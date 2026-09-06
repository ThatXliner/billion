import assert from "node:assert/strict";
import test from "node:test";

import { toBillCard } from "./content";

void test("API bill cards project lifecycle status from the full action record", () => {
  const card = toBillCard({
    id: "bill-hr4795",
    title: "A bill",
    description: "Description",
    billNumber: "H.R. 4795",
    sourceWebsite: "congress.gov",
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
  });

  assert.equal(card.billStatus, "Passed House");
});
