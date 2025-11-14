#!/usr/bin/env python3
"""
Test script to verify the UC Merced Enrollment System setup
"""

import sys
import os

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    try:
        import flask
        print("Flask imported successfully")
        
        import flask_sqlalchemy
        print("Flask-SQLAlchemy imported successfully")
        
        import flask_admin
        print("Flask-Admin imported successfully")
        
        return True
    except ImportError as e:
        print(f"Import error: {e}")
        return False

def test_app_creation():
    """Test if the Flask app can be created"""
    print("\nTesting app creation...")
    try:
        from app import app, db, User, Course, Enrollment
        
        with app.app_context():
            # Test database connection
            db.create_all()
            print("Database tables created successfully")
            
            # Test sample data
            user_count = User.query.count()
            course_count = Course.query.count()
            enrollment_count = Enrollment.query.count()
            
            print(f"Found {user_count} users in database")
            print(f"Found {course_count} courses in database")
            print(f"Found {enrollment_count} enrollments in database")
            
            if user_count > 0 and course_count > 0:
                print("Sample data appears to be loaded correctly")
                return True
            else:
                print("No sample data found - this is normal for first run")
                return True
                
    except Exception as e:
        print(f"App creation error: {e}")
        return False

def test_demo_accounts():
    """Test if demo accounts exist"""
    print("\nTesting demo accounts...")
    try:
        from app import app, db, User
        
        with app.app_context():
            # Check for demo accounts
            demo_users = {
                'cnorris': 'student',
                'ahepworth': 'teacher', 
                'admin': 'admin'
            }
            
            for username, expected_role in demo_users.items():
                user = User.query.filter_by(username=username).first()
                if user:
                    if user.role == expected_role:
                        print(f"Demo account '{username}' ({expected_role}) found")
                    else:
                        print(f"Demo account '{username}' has unexpected role: {user.role}")
                else:
                    print(f"Demo account '{username}' not found")
                    
    except Exception as e:
        print(f"Demo account test error: {e}")

def main():
    """Run all tests"""
    print("🎓 UC Merced Enrollment System - Setup Test")
    print("=" * 50)
    
    success = True
    
    # Test imports
    if not test_imports():
        success = False
    
    # Test app creation
    if not test_app_creation():
        success = False
    
    # Test demo accounts
    test_demo_accounts()
    
    print("\n" + "=" * 50)
    if success:
        print("All tests passed! The application is ready to run.")
        print("\nTo start the server, run:")
        print("  python3 app.py")
        print("\nOr use the startup script:")
        print("  ./start_server.sh")
        print("\nThen open your browser to: http://localhost:5001")
    else:
        print("Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
