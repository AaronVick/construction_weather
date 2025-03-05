# Database Reset and Seed Script

This directory contains a script to reset and seed the Firestore database for the Construction Weather application.

## Overview

The `reset_and_seed_db.py` script performs the following operations:

1. Clears all collections in Firestore **EXCEPT** for the `admins` collection
2. Creates sample user profiles for a basic user and a premium user
3. Creates sample data for these users including:
   - Clients
   - Workers
   - Jobsites
   - Worker-Jobsite assignments
   - Subscriptions
   - Billing history
   - Email templates
   - Email logs
   - Weather checks

## Prerequisites

- Python 3.6 or higher
- Firebase Admin SDK
- A valid `serviceAccountKey.json` file in the project root directory

## Installation

1. Make sure you have the required Python packages installed:

```bash
pip install firebase-admin
```

2. Ensure you have a valid `serviceAccountKey.json` file in the project root directory. This file contains the credentials needed to access your Firebase project.

## Usage

Run the script from the project root directory:

```bash
python scripts/reset_and_seed_db.py
```

## Sample Users

The script creates two sample users:

1. **Basic User**
   - Email: `basic@example.com`
   - Password: `password123`
   - Subscription: Basic plan

2. **Premium User**
   - Email: `premium@example.com`
   - Password: `password123`
   - Subscription: Premium plan

You can use these credentials to log in to the application and test the different subscription tiers.

## Data Structure

The script creates the following data for each user:

- **User Profile**: Basic user information
- **Subscription**: Active subscription with appropriate features based on the plan
- **Clients**: 3 sample clients with varying details
- **Workers**: 3 sample workers with varying details
- **Jobsites**: Multiple jobsites (number depends on subscription plan)
- **Worker-Jobsite Assignments**: Random assignments of workers to jobsites
- **Email Templates**: Sample email templates (number depends on subscription plan)
- **Email Logs**: Sample email logs showing communication history
- **Weather Checks**: Sample weather check records with varying conditions

## Customization

You can modify the script to change the sample data or add more collections as needed:

- Edit the `SAMPLE_USERS` array to change user details
- Edit the `SAMPLE_CLIENTS` array to change client details
- Edit the `SAMPLE_WORKERS` array to change worker details
- Edit the `SUBSCRIPTION_FEATURES` dictionary to change plan features
- Add more collections to the `COLLECTIONS_TO_CLEAR` array if needed

## Warning

This script will delete all data in the specified collections. Make sure you have a backup of any important data before running it.

## Troubleshooting

If you encounter any issues:

1. Check that your `serviceAccountKey.json` file is valid and has the necessary permissions
2. Ensure you're running the script from the project root directory
3. Check the Firebase console to verify that the collections were cleared and new data was created
4. Look for error messages in the console output for specific issues
