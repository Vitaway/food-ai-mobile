const PATIENT_ID_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PATIENT_ID_CHARS[Math.floor(Math.random() * PATIENT_ID_CHARS.length)];
  }
  return out;
}

/** Immutable Vitaway patient file ID, e.g. VTW-7K2M9X4Q */
export function generatePatientId(): string {
  return `VTW-${randomSegment(8)}`;
}
