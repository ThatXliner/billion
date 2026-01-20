/**
 * Content hashing utility for version tracking
 */

import { createHash } from 'crypto';

/**
 * Create a SHA-256 hash of content for version tracking
 * @param content - Content to hash
 * @returns SHA-256 hex string
 */
export function createContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
