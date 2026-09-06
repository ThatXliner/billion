import assert from "node:assert/strict";
import test from "node:test";

import { deriveBillLifecycle } from "@acme/validators";

void test("state Senate simple resolutions use their chamber when adoption is unqualified", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "TX SR 23 (891)",
    latestAction: "Reported enrolled",
    actions: [
      {
        date: "2025-07-28",
        text: "Received by the Secretary of the Senate",
        type: "filing, introduction",
      },
      {
        date: "2025-08-15",
        text: "Read & adopted",
        type: "introduction, passage",
      },
      {
        date: "2025-08-15",
        text: "Vote recorded in Journal",
      },
      {
        date: "2025-08-15",
        text: "Reported enrolled",
        type: "enrolled",
      },
    ],
  });

  assert.deepEqual(
    {
      status: lifecycle.status,
      label: lifecycle.label,
      isEnacted: lifecycle.isEnacted,
    },
    {
      status: "adopted_senate",
      label: "Agreed to in Senate",
      isEnacted: false,
    },
  );
});

void test("state House simple resolutions use their chamber when adoption is unqualified", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "TX HR 32 (891)",
    actions: [
      {
        date: "2025-07-24",
        text: "Filed",
        type: "filing",
      },
      {
        date: "2025-08-15",
        text: "Read & adopted",
        type: "introduction, passage",
      },
      {
        date: "2025-08-15",
        text: "Reported enrolled",
        type: "enrolled",
      },
    ],
  });

  assert.equal(lifecycle.status, "adopted_house");
  assert.equal(lifecycle.label, "Agreed to in House");
  assert.equal(lifecycle.isEnacted, false);
});

void test("a state simple resolution with only a latest Passed action is adopted in its named chamber", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "CA HR 133 (2025-2026)",
    latestAction: "Passed",
    actions: [
      {
        date: "2026-08-05",
        text: "Introduced.",
        type: "introduction",
      },
    ],
  });

  assert.equal(lifecycle.status, "adopted_house");
  assert.equal(lifecycle.label, "Agreed to in House");
  assert.equal(lifecycle.isEnacted, false);
});

void test("committee adoption language does not count as a concurrent-chamber vote", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "CA SCR 191 (2025-2026)",
    latestAction: "Passed Senate",
    actions: [
      {
        date: "2026-08-05",
        text: "From committee: Be adopted. Ordered to consent calendar.",
        type: "amendment-passage, committee-passage, passage",
      },
      {
        date: "2026-08-13",
        text: "Read. Adopted. (Ayes 36. Noes 0.) Ordered to the Assembly.",
        type: "amendment-passage, passage, reading-1",
      },
    ],
  });

  assert.equal(lifecycle.status, "passed_senate");
  assert.equal(lifecycle.label, "Passed Senate");
  assert.equal(lifecycle.isEnacted, false);
});

void test("both explicit state concurrent chamber actions become adopted_both", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "CA SCR 197 (2025-2026)",
    latestAction: "Passed Senate",
    actions: [
      {
        date: "2026-08-20",
        text: "Read. Adopted. (Ayes 39. Noes 0.) Ordered to the Assembly.",
        type: "amendment-passage, passage, reading-1",
      },
      {
        date: "2026-08-24",
        text: "From committee: Be adopted. Ordered to consent calendar.",
        type: "amendment-passage, committee-passage, passage",
      },
      {
        date: "2026-08-26",
        text: "Read. Adopted. Ordered to the Senate.",
        type: "amendment-passage, passage, reading-1",
      },
    ],
  });

  assert.equal(lifecycle.status, "adopted_both");
  assert.equal(lifecycle.label, "Agreed to by both chambers");
  assert.equal(lifecycle.isEnacted, false);
});

void test("joint resolutions retain chamber-passage semantics", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "CA HJR 1 (2025-2026)",
    latestAction: "Passed House",
    actions: [{ text: "Passed House" }],
  });

  assert.equal(lifecycle.status, "passed_house");
  assert.equal(lifecycle.label, "Passed House");
  assert.equal(lifecycle.isEnacted, false);
});

void test("amendment-only adoption does not complete a simple resolution", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "TX SR 23 (891)",
    latestAction: "Amendment adopted",
    actions: [
      {
        date: "2025-08-15",
        text: "Amendment adopted",
        type: "amendment",
      },
    ],
  });

  assert.equal(lifecycle.status, "proposed");
  assert.equal(lifecycle.hasCompletedVote, false);
});

void test("an amendment passed by a chamber does not count as measure passage", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "TX SR 23 (891)",
    latestAction: "Amendment passed House",
    actions: [
      {
        text: "Amendment passed House",
        type: "amendment-passage",
      },
    ],
  });

  assert.equal(lifecycle.status, "proposed");
  assert.equal(lifecycle.hasCompletedVote, false);
});

void test("a motion agreed to by a chamber does not count as resolution adoption", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "TX SR 23 (891)",
    latestAction: "Motion agreed to in House",
    actions: [
      {
        text: "Motion agreed to in House",
        type: "motion",
      },
    ],
  });

  assert.equal(lifecycle.status, "proposed");
  assert.equal(lifecycle.hasCompletedVote, false);
});

void test("ordinary state bills are not mistaken for resolutions", () => {
  for (const billNumber of ["TX HB 1 (891)", "CA SB 2 (2025-2026)"]) {
    const lifecycle = deriveBillLifecycle({
      billNumber,
      latestAction: "Passed",
    });

    assert.equal(lifecycle.isResolution, false, billNumber);
    assert.equal(lifecycle.status, "proposed", billNumber);
    assert.equal(lifecycle.label, "Passed", billNumber);
  }
});

void test("federal H.R. bills are not mistaken for state simple resolutions", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "H.R. 1",
    latestAction: "Passed",
  });

  assert.equal(lifecycle.isResolution, false);
  assert.equal(lifecycle.status, "proposed");
});
