/**
 * AI image generation using OpenAI DALL-E
 * Generates images from text prompts and converts them to JPEG format
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * Generate an image using DALL-E 3
 * @param prompt - Text description of desired image
 * @returns Generated image as Buffer with metadata, or null if generation fails
 */
export async function generateImage(
  prompt: string,
): Promise<GeneratedImage | null> {
  try {
    console.log(`Generating image with DALL-E 3: ${prompt.substring(0, 50)}...`);

    // DALL-E 3 for quality
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional news photography: ${prompt}. Photorealistic, high quality, journalistic style.`,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    if (!response.data?.[0]?.url) {
      console.error('No image URL returned from DALL-E');
      return null;
    }

    const imageUrl = response.data[0].url;

    // Download image to buffer (URLs expire after 1 hour, need to store permanently)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return null;
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    console.log(`Image generated successfully: ${buffer.length} bytes`);

    return {
      data: buffer,
      mimeType: 'image/png', // DALL-E returns PNG
      width: 1024,
      height: 1024,
    };
  } catch (error) {
    // Check if error is due to content policy violation
    if (error instanceof Error && error.message.includes('content_policy_violation')) {
      console.warn(`Image generation blocked by content filter for prompt: ${prompt.substring(0, 100)}...`);
      return null;
    }

    // Generic error handling
    console.error('Image generation failed:', error);
    return null;
  }
}

/**
 * Convert PNG buffer to JPEG format for smaller file size
 * @param pngBuffer - PNG image buffer
 * @param quality - JPEG quality (0-100), default 85
 * @returns JPEG buffer
 */
export async function convertToJpeg(
  pngBuffer: Buffer,
  quality = 85,
): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;

    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality })
      .toBuffer();

    console.log(
      `Converted PNG to JPEG: ${pngBuffer.length} -> ${jpegBuffer.length} bytes`,
    );

    return jpegBuffer;
  } catch (error) {
    console.error('JPEG conversion failed:', error);
    // Return original buffer if conversion fails
    return pngBuffer;
  }
}
