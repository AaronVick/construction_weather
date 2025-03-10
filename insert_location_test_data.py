#!/usr/bin/env python3
"""
Script to insert test data for user profiles and jobsites with location data.
This script adds latitude and longitude coordinates to existing user profiles and jobsites.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import random
import sys
import os
from datetime import datetime, timedelta

# Initialize Firebase Admin SDK
# You need to provide a service account key file
SERVICE_ACCOUNT_KEY = 'serviceAccountKey.json'

# Test user IDs - replace with actual user IDs from your system
TEST_USERS = {
    'basic': 'CIv3qKZ6KMa2kSxWloAaZBfau8I2',  # Basic user
    'premium': 'Sd9Vike74UVRBLjUI0cBTNr0Nd22',  # Replace with a premium user ID
    'enterprise': 'enterprise-user-id'  # Replace with an enterprise user ID
}

# Sample ZIP codes with their coordinates
ZIP_CODES = {
    '10001': {'city': 'New York', 'state': 'NY', 'lat': 40.7501, 'lng': -73.9964},
    '90210': {'city': 'Beverly Hills', 'state': 'CA', 'lat': 34.0901, 'lng': -118.4065},
    '60601': {'city': 'Chicago', 'state': 'IL', 'lat': 41.8855, 'lng': -87.6217},
    '33139': {'city': 'Miami Beach', 'state': 'FL', 'lat': 25.7903, 'lng': -80.1303},
    '98101': {'city': 'Seattle', 'state': 'WA', 'lat': 47.6101, 'lng': -122.3421},
    '02108': {'city': 'Boston', 'state': 'MA', 'lat': 42.3582, 'lng': -71.0637},
    '75201': {'city': 'Dallas', 'state': 'TX', 'lat': 32.7864, 'lng': -96.7970},
    '80202': {'city': 'Denver', 'state': 'CO', 'lat': 39.7525, 'lng': -104.9995},
    '94102': {'city': 'San Francisco', 'state': 'CA', 'lat': 37.7749, 'lng': -122.4194},
    '20001': {'city': 'Washington', 'state': 'DC', 'lat': 38.9072, 'lng': -77.0369}
}

# Sample jobsite names
JOBSITE_NAMES = [
    'Downtown Office Tower',
    'Riverside Apartments',
    'Highland Park Residences',
    'Metro Station Renovation',
    'Westside Shopping Center',
    'Harbor View Hotel',
    'Eastside Medical Center',
    'University Campus Expansion',
    'Industrial Park Warehouse',
    'Central Park Pavilion'
]

# Sample client names
CLIENT_NAMES = [
    'Acme Construction Co.',
    'BuildRight Developers',
    'Cornerstone Properties',
    'Diamond Builders',
    'Elite Construction Group',
    'Frontier Development',
    'Global Infrastructure Partners',
    'Heritage Construction',
    'Innovative Building Solutions',
    'Johnson & Associates'
]

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize the app
        try:
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            sys.exit(1)
    
    return firestore.client()

def update_user_profile(db, user_id, zip_code):
    """Update a user profile with location data"""
    if zip_code not in ZIP_CODES:
        print(f"Invalid ZIP code: {zip_code}")
        return False
    
    location_data = ZIP_CODES[zip_code]
    
    try:
        # Get the user profile document
        user_ref = db.collection('user_profiles').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            print(f"User profile not found for ID: {user_id}")
            return False
        
        # Update the user profile with location data
        user_ref.update({
            'zip_code': zip_code,
            'latitude': location_data['lat'],
            'longitude': location_data['lng'],
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        print(f"Updated user profile {user_id} with ZIP code {zip_code} and coordinates")
        return True
    
    except Exception as e:
        print(f"Error updating user profile: {e}")
        return False

def create_client(db, user_id, name, zip_code):
    """Create a new client for a user"""
    if zip_code not in ZIP_CODES:
        print(f"Invalid ZIP code: {zip_code}")
        return None
    
    location_data = ZIP_CODES[zip_code]
    
    try:
        # Create a new client document
        client_data = {
            'name': name,
            'user_id': user_id,
            'email': f"contact@{name.lower().replace(' ', '').replace('&', 'and')}.com",
            'phone': f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            'company': name,
            'address': f"{random.randint(100, 9999)} Main St",
            'city': location_data['city'],
            'state': location_data['state'],
            'zip_code': zip_code,
            'is_active': True,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        client_ref = db.collection('clients').document()
        client_ref.set(client_data)
        
        print(f"Created client {name} for user {user_id}")
        return client_ref.id
    
    except Exception as e:
        print(f"Error creating client: {e}")
        return None

def create_jobsite(db, user_id, client_id, name, zip_code):
    """Create a new jobsite for a client"""
    if zip_code not in ZIP_CODES:
        print(f"Invalid ZIP code: {zip_code}")
        return False
    
    location_data = ZIP_CODES[zip_code]
    
    # Add some random variation to the coordinates to make jobsites in the same ZIP code distinct
    lat_offset = (random.random() - 0.5) * 0.02  # +/- 0.01 degrees (about 1 km)
    lng_offset = (random.random() - 0.5) * 0.02
    
    try:
        # Create weather monitoring settings
        weather_monitoring = {
            'isEnabled': True,
            'checkTime': f"{random.randint(5, 8):02d}:00",  # Early morning check (5-8 AM)
            'alertThresholds': {
                'rain': {
                    'enabled': True,
                    'thresholdPercentage': random.choice([30, 40, 50, 60, 70])
                },
                'snow': {
                    'enabled': True,
                    'thresholdInches': random.choice([0.5, 1, 2, 3])
                },
                'wind': {
                    'enabled': True,
                    'thresholdMph': random.choice([15, 20, 25, 30])
                },
                'temperature': {
                    'enabled': True,
                    'thresholdFahrenheit': random.choice([32, 28, 25, 20])
                }
            },
            'notificationSettings': {
                'notifyClient': True,
                'notifyWorkers': True,
                'notificationLeadHours': random.choice([8, 12, 24])
            }
        }
        
        # Create a new jobsite document
        jobsite_data = {
            'name': name,
            'client_id': client_id,
            'user_id': user_id,
            'address': f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple', 'Pine', 'Cedar'])} {random.choice(['St', 'Ave', 'Blvd', 'Dr'])}",
            'city': location_data['city'],
            'state': location_data['state'],
            'zip_code': zip_code,
            'latitude': location_data['lat'] + lat_offset,
            'longitude': location_data['lng'] + lng_offset,
            'is_active': True,
            'weather_monitoring': weather_monitoring,
            'notes': f"Test jobsite in {location_data['city']}, {location_data['state']}",
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        jobsite_ref = db.collection('jobsites').document()
        jobsite_ref.set(jobsite_data)
        
        print(f"Created jobsite {name} for client {client_id} in {location_data['city']}, {location_data['state']}")
        return True
    
    except Exception as e:
        print(f"Error creating jobsite: {e}")
        return False

def main():
    """Main function to insert test data"""
    print("Initializing Firebase...")
    db = initialize_firebase()
    
    print("\nUpdating user profiles with location data...")
    # Update user profiles with location data
    for user_type, user_id in TEST_USERS.items():
        # Assign different ZIP codes to different user types
        if user_type == 'basic':
            zip_code = '10001'  # New York
        elif user_type == 'premium':
            zip_code = '90210'  # Beverly Hills
        else:
            zip_code = '94102'  # San Francisco
        
        update_user_profile(db, user_id, zip_code)
    
    print("\nCreating clients and jobsites...")
    # Create clients and jobsites for each user
    for user_type, user_id in TEST_USERS.items():
        # Create 1-3 clients for each user
        num_clients = 1 if user_type == 'basic' else (2 if user_type == 'premium' else 3)
        
        for i in range(num_clients):
            client_name = random.choice(CLIENT_NAMES)
            CLIENT_NAMES.remove(client_name)  # Ensure unique client names
            
            # Choose a random ZIP code for the client
            client_zip = random.choice(list(ZIP_CODES.keys()))
            
            # Create the client
            client_id = create_client(db, user_id, client_name, client_zip)
            
            if client_id:
                # Create 1-5 jobsites for each client, depending on user type
                num_jobsites = 1 if user_type == 'basic' else (3 if user_type == 'premium' else 5)
                
                for j in range(num_jobsites):
                    if JOBSITE_NAMES:
                        jobsite_name = random.choice(JOBSITE_NAMES)
                        JOBSITE_NAMES.remove(jobsite_name)  # Ensure unique jobsite names
                    else:
                        jobsite_name = f"{client_name} Project {j+1}"
                    
                    # Choose a random ZIP code for the jobsite
                    jobsite_zip = random.choice(list(ZIP_CODES.keys()))
                    
                    # Create the jobsite
                    create_jobsite(db, user_id, client_id, jobsite_name, jobsite_zip)
    
    print("\nTest data insertion complete!")

if __name__ == "__main__":
    main()
