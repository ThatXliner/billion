import { createHash } from 'crypto';
import { eq, and } from '@acme/db';
import { db } from '@acme/db/client';
import { Bill, GovernmentContent, CourtCase } from '@acme/db/schema';

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

// Insert or update government content with version tracking
export async function upsertGovernmentContent(contentData: {
  title: string;
  type: string;
  publishedDate: Date;
  description?: string;
  fullText?: string;
  url: string;
  source?: string;
}) {
  const contentForHash = JSON.stringify({
    title: contentData.title,
    description: contentData.description,
    fullText: contentData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  // Check if content already exists (by URL as unique identifier)
  const existing = await db
    .select()
    .from(GovernmentContent)
    .where(eq(GovernmentContent.url, contentData.url))
    .limit(1);

  if (existing.length > 0) {
    const existingContent = existing[0]!;

    // If content hash is the same, no update needed
    if (existingContent.contentHash === contentHash) {
      console.log(`Government content "${contentData.title}" unchanged, skipping update`);
      return existingContent;
    }

    // Content has changed, update with version tracking
    const versions = existingContent.versions || [];
    versions.push({
      hash: existingContent.contentHash,
      updatedAt: existingContent.updatedAt?.toISOString() || new Date().toISOString(),
      changes: 'Content updated',
    });

    const [updated] = await db
      .update(GovernmentContent)
      .set({
        ...contentData,
        contentHash,
        versions,
      })
      .where(eq(GovernmentContent.id, existingContent.id))
      .returning();

    console.log(`Government content "${contentData.title}" updated with new version`);
    return updated;
  }

  // Insert new content
  const [newContent] = await db
    .insert(GovernmentContent)
    .values({
      ...contentData,
      contentHash,
      versions: [],
    })
    .returning();

  console.log(`Government content "${contentData.title}" inserted`);
  return newContent;
}

// Legacy function name for backward compatibility
export async function upsertPresidentialAction(actionData: {
  title: string;
  type: string;
  issuedDate?: Date;
  publishedDate?: Date;
  description?: string;
  fullText?: string;
  url: string;
  source?: string;
}) {
  return upsertGovernmentContent({
    ...actionData,
    publishedDate: actionData.publishedDate || actionData.issuedDate || new Date(),
    source: actionData.source || 'whitehouse.gov',
  });
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
