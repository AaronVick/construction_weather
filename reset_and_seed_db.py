#!/usr/bin/env python3
"""
Reset and Seed Firestore Database

This script clears all collections in Firestore except for the 'admins' collection,
and then creates sample user profiles and data for a basic user and a pro user.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
import datetime
import uuid
import random
from typing import Dict, List, Any, Optional

# Initialize Firebase Admin SDK
try:
    # Use the application default credentials
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass

db = firestore.client()

# Collection names to clear (excluding 'admins')
COLLECTIONS_TO_CLEAR = [
    'user_profiles',
    'clients',
    'jobsites',
    'workers',
    'worker_jobsites',
    'subscriptions',
    'billing_history',
    'email_logs',
    'email_templates',
    'weather_checks',
    'analytics_data',
    'system_settings'
]

# Sample user data
SAMPLE_USERS = [
    {
        'email': 'basic@example.com',
        'password': 'password123',
        'display_name': 'Basic User',
        'subscription_plan': 'basic'
    },
    {
        'email': 'premium@example.com',
        'password': 'password123',
        'display_name': 'Premium User',
        'subscription_plan': 'premium'
    }
]

# Sample client data
SAMPLE_CLIENTS = [
    {
        'name': 'Acme Construction',
        'email': 'contact@acmeconstruction.com',
        'phone': '555-123-4567',
        'company': 'Acme Construction Inc.',
        'address': '123 Main St',
        'city': 'Springfield',
        'state': 'IL',
        'zip_code': '62701',
        'is_active': True,
        'notes': 'Major commercial client'
    },
    {
        'name': 'Buildwell Contractors',
        'email': 'info@buildwell.com',
        'phone': '555-987-6543',
        'company': 'Buildwell Contractors LLC',
        'address': '456 Oak Ave',
        'city': 'Springfield',
        'state': 'IL',
        'zip_code': '62702',
        'is_active': True,
        'notes': 'Residential specialist'
    },
    {
        'name': 'Metro Development',
        'email': 'projects@metrodevelopment.com',
        'phone': '555-456-7890',
        'company': 'Metro Development Group',
        'address': '789 Broadway',
        'city': 'Springfield',
        'state': 'IL',
        'zip_code': '62703',
        'is_active': False,
        'notes': 'On hold until next fiscal year'
    }
]

# Sample worker data
SAMPLE_WORKERS = [
    {
        'name': 'John Smith',
        'email': 'john.smith@example.com',
        'phone': '555-111-2222',
        'position': 'Foreman',
        'is_active': True,
        'emergency_contact': {
            'name': 'Jane Smith',
            'relationship': 'Spouse',
            'phone': '555-222-3333'
        },
        'notes': 'Certified crane operator'
    },
    {
        'name': 'Maria Garcia',
        'email': 'maria.garcia@example.com',
        'phone': '555-333-4444',
        'position': 'Project Manager',
        'is_active': True,
        'emergency_contact': {
            'name': 'Carlos Garcia',
            'relationship': 'Brother',
            'phone': '555-444-5555'
        },
        'notes': 'Bilingual (English/Spanish)'
    },
    {
        'name': 'Robert Johnson',
        'email': 'robert.johnson@example.com',
        'phone': '555-555-6666',
        'position': 'Equipment Operator',
        'is_active': False,
        'emergency_contact': {
            'name': 'Susan Johnson',
            'relationship': 'Mother',
            'phone': '555-666-7777'
        },
        'notes': 'On medical leave until 2025-05-01'
    }
]

# Sample weather monitoring settings
SAMPLE_WEATHER_MONITORING = {
    'isEnabled': True,
    'checkTime': '06:00',
    'alertThresholds': {
        'rain': {
            'enabled': True,
            'thresholdPercentage': 50
        },
        'snow': {
            'enabled': True,
            'thresholdInches': 2
        },
        'wind': {
            'enabled': True,
            'thresholdMph': 25
        },
        'temperature': {
            'enabled': True,
            'thresholdFahrenheit': 32
        }
    },
    'notificationSettings': {
        'notifyClient': True,
        'notifyWorkers': True,
        'notificationLeadHours': 12
    }
}

# Subscription features by plan
SUBSCRIPTION_FEATURES = {
    'basic': {
        'maxJobsites': 5,
        'maxEmailTemplates': 3,
        'advancedAnalytics': False,
        'customEmails': False,
        'prioritySupport': False,
        'smsNotifications': False,
        'customReports': False,
        'apiAccess': False,
        'whiteLabeling': False,
        'singleSignOn': False
    },
    'premium': {
        'maxJobsites': 20,
        'maxEmailTemplates': 10,
        'advancedAnalytics': True,
        'customEmails': True,
        'prioritySupport': True,
        'smsNotifications': True,
        'customReports': True,
        'apiAccess': False,
        'whiteLabeling': False,
        'singleSignOn': False
    },
    'enterprise': {
        'maxJobsites': 100,
        'maxEmailTemplates': 50,
        'advancedAnalytics': True,
        'customEmails': True,
        'prioritySupport': True,
        'smsNotifications': True,
        'customReports': True,
        'apiAccess': True,
        'whiteLabeling': True,
        'singleSignOn': True
    }
}

def clear_collections():
    """Clear all collections except 'admins'"""
    print("Clearing collections...")
    
    for collection_name in COLLECTIONS_TO_CLEAR:
        try:
            # Get all documents in the collection
            docs = db.collection(collection_name).stream()
            
            # Delete each document
            for doc in docs:
                doc.reference.delete()
                
            print(f"Cleared collection: {collection_name}")
        except Exception as e:
            print(f"Error clearing collection {collection_name}: {e}")
    
    print("Collections cleared successfully")

def create_firebase_user(email: str, password: str, display_name: str) -> str:
    """Create a Firebase Authentication user and return the UID"""
    try:
        # Check if user already exists
        try:
            user = auth.get_user_by_email(email)
            print(f"User {email} already exists with UID: {user.uid}")
            return user.uid
        except:
            # User doesn't exist, create a new one
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            print(f"Created new user {email} with UID: {user.uid}")
            return user.uid
    except Exception as e:
        print(f"Error creating user {email}: {e}")
        raise

def create_user_profile(uid: str, data: Dict[str, Any]):
    """Create a user profile document"""
    try:
        profile_data = {
            'email': data['email'],
            'display_name': data['display_name'],
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        db.collection('user_profiles').document(uid).set(profile_data)
        print(f"Created user profile for {data['email']}")
    except Exception as e:
        print(f"Error creating user profile for {data['email']}: {e}")

def create_subscription(uid: str, plan: str):
    """Create a subscription document for a user"""
    try:
        # Generate a random subscription ID
        subscription_id = str(uuid.uuid4())
        
        # Calculate dates
        now = datetime.datetime.now()
        next_year = now + datetime.timedelta(days=365)
        
        subscription_data = {
            'id': subscription_id,
            'user_id': uid,
            'plan': plan,
            'status': 'active',
            'billing_cycle': 'monthly',
            'price_id': f'price_{plan}_monthly',
            'customer_id': f'cus_{uid[:8]}',
            'start_date': now.isoformat(),
            'end_date': None,
            'trial_end': None,
            'next_billing_date': (now + datetime.timedelta(days=30)).isoformat(),
            'cancellation_date': None,
            'payment_method': {
                'brand': 'visa',
                'last4': '4242',
                'expMonth': 12,
                'expYear': 2030
            },
            'features': SUBSCRIPTION_FEATURES[plan],
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'currentPeriodEnd': next_year.isoformat()
        }
        
        db.collection('subscriptions').document(subscription_id).set(subscription_data)
        print(f"Created {plan} subscription for user {uid}")
        
        # Create billing history
        create_billing_history(uid, subscription_id, plan)
        
        return subscription_id
    except Exception as e:
        print(f"Error creating subscription for user {uid}: {e}")

def create_billing_history(uid: str, subscription_id: str, plan: str):
    """Create billing history for a user"""
    try:
        # Determine price based on plan
        prices = {
            'basic': 29.99,
            'premium': 59.99,
            'enterprise': 199.99
        }
        
        # Create 3 billing history items
        for i in range(3):
            history_id = str(uuid.uuid4())
            date = datetime.datetime.now() - datetime.timedelta(days=30 * i)
            
            history_data = {
                'id': history_id,
                'user_id': uid,
                'subscription_id': subscription_id,
                'date': date.isoformat(),
                'description': f"{plan.capitalize()} Plan - Monthly",
                'amount': prices.get(plan, 0),
                'status': 'paid',
                'invoice': f'inv_{date.strftime("%Y%m%d")}_{uid[:6]}',
                'invoiceUrl': f'https://dashboard.stripe.com/invoices/inv_{date.strftime("%Y%m%d")}_{uid[:6]}',
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('billing_history').document(history_id).set(history_data)
        
        print(f"Created billing history for user {uid}")
    except Exception as e:
        print(f"Error creating billing history for user {uid}: {e}")

def create_clients(uid: str, num_clients: int = 3) -> List[str]:
    """Create sample clients for a user and return their IDs"""
    client_ids = []
    try:
        for i in range(min(num_clients, len(SAMPLE_CLIENTS))):
            client_id = str(uuid.uuid4())
            client_data = {
                **SAMPLE_CLIENTS[i],
                'user_id': uid,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('clients').document(client_id).set(client_data)
            client_ids.append(client_id)
        
        print(f"Created {len(client_ids)} clients for user {uid}")
        return client_ids
    except Exception as e:
        print(f"Error creating clients for user {uid}: {e}")
        return client_ids

def create_workers(uid: str, num_workers: int = 3) -> List[str]:
    """Create sample workers for a user and return their IDs"""
    worker_ids = []
    try:
        for i in range(min(num_workers, len(SAMPLE_WORKERS))):
            worker_id = str(uuid.uuid4())
            worker_data = {
                **SAMPLE_WORKERS[i],
                'user_id': uid,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('workers').document(worker_id).set(worker_data)
            worker_ids.append(worker_id)
        
        print(f"Created {len(worker_ids)} workers for user {uid}")
        return worker_ids
    except Exception as e:
        print(f"Error creating workers for user {uid}: {e}")
        return worker_ids

def create_jobsites(uid: str, client_ids: List[str], worker_ids: List[str], max_jobsites: int = 5) -> List[str]:
    """Create sample jobsites for a user and return their IDs"""
    jobsite_ids = []
    try:
        # Create a random number of jobsites up to max_jobsites
        num_jobsites = min(max_jobsites, len(client_ids) * 2)
        
        for i in range(num_jobsites):
            jobsite_id = str(uuid.uuid4())
            client_id = random.choice(client_ids)
            
            # Generate a random address
            street_number = random.randint(100, 999)
            streets = ['Main St', 'Oak Ave', 'Maple Rd', 'Washington Blvd', 'Park Lane']
            cities = ['Springfield', 'Riverdale', 'Oakville', 'Maplewood', 'Centerville']
            states = ['IL', 'NY', 'CA', 'TX', 'FL']
            zip_codes = ['62701', '10001', '90210', '77001', '33101']
            
            jobsite_data = {
                'name': f"Project Site {i+1}",
                'client_id': client_id,
                'address': f"{street_number} {random.choice(streets)}",
                'city': random.choice(cities),
                'state': random.choice(states),
                'zip_code': random.choice(zip_codes),
                'is_active': random.choice([True, True, False]),  # 2/3 chance of being active
                'weather_monitoring': SAMPLE_WEATHER_MONITORING if random.random() > 0.5 else {'isEnabled': False},
                'notes': f"Sample jobsite {i+1}",
                'user_id': uid,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('jobsites').document(jobsite_id).set(jobsite_data)
            jobsite_ids.append(jobsite_id)
            
            # Assign some workers to this jobsite
            if worker_ids:
                num_workers = random.randint(1, min(3, len(worker_ids)))
                assigned_workers = random.sample(worker_ids, num_workers)
                
                for worker_id in assigned_workers:
                    relation_id = str(uuid.uuid4())
                    relation_data = {
                        'worker_id': worker_id,
                        'jobsite_id': jobsite_id,
                        'user_id': uid,
                        'created_at': firestore.SERVER_TIMESTAMP
                    }
                    
                    db.collection('worker_jobsites').document(relation_id).set(relation_data)
        
        print(f"Created {len(jobsite_ids)} jobsites for user {uid}")
        return jobsite_ids
    except Exception as e:
        print(f"Error creating jobsites for user {uid}: {e}")
        return jobsite_ids

def create_email_templates(uid: str, num_templates: int = 3):
    """Create sample email templates for a user"""
    try:
        templates = [
            {
                'name': 'Weather Alert',
                'subject': 'Weather Alert: {{jobsite_name}}',
                'body': '''
                <p>Dear {{client_name}},</p>
                <p>This is to inform you that there is a weather alert for your jobsite at {{jobsite_address}}.</p>
                <p>Weather Condition: {{weather_condition}}</p>
                <p>Expected Impact: {{impact_description}}</p>
                <p>Recommended Action: {{recommended_action}}</p>
                <p>Please contact us if you have any questions.</p>
                <p>Regards,<br>{{user_name}}</p>
                '''
            },
            {
                'name': 'Project Update',
                'subject': 'Project Update: {{jobsite_name}}',
                'body': '''
                <p>Dear {{client_name}},</p>
                <p>Here is the latest update on your project at {{jobsite_address}}:</p>
                <p>Current Status: {{project_status}}</p>
                <p>Completed Tasks:</p>
                <ul>
                    <li>{{completed_task_1}}</li>
                    <li>{{completed_task_2}}</li>
                </ul>
                <p>Upcoming Tasks:</p>
                <ul>
                    <li>{{upcoming_task_1}}</li>
                    <li>{{upcoming_task_2}}</li>
                </ul>
                <p>Please let me know if you have any questions.</p>
                <p>Regards,<br>{{user_name}}</p>
                '''
            },
            {
                'name': 'Invoice',
                'subject': 'Invoice #{{invoice_number}} for {{jobsite_name}}',
                'body': '''
                <p>Dear {{client_name}},</p>
                <p>Please find attached invoice #{{invoice_number}} for the work completed at {{jobsite_address}}.</p>
                <p>Invoice Amount: ${{invoice_amount}}</p>
                <p>Due Date: {{due_date}}</p>
                <p>Payment Methods:</p>
                <ul>
                    <li>Credit Card: Visit our payment portal at {{payment_link}}</li>
                    <li>Check: Mail to our office address</li>
                </ul>
                <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                <p>Regards,<br>{{user_name}}</p>
                '''
            }
        ]
        
        for i in range(min(num_templates, len(templates))):
            template_id = str(uuid.uuid4())
            template_data = {
                **templates[i],
                'user_id': uid,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('email_templates').document(template_id).set(template_data)
        
        print(f"Created {min(num_templates, len(templates))} email templates for user {uid}")
    except Exception as e:
        print(f"Error creating email templates for user {uid}: {e}")

def create_email_logs(uid: str, client_ids: List[str], jobsite_ids: List[str], num_logs: int = 5):
    """Create sample email logs for a user"""
    try:
        if not client_ids or not jobsite_ids:
            return
            
        for i in range(num_logs):
            log_id = str(uuid.uuid4())
            client_id = random.choice(client_ids)
            jobsite_id = random.choice(jobsite_ids)
            
            # Get random dates within the last 30 days
            days_ago = random.randint(0, 30)
            sent_date = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            subjects = [
                'Weather Alert: High Winds Expected',
                'Project Update: Phase 1 Complete',
                'Invoice #12345 for Your Project',
                'Schedule Change: Construction Delayed',
                'Material Delivery Confirmation'
            ]
            
            statuses = ['sent', 'delivered', 'opened', 'clicked', 'bounced']
            weights = [0.6, 0.2, 0.1, 0.05, 0.05]  # Probabilities for each status
            
            log_data = {
                'user_id': uid,
                'client_id': client_id,
                'jobsite_id': jobsite_id,
                'subject': random.choice(subjects),
                'sent_at': sent_date.isoformat(),
                'status': random.choices(statuses, weights=weights)[0],
                'recipient': f"client{client_id[-4:]}@example.com",
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('email_logs').document(log_id).set(log_data)
        
        print(f"Created {num_logs} email logs for user {uid}")
    except Exception as e:
        print(f"Error creating email logs for user {uid}: {e}")

def create_weather_checks(uid: str, jobsite_ids: List[str], num_checks: int = 10):
    """Create sample weather checks for a user"""
    try:
        if not jobsite_ids:
            return
            
        weather_conditions = [
            {'condition': 'clear', 'temperature': 75, 'wind_speed': 5, 'precipitation': 0},
            {'condition': 'partly_cloudy', 'temperature': 68, 'wind_speed': 10, 'precipitation': 0},
            {'condition': 'cloudy', 'temperature': 62, 'wind_speed': 15, 'precipitation': 0},
            {'condition': 'rain', 'temperature': 58, 'wind_speed': 20, 'precipitation': 0.5},
            {'condition': 'heavy_rain', 'temperature': 52, 'wind_speed': 25, 'precipitation': 2.0},
            {'condition': 'snow', 'temperature': 28, 'wind_speed': 15, 'precipitation': 1.0},
            {'condition': 'storm', 'temperature': 65, 'wind_speed': 35, 'precipitation': 3.0}
        ]
        
        for i in range(num_checks):
            check_id = str(uuid.uuid4())
            jobsite_id = random.choice(jobsite_ids)
            
            # Get random dates within the last 30 days
            days_ago = random.randint(0, 30)
            check_date = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            weather = random.choice(weather_conditions)
            
            # Determine if alert was triggered
            alert_triggered = (
                (weather['condition'] in ['rain', 'heavy_rain'] and weather['precipitation'] > 0.5) or
                (weather['condition'] == 'snow' and weather['precipitation'] > 0.5) or
                (weather['wind_speed'] > 25) or
                (weather['temperature'] < 32)
            )
            
            check_data = {
                'user_id': uid,
                'jobsite_id': jobsite_id,
                'check_date': check_date.isoformat(),
                'weather_condition': weather['condition'],
                'temperature': weather['temperature'],
                'wind_speed': weather['wind_speed'],
                'precipitation': weather['precipitation'],
                'alert_triggered': alert_triggered,
                'notifications_sent': alert_triggered,
                'created_at': firestore.SERVER_TIMESTAMP
            }
            
            db.collection('weather_checks').document(check_id).set(check_data)
        
        print(f"Created {num_checks} weather checks for user {uid}")
    except Exception as e:
        print(f"Error creating weather checks for user {uid}: {e}")

def seed_user_data(user_data: Dict[str, Any]):
    """Create a user and all associated data"""
    try:
        # Create Firebase Auth user
        uid = create_firebase_user(
            user_data['email'], 
            user_data['password'], 
            user_data['display_name']
        )
        
        # Create user profile
        create_user_profile(uid, user_data)
        
        # Create subscription
        create_subscription(uid, user_data['subscription_plan'])
        
        # Create clients
        client_ids = create_clients(uid, 3)
        
        # Create workers
        worker_ids = create_workers(uid, 3)
        
        # Create jobsites (with worker assignments)
        max_jobsites = SUBSCRIPTION_FEATURES[user_data['subscription_plan']]['maxJobsites']
        jobsite_ids = create_jobsites(uid, client_ids, worker_ids, max_jobsites)
        
        # Create email templates
        max_templates = SUBSCRIPTION_FEATURES[user_data['subscription_plan']]['maxEmailTemplates']
        create_email_templates(uid, max_templates)
        
        # Create email logs
        create_email_logs(uid, client_ids, jobsite_ids, 5)
        
        # Create weather checks
        create_weather_checks(uid, jobsite_ids, 10)
        
        print(f"Successfully seeded data for user {user_data['email']}")
    except Exception as e:
        print(f"Error seeding data for user {user_data['email']}: {e}")

def main():
    """Main function to clear and seed the database"""
    print("Starting database reset and seed process...")
    
    # Clear all collections except 'admins'
    clear_collections()
    
    # Seed data for each sample user
    for user_data in SAMPLE_USERS:
        seed_user_data(user_data)
    
    print("Database reset and seed process completed successfully")

if __name__ == "__main__":
    main()
