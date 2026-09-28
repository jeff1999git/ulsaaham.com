// Cloudinary delivery URLs for posters and logos. Every image on the site goes
// through these, so a malformed transformation would break them all at once.
import test from "node:test";
import assert from "node:assert/strict";

import { appFileUrl } from "../mail/support/paths.mjs";

const { optimizeCloudinary, cloudinarySrcSet } = await import(appFileUrl("src/lib/image.js"));

const UPLOAD = "https://res.cloudinary.com/demo/image/upload/v1/ulsaham/events/poster.webp";

test("an upload URL gets a width limit that never scales the image up", () => {
  assert.equal(
    optimizeCloudinary(UPLOAD, 480),
    "https://res.cloudinary.com/demo/image/upload/c_limit,f_auto,q_auto,w_480/v1/ulsaham/events/poster.webp"
  );
  assert.match(optimizeCloudinary(UPLOAD), /\/c_limit,f_auto,q_auto,w_600\//);
});

test("URLs that are not plain Cloudinary uploads pass through unchanged", () => {
  const transformed = optimizeCloudinary(UPLOAD, 480);
  for (const url of [
    transformed,
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/poster.webp",
    "https://images.example.test/poster.jpg",
    "",
    null,
    undefined,
  ]) {
    assert.equal(optimizeCloudinary(url, 360), url);
  }
});

test("a srcset lists the image once per width", () => {
  assert.equal(
    cloudinarySrcSet(UPLOAD, [360, 640]),
    [
      "https://res.cloudinary.com/demo/image/upload/c_limit,f_auto,q_auto,w_360/v1/ulsaham/events/poster.webp 360w",
      "https://res.cloudinary.com/demo/image/upload/c_limit,f_auto,q_auto,w_640/v1/ulsaham/events/poster.webp 640w",
    ].join(", ")
  );
});

test("no srcset where the URL cannot be resized, so the plain src is used", () => {
  assert.equal(cloudinarySrcSet("https://images.example.test/poster.jpg", [360, 640]), undefined);
  assert.equal(cloudinarySrcSet(optimizeCloudinary(UPLOAD, 480), [360, 640]), undefined);
  assert.equal(cloudinarySrcSet(null, [360]), undefined);
});
