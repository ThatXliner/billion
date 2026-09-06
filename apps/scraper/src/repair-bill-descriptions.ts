import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import pLimit from "p-limit";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { and, asc, eq, inArray } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill } from "@acme/db/schema";
import {
  deriveBillLifecycle,
  type BillLifecycleAction,
  type DerivedBillLifecycle,
} from "@acme/validators";

import { databaseTarget, databaseTargetMessage } from "./env.js";
import {
  generateAISummary,
  invalidBillSummaryReason,
} from "./utils/ai/text-generation.js";
import {
  BILL_DESCRIPTION_MAX_CHARS,
  clampBillDescription,
} from "./utils/bill-description.js";
import {
  createLogger,
  printFooter,
  printHeader,
  printKeyValue,
} from "./utils/log.js";

export const REPAIR_MANIFEST_VERSION = 1;
export const MAX_REPAIR_ROWS = 1_000;
export const SUPPORTED_BILL_SOURCES = [
  "congress.gov",
  "openstates.org",
] as const;

export type SupportedBillSource = (typeof SUPPORTED_BILL_SOURCES)[number];

export interface RepairBillAction extends BillLifecycleAction {
  date: string;
  text: string;
}

export interface RepairBillRow {
  id: string;
  billNumber: string;
  title: string;
  sourceWebsite: string;
  url: string;
  description: string | null;
  contentHash: string;
  summary: string | null;
  fullText: string | null;
  status: string | null;
  actions: RepairBillAction[];
}

export interface RepairManifestEntry {
  id: string;
  billNumber: string;
  title: string;
  sourceWebsite: string;
  oldDescription: string | null;
  contentHash: string;
  sourceFingerprint: string;
  status: string | null;
  actions: RepairBillAction[];
  evidenceFingerprint: string;
  newDescription: string | null;
  generatedAt: string;
  error?: string;
}

export interface RepairManifest {
  version: typeof REPAIR_MANIFEST_VERSION;
  generatedAt: string;
  maxChars: number;
  source?: SupportedBillSource;
  entries: RepairManifestEntry[];
}

interface RepairManifestFile extends RepairManifest {
  command: "repair-bill-descriptions";
}

interface CandidateDecision {
  selected: boolean;
  reason: string;
}

interface GenerationResult {
  entry: RepairManifestEntry;
  ok: boolean;
}

const logger = createLogger("repair-bill-descriptions");

type RepairBillSelection = {
  id: string;
  billNumber: string;
  title: string;
  sourceWebsite: string;
  url: string;
  description: string | null;
  contentHash: string;
  summary: string | null;
  fullText: string | null;
  status: string | null;
  actions: readonly BillLifecycleAction[] | null;
};

const BILL_REPAIR_FIELDS = {
  id: Bill.id,
  billNumber: Bill.billNumber,
  title: Bill.title,
  sourceWebsite: Bill.sourceWebsite,
  url: Bill.url,
  description: Bill.description,
  contentHash: Bill.contentHash,
  summary: Bill.summary,
  fullText: Bill.fullText,
  status: Bill.status,
  actions: Bill.actions,
};

function normalizedAction(action: RepairBillAction) {
  return {
    date: action.date ?? null,
    text: action.text ?? null,
    type: action.type ?? null,
    actionCode: action.actionCode ?? null,
    classification: action.classification ?? null,
  };
}

/** Fingerprint the source evidence that determines a lifecycle label. */
export function evidenceFingerprint(
  status: string | null | undefined,
  actions: readonly RepairBillAction[] | null | undefined,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        status: status ?? null,
        actions: (actions ?? []).map(normalizedAction),
      }),
    )
    .digest("hex");
}

/** Fingerprint source text and identity independently of the repair field. */
export function sourceFingerprint(
  row: Pick<
    RepairBillRow,
    "billNumber" | "title" | "sourceWebsite" | "url" | "summary" | "fullText"
  >,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        billNumber: row.billNumber,
        title: row.title,
        sourceWebsite: row.sourceWebsite,
        url: row.url,
        summary: row.summary,
        fullText: row.fullText,
      }),
    )
    .digest("hex");
}

export function lifecycleFor(
  row: Pick<RepairBillRow, "billNumber" | "status" | "actions">,
): DerivedBillLifecycle {
  return deriveBillLifecycle({
    billNumber: row.billNumber,
    actions: row.actions,
    latestAction: row.status,
  });
}

/** Return a reason when a stored description should be repaired. */
export function descriptionRepairReason(
  row: Pick<RepairBillRow, "billNumber" | "status" | "actions" | "description">,
  maxChars = BILL_DESCRIPTION_MAX_CHARS,
  force = false,
): string | undefined {
  if (force) return "explicit id";

  const lifecycle = lifecycleFor(row);
  if (lifecycle.isEnacted) return undefined;

  const description = row.description?.trim() ?? "";
  if (!description) return "missing description";
  if (description.length > maxChars)
    return `description exceeds ${maxChars} characters`;

  const invalidReason = invalidBillSummaryReason(description, lifecycle);
  return invalidReason ? `lifecycle validation: ${invalidReason}` : undefined;
}

/** Validate generated text again immediately before it can be applied. */
export function validateRepairDescription(
  description: string | null | undefined,
  lifecycle: DerivedBillLifecycle,
  maxChars = BILL_DESCRIPTION_MAX_CHARS,
): string | undefined {
  const value = description?.replace(/\s+/g, " ").trim() ?? "";
  if (!value) return "generated description is empty";
  if (value.length > maxChars) {
    return `generated description exceeds ${maxChars} characters`;
  }
  return invalidBillSummaryReason(value, lifecycle);
}

/** Keep the apply update limited to the one field this command owns. */
export function descriptionUpdateValues(description: string): {
  description: string;
} {
  const value = description.replace(/\s+/g, " ").trim();
  if (!value) throw new Error("description update cannot be empty");
  return { description: value };
}

/**
 * Compare the database row captured at apply time with the generation evidence.
 * The source and action fingerprints make stale manifests fail closed.
 */
export function manifestEntryIsFresh(
  entry: RepairManifestEntry,
  row: RepairBillRow,
): boolean {
  return (
    entry.id === row.id &&
    entry.billNumber === row.billNumber &&
    entry.sourceWebsite === row.sourceWebsite &&
    entry.oldDescription === row.description &&
    entry.contentHash === row.contentHash &&
    entry.sourceFingerprint === sourceFingerprint(row) &&
    entry.status === row.status &&
    entry.evidenceFingerprint === evidenceFingerprint(row.status, row.actions)
  );
}

function selectSource(source?: SupportedBillSource) {
  return source
    ? eq(Bill.sourceWebsite, source)
    : inArray(Bill.sourceWebsite, [...SUPPORTED_BILL_SOURCES]);
}

function repairRowSelection(
  row: RepairBillRow,
  maxChars: number,
  force: boolean,
): CandidateDecision {
  if (!sourceText(row)) {
    return {
      selected: false,
      reason: "no stored official summary or full text",
    };
  }
  const reason = descriptionRepairReason(row, maxChars, force);
  if (reason) return { selected: true, reason };
  return {
    selected: false,
    reason: lifecycleFor(row).isEnacted
      ? "enacted bill (use explicit --id to force)"
      : "description passes lifecycle validation",
  };
}

function sourceText(row: RepairBillRow): string | undefined {
  const summary = row.summary?.trim();
  if (summary) return summary;
  const fullText = row.fullText?.trim();
  return fullText || undefined;
}

function asRepairRow(row: RepairBillSelection): RepairBillRow {
  return {
    id: row.id,
    billNumber: row.billNumber,
    title: row.title,
    sourceWebsite: row.sourceWebsite,
    url: row.url,
    description: row.description,
    contentHash: row.contentHash,
    summary: row.summary,
    fullText: row.fullText,
    status: row.status,
    actions: (row.actions ?? []) as RepairBillAction[],
  };
}

async function loadRows(args: {
  ids?: readonly string[];
  limit?: number;
  source?: SupportedBillSource;
}): Promise<RepairBillRow[]> {
  const query = db
    .select(BILL_REPAIR_FIELDS)
    .from(Bill)
    .where(
      args.ids?.length
        ? and(selectSource(args.source), inArray(Bill.id, [...args.ids]))
        : selectSource(args.source),
    )
    .orderBy(asc(Bill.id));
  const rows =
    args.limit === undefined ? await query : await query.limit(args.limit);
  return rows.map((row) => asRepairRow(row));
}

function manifestEntryFor(
  row: RepairBillRow,
  newDescription: string | null,
  generatedAt: string,
  error?: string,
): RepairManifestEntry {
  return {
    id: row.id,
    billNumber: row.billNumber,
    title: row.title,
    sourceWebsite: row.sourceWebsite,
    oldDescription: row.description,
    contentHash: row.contentHash,
    sourceFingerprint: sourceFingerprint(row),
    status: row.status,
    actions: row.actions,
    evidenceFingerprint: evidenceFingerprint(row.status, row.actions),
    newDescription,
    generatedAt,
    ...(error ? { error } : {}),
  };
}

async function generateEntry(
  row: RepairBillRow,
  maxChars: number,
): Promise<GenerationResult> {
  const generatedAt = new Date().toISOString();
  const lifecycle = lifecycleFor(row);
  const text = sourceText(row);
  if (!text) {
    const error = "no stored official summary or full text";
    logger.warn(`${row.billNumber} skipped: ${error}`);
    return {
      entry: manifestEntryFor(row, null, generatedAt, error),
      ok: false,
    };
  }

  try {
    const generated = await generateAISummary(row.title, text, {
      billNumber: row.billNumber,
      status: row.status,
      actions: row.actions,
    });
    const value = clampBillDescription(generated);
    const invalidReason = validateRepairDescription(value, lifecycle, maxChars);
    if (invalidReason) {
      logger.error(`${row.billNumber} failed validation: ${invalidReason}`);
      return {
        entry: manifestEntryFor(row, null, generatedAt, invalidReason),
        ok: false,
      };
    }
    logger.success(`${row.billNumber} generated a repair candidate`);
    return { entry: manifestEntryFor(row, value, generatedAt), ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${row.billNumber} failed: ${message}`);
    return {
      entry: manifestEntryFor(row, null, generatedAt, message),
      ok: false,
    };
  }
}

function parseManifest(value: unknown): RepairManifestFile {
  if (!value || typeof value !== "object") {
    throw new Error("manifest must contain a JSON object");
  }
  const manifest = value as Partial<RepairManifestFile>;
  if (manifest.version !== REPAIR_MANIFEST_VERSION) {
    throw new Error(
      `unsupported manifest version: ${String(manifest.version)}`,
    );
  }
  if (manifest.command !== "repair-bill-descriptions") {
    throw new Error("manifest was not produced by repair-bill-descriptions");
  }
  if (
    !Array.isArray(manifest.entries) ||
    typeof manifest.maxChars !== "number"
  ) {
    throw new Error("manifest is missing entries or maxChars");
  }
  if (
    !Number.isInteger(manifest.maxChars) ||
    manifest.maxChars < 1 ||
    manifest.maxChars > BILL_DESCRIPTION_MAX_CHARS
  ) {
    throw new Error(
      `manifest maxChars must be an integer from 1 to ${BILL_DESCRIPTION_MAX_CHARS}`,
    );
  }
  if (manifest.entries.length > MAX_REPAIR_ROWS) {
    throw new Error(`manifest contains more than ${MAX_REPAIR_ROWS} entries`);
  }
  const ids = new Set<string>();
  for (const entry of manifest.entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.id !== "string" ||
      typeof entry.billNumber !== "string" ||
      typeof entry.sourceWebsite !== "string" ||
      (entry.oldDescription !== null &&
        typeof entry.oldDescription !== "string") ||
      typeof entry.contentHash !== "string" ||
      typeof entry.sourceFingerprint !== "string" ||
      (entry.status !== null && typeof entry.status !== "string") ||
      typeof entry.evidenceFingerprint !== "string" ||
      !Array.isArray(entry.actions) ||
      (entry.newDescription !== null &&
        typeof entry.newDescription !== "string") ||
      typeof entry.generatedAt !== "string"
    ) {
      throw new Error("manifest contains an invalid entry");
    }
    if (ids.has(entry.id)) {
      throw new Error(`manifest contains duplicate bill id ${entry.id}`);
    }
    ids.add(entry.id);
  }
  return manifest as RepairManifestFile;
}

async function readManifest(path: string): Promise<RepairManifestFile> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    throw new Error(
      `could not read manifest ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    return parseManifest(JSON.parse(raw));
  } catch (error) {
    throw new Error(
      `invalid manifest ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function writeManifest(
  path: string,
  manifest: RepairManifestFile,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function reportInventory(
  rows: readonly RepairBillRow[],
  selected: readonly RepairBillRow[],
  skipped: number,
): void {
  printHeader("Description repair inventory");
  printKeyValue("Stored rows inspected", rows.length);
  printKeyValue("Candidates", selected.length);
  printKeyValue("Skipped", skipped);
  printKeyValue("Writes", "disabled (read-only inventory)");
  printFooter();
}

async function applyManifest(
  manifest: RepairManifestFile,
  source?: SupportedBillSource,
): Promise<{ applied: number; skipped: number; failed: number }> {
  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of manifest.entries) {
    if (!entry.newDescription) {
      failed++;
      logger.error(
        `${entry.billNumber} cannot apply: ${entry.error ?? "manifest entry has no generated description"}`,
      );
      continue;
    }
    if (source && entry.sourceWebsite !== source) {
      failed++;
      logger.error(
        `${entry.billNumber} cannot apply: manifest source does not match --source ${source}`,
      );
      continue;
    }
    const newDescription = entry.newDescription;
    let outcome:
      | {
          kind: "applied";
          oldDescription: string | null;
          newDescription: string;
        }
      | { kind: "failed"; reason: string };
    try {
      outcome = await db.transaction(async (tx) => {
        // Lock and validate in the same transaction as the update. A separate
        // read followed by UPDATE would leave a race where source evidence could
        // change after validation but before the description write.
        const [selected] = await tx
          .select(BILL_REPAIR_FIELDS)
          .from(Bill)
          .where(eq(Bill.id, entry.id))
          .for("update")
          .limit(1);
        if (!selected) {
          return {
            kind: "failed" as const,
            reason: "bill row is missing",
          };
        }

        const row = asRepairRow(selected);
        if (source && row.sourceWebsite !== source) {
          return {
            kind: "failed" as const,
            reason: `bill source does not match --source ${source}`,
          };
        }
        if (!manifestEntryIsFresh(entry, row)) {
          return {
            kind: "failed" as const,
            reason:
              "source, lifecycle evidence, or description changed since generation",
          };
        }

        const invalidReason = validateRepairDescription(
          newDescription,
          lifecycleFor(row),
          manifest.maxChars,
        );
        if (invalidReason) {
          return {
            kind: "failed" as const,
            reason: `generated description is no longer valid (${invalidReason})`,
          };
        }

        const values = descriptionUpdateValues(newDescription);
        await tx.update(Bill).set(values).where(eq(Bill.id, row.id));
        return {
          kind: "applied" as const,
          oldDescription: row.description,
          newDescription: values.description,
        };
      });
    } catch (error) {
      failed++;
      logger.error(
        `${entry.billNumber} failed during apply: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    if (outcome.kind === "failed") {
      failed++;
      logger.error(`${entry.billNumber} rejected: ${outcome.reason}`);
      continue;
    }
    applied++;
    logger.success(
      `${entry.billNumber}: ${outcome.oldDescription ?? "<empty>"} -> ${outcome.newDescription}`,
    );
  }

  skipped = manifest.entries.length - applied - failed;
  return { applied, skipped, failed };
}

async function parseArgs(argv: readonly string[]) {
  return yargs(argv)
    .option("id", {
      alias: "bill-id",
      type: "string",
      array: true,
      description: "Bill id to inspect or force (repeatable, max 1000)",
    })
    .option("limit", {
      type: "number",
      description: "Maximum stored bill rows to inspect (1-1000)",
    })
    .option("source", {
      type: "string",
      choices: [...SUPPORTED_BILL_SOURCES],
      description: "Limit selection to one stored source",
    })
    .option("generate", {
      type: "boolean",
      default: false,
      description: "Generate candidates and write a review manifest",
    })
    .option("output", {
      type: "string",
      description: "Manifest output path (required with --generate)",
    })
    .option("apply", {
      type: "boolean",
      default: false,
      description: "Apply a previously reviewed manifest",
    })
    .option("manifest", {
      type: "string",
      description: "Manifest input path (required with --apply)",
    })
    .option("yes", {
      type: "boolean",
      default: false,
      description: "Acknowledge production writes",
    })
    .option("concurrency", {
      type: "number",
      default: 5,
      description: "Concurrent generations (1-10)",
    })
    .option("max-chars", {
      type: "number",
      default: BILL_DESCRIPTION_MAX_CHARS,
      description: "Maximum generated description length (1-100)",
    })
    .check((args) => {
      const rawIds = (args.id ?? []) as string[];
      const ids = rawIds.filter((id) => id.trim().length > 0);
      if (ids.length !== rawIds.length) {
        throw new Error("--id values must be non-empty");
      }
      const maxChars =
        typeof args.maxChars === "number" ? args.maxChars : undefined;
      if (ids.length > MAX_REPAIR_ROWS) {
        throw new Error(
          `--id may be repeated at most ${MAX_REPAIR_ROWS} times`,
        );
      }
      if (
        args.limit !== undefined &&
        (!Number.isInteger(args.limit) ||
          args.limit < 1 ||
          args.limit > MAX_REPAIR_ROWS)
      ) {
        throw new Error(
          `--limit must be an integer from 1 to ${MAX_REPAIR_ROWS}`,
        );
      }
      if (
        maxChars !== undefined &&
        (!Number.isInteger(maxChars) ||
          maxChars < 1 ||
          maxChars > BILL_DESCRIPTION_MAX_CHARS)
      ) {
        throw new Error(
          `--max-chars must be an integer from 1 to ${BILL_DESCRIPTION_MAX_CHARS}`,
        );
      }
      if (
        !Number.isInteger(args.concurrency) ||
        args.concurrency < 1 ||
        args.concurrency > 10
      ) {
        throw new Error("--concurrency must be an integer from 1 to 10");
      }
      if (args.generate && args.apply)
        throw new Error("choose only one of --generate or --apply");
      if (args.generate && !args.output)
        throw new Error("--output is required with --generate");
      if (args.apply && !args.manifest)
        throw new Error("--manifest is required with --apply");
      if (args.output && !args.generate)
        throw new Error("--output requires --generate");
      if (args.manifest && !args.apply)
        throw new Error("--manifest requires --apply");
      if (!args.apply && ids.length === 0 && args.limit === undefined) {
        throw new Error("provide repeatable --id or a bounded --limit");
      }
      return true;
    })
    .strict()
    .help()
    .parse();
}

export async function main(
  argv: readonly string[] = hideBin(process.argv),
): Promise<void> {
  const args = await parseArgs(argv);
  const ids = ((args.id ?? []) as string[]).filter(Boolean);
  const source = args.source as SupportedBillSource | undefined;
  const maxChars = args.maxChars ?? BILL_DESCRIPTION_MAX_CHARS;
  const concurrency = args.concurrency ?? 5;
  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) throw new Error("POSTGRES_URL is required");

  const target = databaseTarget(databaseUrl);
  if (args.apply && target.target === "production" && !args.yes) {
    throw new Error("Production writes require both --apply and --yes");
  }
  logger[target.target === "production" ? "warn" : "info"](
    args.apply
      ? databaseTargetMessage(databaseUrl)
      : `Database target: ${target.host} (${target.target}; read-only inventory${args.generate ? " and manifest generation" : ""}).`,
  );

  if (args.apply) {
    const manifest = await readManifest(args.manifest!);
    const result = await applyManifest(manifest, source);
    printHeader("Description repair result");
    printKeyValue("Applied", result.applied);
    printKeyValue("Skipped", result.skipped);
    printKeyValue("Failed", result.failed);
    printFooter();
    if (result.failed > 0) process.exitCode = 1;
    return;
  }

  const rows = await loadRows({
    ids: ids.length ? ids : undefined,
    limit: ids.length ? undefined : args.limit,
    source,
  });
  const rowIds = new Set(rows.map((row) => row.id));
  const missingIds = ids.filter((id) => !rowIds.has(id));
  for (const id of missingIds)
    logger.error(`${id} was not found in the selected bill sources`);

  const selectedRows = rows.filter(
    (row) => repairRowSelection(row, maxChars, ids.includes(row.id)).selected,
  );
  reportInventory(rows, selectedRows, rows.length - selectedRows.length);
  if (missingIds.length > 0) process.exitCode = 1;
  if (!args.generate) return;

  const generatedAt = new Date().toISOString();
  const limit = pLimit(concurrency);
  const results = await Promise.all(
    selectedRows.map((row) => limit(() => generateEntry(row, maxChars))),
  );
  const manifest: RepairManifestFile = {
    command: "repair-bill-descriptions",
    version: REPAIR_MANIFEST_VERSION,
    generatedAt,
    maxChars,
    ...(source ? { source } : {}),
    entries: results.map((result) => result.entry),
  };
  await writeManifest(args.output!, manifest);
  printHeader("Description repair manifest");
  printKeyValue("Output", args.output!);
  printKeyValue("Generated", results.filter((result) => result.ok).length);
  printKeyValue("Failed", results.filter((result) => !result.ok).length);
  printFooter();
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

// The entry wrapper loads repository dotenv files before calling main. Keeping
// execution out of this module makes its manifest and stale-row helpers easy to
// test without a database connection or provider credentials.
