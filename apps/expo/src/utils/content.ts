/** Shared shape + helpers for backend content items (bills, orders, cases). */
import type { ContentCardItem } from "~/components/ui";
import type {
  ContentJurisdiction,
  JurisdictionCode,
} from "~/utils/jurisdiction";
import { resolveType } from "~/styles";
import { isStateJurisdiction, JURISDICTIONS } from "~/utils/jurisdiction";

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: "bill" | "government_content" | "court_case" | "general";
  thumbnailUrl?: string;
  imageUri?: string;
  billNumber?: string;
  jurisdiction?: ContentJurisdiction;
  jurisdictionCode?: JurisdictionCode;
  billStatus?: string;
  activityAt?: Date;
  chamber?: string;
  sponsor?: string;
  sessionLabel?: string;
}

const STATUS_LABEL: Record<ContentItem["type"], string> = {
  bill: "Legislation",
  government_content: "Executive action",
  court_case: "Court case",
  general: "Briefing",
};

/** Map a backend content item onto the props a ContentCard expects. */
function stateBillTag(
  billNumber: string | undefined,
  showJurisdiction: boolean,
): string | undefined {
  if (!billNumber) return undefined;
  const match = /^([A-Z]{2})\s+(.+?)\s+\([^)]+\)$/.exec(billNumber);
  if (!match) return billNumber;
  return showJurisdiction ? match[2] : `${match[1]} ${match[2]}`;
}

/** Map API content onto a card, preserving legislative status and context. */
export function toCardItem(
  item: ContentItem,
  options: { showJurisdiction?: boolean } = {},
): ContentCardItem {
  const stateName = isStateJurisdiction(item.jurisdiction)
    ? JURISDICTIONS[item.jurisdiction].name
    : undefined;
  const isBill = item.type === "bill";
  const isStateBill = isBill && !!stateName;
  return {
    id: item.id,
    type: resolveType(item.type),
    tag: isStateBill
      ? stateBillTag(item.billNumber, !!options.showJurisdiction)
      : item.billNumber,
    title: item.title,
    gist: item.description,
    status: isBill
      ? (item.billStatus ?? STATUS_LABEL.bill)
      : STATUS_LABEL[item.type],
    activityAt: isBill ? item.activityAt : undefined,
    meta: isStateBill
      ? [item.chamber && `${stateName} ${item.chamber}`, item.sponsor]
          .filter(Boolean)
          .join(" · ")
      : undefined,
    jurisdictionCode:
      isStateBill && options.showJurisdiction
        ? item.jurisdictionCode
        : undefined,
    statusTone: /veto/i.test(item.billStatus ?? "") ? "warning" : "accent",
    thumbnailUrl: item.thumbnailUrl,
    imageUri: item.imageUri,
  };
}
