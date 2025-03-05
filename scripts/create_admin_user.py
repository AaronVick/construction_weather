#!/usr/bin/env python3
# scripts/create_admin_user.py

import json
import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
import getpass

def main():
    """
    Main function to create an admin user in Firebase
    """
    print("=== Create Admin User ===")
    
    # Initialize Firebase Admin SDK
    try:
        # Load service account key
        service_account_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'serviceAccountKey.json')
        
        if not os.path.exists(service_account_path):
            print(f"Error: Service account key file not found at {service_account_path}")
            print("Please download your service account key from the Firebase console and save it as 'serviceAccountKey.json' in the project root directory.")
            return
        
        cred = credentials.Certificate(service_account_path)
        
        # Check if already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        # Get Firestore and Auth instances
        db = firestore.client()
        
        # Get user input
        email = input("Enter admin email: ")
        password = getpass.getpass("Enter admin password (min 6 characters): ")
        first_name = input("Enter admin first name (optional): ")
        last_name = input("Enter admin last name (optional): ")
        
        # Check if user already exists in Firebase Auth
        try:
            user = auth.get_user_by_email(email)
            uid = user.uid
            print(f"User already exists with UID: {uid}")
        except auth.UserNotFoundError:
            # User doesn't exist, create a new one
            user = auth.create_user(
                email=email,
                password=password,
                display_name=f"{first_name} {last_name}".strip()
            )
            uid = user.uid
            print(f"Created new user with UID: {uid}")
        except Exception as e:
            print(f"Error checking/creating user: {e}")
            return
        
        # Check if user is already an admin
        admin_ref = db.collection('admins').where('email', '==', email)
        admin_docs = admin_ref.get()
        
        if len(admin_docs) > 0:
            print("User is already an admin. Updating permissions...")
            
            # Update existing admin
            admin_doc = admin_docs[0]
            admin_doc.reference.update({
                'firstName': first_name or admin_doc.get('firstName') or '',
                'lastName': last_name or admin_doc.get('lastName') or '',
                'role': 'super_admin',
                'permissions': [
                    'manage_users',
                    'manage_subscriptions',
                    'view_analytics',
                    'manage_billing',
                    'manage_settings',
                    'manage_admins',
                    'support_access'
                ],
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            print(f"Admin user updated: {email}")
        else:
            # Create new admin document
            db.collection('admins').document(uid).set({
                'email': email,
                'firstName': first_name or '',
                'lastName': last_name or '',
                'role': 'super_admin',
                'permissions': [
                    'manage_users',
                    'manage_subscriptions',
                    'view_analytics',
                    'manage_billing',
                    'manage_settings',
                    'manage_admins',
                    'support_access'
                ],
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            print(f"Admin user created: {email}")
        
        print("\nAdmin user setup complete!")
        print(f"You can now log in with email: {email} and the provided password.")
        print("Visit /admin/dashboard to access the admin area.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
