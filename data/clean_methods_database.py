#!/usr/bin/env python3
"""
Script to remove spam entries from the methods database.
Detects various spam patterns including:
- Customer service/support spam
- Phone numbers and contact information
- Travel/airline booking spam
- Question-based spam patterns
- Commercial service advertisements
- Other irrelevant commercial content
"""

import sqlite3
import logging
import re
from pathlib import Path
from typing import List, Tuple, Dict

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('methods_cleaning.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MethodsDatabaseCleaner:
    def __init__(self, db_path: str = "papers_with_code.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Connect to SQLite database"""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        logger.info(f"Connected to database: {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
            
    def get_methods_count(self) -> int:
        """Get total count of methods in database"""
        self.cursor.execute("SELECT COUNT(*) FROM methods")
        return self.cursor.fetchone()[0]
    
    def get_spam_patterns(self) -> Dict[str, List[str]]:
        """Define comprehensive spam patterns for methods"""
        return {
            'customer_service_spam': [
                r'customer\s+service',
                r'support\s+line',
                r'helpline',
                r'toll\s+free',
                r'call\s+center',
                r'24/7\s+customer',
                r'contact\s+us\s+support',
                r'reach\s+out',
                r'speak\s+to\s+a\s+real\s+person',
                r'get\s+human\s+immediately',
                r'bypass\s+automated\s+system',
                r'atencion\s+al\s+cliente',
                r'asistencia\s+en\s+español',
                r'soporte\s+en\s+español'
            ],
            'phone_numbers': [
                r'\+1\s*\(\d{3}\)\s*\d{3}-\d{4}',
                r'\+1\s*\d{3}-\d{3}-\d{4}',
                r'\+1\s*\d{10}',
                r'\(\d{3}\)\s*\d{3}-\d{4}',
                r'\d{3}-\d{3}-\d{4}',
                r'\+1\s*→\s*\d{3}\s*→\s*\d{3}\s*→\s*\d{4}',
                r'\+1\s*➤\s*\d{3}\s*➤\s*\d{3}\s*➤\s*\d{4}',
                r'1\s*-\s*800\s*-\s*\(\d{3}\)\s*-\s*\(\d{3}\)\s*-\s*\(\d{4}\)',
                r'1\s*-\s*808\s*-\s*\(\d{3}\)\s*-\s*\(\d{3}\)\s*-\s*\(\d{4}\)',
                r'☎\s*\+1\s*→\s*\d{3}\s*→\s*\d{3}\s*→\s*\d{4}',
                r'☎\s*\+1\s*➤\s*\d{3}\s*➤\s*\d{3}\s*➤\s*\d{4}',
                r'☎️\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
                r'\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
                r'☎️\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
                # Specific patterns for the spam we're seeing
                r'\+1-801-\(855\)-\(5905\)',
                r'\+1-804-\(853\)-\(9001\)',
                r'☎️\+1-801-\(855\)-\(5905\)',
                r'☎️\+1-804-\(853\)-\(9001\)',
                # International phone patterns
                r'\+48\s*\(48\)\s*8880001',
                r'\+48\s*\(48\)\s*8880001',
                r'\+48\s*\(48\)\s*8880001',
                # More general phone patterns
                r'\+\d+\s*\(\d+\)\s*\d+',
                r'\(\d+\)\s*\d+',
                r'\d+\s*-\s*\(\d+\)\s*-\s*\(\d+\)'
            ],
            'travel_airline_spam': [
                r'american\s+airlines?',
                r'american\s+air',
                r'american\s+representative',
                r'american\s+agente',
                r'american\s+operador',
                r'expedia',
                r'flight\s+booking',
                r'hotel\s+reservation',
                r'travel\s+emergency',
                r'canceled\s+flight',
                r'last\s+minute\s+booking',
                r'refund\s+delays',
                r'itinerary\s+number',
                r'booking\s+issue',
                r'check-in',
                r'reservation',
                r'vuelo',
                r'reserva',
                r'cancelación',
                r'reembolso',
                r'cambio\s+de\s+vuelo',
                r'atención\s+al\s+cliente'
            ],
            'question_spam': [
                r'how\s+do\s+i\s+get',
                r'how\s+do\s+i\s+talk\s+to',
                r'how\s+do\s+i\s+speak\s+to',
                r'how\s+do\s+i\s+contact',
                r'how\s+do\s+i\s+reach',
                r'what\s+if\s+i',
                r'can\s+you\s+change',
                r'can\s+i\s+cancel',
                r'what\s+are\s+the\s+policies',
                r'when\s+to\s+use',
                r'cómo\s+hablar\s+con',
                r'cómo\s+llamar\s+a',
                r'cómo\s+contactar',
                r'cómo\s+hablo\s+con',
                r'cómo\s+puedo\s+hablar',
                r'qué\s+es\s+la\s+política',
                r'cuál\s+es\s+el\s+número'
            ],
            'commercial_advertising': [
                r'available\s+24/7',
                r'best\s+used\s+for',
                r'fastest\s+way',
                r'most\s+effective\s+way',
                r'convenient\s+if',
                r'useful\s+for',
                r'help\s+resolve\s+your\s+issue',
                r'related\s+search\s+phrases',
                r'final\s+tips',
                r'best\s+for\s+help\s+with',
                r'brinda\s+soporte',
                r'disponible\s+para',
                r'te\s+conecta\s+con',
                r'ofrece\s+asistencia'
            ],
            'url_spam': [
                r'@\w+',  # Twitter handles
                r'facebook\.com',
                r'twitter\.com',
                r'linkedin\.com'
            ],
            'spanish_spam': [
                r'¿cómo\s+',
                r'para\s+hablar\s+con',
                r'para\s+llamar\s+a',
                r'asegúrate\s+de\s+tener',
                r'el\s+centro\s+de\s+llamadas',
                r'horarios\s+amplios',
                r'cualquier\s+consulta',
                r'relacionada\s+a\s+tu\s+viaje',
                r'atención\s+al\s+cliente\s+regional',
                r'disponibles\s+para\s+resolver',
                r'brindar\s+soporte'
            ]
        }
    
    def check_spam_patterns(self, name: str, description: str = None, full_name: str = None) -> Tuple[bool, str, str]:
        """
        Check if a method name or description matches spam patterns.
        Returns (is_spam, spam_type, matched_pattern)
        """
        if not name:
            return False, None, None
            
        # Combine all text fields for pattern checking
        text_to_check = f"{name} {description or ''} {full_name or ''}".lower()
        
        patterns = self.get_spam_patterns()
        
        # Check for exact matches first
        for spam_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                if re.search(pattern, text_to_check, re.IGNORECASE):
                    return True, spam_type, pattern
        
        # Additional checks for common spam indicators
        # Check if name contains question words and phone numbers
        question_words = ['how', 'what', 'can', 'when', 'why', 'cómo', 'qué', 'cuál', 'por qué']
        has_question = any(word in text_to_check for word in question_words)
        
        # Check for phone number patterns (various formats)
        phone_patterns = [
            r'\d{3}[-→➤]\d{3}[-→➤]\d{4}',
            r'\+1\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{4}',
            r'1\s*[-→➤]\s*800\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{4}',
            r'1\s*[-→➤]\s*808\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{3}\s*[-→➤]\s*\d{4}',
            # More comprehensive phone patterns
            r'\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
            r'☎️\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
            r'☎️\+1-\d{3}-\(\d{3}\)-\(\d{4}\)',
            # International patterns
            r'\+48\s*\(48\)\s*8880001',
            # General phone patterns
            r'\+\d+\s*\(\d+\)\s*\d+',
            r'\(\d+\)\s*\d+',
            r'\d+\s*-\s*\(\d+\)\s*-\s*\(\d+\)'
        ]
        
        has_phone = any(re.search(pattern, text_to_check) for pattern in phone_patterns)
        
        # Check for airline/travel keywords
        travel_keywords = ['airline', 'air', 'flight', 'vuelo', 'reserva', 'booking', 'reservation', 'cancel', 'cancelar']
        has_travel = any(keyword in text_to_check for keyword in travel_keywords)
        
        # If it has both question words and phone numbers, it's likely spam
        if has_question and has_phone:
            return True, 'question_phone_spam', 'question_with_phone'
        
        # If it has travel keywords and phone numbers, it's likely spam
        if has_travel and has_phone:
            return True, 'travel_phone_spam', 'travel_with_phone'
        
        # If it has question words and travel keywords, it's likely spam
        if has_question and has_travel:
            return True, 'question_travel_spam', 'question_with_travel'
        
        # Final aggressive check: if it has travel keywords and ANY phone-like pattern, it's spam
        # This catches entries that might have phone numbers in unusual formats
        if has_travel:
            # Look for any sequence that looks like a phone number
            phone_like_patterns = [
                r'\d{1,2}[-\s⇌→➤]\d{1,3}[-\s⇌→➤]\d{1,4}',  # Matches patterns like 1-801-855-5905, 1⇌8.01-85.5⇌59.05
                r'\+\d{1,2}\s*-\s*\d{1,3}\s*-\s*\d{1,4}',   # Matches +39 0200-70-2383
                r'\d{1,2}\s*-\s*\d{1,4}\s*-\s*\d{1,2}',     # Matches 39 0200-70-23
                r'\d{1,2}\s*⇌\s*\d{1,2}\s*\.\s*\d{1,2}\s*-\s*\d{1,2}\s*⇌\s*\d{1,2}',  # Matches 1⇌8.01-85.5⇌59.05
                # More unusual patterns
                r'🔰\+1~801~855~5905',  # Matches 🔰+1~801~855~5905
                r'🔰\+1~804~853~9001',  # Matches 🔰+1~804~853~9001
                r'\+1~801~855~5905',    # Matches +1~801~855~5905
                r'\+1~804~853~9001',    # Matches +1~804~853~9001
                r'1~801~855~5905',      # Matches 1~801~855~5905
                r'1~804~853~9001',      # Matches 1~804~853~9001
                # Very specific patterns from the remaining spam
                r'1-801-\(855\)-5905',
                r'1-804-\(853\)-9001',
                r'\+1-\(801\)-\(855\)-5905',
                r'\+1-\(804\)-\(853\)-9001',
                # Patterns with spaces around +
                r'\+\s*1-801-\(855\)-5905',
                r'\+\s*1-804-\(853\)-9001',
                r'\+\s*1\s*-\s*\(801\)\s*-\s*\(855\)\s*-\s*5905',
                r'\+\s*1\s*-\s*\(804\)\s*-\s*\(853\)\s*-\s*9001'
            ]
            
            for pattern in phone_like_patterns:
                if re.search(pattern, text_to_check):
                    return True, 'travel_phone_like_spam', f'travel_with_phone_like_{pattern}'
            
            # Ultra-aggressive check: if it has travel keywords and contains any sequence that looks like a phone number
            # This catches entries that might have phone numbers in very unusual formats
            ultra_phone_patterns = [
                r'\+?\s*\d+\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?',  # Matches + 1-(801)-855-(5905)
                r'\d+\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?',        # Matches 1-(801)-855-(5905)
                r'\+?\s*\d+\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?\s*[-\(]\s*\d+\s*\)?',  # Matches +1-(801)-855-(5905)
                # Very specific patterns for the remaining spam
                r'\+1-801-\(855\)-5905',      # Matches +1-801-(855)-5905
                r'\+1-804-\(853\)-9001',      # Matches +1-804-(853)-9001
                r'1-801-\(855\)-5905',        # Matches 1-801-(855)-5905
                r'1-804-\(853\)-9001',        # Matches 1-804-(853)-9001
                # Patterns with spaces around +
                r'\+\s*1-801-\(855\)-5905',   # Matches + 1-801-(855)-5905
                r'\+\s*1-804-\(853\)-9001',   # Matches + 1-804-(853)-9001
                # Patterns with arrows and unusual formats
                r'1⇌8\.01-85\.5⇌59\.05',     # Matches 1⇌8.01-85.5⇌59.05
                r'1⇌8\.04-85\.3⇌90\.01',     # Matches 1⇌8.04-85.3⇌90.01
                # Patterns with spaces and parentheses around last part
                r'\+\s*1-\(801\)-\(855\)-\(5905\)',   # Matches + 1-(801)-855-(5905)
                r'\+\s*1-\(804\)-\(853\)-\(9001\)',   # Matches + 1-(804)-853-(9001)
            ]
            
            for pattern in ultra_phone_patterns:
                if re.search(pattern, text_to_check):
                    return True, 'travel_ultra_phone_spam', f'travel_with_ultra_phone_{pattern}'
            
            # Final check: if it has travel keywords and contains any phone-like sequence, it's spam
            # This catches entries that might have phone numbers in very unusual formats
            if has_travel:
                # Look for any sequence that contains digits and dashes/parentheses in a phone-like pattern
                phone_like_sequences = [
                    '+ 1-(801)-855-(5905)',
                    '+ 1-(804)-853-(9001)',
                    '1-(801)-855-(5905)',
                    '1-(804)-853-(9001)',
                    '+1-(801)-855-(5905)',
                    '+1-(804)-853-(9001)'
                ]
                
                for sequence in phone_like_sequences:
                    if sequence in text_to_check:
                        return True, 'travel_exact_phone_spam', f'travel_with_exact_phone_{sequence}'
                    
        return False, None, None
    
    def find_spam_entries(self) -> List[Tuple[int, str, str, str]]:
        """Find all methods that match spam patterns"""
        logger.info("Scanning for spam entries...")
        
        self.cursor.execute("""
            SELECT id, name, full_name, description 
            FROM methods 
            WHERE name IS NOT NULL
        """)
        
        spam_entries = []
        total_checked = 0
        
        for row in self.cursor.fetchall():
            method_id, name, full_name, description = row
            total_checked += 1
            
            is_spam, spam_type, pattern = self.check_spam_patterns(name, description, full_name)
            
            if is_spam:
                spam_entries.append((method_id, name, spam_type, pattern))
                
            if total_checked % 1000 == 0:
                logger.info(f"Checked {total_checked} methods...")
                
        logger.info(f"Found {len(spam_entries)} spam entries out of {total_checked} total methods")
        return spam_entries
    
    def remove_spam_entries(self, spam_entries: List[Tuple[int, str, str, str]]) -> int:
        """Remove spam entries from the database"""
        if not spam_entries:
            logger.info("No spam entries to remove")
            return 0
            
        logger.info(f"Removing {len(spam_entries)} spam entries...")
        
        # Get method IDs to remove
        method_ids = [entry[0] for entry in spam_entries]
        
        # Remove from paper_methods relationship table first
        placeholders = ','.join(['?' for _ in method_ids])
        self.cursor.execute(f"""
            DELETE FROM paper_methods 
            WHERE method_id IN ({placeholders})
        """, method_ids)
        
        # Remove from method_categories_rel table
        self.cursor.execute(f"""
            DELETE FROM method_categories_rel 
            WHERE method_id IN ({placeholders})
        """, method_ids)
        
        # Remove from methods table
        self.cursor.execute(f"""
            DELETE FROM methods 
            WHERE id IN ({placeholders})
        """, method_ids)
        
        # Commit changes
        self.conn.commit()
        
        logger.info(f"Successfully removed {len(spam_entries)} spam entries")
        return len(spam_entries)
    
    def log_spam_details(self, spam_entries: List[Tuple[int, str, str, str]]):
        """Log detailed information about removed spam entries"""
        if not spam_entries:
            return
            
        logger.info("\n=== SPAM ENTRIES REMOVED ===")
        
        # Group by spam type
        spam_by_type = {}
        for entry in spam_entries:
            method_id, name, spam_type, pattern = entry
            if spam_type not in spam_by_type:
                spam_by_type[spam_type] = []
            spam_by_type[spam_type].append((method_id, name, pattern))
        
        # Log summary by type
        for spam_type, entries in spam_by_type.items():
            logger.info(f"\n{spam_type.upper()} ({len(entries)} entries):")
            for method_id, name, pattern in entries[:10]:  # Show first 10
                logger.info(f"  ID {method_id}: {name[:80]}... (pattern: {pattern})")
            if len(entries) > 10:
                logger.info(f"  ... and {len(entries) - 10} more")
    
    def clean_database(self) -> Dict[str, int]:
        """Main method to clean the database"""
        try:
            self.connect()
            
            initial_count = self.get_methods_count()
            logger.info(f"Initial methods count: {initial_count}")
            
            # Find spam entries
            spam_entries = self.find_spam_entries()
            
            if not spam_entries:
                logger.info("No spam entries found. Database is clean!")
                return {'removed': 0, 'initial_count': initial_count, 'final_count': initial_count}
            
            # Remove spam entries
            removed_count = self.remove_spam_entries(spam_entries)
            
            # Log details
            self.log_spam_details(spam_entries)
            
            # Get final count
            final_count = self.get_methods_count()
            logger.info(f"Final methods count: {final_count}")
            logger.info(f"Removed {removed_count} spam entries")
            
            return {
                'removed': removed_count,
                'initial_count': initial_count,
                'final_count': final_count
            }
            
        except Exception as e:
            logger.error(f"Error during database cleaning: {e}")
            raise
        finally:
            self.close()

def main():
    """Main execution function"""
    logger.info("Starting methods database cleaning process...")
    
    # Check if database exists
    db_path = "papers_with_code.db"
    if not Path(db_path).exists():
        logger.error(f"Database not found: {db_path}")
        return
    
    # Create cleaner instance and run
    cleaner = MethodsDatabaseCleaner(db_path)
    results = cleaner.clean_database()
    
    logger.info("=== CLEANING COMPLETE ===")
    logger.info(f"Initial methods count: {results['initial_count']}")
    logger.info(f"Spam entries removed: {results['removed']}")
    logger.info(f"Final methods count: {results['final_count']}")
    
    if results['removed'] > 0:
        logger.info(f"Database cleaned successfully! Removed {results['removed']} spam entries.")
    else:
        logger.info("Database was already clean. No spam entries found.")

if __name__ == "__main__":
    main()
