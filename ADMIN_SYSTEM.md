# Admin System Documentation

## Overview

The FakeUser Manager now includes a comprehensive admin system with role-based access control, user management, and activity logging.

## User Roles

### RootUser
- **Automatically assigned** to the first user who signs up
- Full system access
- Can manage all users, roles, and permissions
- Can view and modify all data
- Can assign/change any user's role

### AdminUser
- Can view all users
- Can update CustomerUser accounts (status, display name)
- Cannot change roles
- Can manage teams, fake users, and tags
- Can view activity logs

### CustomerUser
- Default role for new users
- Can only view their own profile
- Can create, read, update, and delete their own fake users
- Can view tags within their teams
- Limited access to system features

## Features

### User Management
- **View All Users**: List all users in the system with their roles and status
- **Edit Users**: Update user profiles (display name, status)
- **Change Roles**: RootUser can promote/demote users
- **User Status**: Mark users as active, suspended, or deleted
- **Search**: Filter users by email or name

### Activity Logging
- All user actions are automatically logged
- Tracked actions include:
  - User created
  - User updated
  - User deleted
  - Role changed
  - Login/logout events
- Logs include:
  - User who performed the action
  - Timestamp
  - Resource type and ID
  - Additional details (JSON)
  - IP address (when available)

### Permissions System
- Role-based permissions control access to resources
- Permissions defined for actions: create, read, update, delete, manage
- Resources include: users, roles, permissions, teams, fake_users, tags

## Database Schema

### Tables
- `user_roles`: Stores user role assignments
- `permissions`: Defines role-based permissions
- `activity_logs`: Records all system activities
- `user_profiles`: Extended user information

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access authorized data
- RootUser has unrestricted access
- AdminUser has limited administrative access
- CustomerUser has restricted access to own data

## Usage

### Accessing Admin Panel
1. Sign in to the application
2. If you're a RootUser or AdminUser, you'll see an "Admin" tab
3. Click the Admin tab to access user management and activity logs

### Managing Users
1. Go to Admin > Users
2. Search for a user or browse the list
3. Click "Edit" on any user you have permission to modify
4. Update their display name, status, or role (RootUser only)
5. Save changes

### Viewing Activity Logs
1. Go to Admin > Activity Log
2. View recent system activities
3. Click "View details" to see additional information
4. Use the Refresh button to reload logs

## First User Setup

When you first deploy the application:
1. Sign up with your admin email
2. You will automatically be assigned the RootUser role
3. You can then invite other users
4. Promote trusted users to AdminUser if needed

## Security Best Practices

1. **Protect RootUser access**: Only assign RootUser to highly trusted individuals
2. **Use AdminUser for delegation**: Create AdminUser accounts for team leads
3. **Monitor activity logs**: Regularly review logs for suspicious activity
4. **Suspend compromised accounts**: Use the "suspended" status to temporarily disable accounts
5. **Never delete the RootUser**: Always maintain at least one RootUser account

## API Functions

The following functions are available in `/src/lib/supabase.js`:

- `getUserRole(userId)` - Get a user's role
- `getAllUsers()` - List all users (admin only)
- `updateUserProfile(userId, updates)` - Update user profile
- `updateUserRole(userId, newRole)` - Change user role (RootUser only)
- `deleteUser(userId)` - Soft delete a user
- `getActivityLogs(limit)` - Get recent activity logs
- `getUserActivityLogs(userId, limit)` - Get logs for specific user
- `logActivity(action, resourceType, resourceId, details)` - Log an activity

## Troubleshooting

### Can't see Admin tab
- Check your user role in the database
- Only RootUser and AdminUser can access admin features

### Can't edit a user
- RootUser can edit anyone
- AdminUser can only edit CustomerUser accounts
- No one can edit the RootUser except another RootUser

### Activity logs not showing
- Ensure you have RootUser or AdminUser role
- Check RLS policies are properly configured
- Verify the activity_logs table exists
