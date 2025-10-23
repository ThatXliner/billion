#!/usr/bin/env python3
"""
US Government Bills and Executive Orders Scraper

This script runs scrapers for:
- White House Presidential Actions (https://www.whitehouse.gov/presidential-actions/)
- Congress.gov Bills (https://www.congress.gov/browse)
- GovTrack.us Bills (https://www.govtrack.us/)

All data is stored in a SQLite database (government_bills.db)
"""

import os
import sys
import argparse
import sqlite3
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from govbills.spiders.whitehouse_spider import WhitehouseSpider
from govbills.spiders.congress_spider import CongressSpider
from govbills.spiders.govtrack_spider import GovtrackSpider


def create_database_if_not_exists():
    """Create the SQLite database if it doesn't exist"""
    db_path = 'government_bills.db'
    if not os.path.exists(db_path):
        print(f"Creating database: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.close()
    return db_path


def show_database_stats():
    """Show statistics about the scraped data"""
    db_path = 'government_bills.db'
    if not os.path.exists(db_path):
        print("Database does not exist yet. Run the scraper first.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in database. Run the scraper first.")
            return
        
        print("\n" + "="*50)
        print("DATABASE STATISTICS")
        print("="*50)
        
        # Bills statistics
        cursor.execute("SELECT COUNT(*) FROM bills")
        bills_count = cursor.fetchone()[0]
        print(f"Total Bills: {bills_count}")
        
        if bills_count > 0:
            cursor.execute("SELECT source_site, COUNT(*) FROM bills GROUP BY source_site")
            bills_by_source = cursor.fetchall()
            for source, count in bills_by_source:
                print(f"  - {source}: {count}")
            
            cursor.execute("SELECT bill_type, COUNT(*) FROM bills WHERE bill_type IS NOT NULL GROUP BY bill_type")
            bills_by_type = cursor.fetchall()
            if bills_by_type:
                print("  Bills by type:")
                for bill_type, count in bills_by_type:
                    print(f"    - {bill_type}: {count}")
        
        # Executive Actions statistics
        cursor.execute("SELECT COUNT(*) FROM executive_actions")
        actions_count = cursor.fetchone()[0]
        print(f"Total Executive Actions: {actions_count}")
        
        if actions_count > 0:
            cursor.execute("SELECT action_type, COUNT(*) FROM executive_actions WHERE action_type IS NOT NULL GROUP BY action_type")
            actions_by_type = cursor.fetchall()
            if actions_by_type:
                print("  Actions by type:")
                for action_type, count in actions_by_type:
                    print(f"    - {action_type}: {count}")
        
        # Recent items
        cursor.execute("SELECT title, source_site, scraped_date FROM bills ORDER BY scraped_date DESC LIMIT 5")
        recent_bills = cursor.fetchall()
        if recent_bills:
            print("\nRecent Bills:")
            for title, source, date in recent_bills:
                print(f"  - {title[:60]}... ({source})")
        
        cursor.execute("SELECT title, source_site, scraped_date FROM executive_actions ORDER BY scraped_date DESC LIMIT 5")
        recent_actions = cursor.fetchall()
        if recent_actions:
            print("\nRecent Executive Actions:")
            for title, source, date in recent_actions:
                print(f"  - {title[:60]}... ({source})")
        
        print("="*50)
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        conn.close()


def run_spider(spider_name, settings):
    """Run a single spider"""
    process = CrawlerProcess(settings)
    
    spider_classes = {
        'whitehouse': WhitehouseSpider,
        'congress': CongressSpider,
        'govtrack': GovtrackSpider
    }
    
    if spider_name in spider_classes:
        process.crawl(spider_classes[spider_name])
        process.start()
    else:
        print(f"Unknown spider: {spider_name}")
        print(f"Available spiders: {', '.join(spider_classes.keys())}")


def run_all_spiders(settings):
    """Run all spiders sequentially"""
    spiders = ['whitehouse', 'congress', 'govtrack']
    
    for spider_name in spiders:
        print(f"\n{'='*20} Running {spider_name} spider {'='*20}")
        try:
            process = CrawlerProcess(settings)
            if spider_name == 'whitehouse':
                process.crawl(WhitehouseSpider)
            elif spider_name == 'congress':
                process.crawl(CongressSpider)
            elif spider_name == 'govtrack':
                process.crawl(GovtrackSpider)
            
            process.start()
            print(f"Completed {spider_name} spider")
        except Exception as e:
            print(f"Error running {spider_name} spider: {e}")
            continue


def main():
    parser = argparse.ArgumentParser(description='US Government Bills and Executive Orders Scraper')
    parser.add_argument('--spider', '-s', 
                       choices=['whitehouse', 'congress', 'govtrack', 'all'],
                       default='all',
                       help='Which spider to run (default: all)')
    parser.add_argument('--stats', action='store_true',
                       help='Show database statistics')
    parser.add_argument('--db-path', default='government_bills.db',
                       help='Path to SQLite database (default: government_bills.db)')
    
    args = parser.parse_args()
    
    # Show stats and exit if requested
    if args.stats:
        show_database_stats()
        return
    
    print("US Government Bills and Executive Orders Scraper")
    print("="*50)
    
    # Create database if it doesn't exist
    create_database_if_not_exists()
    
    # Get Scrapy settings
    settings = get_project_settings()
    settings.set('DATABASE_PATH', args.db_path)
    
    # Run spiders
    if args.spider == 'all':
        print("Running all spiders...")
        print("This will scrape:")
        print("- White House Presidential Actions")
        print("- Congress.gov Bills")  
        print("- GovTrack.us Bills")
        print("\nThis may take a while. Please be patient...")
        
        run_all_spiders(settings)
    else:
        print(f"Running {args.spider} spider...")
        run_spider(args.spider, settings)
    
    # Show final stats
    print("\n" + "="*50)
    print("SCRAPING COMPLETED")
    print("="*50)
    show_database_stats()


if __name__ == "__main__":
    main()
