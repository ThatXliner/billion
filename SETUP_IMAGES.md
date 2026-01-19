# Image Integration Setup & Testing Guide

## Quick Setup (3 minutes) - INSTANT API KEY!

### Step 1: Get Pexels API Key (1 min) ⚡️
1. Go to https://www.pexels.com/api/
2. Click "Get Started" and sign up
3. Your API key appears IMMEDIATELY - no approval wait!
4. Copy your **API Key**

### Step 2: Add Environment Variable (30 sec)
Add to your `.env` file (or `.env.local`):
```bash
PEXELS_API_KEY=your_api_key_here
```

### Step 3: Apply Database Changes (2 min)
```bash
cd packages/db
pnpm drizzle-kit push
```

That's it! The image integration is now active.

---

## Testing the Image Integration

### Test 1: Verify Image Search Works (30 seconds)

Test the image search utility directly:

```bash
cd apps/scraper

# Quick test - search for images about "renewable energy"
node --loader tsx/esm -e "
import { searchImages } from './src/utils/image-search.js';
const images = await searchImages('renewable energy solar panels', 3);
console.log('Found', images.length, 'images');
console.log(JSON.stringify(images, null, 2));
"
```

**Expected output**: 3 image objects with URLs, alt text, and attribution

**If it fails**: Check your `UNSPLASH_ACCESS_KEY` is set correctly

---

### Test 2: Run Scraper and Check Images (2 min)

Run the scraper to generate articles with images:

```bash
cd apps/scraper
pnpm start
```

Watch the console logs for:
- ✅ "Searching for images for..."
- ✅ "Image search query: ..."
- ✅ Image URLs being logged

**If no image logs appear**: The scraper skips images if `fullText` is empty or API key is missing

---

### Test 3: Verify Database Has Images (30 seconds)

Check that images were saved to the database:

```bash
# Connect to your database (adjust connection string)
psql $POSTGRES_URL

# Check if columns exist
\d bill

# Should show: thumbnail_url and images columns

# Check for articles with images
SELECT title, thumbnail_url, 
       jsonb_array_length(images) as image_count 
FROM bill 
WHERE thumbnail_url IS NOT NULL 
LIMIT 5;
```

**Expected output**: Articles with thumbnail URLs and image counts

---

### Test 4: Check API Responses (1 min)

Test that the API includes images:

```bash
# Start your Next.js app
cd apps/nextjs
pnpm dev

# In another terminal, test the API
curl http://localhost:3000/api/trpc/content.getAll | jq '.result.data[] | {title, thumbnailUrl}'
```

Or use the tRPC panel in your app to query `content.getAll` and inspect the response.

**Expected output**: Content objects with `thumbnailUrl` field populated

---

## Troubleshooting

### No images appearing in articles

**Check 1**: Verify API key is set
```bash
echo $PEXELS_API_KEY
# Should show your key, not empty
```

**Check 2**: Check scraper logs for errors
```bash
cd apps/scraper
pnpm start 2>&1 | grep -i "image\|pexels\|error"
```

**Check 3**: Test API directly
```bash
curl -H "Authorization: YOUR_KEY" \
  "https://api.pexels.com/v1/search?query=politics&per_page=1"
```

### Rate limit errors

Pexels free tier allows:
- 200 requests per hour (4x more than Unsplash!)
- Unlimited monthly requests

**Solution**: If you hit limits:
1. Wait an hour (resets hourly)
2. Use caching (save image search results)
3. Contact Pexels for higher limits (usually granted quickly)

### Database errors after schema change

**Fix**: The schema types need to be regenerated. Run:
```bash
cd packages/db
pnpm db:generate  # or whatever your generate command is
```

---

## Image Quality & Relevance Testing

### Manual Image Check

1. Pick a recent article from your database
2. Look at the `thumbnail_url` - open it in browser
3. Check the `images` array - do they match the topic?

Example query:
```sql
SELECT title, thumbnail_url, images 
FROM government_content 
ORDER BY created_at DESC 
LIMIT 1;
```

### Improve Image Relevance

If images don't match well, you can:

1. **Adjust keyword generation** in `image-search.ts`:
   - Make the AI prompt more specific
   - Add topic-specific keywords manually

2. **Change search parameters** in `db.ts`:
   - Increase/decrease number of images
   - Try different orientations (portrait vs landscape)

3. **Use different search queries**:
   ```typescript
   // Instead of AI-generated keywords
   const searchQuery = 'capitol building politics government';
   ```

---

## Production Recommendations

### 1. Image Caching (Important!)
Don't search for images every time. Cache results:

```typescript
// Check if article already has images
if (!existingArticle.thumbnailUrl && contentData.fullText) {
  // Only search if no images yet
  thumbnailUrl = await getThumbnailImage(searchQuery);
}
```

### 2. Fallback Images
Set default images for when search fails:

```typescript
thumbnailUrl = await getThumbnailImage(searchQuery) 
  || 'https://your-cdn.com/default-politics.jpg';
```

### 3. Multiple Image Sources
Add fallback to Pixabay or Unsplash if Pexels fails:

```typescript
let images = await searchImages(query, 3);
if (images.length === 0) {
  images = await searchPixabay(query, 3); // Fallback
}
```

### 4. Monitor API Usage
Track your Pexels usage:
- Log successful requests
- Monitor rate limit headers
- Alert when approaching limits

---

## Next Steps After Testing

Once images are working:

1. **Update UI components** to display thumbnails in feed
2. **Add image galleries** to article detail pages  
3. **Implement lazy loading** for better performance
4. **Add image optimization** (resize, compress)
5. **Consider CDN** for faster image delivery

---

## Quick Reference

### Get API Key (INSTANT!)
https://www.pexels.com/api/

### Test Image Search
```bash
cd apps/scraper
node --loader tsx/esm -e "import {searchImages} from './src/utils/image-search.js'; console.log(await searchImages('politics',1))"
```

### Check Database
```sql
SELECT COUNT(*) FROM bill WHERE thumbnail_url IS NOT NULL;
```

### View API Response
```bash
curl localhost:3000/api/trpc/content.getAll | jq
```
