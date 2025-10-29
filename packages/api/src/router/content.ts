import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, GovernmentContent, CourtCase } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Schema for content card
const ContentCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["bill", "order", "case", "general"]),
  isAIGenerated: z.boolean(),
});

export type ContentCard = z.infer<typeof ContentCardSchema>;

// Schema for detailed content
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContentDetailSchema = ContentCardSchema.extend({
  articleContent: z.string(),
  originalContent: z.string(),
});

export type ContentDetail = z.infer<typeof ContentDetailSchema>;

// Mock data (will be replaced with database queries later)
const mockContent: ContentCard[] = [
  {
    id: "1",
    title: "AI Generated Short Form",
    description:
      "Video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
    type: "bill",
    isAIGenerated: true,
  },
  {
    id: "2",
    title: "Healthcare Reform Bill Analysis",
    description:
      "Comprehensive breakdown of the proposed healthcare legislation and its potential impacts on different demographics",
    type: "bill",
    isAIGenerated: true,
  },
  {
    id: "3",
    title: "Supreme Court Order Update",
    description:
      "Recent court ruling on constitutional matters with expert legal commentary and public reaction",
    type: "order",
    isAIGenerated: true,
  },
  {
    id: "4",
    title: "Environmental Case Study",
    description:
      "Ongoing legal case about environmental protection policies and corporate responsibility",
    type: "case",
    isAIGenerated: true,
  },
];

// Mock detailed content (will be replaced with database queries later)
const mockDetailedContent: ContentDetail[] = [
  {
    id: "1",
    title: "AI Generated Short Form",
    description:
      "Video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
    type: "bill",
    isAIGenerated: true,
    articleContent: `AI Generated short form video describing the law/bill/action, it's consequences, and views from both sides of the political spectrum.

This comprehensive analysis breaks down the key components of the proposed legislation and examines its potential impact across different sectors of society.

Key Points:
• Bipartisan support and opposition
• Economic implications
• Social impact considerations
• Timeline for implementation
• Public opinion analysis

The algorithm which helps with keeping you interested and helps up to read/watch the next one.

In our app, we can let you view the thing in question in 2 long-form modes:
- an engaging and visual/heavy AI-generated article (with quotes to the original)
- the original source, in a better, consistent, and modern reading UI`,
    originalContent: `[Original Bill Text]

H.R. 1234 - The Healthcare Modernization Act

Section 1. Short Title
This Act may be cited as the "Healthcare Modernization Act".

Section 2. Findings
Congress finds the following:
(1) Healthcare accessibility remains a critical challenge
(2) Technology can improve patient outcomes
(3) Cost reduction measures are necessary

Section 3. Healthcare Technology Integration
(a) IN GENERAL.—The Secretary shall establish a program to integrate modern technology solutions into healthcare delivery systems.

(b) REQUIREMENTS.—The program established under subsection (a) shall include:
(1) Electronic health record standardization
(2) Telemedicine infrastructure development
(3) AI-assisted diagnostic tools

[Continue reading original source...]`,
  },
  {
    id: "2",
    title: "Healthcare Reform Bill Analysis",
    description:
      "Comprehensive breakdown of the proposed healthcare legislation and its potential impacts on different demographics",
    type: "bill",
    isAIGenerated: true,
    articleContent: `Comprehensive analysis of the Healthcare Reform Bill and its wide-ranging implications for American citizens.

Overview:
The proposed Healthcare Reform Bill represents one of the most significant legislative efforts to modernize the American healthcare system in decades. This article breaks down the complex provisions and examines perspectives from across the political spectrum.

Conservative Perspective:
• Concerns about government overreach
• Emphasis on market-based solutions
• Focus on cost control through competition

Progressive Perspective:
• Support for expanded coverage
• Emphasis on healthcare as a right
• Focus on reducing inequalities

Economic Impact:
The Congressional Budget Office estimates this bill would affect healthcare spending by approximately $1.2 trillion over the next decade, with provisions for cost savings through efficiency improvements and preventive care initiatives.`,
    originalContent: `H.R. 2567 - Healthcare Reform Act of 2025

SECTION 1. SHORT TITLE.
This Act may be cited as the "Healthcare Reform Act of 2025".

SECTION 2. EXPANSION OF HEALTHCARE COVERAGE.
(a) ELIGIBILITY.—
(1) IN GENERAL.—The Secretary shall expand eligibility criteria for federal healthcare programs to include individuals and families with incomes up to 400 percent of the federal poverty level.

(2) IMPLEMENTATION.—Not later than 180 days after the date of enactment of this Act, the Secretary shall issue regulations to implement the provisions of paragraph (1).

SECTION 3. COST REDUCTION MEASURES.
(a) PRESCRIPTION DRUG PRICING.—
(1) NEGOTIATION AUTHORITY.—The Secretary is authorized to negotiate prices for prescription drugs covered under federal healthcare programs.

(b) PREVENTIVE CARE.—Enhanced funding for preventive care services and wellness programs.

[Original text continues...]`,
  },
  {
    id: "3",
    title: "Supreme Court Order Update",
    description:
      "Recent court ruling on constitutional matters with expert legal commentary and public reaction",
    type: "order",
    isAIGenerated: true,
    articleContent: `Breaking down the Supreme Court's landmark decision on constitutional rights and its implications for future cases.

The Decision:
In a 6-3 ruling, the Supreme Court has clarified the scope of constitutional protections in the digital age, establishing new precedents for privacy rights and government oversight.

Majority Opinion Highlights:
• Constitutional protections extend to digital communications
• Warrants required for certain types of data access
• Balance between security and privacy

Dissenting Opinions:
• Concerns about law enforcement capabilities
• Questions about practical implementation
• Debate over constitutional interpretation

Impact on Future Cases:
Legal experts predict this ruling will influence dozens of pending cases and reshape how lower courts approach digital privacy issues.`,
    originalContent: `SUPREME COURT OF THE UNITED STATES

No. 23-1234

UNITED STATES, PETITIONER v. JOHN DOE

ON WRIT OF CERTIORARI TO THE UNITED STATES COURT OF APPEALS FOR THE NINTH CIRCUIT

[March 15, 2025]

CHIEF JUSTICE ROBERTS delivered the opinion of the Court.

The question before us is whether the Fourth Amendment requires law enforcement to obtain a warrant before accessing certain digital communications stored by third-party service providers. We hold that it does.

I
The facts of this case are straightforward. Law enforcement officials...

[Opinion continues with detailed legal analysis and precedent citations...]`,
  },
  {
    id: "4",
    title: "Environmental Case Study",
    description:
      "Ongoing legal case about environmental protection policies and corporate responsibility",
    type: "case",
    isAIGenerated: true,
    articleContent: `Deep dive into the landmark environmental case that could reshape corporate accountability for climate change.

Case Background:
Multiple state attorneys general have brought suit against major corporations, alleging decades of environmental harm and misleading public statements about climate impacts.

Plaintiff Arguments:
• Documentation of environmental damage
• Evidence of corporate knowledge
• Claims of public deception
• Requests for remediation funding

Defense Position:
• Questions about legal jurisdiction
• Arguments regarding scientific uncertainty at the time
• Discussion of industry-wide practices
• Constitutional concerns about retroactive liability

Potential Outcomes:
Legal scholars suggest this case could establish new frameworks for environmental liability and corporate disclosure requirements.`,
    originalContent: `STATE OF CALIFORNIA, et al., Plaintiffs
v.
EXAMPLE ENERGY CORPORATION, et al., Defendants

CASE NO. 2024-CV-5678
DISTRICT COURT, NORTHERN DISTRICT OF CALIFORNIA

PLAINTIFF'S COMPLAINT

I. INTRODUCTION
Plaintiffs, the States of California, New York, and Massachusetts, bring this action against Defendants for damages and injunctive relief arising from Defendants' contributions to climate change and their campaign to deceive the public about the environmental and health impacts of their products.

II. PARTIES
1. Plaintiff State of California is a sovereign state...

III. JURISDICTION AND VENUE
This Court has jurisdiction pursuant to...

[Complaint continues with detailed allegations and legal claims...]`,
  },
];

export const contentRouter = {
  // Get all content from database
  getAll: publicProcedure.query(async () => {
    const bills = await db.select().from(Bill).orderBy(desc(Bill.createdAt)).limit(20);
    const governmentContent = await db.select().from(GovernmentContent).orderBy(desc(GovernmentContent.createdAt)).limit(20);
    const courtCases = await db.select().from(CourtCase).orderBy(desc(CourtCase.createdAt)).limit(20);

    const allContent: ContentCard[] = [
      // Mock content first
      ...mockContent,
      // Bills from database
      ...bills.map((bill) => ({
        id: bill.id,
        title: bill.title,
        description: bill.description || bill.summary || '',
        type: 'bill' as const,
        isAIGenerated: false,
      })),
      // Government content (news articles, executive orders, etc.) from database
      ...governmentContent.map((content) => ({
        id: content.id,
        title: content.title,
        description: content.description || '',
        type: 'general' as const,
        isAIGenerated: false,
      })),
      // Court cases from database
      ...courtCases.map((courtCase) => ({
        id: courtCase.id,
        title: courtCase.title,
        description: courtCase.description || '',
        type: 'case' as const,
        isAIGenerated: false,
      })),
    ];

    return allContent;
  }),

  // Get content filtered by type from database
  getByType: publicProcedure
    .input(
      z.object({
        type: z.enum(["all", "bill", "order", "case", "general"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.type || input.type === "all") {
        const bills = await db.select().from(Bill).orderBy(desc(Bill.createdAt)).limit(20);
        const governmentContent = await db.select().from(GovernmentContent).orderBy(desc(GovernmentContent.createdAt)).limit(20);
        const courtCases = await db.select().from(CourtCase).orderBy(desc(CourtCase.createdAt)).limit(20);

        const allContent: ContentCard[] = [
          // Mock content first
          ...mockContent,
          // Bills from database
          ...bills.map((bill) => ({
            id: bill.id,
            title: bill.title,
            description: bill.description || bill.summary || '',
            type: 'bill' as const,
            isAIGenerated: false,
          })),
          // Government content from database
          ...governmentContent.map((content) => ({
            id: content.id,
            title: content.title,
            description: content.description || '',
            type: 'general' as const,
            isAIGenerated: false,
          })),
          // Court cases from database
          ...courtCases.map((courtCase) => ({
            id: courtCase.id,
            title: courtCase.title,
            description: courtCase.description || '',
            type: 'case' as const,
            isAIGenerated: false,
          })),
        ];

        return allContent;
      }

      if (input.type === "bill") {
        const bills = await db.select().from(Bill).orderBy(desc(Bill.createdAt)).limit(50);
        return bills.map((bill) => ({
          id: bill.id,
          title: bill.title,
          description: bill.description || bill.summary || '',
          type: 'bill' as const,
          isAIGenerated: false,
        }));
      }

      if (input.type === "order" || input.type === "general") {
        const governmentContent = await db.select().from(GovernmentContent).orderBy(desc(GovernmentContent.createdAt)).limit(50);
        return governmentContent.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || '',
          type: 'general' as const,
          isAIGenerated: false,
        }));
      }

      if (input.type === "case") {
        const courtCases = await db.select().from(CourtCase).orderBy(desc(CourtCase.createdAt)).limit(50);
        return courtCases.map((courtCase) => ({
          id: courtCase.id,
          title: courtCase.title,
          description: courtCase.description || '',
          type: 'case' as const,
          isAIGenerated: false,
        }));
      }

      return [];
    }),

  // Get detailed content by ID from database
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // Check mock content first
      const mockItem = mockDetailedContent.find(item => item.id === input.id);
      if (mockItem) {
        return mockItem;
      }

      // Try to find in bills
      const bill = await db.select().from(Bill).where(eq(Bill.id, input.id)).limit(1);
      if (bill.length > 0) {
        const b = bill[0]!;
        return {
          id: b.id,
          title: b.title,
          description: b.description || b.summary || '',
          type: 'bill' as const,
          isAIGenerated: false,
          articleContent: b.summary || b.description || 'No summary available',
          originalContent: b.fullText || 'Full text not available',
        };
      }

      // Try to find in government content
      const content = await db.select().from(GovernmentContent).where(eq(GovernmentContent.id, input.id)).limit(1);
      if (content.length > 0) {
        const c = content[0]!;
        return {
          id: c.id,
          title: c.title,
          description: c.description || '',
          type: 'general' as const,
          isAIGenerated: false,
          articleContent: c.description || 'No description available',
          originalContent: c.fullText || 'Full text not available',
        };
      }

      // Try to find in court cases
      const courtCase = await db.select().from(CourtCase).where(eq(CourtCase.id, input.id)).limit(1);
      if (courtCase.length > 0) {
        const c = courtCase[0]!;
        return {
          id: c.id,
          title: c.title,
          description: c.description || '',
          type: 'case' as const,
          isAIGenerated: false,
          articleContent: c.description || 'No description available',
          originalContent: c.fullText || 'Full text not available',
        };
      }

      throw new Error(`Content with id ${input.id} not found`);
    }),
} satisfies TRPCRouterRecord;
