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

  const [result] = await db
    .insert(Bill)
    .values({
      ...billData,
      contentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: [Bill.billNumber, Bill.sourceWebsite],
      set: (excluded) => {
        // Only update if content hash has changed
        // This requires a subquery approach or we need to handle version tracking differently
        return {
          title: excluded.title,
          description: excluded.description,
          sponsor: excluded.sponsor,
          status: excluded.status,
          introducedDate: excluded.introducedDate,
          congress: excluded.congress,
          chamber: excluded.chamber,
          summary: excluded.summary,
          fullText: excluded.fullText,
          url: excluded.url,
          contentHash: excluded.contentHash,
          updatedAt: new Date(),
        };
      },
    })
    .returning();

  console.log(`Bill ${billData.billNumber} upserted`);
  return result;
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

  const [result] = await db
    .insert(GovernmentContent)
    .values({
      ...contentData,
      contentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: GovernmentContent.url,
      set: {
        title: contentData.title,
        type: contentData.type,
        publishedDate: contentData.publishedDate,
        description: contentData.description,
        fullText: contentData.fullText,
        source: contentData.source,
        contentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Government content "${contentData.title}" upserted`);
  return result;
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

  const [result] = await db
    .insert(CourtCase)
    .values({
      ...caseData,
      contentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: CourtCase.caseNumber,
      set: {
        title: caseData.title,
        court: caseData.court,
        filedDate: caseData.filedDate,
        description: caseData.description,
        status: caseData.status,
        fullText: caseData.fullText,
        url: caseData.url,
        contentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Court case ${caseData.caseNumber} upserted`);
  return result;
}
