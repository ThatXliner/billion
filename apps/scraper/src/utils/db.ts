import { createHash } from 'crypto';
import { eq, and } from '@acme/db';
import { db } from '@acme/db/client';
import { Bill, PresidentialAction, CourtCase } from '@acme/db/schema';

// Utility to create a hash of content for version tracking
export function createContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Insert or update a bill with version tracking
export async function upsertBill(billData: {
  billNumber: string;
  title: string;
  description?: string;
  sponsor?: string;
  status?: string;
  introducedDate?: Date;
  congress?: number;
  chamber?: string;
  summary?: string;
  fullText?: string;
  url: string;
  sourceWebsite: string;
}) {
  const contentForHash = JSON.stringify({
    title: billData.title,
    description: billData.description,
    status: billData.status,
    summary: billData.summary,
    fullText: billData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  // Check if bill already exists
  const existing = await db
    .select()
    .from(Bill)
    .where(
      and(
        eq(Bill.billNumber, billData.billNumber),
        eq(Bill.sourceWebsite, billData.sourceWebsite)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const existingBill = existing[0]!;

    // If content hash is the same, no update needed
    if (existingBill.contentHash === contentHash) {
      console.log(`Bill ${billData.billNumber} unchanged, skipping update`);
      return existingBill;
    }

    // Content has changed, update with version tracking
    const versions = existingBill.versions || [];
    versions.push({
      hash: existingBill.contentHash,
      updatedAt: existingBill.updatedAt?.toISOString() || new Date().toISOString(),
      changes: 'Content updated',
    });

    const [updated] = await db
      .update(Bill)
      .set({
        ...billData,
        contentHash,
        versions,
      })
      .where(eq(Bill.id, existingBill.id))
      .returning();

    console.log(`Bill ${billData.billNumber} updated with new version`);
    return updated;
  }

  // Insert new bill
  const [newBill] = await db
    .insert(Bill)
    .values({
      ...billData,
      contentHash,
      versions: [],
    })
    .returning();

  console.log(`Bill ${billData.billNumber} inserted`);
  return newBill;
}

// Insert or update a presidential action with version tracking
export async function upsertPresidentialAction(actionData: {
  title: string;
  type: string;
  issuedDate: Date;
  description?: string;
  fullText?: string;
  url: string;
}) {
  const contentForHash = JSON.stringify({
    title: actionData.title,
    description: actionData.description,
    fullText: actionData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  // Check if action already exists (by URL as unique identifier)
  const existing = await db
    .select()
    .from(PresidentialAction)
    .where(eq(PresidentialAction.url, actionData.url))
    .limit(1);

  if (existing.length > 0) {
    const existingAction = existing[0]!;

    // If content hash is the same, no update needed
    if (existingAction.contentHash === contentHash) {
      console.log(`Presidential action "${actionData.title}" unchanged, skipping update`);
      return existingAction;
    }

    // Content has changed, update with version tracking
    const versions = existingAction.versions || [];
    versions.push({
      hash: existingAction.contentHash,
      updatedAt: existingAction.updatedAt?.toISOString() || new Date().toISOString(),
      changes: 'Content updated',
    });

    const [updated] = await db
      .update(PresidentialAction)
      .set({
        ...actionData,
        contentHash,
        versions,
      })
      .where(eq(PresidentialAction.id, existingAction.id))
      .returning();

    console.log(`Presidential action "${actionData.title}" updated with new version`);
    return updated;
  }

  // Insert new action
  const [newAction] = await db
    .insert(PresidentialAction)
    .values({
      ...actionData,
      contentHash,
      versions: [],
    })
    .returning();

  console.log(`Presidential action "${actionData.title}" inserted`);
  return newAction;
}

// Insert or update a court case with version tracking
export async function upsertCourtCase(caseData: {
  caseNumber: string;
  title: string;
  court: string;
  filedDate?: Date;
  description?: string;
  status?: string;
  fullText?: string;
  url: string;
}) {
  const contentForHash = JSON.stringify({
    title: caseData.title,
    description: caseData.description,
    status: caseData.status,
    fullText: caseData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  // Check if case already exists
  const existing = await db
    .select()
    .from(CourtCase)
    .where(eq(CourtCase.caseNumber, caseData.caseNumber))
    .limit(1);

  if (existing.length > 0) {
    const existingCase = existing[0]!;

    // If content hash is the same, no update needed
    if (existingCase.contentHash === contentHash) {
      console.log(`Court case ${caseData.caseNumber} unchanged, skipping update`);
      return existingCase;
    }

    // Content has changed, update with version tracking
    const versions = existingCase.versions || [];
    versions.push({
      hash: existingCase.contentHash,
      updatedAt: existingCase.updatedAt?.toISOString() || new Date().toISOString(),
      changes: 'Content updated',
    });

    const [updated] = await db
      .update(CourtCase)
      .set({
        ...caseData,
        contentHash,
        versions,
      })
      .where(eq(CourtCase.id, existingCase.id))
      .returning();

    console.log(`Court case ${caseData.caseNumber} updated with new version`);
    return updated;
  }

  // Insert new case
  const [newCase] = await db
    .insert(CourtCase)
    .values({
      ...caseData,
      contentHash,
      versions: [],
    })
    .returning();

  console.log(`Court case ${caseData.caseNumber} inserted`);
  return newCase;
}
