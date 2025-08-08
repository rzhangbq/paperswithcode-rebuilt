#!/usr/bin/env python3
"""
Unified script to build all Papers with Code databases.
This script can build:
1. Standard database (papers_with_code.db)
2. Enhanced methods database (papers_with_code_enhanced.db)
3. Evaluation database (evaluation_database.db)

Usage:
    python build_all_databases.py [--standard] [--enhanced] [--evaluation] [--all]
"""

import argparse
import os
import sys
import logging
import time
from pathlib import Path

# Import the database builders
from build_database import PapersWithCodeDB
from build_evaluation_database import EvaluationDatabaseBuilder

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('database_build.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class UnifiedDatabaseBuilder:
    def __init__(self):
        self.start_time = time.time()
        self.build_results = {}
        
    def log_build_start(self, db_name):
        """Log the start of a database build"""
        logger.info(f"🚀 Starting {db_name} build...")
        logger.info(f"   Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
    def log_build_complete(self, db_name, success=True):
        """Log the completion of a database build"""
        if success:
            logger.info(f"✅ {db_name} build completed successfully!")
        else:
            logger.error(f"❌ {db_name} build failed!")
            
    def check_required_files(self):
        """Check if all required JSON files exist"""
        required_files = [
            '../raw_data/papers-with-abstracts.json',
            '../raw_data/methods.json',
            '../raw_data/datasets.json',
            '../raw_data/evaluation-tables.json',
            '../raw_data/links-between-papers-and-code.json'
        ]
        
        missing_files = []
        for file_path in required_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
                
        if missing_files:
            logger.error("❌ Missing required files:")
            for file_path in missing_files:
                logger.error(f"   {file_path}")
            logger.error("Please download the required JSON files to the raw_data/ directory.")
            return False
            
        logger.info("✅ All required files found")
        return True
        
    def check_disk_space(self):
        """Check if there's enough disk space"""
        # Estimate required space (in bytes)
        required_space = 10 * 1024 * 1024 * 1024  # 10GB
        
        try:
            statvfs = os.statvfs('.')
            free_space = statvfs.f_frsize * statvfs.f_bavail
            
            if free_space < required_space:
                logger.warning(f"⚠️  Low disk space: {free_space / (1024**3):.1f}GB free")
                logger.warning(f"   Recommended: At least 10GB free space")
                return False
            else:
                logger.info(f"✅ Sufficient disk space: {free_space / (1024**3):.1f}GB free")
                return True
        except Exception as e:
            logger.warning(f"⚠️  Could not check disk space: {e}")
            return True  # Continue anyway
            
    def build_standard_database(self):
        """Build the standard database"""
        try:
            self.log_build_start("Standard Database")
            
            db = PapersWithCodeDB()
            db.connect()
            db.create_tables()
            
            # Insert data from JSON files
            if os.path.exists('../raw_data/papers-with-abstracts.json'):
                db.insert_papers('../raw_data/papers-with-abstracts.json')
            
            if os.path.exists('../raw_data/methods.json'):
                db.insert_methods('../raw_data/methods.json')
                
            if os.path.exists('../raw_data/datasets.json'):
                db.insert_datasets('../raw_data/datasets.json')
                
            if os.path.exists('../raw_data/evaluation-tables.json'):
                db.insert_evaluations('../raw_data/evaluation-tables.json')
                
            if os.path.exists('../raw_data/links-between-papers-and-code.json'):
                db.insert_code_links('../raw_data/links-between-papers-and-code.json')
            
            # Create indexes and get statistics
            db.create_indexes()
            db.get_database_stats()
            
            db.close()
            self.log_build_complete("Standard Database", True)
            self.build_results['standard'] = True
            return True
            
        except Exception as e:
            logger.error(f"Error building standard database: {e}")
            self.log_build_complete("Standard Database", False)
            self.build_results['standard'] = False
            return False
            
    def build_enhanced_methods_database(self):
        """Build the enhanced methods database"""
        try:
            self.log_build_start("Enhanced Methods Database")
            
            # Use the enhance_existing_database script
            from enhance_existing_database import DatabaseEnhancer
            
            enhancer = DatabaseEnhancer()
            enhancer.connect()
            
            # Create enhanced tables
            enhancer.create_enhanced_tables()
            
            # Update methods with enhanced data
            if os.path.exists('../raw_data/methods.json'):
                enhancer.update_methods_with_enhanced_data('../raw_data/methods.json')
            
            # Create enhanced indexes
            enhancer.create_enhanced_indexes()
            
            # Get enhanced statistics
            enhancer.get_enhanced_stats()
            
            enhancer.close()
            self.log_build_complete("Enhanced Methods Database", True)
            self.build_results['enhanced'] = True
            return True
            
        except Exception as e:
            logger.error(f"Error building enhanced methods database: {e}")
            self.log_build_complete("Enhanced Methods Database", False)
            self.build_results['enhanced'] = False
            return False
            
    def build_evaluation_database(self):
        """Build the evaluation database"""
        try:
            self.log_build_start("Evaluation Database")
            
            db = EvaluationDatabaseBuilder()
            db.connect()
            db.create_tables()
            
            # Insert evaluation data
            if os.path.exists('../raw_data/evaluation-tables.json'):
                db.insert_evaluation_data('../raw_data/evaluation-tables.json')
            
            # Create indexes and get statistics
            db.create_indexes()
            db.get_database_stats()
            
            db.close()
            self.log_build_complete("Evaluation Database", True)
            self.build_results['evaluation'] = True
            return True
            
        except Exception as e:
            logger.error(f"Error building evaluation database: {e}")
            self.log_build_complete("Evaluation Database", False)
            self.build_results['evaluation'] = False
            return False
            
    def print_summary(self):
        """Print a summary of the build results"""
        total_time = time.time() - self.start_time
        
        logger.info("\n" + "="*60)
        logger.info("📊 BUILD SUMMARY")
        logger.info("="*60)
        
        for db_name, success in self.build_results.items():
            status = "✅ SUCCESS" if success else "❌ FAILED"
            logger.info(f"{db_name.upper():<25} {status}")
            
        logger.info(f"\n⏱️  Total build time: {total_time/60:.1f} minutes")
        
        # Check database file sizes
        db_files = {
            'Standard': 'papers_with_code.db',
            'Evaluation': 'evaluation_database.db'
        }
        
        logger.info("\n📁 Database file sizes:")
        for db_name, filename in db_files.items():
            if os.path.exists(filename):
                size_mb = os.path.getsize(filename) / (1024 * 1024)
                if size_mb > 1024:
                    size_gb = size_mb / 1024
                    logger.info(f"{db_name:<20} {size_gb:.1f} GB")
                else:
                    logger.info(f"{db_name:<20} {size_mb:.1f} MB")
            else:
                logger.info(f"{db_name:<20} Not created")
                
        logger.info("="*60)
        
    def run(self, build_standard=False, build_enhanced=False, build_evaluation=False):
        """Run the database builds based on specified options"""
        logger.info("🔧 Papers with Code Database Builder")
        logger.info("="*60)
        
        # Check prerequisites
        if not self.check_required_files():
            return False
            
        if not self.check_disk_space():
            logger.warning("Continuing with build despite low disk space...")
            
        # Determine what to build
        if build_standard or build_enhanced or build_evaluation:
            builds_to_run = []
            if build_standard:
                builds_to_run.append(("Standard", self.build_standard_database))
            if build_enhanced:
                builds_to_run.append(("Enhanced Methods", self.build_enhanced_methods_database))
            if build_evaluation:
                builds_to_run.append(("Evaluation", self.build_evaluation_database))
        else:
            # Default: build all
            builds_to_run = [
                ("Standard", self.build_standard_database),
                ("Evaluation", self.build_evaluation_database)
            ]
            
        # Run the builds
        for db_name, build_func in builds_to_run:
            logger.info(f"\n{'='*20} {db_name.upper()} {'='*20}")
            build_func()
            
        # Print summary
        self.print_summary()
        
        # Return success if all requested builds succeeded
        requested_builds = [k for k, v in self.build_results.items() if v is not None]
        successful_builds = [k for k, v in self.build_results.items() if v is True]
        
        if len(successful_builds) == len(requested_builds):
            logger.info("🎉 All requested databases built successfully!")
            return True
        else:
            logger.error("⚠️  Some database builds failed. Check the logs for details.")
            return False

def main():
    """Main function with command line argument parsing"""
    parser = argparse.ArgumentParser(
        description="Build Papers with Code databases",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python build_all_databases.py --all                    # Build all databases
  python build_all_databases.py --standard               # Build only standard database
  python build_all_databases.py --enhanced --evaluation  # Build enhanced and evaluation databases
        """
    )
    
    parser.add_argument(
        '--standard',
        action='store_true',
        help='Build standard database (papers_with_code.db)'
    )
    
    parser.add_argument(
        '--enhanced',
        action='store_true',
        help='Build enhanced methods database (papers_with_code_enhanced.db)'
    )
    
    parser.add_argument(
        '--evaluation',
        action='store_true',
        help='Build evaluation database (evaluation_database.db)'
    )
    
    parser.add_argument(
        '--all',
        action='store_true',
        help='Build all databases (default if no specific option is given)'
    )
    
    args = parser.parse_args()
    
    # If no specific option is given, default to --all
    if not any([args.standard, args.enhanced, args.evaluation, args.all]):
        args.all = True
        
    # Create and run the builder
    builder = UnifiedDatabaseBuilder()
    success = builder.run(
        build_standard=args.standard or args.all,
        build_enhanced=args.enhanced or args.all,
        build_evaluation=args.evaluation or args.all
    )
    
    if success:
        logger.info("\n🎯 Next steps:")
        logger.info("1. Run 'python query_examples.py' to test standard database")
        logger.info("2. Run 'python methods_query_examples.py' to test enhanced methods")
        logger.info("3. Check COMPREHENSIVE_README.md for usage examples")
        logger.info("4. Integrate databases into your web application")
        
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 