import type { BillLifecycleAction } from "@acme/validators";
import { deriveBillLifecycle, sanitizeBillStatus } from "@acme/validators";

/** The stored source fields needed to project a bill's reader-facing status. */
export interface BillStatusSource {
  billNumber: string;
  status?: string | null;
  actions?: readonly BillLifecycleAction[] | null;
}

/**
 * Turn the source's latest action plus its complete action record into the
 * meaningful lifecycle label returned by API bill surfaces.
 *
 * `status` remains the raw latest action in storage. The projection happens at
 * read time so the API can ignore procedural follow-ups such as a motion to
 * reconsider while preserving the official timeline in the response.
 */
export function projectBillStatus(bill: BillStatusSource): string {
  return (
    sanitizeBillStatus(
      deriveBillLifecycle({
        billNumber: bill.billNumber,
        actions: bill.actions,
        latestAction: bill.status,
      }).label,
    ) || "Proposed"
  );
}
