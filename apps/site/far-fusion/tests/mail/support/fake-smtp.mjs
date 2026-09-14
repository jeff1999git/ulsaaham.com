import net from "node:net";

// A throwaway SMTP server. It speaks just enough of the protocol for nodemailer
// to authenticate and deliver, and it records what it was given so a test can
// assert on the credentials and on the exact bytes of the message.
//
// It binds port 0 (the OS picks a free one) because node runs test files in
// parallel processes, and a fixed port would make them collide.

const decodePlain = (b64) => {
  const [, user = "", pass = ""] = Buffer.from(b64, "base64").toString("utf8").split("\0");
  return { user, pass };
};

const b64 = (text) => Buffer.from(text, "utf8").toString("base64");

export async function startFakeSmtp(options = {}) {
  const messages = [];
  const auths = [];
  const sockets = new Set();
  let connections = 0;

  const server = net.createServer((socket) => {
    connections += 1;
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});

    let buffer = "";
    let collecting = false;
    let data = "";
    let envelopeFrom = "";
    let recipients = [];
    let loginStage = null;
    let loginUser = "";

    const reply = (line) => socket.write(line + "\r\n");
    reply("220 fake.local ESMTP");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      for (;;) {
        if (collecting) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) {
            data += buffer;
            buffer = "";
            return;
          }
          data += buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          collecting = false;
          messages.push({
            envelopeFrom,
            recipients: [...recipients],
            // Undo the dot stuffing SMTP applies to a line that starts with one.
            raw: data.replace(/^\.\./, ".").replace(/\r\n\.\./g, "\r\n."),
          });
          data = "";
          reply("250 2.0.0 Ok: queued");
          continue;
        }

        const nl = buffer.indexOf("\r\n");
        if (nl === -1) return;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);

        if (loginStage === "user") {
          loginUser = Buffer.from(line, "base64").toString("utf8");
          loginStage = "pass";
          reply("334 " + b64("Password:"));
          continue;
        }
        if (loginStage === "pass") {
          auths.push({ user: loginUser, pass: Buffer.from(line, "base64").toString("utf8") });
          loginStage = null;
          reply(options.authFails ? "535 5.7.8 Authentication failed" : "235 2.7.0 Accepted");
          continue;
        }

        const [verb, ...rest] = line.split(" ");
        const command = verb.toUpperCase();
        const argument = rest.join(" ");

        if (command === "EHLO" || command === "HELO") {
          socket.write("250-fake.local\r\n250-AUTH PLAIN LOGIN\r\n250-8BITMIME\r\n250 SIZE 20971520\r\n");
        } else if (command === "AUTH") {
          const [mechanism, initial] = argument.split(" ");
          if (mechanism.toUpperCase() === "PLAIN" && initial) {
            auths.push(decodePlain(initial));
            reply(options.authFails ? "535 5.7.8 Authentication failed" : "235 2.7.0 Accepted");
          } else {
            loginStage = "user";
            reply("334 " + b64("Username:"));
          }
        } else if (command === "MAIL") {
          envelopeFrom = (argument.match(/<([^>]*)>/) || [, ""])[1];
          recipients = [];
          reply("250 2.1.0 Ok");
        } else if (command === "RCPT") {
          const address = (argument.match(/<([^>]*)>/) || [, ""])[1];
          if (options.rejectRecipient && options.rejectRecipient.test(address)) {
            reply("550 5.1.1 Recipient rejected");
          } else {
            recipients.push(address);
            reply("250 2.1.5 Ok");
          }
        } else if (command === "DATA") {
          collecting = true;
          reply("354 End data with <CR><LF>.<CR><LF>");
        } else if (command === "QUIT") {
          reply("221 2.0.0 Bye");
          socket.end();
          return;
        } else {
          reply("250 2.0.0 Ok");
        }
      }
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    port: server.address().port,
    messages,
    auths,
    get connections() {
      return connections;
    },
    /** Counts for one case, so an assertion does not depend on what ran before. */
    mark() {
      return { messages: messages.length, auths: auths.length, connections };
    },
    since(marker) {
      return {
        messages: messages.slice(marker.messages),
        auths: auths.slice(marker.auths),
        connections: connections - marker.connections,
      };
    },
    /**
     * The transporter is pooled and module-private, so nothing in the code can
     * close it. Dropping the server side is what lets the process exit.
     */
    async close() {
      for (const socket of sockets) socket.destroy();
      sockets.clear();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
