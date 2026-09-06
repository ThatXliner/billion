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
    /(?:passed(?:\s*\/\s*agreed to)?|agreed to)\s+(?:in|by)\s+(?:the\s+)?(house|assembly|senate)\b/.exec(
      text,
    )?.[1];
  if (passageChamber) {
    return passageChamber === "senate" ? "Senate" : "House";
  }
  const adoptionChamber =
    /\b(?:adopted|agreed to)\s+(?:in|by)\s+(?:the\s+)?(house|assembly|senate)\b/.exec(
      text,
    )?.[1];
  if (adoptionChamber) {
    return adoptionChamber === "senate" ? "Senate" : "House";
  }
  const directPassageChamber = /\bpassed\s+(house|assembly|senate)\b/.exec(
    text,
  )?.[1];
  if (directPassageChamber) {
    return directPassageChamber === "senate" ? "Senate" : "House";
  }

  // State resolution histories commonly describe the chamber that acted by
  // naming the chamber that receives the measure next, e.g. "Ordered to the
  // Assembly" after a Senate adoption. This is only a supporting signal; the
  // action still has to contain passage/adoption evidence before it can affect
  // the lifecycle.
  const orderedTo =
    /\bordered\s+to\s+(?:the\s+)?(assembly|house|senate)\b/.exec(text)?.[1];
  if (orderedTo) {
    return orderedTo === "senate" ? "House" : "Senate";
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
  const isCommitteeAction =
    /\bcommittee\b/.test(text) ||
    classifications.has("committee-passage") ||
    classifications.has("committee-passage-favorable");
  const isProceduralAmendmentOrMotion =
    /^(?:(?:the|an?)\s+)?(?:amendment|motion)\b/.test(text) &&
    !/\bon passage\b/.test(text);
  const isSimpleOrConcurrentClassification =
    classifications.has("adoption") || classifications.has("passage");

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
    !isProceduralAmendmentOrMotion &&
    (/(?:passed(?:\s*\/\s*agreed to)?|agreed to)\s+(?:in|by)\s+(?:the\s+)?(?:house|assembly|senate)\b/.test(
      text,
    ) ||
      /\bpassed\s+(?:house|assembly|senate)\b/.test(text) ||
      /\bon passage\b.*\bpassed\b/.test(text) ||
      /\bpassed by the yeas and nays\b/.test(text));
  const passed =
    !isReconsideration &&
    !isCommitteeAction &&
    !isProceduralAmendmentOrMotion &&
    (explicitChamberPassage ||
      (isSimpleOrConcurrentClassification && classifications.has("passage")) ||
      (/(?:passed|passage)/.test(text) &&
        (/^(?:H)?8000$/.test(code) || /^(?:S)?17000$/.test(code))));

  const adopted =
    !isReconsideration &&
    !isCommitteeAction &&
    !isProceduralAmendmentOrMotion &&
    (classifications.has("adoption") ||
      (/^(?:read[\s.&]+)?adopted(?:[\s.,;:!?]|$)/.test(text) &&
        !/\b(?:amendment|motion)\b/.test(text)) ||
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

type ResolutionKind = "simple" | "concurrent" | "joint";

interface ResolutionInfo {
  kind: ResolutionKind;
  chamber?: "House" | "Senate";
}

const STATE_CODES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "AS",
  "GU",
  "MP",
  "PR",
  "VI",
]);

function resolutionKind(
  billNumber: string | null | undefined,
): ResolutionInfo | undefined {
  const compact = compactBillNumber(billNumber);
  const federal = /^(H|S)(CONRES|JRES|RES)/.exec(compact);
  if (federal) {
    const prefix = federal[1] === "H" ? "House" : "Senate";
    const kind =
      federal[2] === "CONRES"
        ? "concurrent"
        : federal[2] === "JRES"
          ? "joint"
          : "simple";
    return { kind, chamber: prefix };
  }

  // Open States prefixes state measures with the jurisdiction, unlike
  // Congress.gov's H.Res./S.Con.Res. forms. Keep the state prefix requirement
  // so federal H.R. and S.R. bills cannot be mistaken for resolutions.
  const normalized = (billNumber ?? "")
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/[\u2010-\u2015-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const state = /^([A-Z]{2})\s+([HS])\s*(CR|JR|R)(?=\s|\d|\(|$)/.exec(
    normalized,
  );
  const stateCode = state?.[1];
  const chamberPrefix = state?.[2];
  const resolutionSuffix = state?.[3];
  if (
    stateCode &&
    chamberPrefix &&
    resolutionSuffix &&
    STATE_CODES.has(stateCode)
  ) {
    const kind =
      resolutionSuffix === "CR"
        ? "concurrent"
        : resolutionSuffix === "JR"
          ? "joint"
          : "simple";
    return {
      kind,
      chamber: chamberPrefix === "H" ? "House" : "Senate",
    };
  }
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
  const resolution = resolutionKind(args.billNumber);
  const kind = resolution?.kind;
  const isResolution = resolution !== undefined;
  const originChamber = resolution?.chamber;

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
    const chamber =
      facts.chamber ??
      (kind === "simple" && (facts.passed || facts.adopted)
        ? originChamber
        : undefined);
    if (facts.passed) {
      completedVote = true;
      // A later successful vote supersedes an earlier failed attempt on the
      // same measure. Keep vetoes until an explicit enactment/override record.
      if (terminal === "failed" || terminal === "withdrawn") {
        terminal = undefined;
      }
      if (kind === "simple" || kind === "concurrent") {
        if (chamber === "House") houseAdopted = true;
        if (chamber === "Senate") senateAdopted = true;
      } else {
        if (chamber === "House") housePassed = true;
        if (chamber === "Senate") senatePassed = true;
      }
    }
    if (facts.adopted) {
      completedVote = true;
      if (chamber === "House") houseAdopted = true;
      if (chamber === "Senate") senateAdopted = true;
    }
    committeePassed ||= facts.committeePassed;
    if (facts.enacted) terminal = "enacted";
    else if (facts.vetoed) terminal = "vetoed";
    else if (facts.failed) terminal = "failed";
    else if (facts.withdrawn) terminal = "withdrawn";
  }

  // Some state feeds reduce a simple-resolution floor action to the exact
  // latest label "Passed" and provide only an introduction action in history.
  // The state resolution's H/S prefix supplies the originating chamber, but a
  // joint or concurrent resolution still needs explicit chamber evidence.
  const latestText =
    fallbackAction ?? orderedActions.at(-1)?.action.text?.trim() ?? "";
  if (
    !terminal &&
    kind === "simple" &&
    originChamber &&
    /^(?:passed|adopted|agreed to)\.?$/i.test(latestText)
  ) {
    completedVote = true;
    if (originChamber === "House") houseAdopted = true;
    else senateAdopted = true;
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
    if (houseAdopted && kind === "simple") {
      return {
        status: "adopted_house",
        label: "Agreed to in House",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
    if (senateAdopted && kind === "simple") {
      return {
        status: "adopted_senate",
        label: "Agreed to in Senate",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
    if (houseAdopted) {
      return {
        status: "passed_house",
        label: "Passed House",
        isEnacted: false,
        hasCompletedVote: true,
        isResolution,
      };
    }
    if (senateAdopted) {
      return {
        status: "passed_senate",
        label: "Passed Senate",
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
