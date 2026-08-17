/*\n  # Fix User Profiles RLS Policy\n\n  1. Problem\n    - Users cannot create their own profile after signup\n    - INSERT policy is too restrictive\n    \n  2. Solution\n    - Drop existing INSERT policy\n    - Create new policy that allows authenticated users to insert their own profile\n    - Ensure user can only create profile for their own auth.uid()\n    \n  3. Security\n    - Users can only insert their own profile (auth.uid() = id)\n    - Cannot create profiles for other users\n    - Must be authenticated\n*/\n\n-- Drop the existing restrictive INSERT policy\nDROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
\n\n-- Create a more permissive INSERT policy for user registration\nCREATE POLICY "Users can create own profile on signup"\n  ON user_profiles\n  FOR INSERT\n  TO authenticated\n  WITH CHECK (auth.uid() = id);
\n\n-- Also ensure the UPDATE policy is correct\nDROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
\n\nCREATE POLICY "Users can update own profile"\n  ON user_profiles\n  FOR UPDATE\n  TO authenticated\n  USING (auth.uid() = id)\n  WITH CHECK (auth.uid() = id);
\n\n-- Ensure SELECT policy is correct\nDROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
\n\nCREATE POLICY "Users can view own profile"\n  ON user_profiles\n  FOR SELECT\n  TO authenticated\n  USING (auth.uid() = id);
\n\n-- Allow public to view basic profile info (needed for showing usernames in listings)\nCREATE POLICY "Anyone can view user profiles"\n  ON user_profiles\n  FOR SELECT\n  TO public\n  USING (true);
\n;
