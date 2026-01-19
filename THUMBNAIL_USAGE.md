# Thumbnail Image Integration Guide

## Overview
The scraper now automatically generates thumbnail images for all government content (Bills, Government Content, and Court Cases) using Google Custom Search API with AI-generated keywords.

## What Changed

### Scraper (`apps/scraper/src/utils/db.ts`)
- Only fetches **one thumbnail image** per article (not multiple images)
- Uses `getThumbnailImage()` to get a single Google-hosted cached thumbnail
- Saves thumbnail URL to `thumbnailUrl` field in database
- ❌ No longer fetches `images[]` array

### API (`packages/api/src/router/content.ts`)
- All content endpoints now return `thumbnailUrl` in their responses
- Added `getThumbnailForContent()` helper function for direct thumbnail access
- Available through both tRPC API and direct function import

## Using Thumbnails in Your App

### 1. Using tRPC API (Recommended)

#### Get all content with thumbnails:
```typescript
import { api } from "~/trpc/react";

function FeedView() {
  const { data: content } = api.content.getAll.useQuery();
  
  return (
    <div>
      {content?.map((item) => (
        <div key={item.id}>
          {item.thumbnailUrl && (
            <img 
              src={item.thumbnailUrl} 
              alt={item.title}
              className="w-full h-48 object-cover"
            />
          )}
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Get single content detail with thumbnail:
```typescript
function ArticleDetail({ id }: { id: string }) {
  const { data: article } = api.content.getById.useQuery({ id });
  
  return (
    <article>
      {article?.thumbnailUrl && (
        <img 
          src={article.thumbnailUrl} 
          alt={article.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      )}
      <h1>{article.title}</h1>
      <p>{article.description}</p>
      <div dangerouslySetInnerHTML={{ __html: article.articleContent }} />
    </article>
  );
}
```

### 2. Using Direct Function Import

```typescript
import { getThumbnailForContent } from "@acme/api";

// Get thumbnail for a specific content item
const thumbnailUrl = await getThumbnailForContent(
  "content-id-here",
  "bill" // or "case" or "general"
);

if (thumbnailUrl) {
  console.log("Thumbnail URL:", thumbnailUrl);
}
```

### 3. React Native / Expo Usage

```tsx
import { Image } from "react-native";
import { api } from "~/utils/api";

function ContentCard({ id }: { id: string }) {
  const { data } = api.content.getById.useQuery({ id });
  
  return (
    <View>
      {data?.thumbnailUrl && (
        <Image 
          source={{ uri: data.thumbnailUrl }}
          style={{ width: "100%", height: 200 }}
          resizeMode="cover"
        />
      )}
      <Text style={styles.title}>{data.title}</Text>
    </View>
  );
}
```

## Thumbnail URLs

All thumbnails are Google-hosted cached images:
- Format: `https://encrypted-tbn0.gstatic.com/images?q=tbn:...`
- Size: Typically ~200x200px (Google's cached thumbnails)
- Cross-origin enabled: Works in web and mobile apps
- No hotlinking issues: Google serves these images

## Database Schema

### thumbnailUrl field (TEXT)
All three content tables have this field:
- `Bill.thumbnailUrl`
- `GovernmentContent.thumbnailUrl`
- `CourtCase.thumbnailUrl`

Example:
```sql
SELECT id, title, thumbnail_url FROM government_content LIMIT 5;
```

## Re-scraping Content

To regenerate thumbnails for existing content:
```bash
cd apps/scraper
pnpm tsx src/main.ts whitehouse  # Re-scrape White House content
```

The scraper will automatically:
1. Generate AI keywords based on article content
2. Search Google Images with those keywords
3. Get the cached thumbnail URL
4. Save to database

## Fallback Behavior

If thumbnail generation fails:
- `thumbnailUrl` will be `null`
- Your UI should handle missing images gracefully
- Consider showing a default placeholder image

```tsx
<img 
  src={item.thumbnailUrl || "/images/default-government.jpg"} 
  alt={item.title}
  onError={(e) => {
    e.currentTarget.src = "/images/default-government.jpg";
  }}
/>
```

## Performance Tips

1. **Lazy loading**: Use native lazy loading for images
   ```tsx
   <img loading="lazy" src={thumbnailUrl} alt={title} />
   ```

2. **Responsive images**: Add appropriate sizing classes
   ```tsx
   <img 
     src={thumbnailUrl} 
     className="w-full h-auto max-w-md"
     alt={title} 
   />
   ```

3. **Caching**: Google's CDN handles caching automatically

## Troubleshooting

### Images not loading in browser
- Google thumbnails may have referrer restrictions for direct browser access
- Images should work fine when loaded through React/Expo Image components
- If needed, you can implement an image proxy in Next.js API routes

### Missing thumbnails
- Check if article has `fullText` (required for AI keyword generation)
- Verify Google API credentials in `.env`:
  ```
  GOOGLE_API_KEY=your_key
  GOOGLE_SEARCH_ENGINE_ID=your_cx
  ```
- Check rate limits (100 free searches/day)
