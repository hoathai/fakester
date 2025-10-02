/*
  # Admin System with Roles, Permissions, and Activity Logging

  ## Overview
  Creates a comprehensive admin system with role-based access control,
  permission management, and activity logging for user actions.

  ## 1. New Tables
    
    ### `user_roles`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - References auth.users
    - `role` (text) - Role name: 'RootUser', 'AdminUser', or 'CustomerUser'
    - `assigned_at` (timestamptz) - When role was assigned
    - `assigned_by` (uuid) - Who assigned the role
    
    ### `permissions`
    - `id` (uuid, primary key) - Unique identifier
    - `role` (text) - Role this permission applies to
    - `resource` (text) - What resource (e.g., 'users', 'teams', 'fake_users')
    - `action` (text) - What action (e.g., 'create', 'read', 'update', 'delete')
    - `created_at` (timestamptz) - Creation timestamp
    
    ### `activity_logs`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - Who performed the action
    - `action` (text) - Action performed (e.g., 'user_created', 'user_updated')
    - `resource_type` (text) - Type of resource affected
    - `resource_id` (uuid) - ID of the resource affected
    - `details` (jsonb) - Additional details about the action
    - `ip_address` (text) - IP address of the user
    - `created_at` (timestamptz) - When action occurred
    
    ### `user_profiles`
    - `id` (uuid, primary key) - References auth.users
    - `email` (text) - User's email
    - `display_name` (text) - User's display name
    - `status` (text) - Account status: 'active', 'suspended', 'deleted'
    - `created_at` (timestamptz) - Account creation time
    - `updated_at` (timestamptz) - Last update time
    - `last_login` (timestamptz) - Last login time

  ## 2. Security
    - Enable RLS on all new tables
    - RootUser can do everything
    - AdminUser can manage CustomerUser accounts
    - CustomerUser can only view their own data
    - Activity logs are read-only for non-root users

  ## 3. Functions
    - `get_user_role()` - Returns current user's role
    - `is_root_user()` - Checks if user is RootUser
    - `is_admin_or_root()` - Checks if user is AdminUser or RootUser
    - `assign_first_user_as_root()` - Trigger to make first user RootUser
    - `log_activity()` - Function to log user activities

  ## 4. Important Notes
    - First user to sign up automatically becomes RootUser
    - All user CRUD operations are logged
    - Roles are immutable once assigned (requires RootUser to change)
    - Activity logs cannot be deleted
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('RootUser', 'AdminUser', 'CustomerUser')),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource, action)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(check_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(user_role, 'CustomerUser');
END;
$$;

-- Helper function to check if user is root
CREATE OR REPLACE FUNCTION is_root_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role(auth.uid()) = 'RootUser';
END;
$$;

-- Helper function to check if user is admin or root
CREATE OR REPLACE FUNCTION is_admin_or_root()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_role(auth.uid());
  RETURN user_role IN ('RootUser', 'AdminUser');
END;
$$;

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$;

-- Trigger function to assign first user as RootUser
CREATE OR REPLACE FUNCTION assign_first_user_as_root()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users with roles
  SELECT COUNT(*) INTO user_count FROM user_roles;
  
  -- If this is the first user, make them RootUser
  IF user_count = 0 THEN
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'RootUser', NEW.id);
    
    INSERT INTO user_profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  ELSE
    -- Otherwise, assign CustomerUser role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'CustomerUser');
    
    INSERT INTO user_profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION assign_first_user_as_root();
  END IF;
END $$;

-- Insert default permissions
INSERT INTO permissions (role, resource, action) VALUES
  -- RootUser can do everything
  ('RootUser', 'users', 'manage'),
  ('RootUser', 'roles', 'manage'),
  ('RootUser', 'permissions', 'manage'),
  ('RootUser', 'teams', 'manage'),
  ('RootUser', 'fake_users', 'manage'),
  ('RootUser', 'tags', 'manage'),
  ('RootUser', 'activity_logs', 'read'),
  
  -- AdminUser permissions
  ('AdminUser', 'users', 'read'),
  ('AdminUser', 'users', 'update'),
  ('AdminUser', 'teams', 'manage'),
  ('AdminUser', 'fake_users', 'manage'),
  ('AdminUser', 'tags', 'manage'),
  ('AdminUser', 'activity_logs', 'read'),
  
  -- CustomerUser permissions
  ('CustomerUser', 'users', 'read'),
  ('CustomerUser', 'teams', 'read'),
  ('CustomerUser', 'fake_users', 'create'),
  ('CustomerUser', 'fake_users', 'read'),
  ('CustomerUser', 'fake_users', 'update'),
  ('CustomerUser', 'fake_users', 'delete'),
  ('CustomerUser', 'tags', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Root users can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_root_user());

CREATE POLICY "Root users can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (is_root_user())
  WITH CHECK (is_root_user());

-- RLS Policies for permissions
CREATE POLICY "All authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only root users can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (is_root_user())
  WITH CHECK (is_root_user());

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and root can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_root());

CREATE POLICY "All authenticated users can create activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins and root can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_root());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Root users can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_root_user())
  WITH CHECK (is_root_user());

CREATE POLICY "Root users can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_root_user());
