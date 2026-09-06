/**
 * Removes dotted leaders copied from print-form legislative action text.
 *
 * The action date is stored separately, so a status such as
 * `Effective on . . . . .` should be displayed as `Effective on`. Requiring
 * spaced dots preserves genuine trailing ellipses such as `Pending...`.
 */
export function sanitizeBillStatus(value: string): string {
  return value.replace(/\s+(?:\.\s+){2,}\.\s*$/, "").trim();
}

/** The source-owned action shape shared by Congress.gov and Open States. */
export interface BillLifecycleAction {
  text?: string | null;
  type?: string | null;
  actionCode?: string | null;
  classification?: readonly string[] | null;
  date?: string | null;
}

/**
 * A compact lifecycle state used by the scraper, API, and AI prompts.
 *
 * The state is deliberately about what the source records establish. A bill
 * that has passed one chamber is still a proposal in the legal sense, while a
 * simple resolution adopted by one chamber is an accomplished congressional
 * action without becoming a law.
 */
export type BillLifecycleStatus =
  | "proposed"
  | "passed_house"
  | "passed_senate"
  | "passed_both"
  | "passed"
  | "adopted_house"
  | "adopted_senate"
  | "adopted_both"
  | "enacted"
  | "vetoed"
  | "failed"
  | "withdrawn";

export interface DerivedBillLifecycle {
  status: BillLifecycleStatus;
  /** Human-facing status suitable for the Browse card and detail header. */
  label: string;
  /** Whether the measure has become law, rather than merely passing a chamber. */
  isEnacted: boolean;
  /** Whether the actions record contains a completed chamber vote/adoption. */
  hasCompletedVote: boolean;
  /** Whether this is a simple or concurrent/joint resolution. */
  isResolution: boolean;
}

interface ActionFacts {
  chamber?: "House" | "Senate";
  passed: boolean;
  adopted: boolean;
  committeePassed: boolean;
  enacted: boolean;
  vetoed: boolean;
  failed: boolean;
  withdrawn: boolean;
}

const EMPTY_ACTION_FACTS: ActionFacts = {
  passed: false,
  adopted: false,
  committeePassed: false,
  enacted: false,
  vetoed: false,
  failed: false,
  withdrawn: false,
};

function compactBillNumber(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

function actionClassifications(action: BillLifecycleAction): Set<string> {
  return new Set(
    [
      ...(action.classification ?? []),
      // Open States normalisation stores its classifications in `type` as a
      // comma-separated string because Bill.actions has one coarse type field.
      ...(action.type?.split(",") ?? []),
    ].map((value) => value.trim().toLowerCase()),
  );
}

function actionChamber(
  text: string,
  actionCode: string,
): "House" | "Senate" | undefined {
  const passageChamber =
    /(?:passed(?:\s*\/\s*agreed to)?|agreed to)\s+(?:in|by)\s+(?:the\s+)?(house|senate)\b/.exec(
      text,
    )?.[1];
  if (passageChamber) {
    return passageChamber === "house" ? "House" : "Senate";
  }
  const directPassageChamber = /\bpassed\s+(house|senate)\b/.exec(text)?.[1];
  if (directPassageChamber) {
    return directPassageChamber === "house" ? "House" : "Senate";
  }

  // Action codes are only a supporting signal. Congress has reused them, so
  // callers must also supply passage/adoption language before they matter.
  if (/^(?:H)?8000$/.test(actionCode)) return "House";
  if (/^(?:S)?17000$/.test(actionCode)) return "Senate";
  if (actionCode.startsWith("H")) return "House";
  if (actionCode.startsWith("S")) return "Senate";
  return undefined;
}

/**
 * Read one structured action without treating every occurrence of "passed"
 * as a bill passage. In particular, a rule for another resolution and a
 * motion to reconsider are procedural records, not outcomes for this bill.
 */
function classifyAction(action: BillLifecycleAction): ActionFacts {
  const rawText = action.text?.trim() ?? "";
  const text = rawText.toLowerCase().replace(/\s+/g, " ");
  const code = action.actionCode?.trim().toUpperCase() ?? "";
  const classifications = actionClassifications(action);
  if (!text && classifications.size === 0) return { ...EMPTY_ACTION_FACTS };

  const isOtherResolutionRule =
    /\brule\s+[hs]\.?(?:\s*res\.?|\s*con\.?\s*res\.?)\b/.test(text) ||
    code === "H1L220";
  if (isOtherResolutionRule) return { ...EMPTY_ACTION_FACTS };

  const isReconsideration = /\bmotion to reconsider\b|\breconsideration\b/.test(
    text,
  );
  const chamber = actionChamber(text, code);
  const isSimpleOrConcurrentClassification =
    classifications.has("adoption") ||
    classifications.has("passage") ||
    classifications.has("committee-passage");

  const enacted =
    classifications.has("became-law") ||
    classifications.has("executive-signature") ||
    /\b(?:became (?:a )?public law|became law|signed by (?:the )?president|signed by (?:the )?governor|chaptered into law|enacted into law)\b/.test(
      text,
    );
  const vetoed =
    classifications.has("executive-veto") ||
    classifications.has("executive-veto-line-item") ||
    /\bvetoed by (?:the )?(?:president|governor)\b/.test(text);
  // Open States uses `withdrawal` for procedural moves such as "Withdrawn
  // From Com/Cal" and "Withdrawn from Engrossing and Enrolling." Those are
  // not a sponsor withdrawing the measure. Treat every "withdrawn from ..."
  // record as a movement; only an explicit withdrawal classification/text
  // without that construction can end the measure.
  const withdrawnFrom = /\bwithdrawn?\s+from\b/.test(text);
  const explicitWithdrawalText =
    /\b(?:bill|measure|resolution)\b[^.]{0,60}\bwithdrawn\b/.test(text) ||
    /\bwithdrawn\s+by\b/.test(text);
  const withdrawn =
    !withdrawnFrom &&
    (classifications.has("withdrawal") || explicitWithdrawalText);

  // A failure classification is structured source data. Free text is stricter:
  // only a failed passage/measure is a bill failure. "Motion ... failed" and
  // failed amendments must never turn the whole bill red.
  const failed =
    classifications.has("failure") ||
    (!isReconsideration &&
      !/\b(?:motion|amendment)\b/.test(text) &&
      /\b(?:failed (?:of )?passage|failed to pass|did not pass|not passed|defeated on passage)\b/.test(
        text,
      ));

  const explicitChamberPassage =
    !isReconsideration &&
    (/(?:passed(?:\s*\/\s*agreed to)?|agreed to)\s+(?:in|by)\s+(?:the\s+)?(?:house|senate)\b/.test(
      text,
    ) ||
      /\bpassed\s+(?:house|senate)\b/.test(text) ||
      /\bon passage\b.*\bpassed\b/.test(text) ||
      /\bpassed by the yeas and nays\b/.test(text));
  const passed =
    !isReconsideration &&
    (explicitChamberPassage ||
      (isSimpleOrConcurrentClassification && classifications.has("passage")) ||
      (/(?:passed|passage)/.test(text) &&
        (/^(?:H)?8000$/.test(code) || /^(?:S)?17000$/.test(code))));

  const adopted =
    !isReconsideration &&
    (classifications.has("adoption") ||
      /\b(?:adopted|agreed to)\s+(?:in|by)\s+(?:the\s+)?(?:house|senate)\b/.test(
        text,
      ));
  const committeePassed =
    classifications.has("committee-passage") ||
    /\bpassed\s+(?:by|out of)\s+(?:the\s+)?committee\b/.test(text);

  return {
    chamber,
    passed,
    adopted,
    committeePassed,
    enacted,
    vetoed,
    failed,
    withdrawn,
  };
}

function fallbackStatusLabel(text: string): string {
  const clean = sanitizeBillStatus(text);
  if (!clean) return "Proposed";
  if (/\breferred to (?:the )?(?:house|senate )?committee\b/i.test(clean)) {
    return "Referred to committee";
  }
  if (/\bintroduced\b/i.test(clean)) return "Introduced";
  if (/\breported\b.*\bcommittee\b/i.test(clean)) {
    return "Reported by committee";
  }
  return clean;
}

function resolutionKind(
  billNumber: string | null | undefined,
): "simple" | "concurrent" | "joint" | undefined {
  const compact = compactBillNumber(billNumber);
  if (/^[HS]RES/.test(compact)) return "simple";
  if (/^[HS]CONRES/.test(compact)) return "concurrent";
  if (/^[HS]JRES/.test(compact)) return "joint";
  return undefined;
}

/**
 * Derive the meaningful lifecycle milestone from all source actions.
 *
 * Congress.gov often appends a routine reconsideration action after a chamber
 * vote. Reading only `latestAction` therefore hides the vote. Conversely, a
 * broad `/passed/` or `/failed/` scan can mistake a rule for another measure or
 * a failed motion for the bill's outcome. This function uses action structure,
 * explicit chamber language, and conservative text guards together.
 */
export function deriveBillLifecycle(args: {
  billNumber?: string | null;
  actions?: readonly BillLifecycleAction[] | null;
  latestAction?: string | null;
}): DerivedBillLifecycle {
  const actions = (args.actions ?? []).filter((action) => {
    const text = action.text?.trim();
    if (text) return true;
    return Boolean(action.classification?.length);
  });
  const fallbackAction = args.latestAction?.trim();
  const hasLatestInActions = fallbackAction
    ? actions.some((action) => action.text?.trim() === fallbackAction)
    : true;
  const allActions =
    fallbackAction && !hasLatestInActions
      ? [...actions, { text: fallbackAction }]
      : actions;
  const kind = resolutionKind(args.billNumber);
  const isResolution = kind !== undefined;

  let housePassed = false;
  let senatePassed = false;
  let houseAdopted = false;
  let senateAdopted = false;
  let committeePassed = false;
  let terminal: "enacted" | "vetoed" | "failed" | "withdrawn" | undefined;
  let completedVote = false;

  const orderedActions = allActions
    .map((action, index) => ({ action, index }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.action.date ?? "");
      const rightTime = Date.parse(right.action.date ?? "");
      const leftValid = !Number.isNaN(leftTime);
      const rightValid = !Number.isNaN(rightTime);
      if (leftValid && rightValid && leftTime !== rightTime) {
        return leftTime - rightTime;
      }
      if (leftValid !== rightValid) return leftValid ? -1 : 1;
      return left.index - right.index;
    });

  for (const { action } of orderedActions) {
    const facts = classifyAction(action);
    if (facts.passed) {
      completedVote = true;
      // A later successful vote supersedes an earlier failed attempt on the
      // same measure. Keep vetoes until an explicit enactment/override record.
      if (terminal === "failed" || terminal === "withdrawn") {
        terminal = undefined;
      }
      if (kind === "simple" || kind === "concurrent") {
        if (facts.chamber === "House") houseAdopted = true;
        if (facts.chamber === "Senate") senateAdopted = true;
      } else {
        if (facts.chamber === "House") housePassed = true;
        if (facts.chamber === "Senate") senatePassed = true;
      }
    }
    if (facts.adopted) {
      completedVote = true;
      if (facts.chamber === "House") houseAdopted = true;
      if (facts.chamber === "Senate") senateAdopted = true;
    }
    committeePassed ||= facts.committeePassed;
    if (facts.enacted) terminal = "enacted";
    else if (facts.vetoed) terminal = "vetoed";
    else if (facts.failed) terminal = "failed";
    else if (facts.withdrawn) terminal = "withdrawn";
  }

  if (terminal === "enacted") {
    return {
      status: "enacted",
      label: "Enacted",
      isEnacted: true,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (terminal === "vetoed") {
    return {
      status: "vetoed",
      label: "Vetoed",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (terminal === "failed") {
    return {
      status: "failed",
      label: "Failed",
      isEnacted: false,
      hasCompletedVote: completedVote,
      isResolution,
    };
  }
  if (terminal === "withdrawn") {
    return {
      status: "withdrawn",
      label: "Withdrawn",
      isEnacted: false,
      hasCompletedVote: completedVote,
      isResolution,
    };
  }

  if (kind === "simple" || kind === "concurrent") {
    if (houseAdopted && senateAdopted) {
      return {
        status: "adopted_both",
        label: "Agreed to by both chambers",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
    if (houseAdopted) {
      return {
        status: "adopted_house",
        label: "Agreed to in House",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
    if (senateAdopted) {
      return {
        status: "adopted_senate",
        label: "Agreed to in Senate",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
  }

  if (housePassed && senatePassed) {
    return {
      status: "passed_both",
      label: "Passed both chambers",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (housePassed) {
    return {
      status: "passed_house",
      label: "Passed House",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (senatePassed) {
    return {
      status: "passed_senate",
      label: "Passed Senate",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (completedVote && isResolution) {
    return {
      status: "passed",
      label: "Passed",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  // The source's latestAction is authoritative for same-day ties. Congress
  // often returns same-day actions newest-first, so date sorting alone can
  // turn a referral into the earlier introduction.
  const latestText =
    fallbackAction ?? orderedActions.at(-1)?.action.text?.trim() ?? "";
  if (/\bpresented to (?:the )?president\b/i.test(latestText)) {
    return {
      status: "passed_both",
      label: "Passed both chambers",
      isEnacted: false,
      hasCompletedVote: true,
      isResolution,
    };
  }
  if (
    /\benrolled\b|\bpresented to (?:the )?governor\b|\bawaiting (?:the )?governor/i.test(
      latestText,
    )
  ) {
    return {
      status: "proposed",
      label: /\bpresented to (?:the )?governor\b/i.test(latestText)
        ? "Presented to governor"
        : "Enrolled",
      isEnacted: false,
      hasCompletedVote: completedVote,
      isResolution,
    };
  }
  if (committeePassed) {
    return {
      status: "proposed",
      label: "Passed committee",
      isEnacted: false,
      hasCompletedVote: completedVote,
      isResolution,
    };
  }

  return {
    status: "proposed",
    label: fallbackStatusLabel(latestText),
    isEnacted: false,
    hasCompletedVote: completedVote,
    isResolution,
  };
}
