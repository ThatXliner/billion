/**
 * Image search utilities for finding relevant photos for articles
 * Uses Pexels API to find high-quality, relevant images
 * Get your free API key instantly at: https://www.pexels.com/api/
 */

export interface ImageResult {
  url: string; // Direct URL to the image
  alt: string; // Alt text description
  source: string; // Source attribution (e.g., "Pexels")
  sourceUrl: string; // URL to the original source
}

/**
 * Search for relevant images based on keywords
 * @param query - Search query (keywords)
 * @param count - Number of images to retrieve (default: 3)
 * @returns Array of image results
 */
export async function searchImages(
  query: string,
  count: number = 3,
): Promise<ImageResult[]> {
  const accessKey = process.env.PEXELS_API_KEY;

  if (!accessKey) {
    console.warn('PEXELS_API_KEY not set, skipping image search');
    return [];
  }

  try {
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', count.toString());
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: accessKey,
      },
    });

    if (!response.ok) {
      console.error(`Pexels API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      console.log(`No images found for query: ${query}`);
      return [];
    }

    return data.photos.map((photo: any) => ({
      url: photo.src.original, // Use original URL - cleaner and more reliable
      alt: photo.alt || `Image related to ${query}`,
      source: `Photo by ${photo.photographer} on Pexels`,
      sourceUrl: photo.url,
    }));
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
