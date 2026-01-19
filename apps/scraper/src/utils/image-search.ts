/**
 * Image search utilities for finding relevant photos for articles
 * Uses Google Custom Search API to find high-quality, relevant images
 */

export interface ImageResult {
  url: string; // Direct URL to the image
  alt: string; // Alt text description
  source: string; // Source attribution (website domain)
  sourceUrl: string; // URL to the original source
}

/**
 * Search for relevant images based on keywords using Google Custom Search
 * @param query - Search query (keywords)
 * @param count - Number of images to retrieve (default: 3, max: 10)
 * @returns Array of image results
 */
export async function searchImages(
  query: string,
  count: number = 3,
): Promise<ImageResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn(
      'GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID not set, skipping image search',
    );
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', Math.min(count, 10).toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(
        `Google Custom Search API error: ${response.status} ${response.statusText}`,
      );
      const errorData = await response.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`No images found for query: ${query}`);
      return [];
    }

    return data.items.slice(0, count).map((item: any) => {
      // Try to get the highest quality image available from Google's image object
      // Fall back to thumbnailLink if the original link doesn't work
      const imageUrl = item.image?.thumbnailLink || item.link;
      
      return {
        url: imageUrl,
        alt: item.title || `Image related to ${query}`,
        source: item.displayLink || 'Google Images',
        sourceUrl: item.image?.contextLink || item.link,
      };
    });
  } catch (error) {
    console.error('Error searching for images:', error);
    return [];
  }
}

/**
 * Generate search keywords from article title and content
 * Uses AI to extract the most relevant visual concepts
 * @param title - Article title
 * @param content - Article content
 * @param type - Content type (bill, order, case, etc.)
 * @returns Search query string
 */
export async function generateImageSearchKeywords(
  title: string,
  content: string,
  type: string,
): Promise<string> {
  try {
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Given this ${type} title and content, generate 2-4 search keywords for finding relevant stock photos. Focus on concrete, visual, photographic concepts that would actually appear in news photography or documentary images.

GOOD examples (specific, visual, photographic):
- capitol building washington dc
- hospital doctor medical equipment
- construction workers infrastructure
- classroom students education
- solar panels renewable energy

BAD examples (too abstract, no clear visual):
- government policy legislation
- economic impact financial
- social justice equality

Title: ${title}

Content: ${content.substring(0, 500)}

Return ONLY 2-4 specific visual keywords separated by spaces. No quotes, no explanation:`,
    });

    return text.trim().replace(/['"]/g, ''); // Remove any quotes
  } catch (error) {
    console.error('Error generating image search keywords:', error);
    // Fallback: use simple keyword extraction from title
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
  }
}

/**
 * Get thumbnail image for article
 * Returns the first/best image from search results
 * @param query - Search query
 * @returns Single image result or null
 */
export async function getThumbnailImage(query: string): Promise<string | null> {
  const images = await searchImages(query, 1);
  return images.length > 0 ? images[0]!.url : null;
}
