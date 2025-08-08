#!/usr/bin/env python3
"""
Quick Start Script for Papers with Code Database System

This script provides an easy way to get started with the database system.
It will guide you through the setup process and help you choose which databases to build.
"""

import os
import sys
import subprocess
import time

def print_banner():
    """Print the welcome banner"""
    print("="*70)
    print("🔬 PAPERS WITH CODE DATABASE SYSTEM")
    print("="*70)
    print("Welcome to the Papers with Code database system!")
    print("This system provides three types of databases:")
    print()
    print("1. 📚 Standard Database - Complete papers, authors, tasks, methods (with enhanced methods)")
    print("2. 📊 Evaluation Database - Detailed evaluation data with metrics")
    print("3. 🔧 Enhance Existing Database - Add methods areas/categories to existing database")
    print("="*70)

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 6):
        print("❌ Python 3.6 or higher is required")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    else:
        print(f"✅ Python version: {version.major}.{version.minor}.{version.micro}")
        return True

def check_required_files():
    """Check if required JSON files exist"""
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
        print("❌ Missing required files:")
        for file_path in missing_files:
            print(f"   {file_path}")
        print()
        print("📥 Please download the required JSON files:")
        print("   1. Go to https://paperswithcode.com/about")
        print("   2. Download the JSON files")
        print("   3. Place them in the raw_data/ directory")
        return False
    else:
        print("✅ All required files found")
        return True

def check_dependencies():
    """Check if required Python packages are installed"""
    try:
        import sqlite3
        import json
        import logging
        print("✅ Required packages are available")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("   Run: pip install -r requirements.txt")
        return False

def get_user_choice():
    """Get user choice for which databases to build"""
    print("\n🎯 Which databases would you like to build?")
    print()
    print("1. Standard Database (6.6GB) - Complete papers, authors, tasks, methods (with enhanced methods)")
    print("2. Evaluation Database (72MB) - Detailed evaluation data")
    print("3. Enhance Existing Database - Add methods areas/categories to existing database")
    print("4. All Databases (Recommended for full functionality)")
    print("5. Exit")
    print()
    
    while True:
        try:
            choice = input("Enter your choice (1-5): ").strip()
            if choice in ['1', '2', '3', '4', '5']:
                return choice
            else:
                print("Please enter a number between 1 and 5")
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            sys.exit(0)

def run_build_command(choice):
    """Run the appropriate build command based on user choice"""
    if choice == '1':
        print("\n🚀 Building Standard Database (with enhanced methods)...")
        cmd = [sys.executable, 'build_database.py']
    elif choice == '2':
        print("\n🚀 Building Evaluation Database...")
        cmd = [sys.executable, 'build_evaluation_database.py']
    elif choice == '3':
        print("\n🚀 Enhancing Existing Database...")
        cmd = [sys.executable, 'enhance_existing_database.py']
    elif choice == '4':
        print("\n🚀 Building All Databases...")
        cmd = [sys.executable, 'build_all_databases.py', '--all']
    else:
        print("\n👋 Goodbye!")
        return False
    
    try:
        result = subprocess.run(cmd, check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed with error code: {e.returncode}")
        return False
    except FileNotFoundError:
        print("❌ Build script not found. Make sure you're in the correct directory.")
        return False

def show_next_steps():
    """Show next steps after successful build"""
    print("\n🎉 Database build completed successfully!")
    print("\n📖 Next steps:")
    print("1. Read COMPREHENSIVE_README.md for detailed documentation")
    print("2. Run query examples to test the databases:")
    print("   - python query_examples.py (for standard database)")
    print("   - python methods_query_examples.py (for enhanced methods)")
    print("3. Integrate the databases into your web application")
    print("4. Check the database files in the current directory")
    print("\n📁 Available database files:")
    
    db_files = [
        ('papers_with_code.db', 'Standard Database (with enhanced methods)'),
        ('evaluation_database.db', 'Evaluation Database')
    ]
    
    for filename, description in db_files:
        if os.path.exists(filename):
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            if size_mb > 1024:
                size_gb = size_mb / 1024
                print(f"   ✅ {filename} ({size_gb:.1f} GB) - {description}")
            else:
                print(f"   ✅ {filename} ({size_mb:.1f} MB) - {description}")
        else:
            print(f"   ❌ {filename} - {description} (not built)")

def main():
    """Main function"""
    print_banner()
    
    # Check prerequisites
    print("\n🔍 Checking prerequisites...")
    
    if not check_python_version():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    if not check_required_files():
        print("\n💡 After downloading the files, run this script again.")
        sys.exit(1)
    
    # Get user choice
    choice = get_user_choice()
    
    if choice == '5':
        print("\n👋 Goodbye!")
        sys.exit(0)
    
    # Run the build
    start_time = time.time()
    success = run_build_command(choice)
    end_time = time.time()
    
    if success:
        print(f"\n⏱️  Build completed in {(end_time - start_time) / 60:.1f} minutes")
        show_next_steps()
    else:
        print("\n❌ Build failed. Check the error messages above.")
        print("💡 For help, check COMPREHENSIVE_README.md or the troubleshooting section.")

if __name__ == "__main__":
    main() 