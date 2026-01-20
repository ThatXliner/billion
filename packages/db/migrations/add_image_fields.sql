-- Add image fields to content tables
-- Migration: Add thumbnailUrl and images fields

-- Add to Bill table
ALTER TABLE bill ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE bill ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add to GovernmentContent table
ALTER TABLE government_content ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE government_content ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add to CourtCase table
ALTER TABLE court_case ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE court_case ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN bill.thumbnail_url IS 'URL of the thumbnail image for the article';
COMMENT ON COLUMN bill.images IS 'Array of relevant images for the article with metadata (url, alt, source, sourceUrl)';

COMMENT ON COLUMN government_content.thumbnail_url IS 'URL of the thumbnail image for the article';
COMMENT ON COLUMN government_content.images IS 'Array of relevant images for the article with metadata (url, alt, source, sourceUrl)';

COMMENT ON COLUMN court_case.thumbnail_url IS 'URL of the thumbnail image for the article';
COMMENT ON COLUMN court_case.images IS 'Array of relevant images for the article with metadata (url, alt, source, sourceUrl)';
