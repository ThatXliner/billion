"use client";

import * as React from "react";
import { Slider } from "./slider";
import { cn } from "./index";

export interface ArticleDepthControlProps {
  value: 1 | 2 | 3 | 4 | 5;
  onValueChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  isGenerating?: boolean;
  isCached?: boolean;
  className?: string;
}

const DEPTH_LABELS = {
  1: "Brief",
  2: "Summary",
  3: "Standard",
  4: "Detailed",
  5: "Expert",
} as const;

const DEPTH_DESCRIPTIONS = {
  1: "Quick overview (100-200 words)",
  2: "Essential facts (300-400 words)",
  3: "Balanced coverage (500-700 words)",
  4: "Comprehensive (800-1000 words)",
  5: "In-depth analysis (1200+ words)",
} as const;

export function ArticleDepthControl({
  value,
  onValueChange,
  isGenerating = false,
  isCached = false,
  className,
}: ArticleDepthControlProps) {
  return (
    <div className={cn("space-y-4 p-4 rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            Article Depth: {DEPTH_LABELS[value]}
          </h3>
          <p className="text-sm text-muted-foreground">
            {DEPTH_DESCRIPTIONS[value]}
          </p>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </div>
        )}
        {isCached && !isGenerating && (
          <span className="text-sm text-green-600 font-medium">✓ Cached</span>
        )}
      </div>

      <div className="space-y-2">
        <Slider
          min={1}
          max={5}
          step={1}
          value={value}
          onValueChange={(val) => onValueChange(val as 1 | 2 | 3 | 4 | 5)}
          disabled={isGenerating}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Brief</span>
          <span>Summary</span>
          <span>Standard</span>
          <span>Detailed</span>
          <span>Expert</span>
        </div>
      </div>
    </div>
  );
}
