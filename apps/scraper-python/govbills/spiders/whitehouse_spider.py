import scrapy
import re
from datetime import datetime
from urllib.parse import urljoin
from govbills.items import ExecutiveActionItem


class WhitehouseSpider(scrapy.Spider):
    name = 'whitehouse'
    allowed_domains = ['whitehouse.gov']
    start_urls = ['https://www.whitehouse.gov/presidential-actions/']
    
    def parse(self, response):
        """Parse the main presidential actions page"""
        # Extract all presidential action links - updated selectors based on actual website structure
        action_links = response.css('h2 a[href*="/presidential-actions/"]::attr(href)').getall()
        
        # Also try alternative selectors for different page layouts
        if not action_links:
            action_links = response.css('a[href*="/presidential-actions/20"]::attr(href)').getall()
        
        self.logger.info(f"Found {len(action_links)} presidential action links")
        
        for link in action_links:
            if '/presidential-actions/' in link and not link.endswith('/presidential-actions/'):
                full_url = urljoin(response.url, link)
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_action,
                    meta={'source_url': full_url}
                )
        
        # Follow pagination - look for "next" and page number links
        next_links = response.css('a[href*="/page/"]:contains("NEXT")::attr(href), a[href*="/page/"]:contains("2")::attr(href)').getall()
        for next_link in next_links[:1]:  # Only follow first next link to avoid duplicates
            if next_link:
                yield scrapy.Request(
                    url=urljoin(response.url, next_link),
                    callback=self.parse
                )
    
    def parse_action(self, response):
        """Parse individual presidential action pages"""
        item = ExecutiveActionItem()
        
        # Basic information - updated selectors for actual website structure
        title = response.css('h1::text, title::text').get()
        if title and ' | ' in title:
            title = title.split(' | ')[0]  # Remove " | The White House" part
        if title:
            title = title.strip()
        
        self.logger.info(f"Processing action: {title}")
        
        # Extract action type and number from title or URL
        action_type = self.extract_action_type(title, response.url)
        action_number = self.extract_action_number(title)
        
        # Extract date - look in various places
        date_text = None
        # Try different date selectors
        date_selectors = [
            'time::attr(datetime)',
            '.date::text',
            '*[class*="date"]::text',
            'time::text'
        ]
        
        for selector in date_selectors:
            date_text = response.css(selector).get()
            if date_text:
                break
        
        # Also try to extract from URL pattern /2025/09/
        if not date_text:
            url_date_match = re.search(r'/(\d{4})/(\d{2})/', response.url)
            if url_date_match:
                year, month = url_date_match.groups()
                date_text = f"{year}-{month}-01"  # Approximate date
        
        signed_date = self.parse_date(date_text)
        
        # Extract content from multiple possible locations
        content_selectors = [
            '.entry-content p',
            '.content p', 
            '.post-content p',
            'main p',
            'article p'
        ]
        
        content_paragraphs = []
        for selector in content_selectors:
            paragraphs = response.css(f'{selector}::text').getall()
            if paragraphs:
                content_paragraphs = paragraphs
                break
        
        description = ' '.join([p.strip() for p in content_paragraphs if p.strip()])
        
        # Extract summary (meta description or first content paragraph)
        summary = response.css('meta[name="description"]::attr(content)').get()
        if not summary and content_paragraphs:
            # Use first substantial paragraph as summary
            for para in content_paragraphs:
                if para.strip() and len(para.strip()) > 50:
                    summary = para.strip()
                    break
        
        # Extract subjects/topics from breadcrumbs, categories, or tags
        subjects = []
        subject_selectors = [
            '.categories a::text',
            '.tags a::text',
            '.breadcrumb a::text',
            'nav a::text'
        ]
        
        for selector in subject_selectors:
            subjects.extend(response.css(selector).getall())
        
        subjects = [subj.strip() for subj in subjects if subj.strip() and subj.strip() != 'Presidential Actions']
        
        # Generate unique action ID
        action_id = self.generate_action_id(title, signed_date, response.url)
        
        item['action_id'] = action_id
        item['title'] = title
        item['description'] = description
        item['action_type'] = action_type
        item['action_number'] = action_number
        item['signed_date'] = signed_date
        item['published_date'] = signed_date  # Usually the same for White House
        item['summary'] = summary
        item['subjects'] = subjects
        item['source_url'] = response.meta['source_url']
        item['full_text_url'] = response.meta['source_url']
        item['source_site'] = 'whitehouse.gov'
        item['scraped_date'] = datetime.now().isoformat()
        
        yield item
    
    def extract_action_type(self, title, url=None):
        """Extract action type from title or URL"""
        if title:
            title_lower = title.lower()
            if 'executive order' in title_lower:
                return 'executive_order'
            elif 'presidential memorandum' in title_lower:
                return 'presidential_memorandum'
            elif 'proclamation' in title_lower:
                return 'proclamation'
            elif 'national security memorandum' in title_lower:
                return 'national_security_memorandum'
        
        # Try to extract from URL if available
        if url:
            url_lower = url.lower()
            if 'executive-order' in url_lower:
                return 'executive_order'
            elif 'memorandum' in url_lower:
                return 'presidential_memorandum'
            elif 'proclamation' in url_lower:
                return 'proclamation'
        
        return 'presidential_action'
    
    def extract_action_number(self, title):
        """Extract action number from title"""
        if not title:
            return None
        
        # Look for patterns like "Executive Order 14001", "EO 14001", etc.
        patterns = [
            r'Executive Order[:\s]+(\d+)',
            r'EO[:\s]+(\d+)',
            r'Proclamation[:\s]+(\d+)',
            r'Presidential Memorandum[:\s]+(\d+)',
            r'National Security Memorandum[:\s]+(\d+)',
            r'NSM[:\s]+(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def parse_date(self, date_text):
        """Parse date from various formats"""
        if not date_text:
            return None
        
        date_text = date_text.strip()
        
        date_formats = [
            '%B %d, %Y',  # January 20, 2021
            '%b %d, %Y',  # Jan 20, 2021
            '%Y-%m-%d',   # 2021-01-20
            '%m/%d/%Y',   # 01/20/2021
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_text, fmt)
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def generate_action_id(self, title, date, url=None):
        """Generate a unique action ID"""
        # Try URL-based ID first for better uniqueness
        if url:
            url_parts = url.split('/')
            if len(url_parts) >= 3:
                # Use the last meaningful part of the URL
                url_id = url_parts[-2] if url_parts[-1] == '' else url_parts[-1]
                if url_id and len(url_id) > 10:  # Meaningful URL part
                    return f"wh-{url_id}"
        
        if not title:
            return f"wh-unknown-{hash(url) % 10000}" if url else None
        
        # Create a basic ID from title and date
        title_clean = re.sub(r'[^\w\s-]', '', title.lower())
        title_clean = re.sub(r'\s+', '-', title_clean.strip())
        
        if date:
            return f"wh-{date}-{title_clean[:30]}"
        else:
            return f"wh-{title_clean[:50]}"