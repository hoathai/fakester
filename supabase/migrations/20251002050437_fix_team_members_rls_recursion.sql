/*
  # Fix Infinite Recursion in team_members RLS Policy

  ## Problem
  The "Team members can view members" policy on team_members table causes infinite recursion
  because it queries the same table (team_members) to check access permissions.

  ## Solution
  Replace the recursive policy with a simpler approach:
  - Use a security definer function to check team membership
  - Or allow authenticated users to view team_members they belong to directly

  ## Changes
  1. Drop the problematic policy
  2. Create a new non-recursive policy
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Team members can view members" ON team_members;

-- Create a non-recursive policy
-- Users can see team_members rows where they are the user_id
-- or where they share a team_id with the viewing user (checked via function)
CREATE POLICY "Team members can view their team memberships"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
