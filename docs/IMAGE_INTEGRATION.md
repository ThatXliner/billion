# Image Integration for Article System

## Overview

This implementation adds relevant photo search and integration to the article generation system. Instead of AI-generated images, it uses the Pexels API to find high-quality, relevant stock photos that fit each article. Pexels provides instant API access (no approval wait) with generous rate limits.

## Features

- **Automatic Image Search**: When articles are generated, the system automatically searches for relevant photos
- **AI-Powered Keywords**: Uses GPT-4o-mini to generate optimal search keywords from article content
- **Thumbnail Support**: Each article gets a primary thumbnail image
- **Multiple Images**: Articles can have up to 3 relevant images with proper attribution
- **Source Attribution**: All images include photographer credit and source links

## Database Schema Changes

Added to `Bill`, `GovernmentContent`, and `CourtCase` tables:
- `thumbnailUrl`: Text field for the primary thumbnail image URL
- `images`: JSONB array containing image objects with:
  - `url`: Direct URL to the image
  - `alt`: Alt text description
  - `source`: Attribution text (e.g., "Photo by John Doe on Unsplash")
  - `sourceUrl`: Link to the original source page

## Setup

### 1. Get Pexels API Key (INSTANT - No Approval Wait!)

1. Sign up at [Pexels API](https://www.pexels.com/api/)
2. Your API key is displayed immediately after signup
3. Copy your API Key

### 2. Set Environment Variable

Add to your `.env` file:

```bash
PEXELS_API_KEY=your_api_key_here
```

### 3. Run Database Migration

```bash
cd packages/db
# If using a migration tool, run the migration
# Or apply manually:
psql -d your_database < migrations/add_image_fields.sql
```

### 4. Install Dependencies

The scraper already has the necessary dependencies. Just ensure you have:
- `ai` package (already installed)
- `@ai-sdk/openai` (already installed)

## How It Works

### 1. Image Search Process

When an article is generated in `apps/scraper/src/utils/db.ts`:

1. **Keyword Generation**: AI analyzes the title and content to extract visual concepts
   - Example: "Infrastructure Bill" → "highway construction bridge"
   
2. **Image Search**: Queries Unsplash API with generated keywords
   - Filters for landscape orientation
   - Ensures high content quality filter
   
3. **Storage**: Saves thumbnail URL and image array to database

### 2. Image Search Utility

Located at `apps/scraper/src/utils/image-search.ts`:

```typescript
// Search for images
const images = await searchImages('renewable energy solar panels', 3);

// Get just a thumbnail
const thumbnail = await getThumbnailImage('healthcare hospital');

// Generate search keywords from content
const keywords = await generateImageSearchKeywords(title, content, type);
```

### 3. API Integration

The tRPC API endpoints in `packages/api/src/router/content.ts` now include:

- `thumbnailUrl` in content card responses (for list views)
- `images` array in detailed content responses (for article pages)

## Usage in Frontend

### Content Cards (List View)

```typescript
// Thumbnails are available in list responses
const { data } = trpc.content.getAll.useQuery();

data.forEach(item => {
  if (item.thumbnailUrl) {
    // Display thumbnail
    <img src={item.thumbnailUrl} alt={item.title} />
  }
});
```

### Article Detail View

```typescript
// Full image array available in detail view
const { data } = trpc.content.getById.useQuery({ id });

if (data.images && data.images.length > 0) {
  data.images.forEach(image => {
    <figure>
      <img src={image.url} alt={image.alt} />
      <figcaption>
        <a href={image.sourceUrl}>{image.source}</a>
      </figcaption>
    </figure>
  });
}
```

## Fallback Behavior

The system gracefully handles cases where images aren't available:

- **No API Key**: Logs warning and continues without images
- **No Results**: Articles work fine without images
- **API Errors**: Logs error and continues processing
- **Rate Limits**: Respects Unsplash's free tier limits (50 requests/hour)

## Customization

### Change Number of Images

In `apps/scraper/src/utils/db.ts`:

```typescript
// Get more or fewer images
images = await searchImages(searchQuery, 5); // Get 5 instead of 3
```

### Different Image Source

Replace `apps/scraper/src/utils/image-search.ts` with a different API:

- **Pexels**: Free, no attribution required
- **Pixabay**: Free, no attribution required
- **Getty Images**: Premium, requires license

### Customize Search Keywords

Modify the AI prompt in `generateImageSearchKeywords()` to adjust keyword generation:

```typescript
prompt: `Generate keywords focusing on [your specific requirements]...`
```

## Rate Limits

**Unsplash Free Tier**:
- 50 requests per hour
- 5,000 total requests per month

For higher volume, consider:
1. Upgrading to Unsplash paid tier
2. Caching image search results
3. Using multiple image APIs with fallback

## Testing

To test image search without running the full scraper:

```bash
cd apps/scraper

# Test image search
node -e "
import('./src/utils/image-search.ts').then(async ({ searchImages }) => {
  const images = await searchImages('congress capitol building', 3);
  console.log(images);
});
"
```

## Troubleshooting

### No images appearing

1. Check `UNSPLASH_ACCESS_KEY` is set correctly
2. Verify you haven't hit rate limits
3. Check console logs for errors
4. Test API key manually: `curl -H "Authorization: Client-ID YOUR_KEY" "https://api.unsplash.com/photos/random"`

### Images not relevant

1. Review generated keywords in logs
2. Adjust keyword generation prompt
3. Consider using different search terms or manual keywords

### Database errors

1. Ensure migration was applied
2. Check that columns exist: `\d bill` in psql
3. Verify JSONB type is supported in your PostgreSQL version

## Future Enhancements

- [ ] Image caching to reduce API calls
- [ ] Multiple image source fallbacks
- [ ] Image optimization and CDN integration
- [ ] User-selectable images from search results
- [ ] Image relevance scoring
- [ ] Automatic image cropping for thumbnails
