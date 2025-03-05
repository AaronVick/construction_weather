# Admin System Guide

This guide explains how to use and manage the admin system for the Construction Weather application.

## Overview

The admin system provides a separate interface for administrators to manage users, subscriptions, billing, and system settings. It is completely separate from the user dashboard and has its own authentication flow.

## Admin Authentication

Admins are authenticated using Firebase Authentication, but with an additional check against the `admins` collection in Firestore. This ensures that only users with admin privileges can access the admin dashboard.

### Admin Roles and Permissions

The system supports different admin roles with varying levels of permissions:

- **super_admin**: Has all permissions, including managing other admins
- **admin**: Can manage users, billing, content, and view analytics
- **billing_admin**: Can manage billing and view analytics
- **content_admin**: Can only manage content

## Adding Admin Users

To add a new admin user, you can use the provided script:

```bash
# First, make sure the user has a Firebase Authentication account
# Then, add them as an admin using the script
node scripts/add-admin-user.js <email> <firstName> <lastName> <role>
```

For example:
```bash
node scripts/add-admin-user.js admin@example.com John Doe super_admin
```

You can also run the script without arguments for an interactive prompt:
```bash
node scripts/add-admin-user.js
```

## Accessing the Admin Dashboard

1. Navigate to `/admin/login` in your browser
2. Log in with your admin credentials (email and password)
3. If authentication is successful, you'll be redirected to the admin dashboard

## Admin Pages

The admin dashboard includes the following pages:

- **Dashboard**: Overview of key metrics and system status
- **User Profiles**: Management of user accounts and profiles
- **Subscriptions**: Subscription plan management and analytics
- **Billing**: Financial transaction history and revenue tracking
- **Revenue**: Detailed revenue analytics and reporting
- **Reports**: Customizable report generation
- **Settings**: System configuration and preferences

## Firestore Security Rules

The application uses Firestore Security Rules to protect admin resources. These rules ensure that:

1. Regular users can only access their own data
2. Admins can access all data based on their permissions
3. Only super_admins can manage other admins

The security rules are defined in `firestore.rules`.

## Troubleshooting

### Admin Login Issues

If you're having trouble logging in to the admin dashboard:

1. Make sure the user exists in Firebase Authentication
2. Check that the user's email is in the `admins` collection in Firestore
3. Verify that the Firestore security rules are properly deployed
4. Check the browser console for any error messages

### Missing Permissions

If you can log in but can't access certain features:

1. Check the user's role and permissions in the `admins` collection
2. Make sure the user has the required permissions for the action they're trying to perform
3. If necessary, have a super_admin update your permissions

## Development

When developing new admin features:

1. Use the `AdminProtectedRoute` component to protect admin routes
2. Check permissions in service functions using the `getCurrentAdmin` function
3. Add new permissions to the appropriate roles in the `add-admin-user.js` script
4. Update the Firestore security rules if necessary
