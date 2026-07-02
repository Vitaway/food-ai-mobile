import fs from "fs";
import path from "path";

/** Same asset as web/public/mirafood-logo.png — used for inline CID email attachments. */
const LOGO_CANDIDATE_PATHS = [
  path.join(__dirname, "../../../web/public/mirafood-logo.png"),
  path.join(__dirname, "../../assets/mirafood-logo.png"),
];

export function resolveEmailLogoPath(): string | null {
  for (const candidate of LOGO_CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}
