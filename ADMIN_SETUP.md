# Admin Setup Guide

This guide explains how to set up an admin user for the application and access the admin dashboard.

## Prerequisites

Before setting up an admin user, make sure you have:

1. Firebase project set up with Authentication and Firestore enabled
2. Service account key file (`serviceAccountKey.json`) in the root directory of the project
3. Python 3.6+ installed on your machine

## Creating an Admin User

We've provided a script to easily create an admin user. Follow these steps:

1. Make sure you have the Firebase service account key file (`serviceAccountKey.json`) in the root directory of your project. If you don't have it:
   - Go to your Firebase project console
   - Navigate to Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the file as `serviceAccountKey.json` in the root directory of your project

2. Install the required dependencies if you haven't already:
   ```bash
   pip install firebase-admin
   ```

3. Run the admin user creation script:
   ```bash
   python scripts/create_admin_user.py
   ```

4. Follow the prompts to enter:
   - Admin email address
   - Password (minimum 6 characters)
   - First name (optional)
   - Last name (optional)

5. The script will:
   - Create a new user in Firebase Authentication (if the user doesn't already exist)
   - Add the user to the 'admins' collection in Firestore with super_admin permissions
   - Confirm the successful creation of the admin user

## Accessing the Admin Dashboard

Once you've created an admin user, you can access the admin dashboard:

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the login page

3. Log in with the admin email and password you created

4. Navigate to `/admin/dashboard` to access the admin area

   You can also access specific admin sections directly:
   - `/admin/dashboard` - Main admin dashboard with analytics
   - `/admin/subscriptions` - Subscription management
   - `/admin/users` - User management (coming soon)
   - `/admin/billing` - Billing reports (coming soon)
   - `/admin/analytics` - Detailed analytics (coming soon)
   - `/admin/settings` - Admin settings (coming soon)

## Admin Features

As an admin, you have access to:

1. **Dashboard Analytics**:
   - Monthly Recurring Revenue (MRR)
   - Total users and growth rate
   - Conversion rate
   - Churn rate
   - Subscription plan distribution
   - Billing summary

2. **Subscription Management**:
   - View all subscriptions
   - Filter by status and plan
   - Search by user ID or customer ID
   - Pagination for large datasets

3. **User Management** (coming soon):
   - View all users
   - Filter and search users
   - Edit user details
   - Manage user permissions

4. **Billing Reports** (coming soon):
   - View all transactions
   - Generate revenue reports
   - Export billing data

## Admin Roles and Permissions

The system supports different admin roles with varying permissions:

- **super_admin**: Full access to all features
- **admin**: General administrative access
- **billing_admin**: Access to billing and subscription features
- **support_admin**: Access to user management and support features

Permissions include:
- manage_users
- manage_subscriptions
- view_analytics
- manage_billing
- manage_settings
- manage_admins
- support_access

By default, the script creates a super_admin with all permissions.

## Troubleshooting

If you encounter issues:

1. **Script errors**:
   - Make sure `serviceAccountKey.json` is in the root directory
   - Verify that the Firebase project has Authentication and Firestore enabled
   - Check that you have the necessary permissions in the Firebase project

2. **Access issues**:
   - Confirm you're logging in with the correct admin credentials
   - Check the Firestore database to ensure the user exists in the 'admins' collection
   - Verify that the user has the necessary permissions in the admin document

3. **Dashboard not loading**:
   - Check browser console for errors
   - Verify that the Firebase configuration in the application matches your Firebase project
