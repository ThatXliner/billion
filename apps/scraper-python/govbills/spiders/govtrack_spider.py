import scrapy
import re
import json
from datetime import datetime
from urllib.parse import urljoin, urlparse
from govbills.items import BillItem


class GovtrackSpider(scrapy.Spider):
    name = 'govtrack'
    allowed_domains = ['govtrack.us']
    start_urls = [
        'https://www.govtrack.us/congress/bills/',
        'https://www.govtrack.us/congress/bills/browse',
        'https://www.govtrack.us/congress/bills/browse?congress=118',  # Current Congress
        'https://www.govtrack.us/congress/bills/browse?congress=117',  # Previous Congress
    ]
    
    custom_settings = {
        'DOWNLOAD_DELAY': 2,  # Be respectful to govtrack.us
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
    }
    
    def parse(self, response):
        """Parse the main bills browse page"""
        # Extract bill links from various selectors
        bill_links = response.css('a[href*="/congress/bills/"]::attr(href)').getall()
        
        # Also look for links in search results and listings
        more_links = response.css('.bill-link a::attr(href), .result a[href*="/congress/bills/"]::attr(href)').getall()
        bill_links.extend(more_links)
        
        for link in bill_links:
            if re.search(r'/congress/bills/[^/]+/\d+/', link):  # Ensure it's an individual bill
                full_url = urljoin(response.url, link)
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_bill,
                    meta={'source_url': full_url}
                )
        
        # Follow pagination
        next_page = response.css('a[rel="next"]::attr(href), .pagination .next a::attr(href)').get()
        if next_page:
            yield scrapy.Request(
                url=urljoin(response.url, next_page),
                callback=self.parse
            )
        
        # Follow category/filter links (limited to avoid infinite loops)
        category_links = response.css('a[href*="/congress/bills/browse?"]::attr(href)').getall()[:10]
        for cat_link in category_links:
            if 'congress=' in cat_link:  # Only follow congress-specific filters
                yield scrapy.Request(
                    url=urljoin(response.url, cat_link),
                    callback=self.parse,
                    dont_filter=False
                )
    
    def parse_bill(self, response):
        """Parse individual bill pages on GovTrack"""
        item = BillItem()
        
        # Extract bill number and type from URL
        bill_info = self.extract_bill_info_from_url(response.url)
        bill_type = bill_info.get('type')
        bill_number = bill_info.get('number')
        congress_session = bill_info.get('congress')
        
        # Extract title
        title = response.css('h1::text, .bill-title::text').get()
        if not title:
            # Try alternative selectors
            title = response.css('title::text').get()
            if title:
                title = title.split(' | ')[0]  # Remove " | GovTrack.us" part
        
        if title:
            title = title.strip()
        
        # Extract sponsor information
        sponsor = response.css('.sponsor a::text, .bill-sponsor::text').get()
        if sponsor:
            sponsor = sponsor.strip()
        
        # Extract cosponsors
        cosponsor_elements = response.css('.cosponsors a::text, .cosponsor-list a::text').getall()
        cosponsors = [co.strip() for co in cosponsor_elements if co.strip()]
        
        # Extract status information
        status = response.css('.bill-status::text, .status-text::text').get()
        if status:
            status = status.strip()
        
        # Extract dates from various sections
        introduced_date = self.extract_govtrack_date(response, 'introduced', 'Introduced')
        last_action_date = self.extract_govtrack_date(response, 'last action', 'Latest Action')
        
        # Extract summary/description
        summary_text = response.css('.bill-summary::text, .summary p::text').getall()
        summary = ' '.join([s.strip() for s in summary_text if s.strip()]) if summary_text else None
        
        # Try to get description from meta tag or first paragraph
        description = response.css('meta[name="description"]::attr(content)').get()
        if not description and summary:
            description = summary[:200] + "..." if len(summary) > 200 else summary
        
        # Extract committees
        committee_elements = response.css('.committees a::text, .committee-list a::text').getall()
        committees = [comm.strip() for comm in committee_elements if comm.strip()]
        
        # Extract subjects/topics
        subject_elements = response.css('.subjects a::text, .topics a::text, .issue-areas a::text').getall()
        subjects = [subj.strip() for subj in subject_elements if subj.strip()]
        
        # Extract policy areas (GovTrack often has these)
        policy_elements = response.css('.policy-areas a::text, .policy-area::text').getall()
        policy_areas = [pa.strip() for pa in policy_elements if pa.strip()]
        
        # Extract vote information
        house_vote = self.extract_vote_info(response, 'house')
        senate_vote = self.extract_vote_info(response, 'senate')
        
        # Extract current stage
        current_stage = response.css('.bill-stage::text, .current-status::text').get()
        if current_stage:
            current_stage = current_stage.strip()
        
        # Extract last action
        last_action = response.css('.latest-action::text, .last-action-text::text').get()
        if not last_action:
            # Look in action timeline
            action_items = response.css('.action-timeline li:first-child::text, .actions li:first-child::text').getall()
            if action_items:
                last_action = action_items[0].strip()
        
        # Generate bill ID
        if congress_session and bill_type and bill_number:
            bill_id = f"govtrack-{congress_session}-{bill_type}-{bill_number}"
        else:
            bill_id = f"govtrack-{hash(response.url) % 1000000}"
        
        # Extract full text URL
        full_text_url = response.css('a[href*="/text/"]::attr(href), a:contains("Full Text")::attr(href)').get()
        if full_text_url:
            full_text_url = urljoin(response.url, full_text_url)
        
        # Get Congress.gov URL if available
        congress_gov_url = response.css('a[href*="congress.gov"]::attr(href)').get()
        
        item['bill_id'] = bill_id
        item['title'] = title
        item['description'] = description
        item['summary'] = summary
        item['bill_type'] = bill_type
        item['bill_number'] = bill_number
        item['congress_session'] = congress_session
        item['introduced_date'] = introduced_date
        item['signed_date'] = None  # GovTrack might not always have this readily available
        item['last_action_date'] = last_action_date
        item['status'] = status
        item['current_stage'] = current_stage
        item['last_action'] = last_action
        item['sponsor'] = sponsor
        item['cosponsors'] = cosponsors
        item['committees'] = committees
        item['house_passage_vote'] = house_vote
        item['senate_passage_vote'] = senate_vote
        item['subjects'] = subjects
        item['policy_areas'] = policy_areas
        item['source_url'] = response.meta['source_url']
        item['full_text_url'] = full_text_url
        item['congress_gov_url'] = congress_gov_url
        item['source_site'] = 'govtrack.us'
        item['scraped_date'] = datetime.now().isoformat()
        
        yield item
    
    def extract_bill_info_from_url(self, url):
        """Extract bill information from GovTrack URL"""
        # GovTrack URLs like: https://www.govtrack.us/congress/bills/118/hr1234
        match = re.search(r'/congress/bills/(\d+)/([a-z]+)(\d+)', url)
        if match:
            return {
                'congress': match.group(1),
                'type': match.group(2),
                'number': match.group(3)
            }
        return {}
    
    def extract_govtrack_date(self, response, *date_labels):
        """Extract dates from GovTrack pages"""
        for label in date_labels:
            # Look for dates near specific labels
            date_containers = response.css(f'*:contains("{label}")').getall()
            for container in date_containers:
                # Extract date patterns from the container
                dates = re.findall(r'(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+ \d{1,2}, \d{4})', container)
                if dates:
                    return self.standardize_date(dates[0])
        
        # Also try data attributes
        date_attrs = response.css('[data-date]::attr(data-date), [datetime]::attr(datetime)').getall()
        if date_attrs:
            return self.standardize_date(date_attrs[0])
        
        return None
    
    def extract_vote_info(self, response, chamber):
        """Extract vote information for specific chamber"""
        vote_selectors = [
            f'.{chamber}-vote::text',
            f'*:contains("{chamber.title()} Vote")::text',
            f'.vote-{chamber}::text'
        ]
        
        for selector in vote_selectors:
            vote_text = response.css(selector).get()
            if vote_text and any(word in vote_text.lower() for word in ['passed', 'failed', 'yes', 'no']):
                return vote_text.strip()
        
        return None
    
    def standardize_date(self, date_str):
        """Standardize date to YYYY-MM-DD format"""
        if not date_str:
            return None
        
        # Clean up the date string
        date_str = date_str.strip()
        
        date_formats = [
            '%m/%d/%Y',
            '%Y-%m-%d',
            '%B %d, %Y',
            '%b %d, %Y',
            '%Y-%m-%dT%H:%M:%S',  # ISO format with time
            '%Y-%m-%dT%H:%M:%SZ', # ISO format with timezone
        ]
        
        for fmt in date_formats:
            try:
                if 'T' in date_str:  # Handle ISO datetime
                    date_str = date_str.split('T')[0]
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None