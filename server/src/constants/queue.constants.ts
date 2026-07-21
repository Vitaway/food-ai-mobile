/** Max minutes a review can wait unclaimed before team-channel escalation. */
export const QUEUE_PICK_TIMEOUT_MINUTES = 5;

/** How often the escalation scheduler scans the queue. */
export const QUEUE_ESCALATION_INTERVAL_MS = 30_000;
