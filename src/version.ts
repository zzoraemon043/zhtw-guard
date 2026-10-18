import { readFileSync } from "node:fs";

interface PackageManifest {
  version: string;
}

function readPackageManifest(): PackageManifest {
  const manifestUrl = new URL("../package.json", import.meta.url);
  return JSON.parse(readFileSync(manifestUrl, "utf8")) as PackageManifest;
}

export const VERSION = readPackageManifest().version;
