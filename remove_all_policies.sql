-- Remove all Row Level Security policies from all tables
-- This script will disable RLS and remove all policies

-- Disable RLS on all tables that actually exist
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

-- Drop all policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "allow_all" ON public.users;

-- Drop all policies on items table (contains both lost and found items)
DROP POLICY IF EXISTS "Users can view all items" ON public.items;
DROP POLICY IF EXISTS "Users can view all lost items" ON public.items;
DROP POLICY IF EXISTS "Users can view all found items" ON public.items;
DROP POLICY IF EXISTS "Users can insert own items" ON public.items;
DROP POLICY IF EXISTS "Users can insert own lost items" ON public.items;
DROP POLICY IF EXISTS "Users can insert own found items" ON public.items;
DROP POLICY IF EXISTS "Users can update own items" ON public.items;
DROP POLICY IF EXISTS "Users can update own lost items" ON public.items;
DROP POLICY IF EXISTS "Users can update own found items" ON public.items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete own lost items" ON public.items;
DROP POLICY IF EXISTS "Users can delete own found items" ON public.items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.items;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.items;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.items;
DROP POLICY IF EXISTS "allow_all" ON public.items;

-- Drop all policies on matches table
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can insert matches for their items" ON public.matches;
DROP POLICY IF EXISTS "Users can update matches for their items" ON public.matches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.matches;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.matches;
DROP POLICY IF EXISTS "allow_all" ON public.matches;

-- Grant full access to all tables for postgres user
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.items TO postgres;
GRANT ALL ON public.matches TO postgres;

-- Grant usage on sequences if they exist
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'items', 'matches');

COMMENT ON TABLE public.users IS 'RLS disabled - full access granted';
COMMENT ON TABLE public.items IS 'RLS disabled - full access granted';
COMMENT ON TABLE public.matches IS 'RLS disabled - full access granted';