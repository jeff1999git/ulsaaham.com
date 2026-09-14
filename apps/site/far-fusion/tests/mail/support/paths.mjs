import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Every path is derived from this file's own location. A hardcoded drive letter
// would be a second module identity on Windows ("f:" against "F:"), and a
// nodemailer patch installed through one spelling is invisible to the other.
const here = path.dirname(fileURLToPath(import.meta.url));

export const APP_ROOT = path.resolve(here, "../../..");
export const REPO_ROOT = path.resolve(APP_ROOT, "../../..");
export const SRC_URL = pathToFileURL(path.join(APP_ROOT, "src")).href;

export const appFileUrl = (rel) => pathToFileURL(path.join(APP_ROOT, rel)).href;
export const appPath = (rel) => path.join(APP_ROOT, rel);
export const repoPath = (rel) => path.join(REPO_ROOT, rel);
