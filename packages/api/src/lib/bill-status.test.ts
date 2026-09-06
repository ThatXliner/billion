import assert from "node:assert/strict";
import test from "node:test";

import { projectBillStatus } from "./bill-status";

void test("projects a House passage when the latest action is reconsideration", () => {
  assert.equal(
    projectBillStatus({
      billNumber: "H.R. 4795",
      status:
        "Motion to reconsider laid on the table Agreed to without objection.",
      actions: [
        {
          date: "2026-09-02",
          text: "On passage Passed by the Yeas and Nays: 237 - 169.",
          type: "Floor",
          actionCode: "H37100",
        },
        {
          date: "2026-09-02",
          text: "Passed/agreed to in House: On passage Passed by the Yeas and Nays: 237 - 169.",
          type: "Floor",
          actionCode: "8000",
        },
        {
          date: "2026-09-02",
          text: "Motion to reconsider laid on the table Agreed to without objection.",
          type: "Floor",
          actionCode: "H38310",
        },
      ],
    }),
    "Passed House",
  );
});

void test("does not treat a rule for another resolution as passage", () => {
  assert.notEqual(
    projectBillStatus({
      billNumber: "H.Res. 1499",
      status: "Rule H. Res. 1499 passed House.",
      actions: [
        {
          date: "2026-09-01",
          text: "Rule H. Res. 1499 passed House.",
          actionCode: "H1L220",
        },
      ],
    }),
    "Passed House",
  );
});

void test("falls back to a meaningful proposal label when no action exists", () => {
  assert.equal(
    projectBillStatus({ billNumber: "H.R. 1", status: null }),
    "Proposed",
  );
});
