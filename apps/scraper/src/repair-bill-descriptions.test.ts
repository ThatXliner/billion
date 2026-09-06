import assert from "node:assert/strict";
import test from "node:test";

import { deriveBillLifecycle } from "@acme/validators";

import type {
  RepairBillRow,
  RepairManifestEntry,
} from "./repair-bill-descriptions.js";
import {
  descriptionRepairReason,
  descriptionUpdateValues,
  evidenceFingerprint,
  lifecycleFor,
  manifestEntryIsFresh,
  sourceFingerprint,
  validateRepairDescription,
} from "./repair-bill-descriptions.js";

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

function row(overrides: Partial<RepairBillRow> = {}): RepairBillRow {
  return {
    id: "bill-1",
    billNumber: "H.R. 4795",
    title: "Protect Economic and Academic Freedom Act",
    sourceWebsite: "congress.gov",
    url: "https://www.congress.gov/bill/119th-congress/house-bill/4795",
    description: "The bill would protect academic freedom.",
    contentHash: "content-hash",
    summary: "The bill would protect academic freedom.",
    fullText: "The bill would protect academic freedom.",
    status:
      "Motion to reconsider laid on the table Agreed to without objection.",
    actions: hr4795Actions,
    ...overrides,
  };
}

function entryFor(source: RepairBillRow): RepairManifestEntry {
  return {
    id: source.id,
    billNumber: source.billNumber,
    title: source.title,
    sourceWebsite: source.sourceWebsite,
    oldDescription: source.description,
    contentHash: source.contentHash,
    sourceFingerprint: sourceFingerprint(source),
    status: source.status,
    actions: source.actions,
    evidenceFingerprint: evidenceFingerprint(source.status, source.actions),
    newDescription: "The measure would protect academic freedom.",
    generatedAt: "2026-09-06T00:00:00.000Z",
  };
}

test("repair lifecycle keeps the recorded House passage behind reconsideration", () => {
  const lifecycle = lifecycleFor(row());

  assert.equal(lifecycle.status, "passed_house");
  assert.equal(lifecycle.label, "Passed House");
  assert.equal(lifecycle.isEnacted, false);
});

test("the repair candidate check uses the shared lifecycle validation", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "H.R. 4795",
    actions: hr4795Actions,
    latestAction: row().status,
  });

  assert.equal(
    validateRepairDescription(
      "The measure would protect academic freedom.",
      lifecycle,
    ),
    undefined,
  );
  assert.match(
    validateRepairDescription(
      "The measure protects academic freedom.",
      lifecycle,
    ) ?? "",
    /conditional language/,
  );
});

test("normal inventory skips enacted bills while explicit ids can force them", () => {
  const enacted = row({
    status: "Became Public Law 119-1",
    actions: [
      {
        date: "2026-09-02",
        text: "Became Public Law 119-1.",
        type: "President",
        actionCode: "8000",
      },
    ],
  });

  assert.equal(descriptionRepairReason(enacted), undefined);
  assert.equal(descriptionRepairReason(enacted, 100, true), "explicit id");
});

test("stale source, status, action, or description evidence fails closed", () => {
  const original = row();
  const entry = entryFor(original);

  assert.equal(manifestEntryIsFresh(entry, original), true);
  assert.equal(
    manifestEntryIsFresh(
      entry,
      row({ description: "Changed by another writer." }),
    ),
    false,
  );
  assert.equal(
    manifestEntryIsFresh(
      entry,
      row({ summary: "Changed official source text." }),
    ),
    false,
  );
  assert.equal(
    manifestEntryIsFresh(entry, row({ status: "Passed House" })),
    false,
  );
  assert.equal(
    manifestEntryIsFresh(
      entry,
      row({
        actions: [
          ...hr4795Actions,
          {
            date: "2026-09-03",
            text: "Referred to the Senate.",
            type: "Floor",
            actionCode: "S11100",
          },
        ],
      }),
    ),
    false,
  );
});

test("description updates contain only the repaired field", () => {
  assert.deepEqual(descriptionUpdateValues("  The measure   would help. "), {
    description: "The measure would help.",
  });
  assert.throws(() => descriptionUpdateValues("   "), /cannot be empty/);
});
