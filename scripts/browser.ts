import { access } from "node:fs/promises";

export async function browserExecutable(): Promise<string> {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  for (const path of candidates) {
    if (!path) continue;
    try {
      await access(path);
      return path;
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error("Chromium was not found. Set CHROME_PATH to a Chromium browser executable.");
}
