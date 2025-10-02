/*
  # FakeUser Manager Database Schema

  ## Overview
  This migration creates the complete database schema for a Chrome extension that manages fake user profiles
  with team collaboration, tagging, and authentication features.

  ## New Tables

  ### 1. `profiles`
  User profiles for the application (linked to auth.users)
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text, unique, not null) - User's email
  - `display_name` (text) - Display name for the user
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `teams`
  Team/workspace management for collaboration
  - `id` (uuid, primary key) - Unique team identifier
  - `name` (text, not null) - Team name
  - `owner_id` (uuid, not null) - Reference to profiles.id (team owner)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `team_members`
  Junction table for team membership
  - `id` (uuid, primary key) - Unique identifier
  - `team_id` (uuid, not null) - Reference to teams.id
  - `user_id` (uuid, not null) - Reference to profiles.id
  - `role` (text, not null, default 'member') - Member role: 'owner', 'admin', 'member'
  - `joined_at` (timestamptz) - When user joined the team
  - Unique constraint on (team_id, user_id)

  ### 4. `tags`
  Reusable tags for organizing fake users
  - `id` (uuid, primary key) - Unique tag identifier
  - `name` (text, not null) - Tag name
  - `color` (text, default '#3B82F6') - Tag color for UI
  - `team_id` (uuid, not null) - Reference to teams.id
  - `created_at` (timestamptz) - Creation timestamp
  - Unique constraint on (name, team_id)

  ### 5. `fake_users`
  Fake user profiles with credentials
  - `id` (uuid, primary key) - Unique fake user identifier
  - `team_id` (uuid, not null) - Reference to teams.id
  - `name` (text, not null) - Fake user's name
  - `email` (text, not null) - Fake email address
  - `phone` (text) - Fake phone number
  - `address` (text) - Fake address
  - `notes` (text) - Additional notes
  - `created_by` (uuid, not null) - Reference to profiles.id
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `fake_user_tags`
  Junction table linking fake users to tags
  - `id` (uuid, primary key) - Unique identifier
  - `fake_user_id` (uuid, not null) - Reference to fake_users.id
  - `tag_id` (uuid, not null) - Reference to tags.id
  - `created_at` (timestamptz) - Creation timestamp
  - Unique constraint on (fake_user_id, tag_id)

  ## Security (Row Level Security)

  All tables have RLS enabled with appropriate policies for team-based access control.

  ## Notes
  - All timestamps use `timestamptz` for timezone awareness
  - Foreign keys ensure referential integrity
  - Indexes added for common query patterns
  - Cascading deletes maintain data consistency
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Now add policies for teams (after team_members exists)
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Add policies for team_members
CREATE POLICY "Team members can view members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, team_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tags.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tags.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tags.team_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tags.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tags.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create fake_users table
CREATE TABLE IF NOT EXISTS fake_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  notes text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fake_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view fake users"
  ON fake_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = fake_users.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create fake users"
  ON fake_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = fake_users.team_id
      AND team_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Team members can update fake users"
  ON fake_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = fake_users.team_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = fake_users.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete fake users"
  ON fake_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = fake_users.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create fake_user_tags junction table
CREATE TABLE IF NOT EXISTS fake_user_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fake_user_id uuid NOT NULL REFERENCES fake_users(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fake_user_id, tag_id)
);

ALTER TABLE fake_user_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view fake user tags"
  ON fake_user_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fake_users
      JOIN team_members ON team_members.team_id = fake_users.team_id
      WHERE fake_users.id = fake_user_tags.fake_user_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can add tags to fake users"
  ON fake_user_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fake_users
      JOIN team_members ON team_members.team_id = fake_users.team_id
      WHERE fake_users.id = fake_user_tags.fake_user_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can remove tags from fake users"
  ON fake_user_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fake_users
      JOIN team_members ON team_members.team_id = fake_users.team_id
      WHERE fake_users.id = fake_user_tags.fake_user_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_team_id ON tags(team_id);
CREATE INDEX IF NOT EXISTS idx_fake_users_team_id ON fake_users(team_id);
CREATE INDEX IF NOT EXISTS idx_fake_user_tags_fake_user_id ON fake_user_tags(fake_user_id);
CREATE INDEX IF NOT EXISTS idx_fake_user_tags_tag_id ON fake_user_tags(tag_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fake_users_updated_at ON fake_users;
CREATE TRIGGER update_fake_users_updated_at
    BEFORE UPDATE ON fake_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
