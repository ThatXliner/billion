# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class BillItem(scrapy.Item):
    # Bill identification
    bill_id = scrapy.Field()
    title = scrapy.Field()
    description = scrapy.Field()
    summary = scrapy.Field()
    
    # Bill details
    bill_type = scrapy.Field()  # executive_order, bill, resolution, etc.
    bill_number = scrapy.Field()
    congress_session = scrapy.Field()
    
    # Dates
    introduced_date = scrapy.Field()
    signed_date = scrapy.Field()
    last_action_date = scrapy.Field()
    
    # Status and progression
    status = scrapy.Field()
    current_stage = scrapy.Field()
    last_action = scrapy.Field()
    
    # Sponsors and committees
    sponsor = scrapy.Field()
    cosponsors = scrapy.Field()
    committees = scrapy.Field()
    
    # Legislative details
    house_passage_vote = scrapy.Field()
    senate_passage_vote = scrapy.Field()
    subjects = scrapy.Field()
    policy_areas = scrapy.Field()
    
    # URLs and references
    source_url = scrapy.Field()
    full_text_url = scrapy.Field()
    congress_gov_url = scrapy.Field()
    
    # Metadata
    source_site = scrapy.Field()
    scraped_date = scrapy.Field()


class ExecutiveActionItem(scrapy.Item):
    # Action identification
    action_id = scrapy.Field()
    title = scrapy.Field()
    description = scrapy.Field()
    
    # Action details
    action_type = scrapy.Field()  # executive_order, presidential_memorandum, proclamation
    action_number = scrapy.Field()
    
    # Dates
    signed_date = scrapy.Field()
    published_date = scrapy.Field()
    
    # Content
    summary = scrapy.Field()
    subjects = scrapy.Field()
    
    # URLs and references
    source_url = scrapy.Field()
    full_text_url = scrapy.Field()
    
    # Metadata
    source_site = scrapy.Field()
    scraped_date = scrapy.Field()