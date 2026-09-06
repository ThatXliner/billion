import assert from "node:assert/strict";
import test from "node:test";

import { deriveBillLifecycle } from "@acme/validators";

const hr4795Actions = [
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
];

test("a routine reconsideration action does not hide a House passage", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "H.R. 4795",
    actions: hr4795Actions,
    latestAction:
      "Motion to reconsider laid on the table Agreed to without objection.",
  });

  assert.equal(lifecycle.status, "passed_house");
  assert.equal(lifecycle.label, "Passed House");
  assert.equal(lifecycle.isEnacted, false);
});

test("a referred joint resolution remains a proposal", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "S.J.Res. 21",
    actions: [
      {
        date: "2025-02-20",
        text: "Introduced in Senate",
        type: "IntroReferral",
        actionCode: "1000",
      },
      {
        date: "2025-02-20",
        text: "Read twice and referred to the Committee on Foreign Relations.",
        type: "IntroReferral",
        actionCode: "H11100",
      },
    ],
    latestAction:
      "Read twice and referred to the Committee on Foreign Relations.",
  });

  assert.equal(lifecycle.status, "proposed");
  assert.equal(lifecycle.label, "Referred to committee");
  assert.equal(lifecycle.isEnacted, false);
});

test("the source latest action wins same-day introduction/referral ties", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "S.J.Res. 21",
    latestAction:
      "Read twice and referred to the Committee on Foreign Relations.",
    actions: [
      {
        date: "2025-02-20",
        text: "Read twice and referred to the Committee on Foreign Relations.",
      },
      {
        date: "2025-02-20",
        text: "Introduced in Senate",
      },
    ],
  });

  assert.equal(lifecycle.label, "Referred to committee");
});

test("failure requires a substantive failed passage action", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "S. 1",
    actions: [
      {
        date: "2026-09-02",
        text: "Motion to reconsider laid on the table Agreed to without objection.",
        type: "Floor",
        actionCode: "S38310",
      },
    ],
    latestAction:
      "Motion to reconsider laid on the table Agreed to without objection.",
  });

  assert.notEqual(lifecycle.status, "failed");
});

test("a rule for another resolution cannot imply that this resolution passed", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "H.Res. 1499",
    latestAction: "Rule H. Res. 1499 passed House.",
    actions: [
      {
        date: "2026-09-01",
        text: "Rule H. Res. 1499 passed House.",
        actionCode: "H1L220",
      },
    ],
  });

  assert.equal(lifecycle.status, "proposed");
  assert.notEqual(lifecycle.label, "Passed House");
});

test("recognizes Senate and both-chamber passage", () => {
  assert.equal(
    deriveBillLifecycle({
      billNumber: "S. 1",
      actions: [{ text: "Passed/agreed to in Senate", actionCode: "17000" }],
    }).label,
    "Passed Senate",
  );
  assert.equal(
    deriveBillLifecycle({
      billNumber: "H.R. 1",
      actions: [
        { text: "Passed House", actionCode: "8000" },
        { text: "Passed/agreed to in Senate", actionCode: "17000" },
      ],
    }).label,
    "Passed both chambers",
  );
});

test("a later executive step is not reduced to an earlier committee vote", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "CA AB 2298 (2025-2026)",
    actions: [
      { date: "2026-07-01", text: "Passed committee" },
      {
        date: "2026-09-01",
        text: "Enrolled and presented to the Governor.",
      },
    ],
  });

  assert.equal(lifecycle.label, "Presented to governor");
  assert.equal(lifecycle.isEnacted, false);
});

test("explicit enactment records are legal status, while a bare state Passed is not", () => {
  assert.equal(
    deriveBillLifecycle({ latestAction: "Signed by the governor" }).isEnacted,
    true,
  );
  assert.equal(
    deriveBillLifecycle({ latestAction: "Chaptered into law" }).isEnacted,
    true,
  );
  assert.equal(
    deriveBillLifecycle({ latestAction: "Passed" }).isEnacted,
    false,
  );
});

test("committee and calendar withdrawals are routine moves, not bill withdrawals", () => {
  assert.equal(
    deriveBillLifecycle({
      billNumber: "NC SB 1 (2025-2026)",
      actions: [
        {
          text: "Withdrawn From Com/Cal",
          type: "withdrawal",
        },
      ],
    }).status,
    "proposed",
  );
  assert.equal(
    deriveBillLifecycle({
      billNumber: "NC HB 308 (2025-2026)",
      actions: [{ text: "Withdrawn From Cal", type: "withdrawal" }],
    }).status,
    "proposed",
  );
  assert.equal(
    deriveBillLifecycle({
      billNumber: "CA AB 1 (2025-2026)",
      actions: [{ text: "Withdrawn from committee", type: "withdrawal" }],
    }).status,
    "proposed",
  );
  assert.equal(
    deriveBillLifecycle({
      billNumber: "CA AB 2476 (2025-2026)",
      actions: [
        {
          text: "Withdrawn from Engrossing and Enrolling.",
          type: "withdrawal",
        },
      ],
    }).status,
    "proposed",
  );
});

test("an explicit measure withdrawal can end the lifecycle", () => {
  assert.equal(
    deriveBillLifecycle({
      billNumber: "CA AB 1 (2025-2026)",
      actions: [{ text: "The bill was withdrawn by its author." }],
    }).status,
    "withdrawn",
  );
});
