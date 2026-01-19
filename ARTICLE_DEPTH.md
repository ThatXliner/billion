# Article Depth Feature Implementation Guide

## Overview
Users can now adjust the depth of AI-generated articles using a slider (1-5 levels). Articles are cached in the database to avoid regeneration.

## Features

### 5 Depth Levels
1. **Brief (1)** - 100-200 words, key points only
2. **Summary (2)** - 300-400 words, essential facts
3. **Standard (3)** - 500-700 words, balanced coverage (default)
4. **Detailed (4)** - 800-1000 words, comprehensive analysis
5. **Expert (5)** - 1200+ words, in-depth with historical context

### Caching System
- Articles generated at each depth level are stored in `articleGenerations` JSONB field
- Cached articles are retrieved instantly
- Only generates new content if depth level hasn't been cached yet
- Default article (`aiGeneratedArticle`) is used for depth 3

## Database Schema

### New Field: `articleGenerations`
Added to `Bill`, `GovernmentContent`, and `CourtCase` tables:

```typescript
articleGenerations: {
  depth: number;      // 1-5
  content: string;    // Generated markdown article
  generatedAt: string; // ISO timestamp
}[]
```

### Migration
Run the migration to add the new field:
```bash
cd packages/db
npx drizzle-kit push
```

## API Endpoints

### 1. Get Article at Specific Depth
```typescript
api.content.getArticleAtDepth.useQuery({
  id: "content-id",
  type: "general", // or "bill" | "case"
  depth: 3,        // 1-5
});

// Returns:
{
  content: "markdown article content...",
  cached: true,  // true if from cache, false if newly generated
  depth: 3,
  depthDescription: "Standard (500-700 words) - Balanced coverage with analysis"
}
```

### 2. Get Available Depth Levels
```typescript
api.content.getDepthLevels.useQuery();

// Returns:
[
  { depth: 1, description: "Brief (100-200 words) - Quick overview..." },
  { depth: 2, description: "Summary (300-400 words) - Essential facts..." },
  ...
]
```

### 3. Check Cached Depths
```typescript
api.content.getCachedDepths.useQuery({
  id: "content-id",
  type: "general",
});

// Returns:
{
  cachedDepths: [
    { depth: 3, generatedAt: "2026-01-19T12:00:00Z" },
    { depth: 4, generatedAt: "2026-01-19T12:05:00Z" },
  ]
}
```

## UI Components

### ArticleDepthControl Component
Pre-built slider component with labels and status indicators:

```tsx
import { ArticleDepthControl } from "@acme/ui";
import { useState } from "react";

function ArticleView() {
  const [depth, setDepth] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  const { data, isLoading } = api.content.getArticleAtDepth.useQuery({
    id: articleId,
    type: "general",
    depth,
  });

  return (
    <div>
      <ArticleDepthControl
        value={depth}
        onValueChange={setDepth}
        isGenerating={isLoading}
        isCached={data?.cached}
      />
      
      <article className="prose">
        {data?.content}
      </article>
    </div>
  );
}
```

### Slider Component
Low-level slider component for custom implementations:

```tsx
import { Slider } from "@acme/ui";

<Slider
  min={1}
  max={5}
  step={1}
  value={depth}
  onValueChange={setDepth}
/>
```

## Complete Example: Article Detail Page

```tsx
"use client";

import { useState } from "react";
import { ArticleDepthControl } from "@acme/ui";
import { api } from "~/trpc/react";
import ReactMarkdown from "react-markdown";

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [depth, setDepth] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  // Get article metadata
  const { data: article } = api.content.getById.useQuery({
    id: params.id,
  });
  
  // Get article content at selected depth
  const { data: articleContent, isLoading } = api.content.getArticleAtDepth.useQuery({
    id: params.id,
    type: article?.type === "bill" ? "bill" : 
          article?.type === "case" ? "case" : "general",
    depth,
  });

  // Check which depths are cached
  const { data: cachedInfo } = api.content.getCachedDepths.useQuery({
    id: params.id,
    type: article?.type === "bill" ? "bill" : 
          article?.type === "case" ? "case" : "general",
  });

  if (!article) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        {article.thumbnailUrl && (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}
        <h1 className="text-4xl font-bold">{article.title}</h1>
        <p className="text-gray-600 mt-2">{article.description}</p>
      </div>

      {/* Depth Control */}
      <ArticleDepthControl
        value={depth}
        onValueChange={setDepth}
        isGenerating={isLoading}
        isCached={articleContent?.cached}
      />

      {/* Cache Status */}
      {cachedInfo && (
        <div className="text-sm text-gray-500">
          Cached depths: {cachedInfo.cachedDepths.map(d => d.depth).join(", ") || "None"}
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-lg max-w-none">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : articleContent ? (
          <ReactMarkdown>{articleContent.content}</ReactMarkdown>
        ) : (
          <p>No content available</p>
        )}
      </article>

      {/* Original Content Toggle */}
      <details className="mt-8">
        <summary className="cursor-pointer font-semibold">
          View Original Text
        </summary>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
          {article.originalContent}
        </div>
      </details>
    </div>
  );
}
```

## React Native / Expo Example

```tsx
import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { api } from "~/utils/api";
import Slider from "@react-native-community/slider";

export function ArticleScreen({ route }) {
  const { id, type } = route.params;
  const [depth, setDepth] = useState<1 | 2 | 3 | 4 | 5>(3);

  const { data: article } = api.content.getById.useQuery({ id });
  const { data: content, isLoading } = api.content.getArticleAtDepth.useQuery({
    id,
    type,
    depth,
  });

  const depthLabels = ["Brief", "Summary", "Standard", "Detailed", "Expert"];

  return (
    <ScrollView style={{ padding: 16 }}>
      {/* Header */}
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        {article?.title}
      </Text>

      {/* Depth Control */}
      <View style={{ marginTop: 20, padding: 16, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Article Depth: {depthLabels[depth - 1]}
        </Text>
        
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={depth}
          onValueChange={(val) => setDepth(Math.round(val) as any)}
          style={{ marginTop: 10 }}
        />
        
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
          {depthLabels.map((label) => (
            <Text key={label} style={{ fontSize: 10, color: "#666" }}>
              {label}
            </Text>
          ))}
        </View>

        {content?.cached && (
          <Text style={{ marginTop: 10, color: "green" }}>✓ Cached</Text>
        )}
      </View>

      {/* Content */}
      <View style={{ marginTop: 20 }}>
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text>{content?.content}</Text>
        )}
      </View>
    </ScrollView>
  );
}
```

## Utility Functions

### Pre-generate All Depths (Batch Processing)
Useful for pre-caching articles during scraping:

```typescript
import { preGenerateAllDepths } from "@acme/api/utils/article-depth";

// In your scraper
await preGenerateAllDepths(contentId, "general");
// Generates and caches articles at all 5 depth levels
```

### Get Depth Descriptions
```typescript
import { DEPTH_DESCRIPTIONS } from "@acme/api/utils/article-depth";

console.log(DEPTH_DESCRIPTIONS[3]);
// "Standard (500-700 words) - Balanced coverage with analysis"
```

## Performance Considerations

1. **First Load**: Depth 3 (Standard) uses the default `aiGeneratedArticle` - instant
2. **New Depth**: Takes 3-10 seconds to generate with GPT-4o-mini
3. **Cached Depth**: Instant retrieval from database
4. **Storage**: Each article ~500-2000 chars, JSONB efficiently stores 5 versions

## Cost Optimization

- Default articles (depth 3) generated during scraping
- Other depths generated on-demand only
- Caching eliminates duplicate API calls
- Consider pre-generating popular depths (1, 3, 5) during low-traffic periods

## Troubleshooting

### Article not generating
- Check if `fullText` field exists in content
- Verify OpenAI API key in environment
- Check API rate limits

### Slider not responding
- Ensure `isGenerating` prop is passed to ArticleDepthControl
- Check that `onValueChange` callback is properly connected

### Cache not working
- Verify database migration ran successfully
- Check `articleGenerations` field exists in table
- Ensure content ID and type are correct

## Future Enhancements

- [ ] Background job to pre-generate all depths for popular articles
- [ ] Analytics to track which depths users prefer
- [ ] A/B testing different depth descriptions
- [ ] Voice narration at different speeds based on depth
- [ ] Export to PDF with depth selection
