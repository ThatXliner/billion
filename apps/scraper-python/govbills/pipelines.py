# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import sqlite3
import os
from datetime import datetime
from scrapy.exceptions import DropItem
from govbills.items import BillItem, ExecutiveActionItem


class SQLitePipeline:
    
    def __init__(self, database_path):
        self.database_path = database_path
        
    @classmethod
    def from_crawler(cls, crawler):
        database_path = crawler.settings.get("DATABASE_PATH")
        return cls(database_path=database_path)
    
    def open_spider(self, spider):
        self.connection = sqlite3.connect(self.database_path)
        self.cursor = self.connection.cursor()
        self.create_tables()
    
    def close_spider(self, spider):
        self.connection.close()
    
    def create_tables(self):
        # Create bills table
        create_bills_table = '''
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id TEXT UNIQUE,
            title TEXT,
            description TEXT,
            summary TEXT,
            bill_type TEXT,
            bill_number TEXT,
            congress_session TEXT,
            introduced_date TEXT,
            signed_date TEXT,
            last_action_date TEXT,
            status TEXT,
            current_stage TEXT,
            last_action TEXT,
            sponsor TEXT,
            cosponsors TEXT,
            committees TEXT,
            house_passage_vote TEXT,
            senate_passage_vote TEXT,
            subjects TEXT,
            policy_areas TEXT,
            source_url TEXT,
            full_text_url TEXT,
            congress_gov_url TEXT,
            source_site TEXT,
            scraped_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        '''
        
        # Create executive actions table
        create_executive_actions_table = '''
        CREATE TABLE IF NOT EXISTS executive_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_id TEXT UNIQUE,
            title TEXT,
            description TEXT,
            action_type TEXT,
            action_number TEXT,
            signed_date TEXT,
            published_date TEXT,
            summary TEXT,
            subjects TEXT,
            source_url TEXT,
            full_text_url TEXT,
            source_site TEXT,
            scraped_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        '''
        
        self.cursor.execute(create_bills_table)
        self.cursor.execute(create_executive_actions_table)
        self.connection.commit()
    
    def process_item(self, item, spider):
        if isinstance(item, BillItem):
            return self.process_bill_item(item)
        elif isinstance(item, ExecutiveActionItem):
            return self.process_executive_action_item(item)
        else:
            raise DropItem(f"Unknown item type: {type(item)}")
    
    def process_bill_item(self, item):
        insert_sql = '''
        INSERT OR REPLACE INTO bills (
            bill_id, title, description, summary, bill_type, bill_number,
            congress_session, introduced_date, signed_date, last_action_date,
            status, current_stage, last_action, sponsor, cosponsors, committees,
            house_passage_vote, senate_passage_vote, subjects, policy_areas,
            source_url, full_text_url, congress_gov_url, source_site, scraped_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        # Convert list fields to comma-separated strings
        cosponsors = ', '.join(item.get('cosponsors', [])) if item.get('cosponsors') else None
        committees = ', '.join(item.get('committees', [])) if item.get('committees') else None
        subjects = ', '.join(item.get('subjects', [])) if item.get('subjects') else None
        policy_areas = ', '.join(item.get('policy_areas', [])) if item.get('policy_areas') else None
        
        values = (
            item.get('bill_id'),
            item.get('title'),
            item.get('description'),
            item.get('summary'),
            item.get('bill_type'),
            item.get('bill_number'),
            item.get('congress_session'),
            item.get('introduced_date'),
            item.get('signed_date'),
            item.get('last_action_date'),
            item.get('status'),
            item.get('current_stage'),
            item.get('last_action'),
            item.get('sponsor'),
            cosponsors,
            committees,
            item.get('house_passage_vote'),
            item.get('senate_passage_vote'),
            subjects,
            policy_areas,
            item.get('source_url'),
            item.get('full_text_url'),
            item.get('congress_gov_url'),
            item.get('source_site'),
            item.get('scraped_date')
        )
        
        try:
            self.cursor.execute(insert_sql, values)
            self.connection.commit()
            return item
        except sqlite3.Error as e:
            raise DropItem(f"Error inserting bill item: {e}")
    
    def process_executive_action_item(self, item):
        insert_sql = '''
        INSERT OR REPLACE INTO executive_actions (
            action_id, title, description, action_type, action_number,
            signed_date, published_date, summary, subjects,
            source_url, full_text_url, source_site, scraped_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        # Convert list fields to comma-separated strings
        subjects = ', '.join(item.get('subjects', [])) if item.get('subjects') else None
        
        values = (
            item.get('action_id'),
            item.get('title'),
            item.get('description'),
            item.get('action_type'),
            item.get('action_number'),
            item.get('signed_date'),
            item.get('published_date'),
            item.get('summary'),
            subjects,
            item.get('source_url'),
            item.get('full_text_url'),
            item.get('source_site'),
            item.get('scraped_date')
        )
        
        try:
            self.cursor.execute(insert_sql, values)
            self.connection.commit()
            return item
        except sqlite3.Error as e:
            raise DropItem(f"Error inserting executive action item: {e}")