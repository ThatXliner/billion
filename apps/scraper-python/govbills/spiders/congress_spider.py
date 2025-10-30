import scrapy
import re
from datetime import datetime
from urllib.parse import urljoin, parse_qs, urlparse
from govbills.items import BillItem


class CongressSpider(scrapy.Spider):
    name = 'congress'
    allowed_domains = ['congress.gov']
    start_urls = [
        'https://www.congress.gov/browse',
        'https://www.congress.gov/bills',
        'https://www.congress.gov/bills/browse?q=%7B%22congress%22%3A118%7D',
        'https://www.congress.gov/bills/browse?q=%7B%22congress%22%3A117%7D',
    ]
    
    custom_settings = {
        'DOWNLOAD_DELAY': 3,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
    }
    
    def parse(self, response):
        """Parse the main browse page"""
        # Look for bill links
        bill_links = response.css('a[href*="/bill/"]::attr(href)').getall()
        
        # Also look for links in search results
        search_result_links = response.css('.result-heading a::attr(href)').getall()
        bill_links.extend(search_result_links)
        
        for link in bill_links:
            if '/bill/' in link:
                full_url = urljoin(response.url, link)
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_bill,
                    meta={'source_url': full_url}
                )
        
        # Follow pagination
        next_links = response.css('a[aria-label="Next"]::attr(href), .pagination .next a::attr(href)').getall()
        for next_link in next_links:
            if next_link:
                yield scrapy.Request(
                    url=urljoin(response.url, next_link),
                    callback=self.parse
                )
        
        # Follow congress browse links
        congress_links = response.css('a[href*="/bills/browse"]::attr(href)').getall()
        for congress_link in congress_links[:5]:  # Limit to avoid too many requests
            yield scrapy.Request(
                url=urljoin(response.url, congress_link),
                callback=self.parse
            )
    
    def parse_bill(self, response):
        """Parse individual bill pages"""
        item = BillItem()
        
        # Extract bill number and type from URL or page
        bill_number = self.extract_bill_number_from_url(response.url)
        if not bill_number:
            bill_number = response.css('.bill-number::text, h1 .bill-number::text').get()
        
        # Extract title
        title = response.css('h1::text, .bill-title::text').get()
        if title:
            title = title.strip()
        
        # Extract bill type
        bill_type = self.extract_bill_type(bill_number or response.url)
        
        # Extract congress session
        congress_match = re.search(r'/(\d+)(?:th|st|nd|rd)-congress/', response.url)
        congress_session = congress_match.group(1) if congress_match else None
        
        # Extract sponsor
        sponsor = response.css('.sponsor a::text, .bill-sponsor::text').get()
        if sponsor:
            sponsor = sponsor.strip()
        
        # Extract cosponsors
        cosponsors = response.css('.cosponsors a::text, .cosponsor::text').getall()
        cosponsors = [co.strip() for co in cosponsors if co.strip()]
        
        # Extract committees
        committees = response.css('.committees a::text, .committee::text').getall()
        committees = [comm.strip() for comm in committees if comm.strip()]
        
        # Extract dates
        introduced_date = self.extract_date(response, 'introduced')
        signed_date = self.extract_date(response, 'signed', 'enacted')
        last_action_date = self.extract_date(response, 'last action', 'latest action')
        
        # Extract status and stage
        status = response.css('.bill-status::text, .status::text').get()
        if status:
            status = status.strip()
        
        current_stage = response.css('.bill-stage::text, .stage::text').get()
        if current_stage:
            current_stage = current_stage.strip()
        
        # Extract last action
        last_action = response.css('.latest-action::text, .last-action::text').get()
        if not last_action:
            # Look for action text in various places
            action_elements = response.css('.actions li:first-child::text, .action-item:first-child::text').getall()
            if action_elements:
                last_action = action_elements[0].strip()
        
        # Extract summary/description
        summary_paragraphs = response.css('.bill-summary p::text, .summary p::text').getall()
        summary = ' '.join([p.strip() for p in summary_paragraphs if p.strip()]) if summary_paragraphs else None
        
        # Extract description (often the title or short description)
        description = response.css('meta[name="description"]::attr(content)').get()
        if not description:
            description = title
        
        # Extract subjects and policy areas
        subjects = response.css('.subjects a::text, .subject::text').getall()
        subjects = [subj.strip() for subj in subjects if subj.strip()]
        
        policy_areas = response.css('.policy-areas a::text, .policy-area::text').getall()
        policy_areas = [pa.strip() for pa in policy_areas if pa.strip()]
        
        # Extract vote information (if available)
        house_vote = response.css('.house-vote::text, .house-passage::text').get()
        senate_vote = response.css('.senate-vote::text, .senate-passage::text').get()
        
        # Generate bill ID
        bill_id = f"congress-{congress_session}-{bill_number}" if congress_session and bill_number else None
        
        # Extract full text URL
        full_text_url = response.css('a[href*="/text/"]::attr(href)').get()
        if full_text_url:
            full_text_url = urljoin(response.url, full_text_url)
        
        item['bill_id'] = bill_id
        item['title'] = title
        item['description'] = description
        item['summary'] = summary
        item['bill_type'] = bill_type
        item['bill_number'] = bill_number
        item['congress_session'] = congress_session
        item['introduced_date'] = introduced_date
        item['signed_date'] = signed_date
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
        item['congress_gov_url'] = response.meta['source_url']
        item['source_site'] = 'congress.gov'
        item['scraped_date'] = datetime.now().isoformat()
        
        yield item
    
    def extract_bill_number_from_url(self, url):
        """Extract bill number from URL"""
        match = re.search(r'/bill/\d+(?:th|st|nd|rd)-congress/[^/]+/(\d+)', url)
        if match:
            return match.group(1)
        return None
    
    def extract_bill_type(self, identifier):
        """Extract bill type from identifier or URL"""
        if not identifier:
            return None
        
        identifier = identifier.lower()
        if 'house-bill' in identifier or '/hr' in identifier:
            return 'house_bill'
        elif 'senate-bill' in identifier or '/s' in identifier:
            return 'senate_bill'
        elif 'house-resolution' in identifier or '/hres' in identifier:
            return 'house_resolution'
        elif 'senate-resolution' in identifier or '/sres' in identifier:
            return 'senate_resolution'
        elif 'house-joint-resolution' in identifier or '/hjres' in identifier:
            return 'house_joint_resolution'
        elif 'senate-joint-resolution' in identifier or '/sjres' in identifier:
            return 'senate_joint_resolution'
        elif 'house-concurrent-resolution' in identifier or '/hconres' in identifier:
            return 'house_concurrent_resolution'
        elif 'senate-concurrent-resolution' in identifier or '/sconres' in identifier:
            return 'senate_concurrent_resolution'
        else:
            return 'bill'
    
    def extract_date(self, response, *date_labels):
        """Extract date from page based on labels"""
        for label in date_labels:
            # Look for date patterns near the label
            date_elements = response.css(f'*:contains("{label}") + *::text, *:contains("{label}")::text').getall()
            for element in date_elements:
                date = self.parse_date_text(element)
                if date:
                    return date
        return None
    
    def parse_date_text(self, text):
        """Parse date from text"""
        if not text:
            return None
        
        # Look for date patterns in text
        date_patterns = [
            r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
            r'(\d{4}-\d{2}-\d{2})',      # YYYY-MM-DD
            r'([A-Za-z]+ \d{1,2}, \d{4})',  # Month DD, YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                return self.standardize_date(date_str)
        
        return None
    
    def standardize_date(self, date_str):
        """Standardize date to YYYY-MM-DD format"""
        date_formats = [
            '%m/%d/%Y',
            '%Y-%m-%d',
            '%B %d, %Y',
            '%b %d, %Y',
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None