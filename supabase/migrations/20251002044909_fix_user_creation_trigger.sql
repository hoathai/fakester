/*
  # Fix User Creation Trigger
  
  Updates the trigger to use the correct function that assigns roles and creates profiles.
  
  ## Changes
  - Drop the old trigger
  - Recreate trigger pointing to assign_first_user_as_root function
  - This ensures new users get CustomerUser role automatically
*/

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with the correct function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_first_user_as_root();
