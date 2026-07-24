import { AppDataSource } from "../config/database";
import { ConsumerProfile } from "../modules/meals/consumer-profile.entity";

/** Format: MRN-YYMM#### e.g. MRN-26070183 (Jul 2026, patient #0183). */
export function formatMrn(date: Date, sequence: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const seq = Math.max(1, Math.floor(sequence));
  const digits = String(seq).padStart(4, "0");
  return `MRN-${yy}${mm}${digits}`;
}

/**
 * Allocate the next patient MRN under a transaction lock so concurrent
 * registrations cannot collide on the same sequence number.
 */
export async function allocatePatientId(now = new Date()): Promise<string> {
  return AppDataSource.transaction(async (manager) => {
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext('mirafood_patient_mrn'))`);

    const repo = manager.getRepository(ConsumerProfile);
    const total = await repo.count();
    let sequence = total + 1;

    for (let attempt = 0; attempt < 20; attempt++) {
      const patientId = formatMrn(now, sequence);
      const exists = await repo.exist({ where: { id: patientId } });
      if (!exists) return patientId;
      sequence += 1;
    }

    // Extremely unlikely collision after retries — append a short random suffix within 64 chars.
    const fallback = formatMrn(now, sequence);
    return `${fallback}${String(Date.now()).slice(-2)}`.slice(0, 64);
  });
}

/** @deprecated Prefer allocatePatientId — kept for sync call sites that need a placeholder. */
export function generatePatientId(now = new Date(), sequence = 1): string {
  return formatMrn(now, sequence);
}
