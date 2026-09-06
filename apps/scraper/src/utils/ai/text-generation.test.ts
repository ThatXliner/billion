import assert from "node:assert/strict";
import test from "node:test";

import { deriveBillLifecycle } from "@acme/validators";

import {
  buildAISummaryPrompt,
  invalidBillSummaryReason,
  needsBillSummaryRegeneration,
} from "./text-generation.js";

const referred = {
  billNumber: "S.J.Res. 21",
  status: "Read twice and referred to the Committee on Foreign Relations.",
  actions: [
    {
      date: "2025-02-20",
      text: "Introduced in Senate",
      type: "IntroReferral",
      actionCode: "10000",
    },
    {
      date: "2025-02-20",
      text: "Read twice and referred to the Committee on Foreign Relations.",
      type: "IntroReferral",
    },
  ],
} as const;

test("bill summary prompts carry the recorded lifecycle and conditional tense", () => {
  const prompt = buildAISummaryPrompt(
    "A joint resolution",
    "The text would address a proposed sale.",
    referred,
  );

  assert.match(prompt, /Official legislative status: Referred to committee/);
  assert.match(prompt, /No completed chamber vote is recorded/);
  assert.match(prompt, /would/);
  assert.doesNotMatch(prompt, /Congress voted to/);
});

test("non-bill summary prompts preserve the original event-focused goal", () => {
  const prompt = buildAISummaryPrompt(
    "An executive order",
    "The order directs agencies to review their procedures.",
  );

  assert.match(prompt, /what happened|what changed/);
  assert.doesNotMatch(prompt, /Official legislative status:/);
});

test("bill prompts include operative text beyond the short non-bill excerpt", () => {
  const operativeText = "OPERATIVE PROVISION BEYOND TWO THOUSAND CHARACTERS";
  const billContent = "x".repeat(2_000) + operativeText;
  const billPrompt = buildAISummaryPrompt("A bill", billContent, referred);

  assert.match(billPrompt, new RegExp(operativeText));
  assert.match(billPrompt, /Existing law.*This bill would/);
  assert.match(
    billPrompt,
    /do not infer new effects from the title, introduction, findings/,
  );

  const nonBillPrompt = buildAISummaryPrompt(
    "An executive order",
    "x".repeat(2_000) + "NON-BILL TAIL",
  );
  assert.doesNotMatch(nonBillPrompt, /NON-BILL TAIL/);
  assert.doesNotMatch(nonBillPrompt, /Existing law.*This bill would/);
  assert.doesNotMatch(nonBillPrompt, /Source text is truncated/);
});

test("bill prompt caps source at 32,000 characters and warns about omitted text", () => {
  const prompt = buildAISummaryPrompt(
    "A bill",
    "x".repeat(32_000) + "OMITTED BILL PROVISION",
    referred,
  );

  assert.doesNotMatch(prompt, /OMITTED BILL PROVISION/);
  assert.match(
    prompt,
    /Source text is truncated to the first 32000 characters/,
  );
  assert.match(prompt, /Do not infer provisions omitted from the excerpt/);
});

test("adopted resolution prompts describe the event separately from policy effects", () => {
  const prompt = buildAISummaryPrompt(
    "A state resolution",
    "Existing law provides background. This bill would request a study.",
    {
      billNumber: "TX SR 23 (891)",
      status: "Reported enrolled",
      actions: [
        {
          text: "Read & adopted",
          type: "introduction, passage",
        },
      ],
    },
  );

  assert.match(
    prompt,
    /Distinguish the recorded adoption event from policy language/,
  );
  assert.match(
    prompt,
    /recorded adoption may be described as a completed event/,
  );
  assert.doesNotMatch(prompt, /No completed chamber vote is recorded/);
});

test("proposal summary validation rejects present-law and unsupported-vote claims", () => {
  const lifecycle = deriveBillLifecycle(referred);

  assert.match(
    invalidBillSummaryReason("This law stops the planned sale.", lifecycle) ??
      "",
    /present fact/,
  );
  assert.match(
    invalidBillSummaryReason(
      "Congress voted to block the planned sale.",
      lifecycle,
    ) ?? "",
    /completed congressional vote/,
  );
  assert.match(
    invalidBillSummaryReason(
      "Substitute teachers can now earn permits.",
      lifecycle,
    ) ?? "",
    /present-time language/,
  );
  assert.equal(
    invalidBillSummaryReason(
      "The measure would block the planned sale.",
      lifecycle,
    ),
    undefined,
  );
});

test("joint-resolution passage is not the adopted-event exemption", () => {
  const lifecycle = deriveBillLifecycle({
    billNumber: "S.J.Res. 21",
    actions: [
      {
        text: "Passed/agreed to in Senate",
        actionCode: "17000",
      },
    ],
  });

  assert.equal(lifecycle.status, "passed_senate");
  assert.match(
    invalidBillSummaryReason(
      "Congress voted to block the planned sale.",
      lifecycle,
    ) ?? "",
    /completed congressional vote/,
  );
});

test("stale descriptions are retried after a lifecycle change", () => {
  assert.equal(
    needsBillSummaryRegeneration("This bill bans the sale.", referred),
    true,
  );
  assert.equal(
    needsBillSummaryRegeneration("The measure would restrict the sale.", {
      billNumber: "S. 1",
      status: "Signed by the President",
      actions: [
        {
          text: "Signed by the President",
          type: "Executive",
        },
      ],
    }),
    true,
  );
  assert.equal(
    needsBillSummaryRegeneration(
      "The measure would restrict the sale.",
      referred,
    ),
    false,
  );
});
