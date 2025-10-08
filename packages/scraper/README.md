# @acme/scraper

A JavaScript/TypeScript scraper for US Government Bills and Executive Orders, rewritten from Python Scrapy to use Playwright and Drizzle ORM.

## Features

- **White House Spider**: Scrapes Presidential Actions from whitehouse.gov
- **Congress Spider**: Scrapes bills from congress.gov 
- **GovTrack Spider**: Scrapes bills from govtrack.us
- **Database Integration**: Stores data using Drizzle ORM instead of SQLite
- **TypeScript**: Full type safety and modern JavaScript
- **Playwright**: Reliable web scraping with browser automation

## Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build
```

## Usage

### Command Line Interface

```bash
# Run all spiders
pnpm scrape

# Run specific spider
pnpm scrape:whitehouse
pnpm scrape:congress  
pnpm scrape:govtrack

# Custom options
pnpm scrape -- --spider congress --delay 2000 --headless false
```

### Programmatic Usage

```typescript
import { runScraper, ScraperRunner } from '@acme/scraper';

// Simple usage
const stats = await runScraper('whitehouse');

// Advanced usage
const runner = new ScraperRunner({
  delay: 1000,
  timeout: 30000,
  headless: true,
  maxRetries: 3
});

const results = await runner.runSpider('congress');
```

## CLI Options

- `--spider <name>`: Which spider to run (whitehouse, congress, govtrack, all)
- `--delay <ms>`: Delay between requests in milliseconds (default: 1000)
- `--timeout <ms>`: Page timeout in milliseconds (default: 30000)
- `--headless [boolean]`: Run browser in headless mode (default: true)
- `--max-retries <count>`: Maximum retries for failed requests (default: 3)

## Data Schema

### Bills

- `billId`: Unique identifier
- `title`: Bill title
- `description`: Bill description
- `summary`: Bill summary
- `billType`: Type of bill (house_bill, senate_bill, etc.)
- `billNumber`: Bill number
- `congressSession`: Congress session number
- `introducedDate`: Date bill was introduced
- `signedDate`: Date bill was signed (if applicable)
- `lastActionDate`: Date of last action
- `status`: Current status
- `currentStage`: Current stage in legislative process
- `lastAction`: Description of last action
- `sponsor`: Bill sponsor
- `cosponsors`: JSON array of cosponsors
- `committees`: JSON array of committees
- `subjects`: JSON array of subjects/topics
- `policyAreas`: JSON array of policy areas
- `sourceUrl`: Original URL
- `sourceSite`: Source website

### Executive Actions

- `actionId`: Unique identifier
- `title`: Action title
- `description`: Action description
- `actionType`: Type (executive_order, presidential_memorandum, etc.)
- `actionNumber`: Action number (if applicable)
- `signedDate`: Date signed
- `publishedDate`: Date published
- `summary`: Action summary
- `subjects`: JSON array of subjects/topics
- `sourceUrl`: Original URL
- `sourceSite`: Source website

## Architecture

The scraper is organized into several key components:

- **Spiders**: Individual scrapers for each website
- **Utils**: Shared utilities for browser automation and data extraction
- **Database**: Service for saving data to Drizzle ORM
- **Types**: TypeScript interfaces and types
- **CLI**: Command-line interface

## Comparison to Python Version

| Feature | Python (Scrapy) | JavaScript (Playwright) |
|---------|-----------------|------------------------|
| Framework | Scrapy | Playwright |
| Database | SQLite | PostgreSQL (Drizzle) |
| Type Safety | Limited | Full TypeScript |
| Browser Automation | Limited | Full browser control |
| Concurrency | Twisted | Async/await |
| Configuration | scrapy.cfg | Package.json scripts |

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Integration with Existing Database

The scraper integrates with your existing Drizzle ORM setup in `packages/db`. The database schema includes tables for both bills and executive actions with proper indexing and relationships.

To integrate with the actual database:

1. Update `database-simple.ts` to import from `@acme/db`
2. Replace the placeholder methods with actual Drizzle queries
3. Run database migrations to create the new tables
4. Update the CLI to show real database statistics

## Error Handling

The scraper includes comprehensive error handling:

- Retries for failed requests
- Graceful handling of missing data
- Detailed error logging
- Browser cleanup on exit

## Performance

- Configurable delays between requests to respect rate limits
- Concurrent processing within reasonable limits
- Memory-efficient streaming for large datasets
- Browser reuse to reduce overhead