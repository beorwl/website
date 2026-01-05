-- Supabase Setup for Contract Upload System
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- 1. Create the contract_submissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contract_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    additional_context TEXT,
    contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'discord', 'telegram')),
    contact_info TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 2. Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 3. Apply trigger to contract_submissions table
-- =====================================================
CREATE TRIGGER update_contract_submissions_updated_at
    BEFORE UPDATE ON public.contract_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Create indexes for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contract_submissions_status
    ON public.contract_submissions(status);

CREATE INDEX IF NOT EXISTS idx_contract_submissions_created_at
    ON public.contract_submissions(created_at DESC);

-- =====================================================
-- 5. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.contract_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Create RLS Policies
-- =====================================================

-- Allow INSERT for authenticated and anonymous users (for form submission)
CREATE POLICY "Allow anonymous submissions"
    ON public.contract_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow SELECT only for authenticated admin users
-- You'll need to create a custom claim or use a specific role
CREATE POLICY "Allow admin read access"
    ON public.contract_submissions
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin'
        OR auth.jwt() ->> 'email' IN (
            SELECT email FROM admin_users
        )
    );

-- Allow UPDATE only for authenticated admin users
CREATE POLICY "Allow admin update access"
    ON public.contract_submissions
    FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin'
        OR auth.jwt() ->> 'email' IN (
            SELECT email FROM admin_users
        )
    );

-- =====================================================
-- 7. Create admin_users table (optional - for access control)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert your admin emails here
-- INSERT INTO public.admin_users (email) VALUES ('your-admin@email.com');

-- =====================================================
-- 8. Create Storage Bucket (Run this separately or use Supabase Dashboard)
-- =====================================================
-- Go to Storage in Supabase Dashboard and create a bucket named 'contracts'
-- Or run this SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contracts',
    'contracts',
    false, -- private bucket
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. Storage Policies for 'contracts' bucket
-- =====================================================

-- Allow anonymous/authenticated users to INSERT (upload)
CREATE POLICY "Allow anonymous uploads"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'contracts');

-- Allow only admin users to SELECT (download)
CREATE POLICY "Allow admin downloads"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'contracts' AND (
            auth.jwt() ->> 'role' = 'admin'
            OR auth.jwt() ->> 'email' IN (
                SELECT email FROM admin_users
            )
        )
    );

-- Allow only admin users to DELETE
CREATE POLICY "Allow admin deletes"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'contracts' AND (
            auth.jwt() ->> 'role' = 'admin'
            OR auth.jwt() ->> 'email' IN (
                SELECT email FROM admin_users
            )
        )
    );

-- =====================================================
-- 10. Optional: Auto-delete old submissions after 30 days
-- =====================================================
-- This requires setting up a Supabase Edge Function or cron job
-- Here's the query you would run periodically:

-- DELETE FROM public.contract_submissions
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- 11. Optional: Create a view for admin dashboard
-- =====================================================
CREATE OR REPLACE VIEW public.contract_submissions_summary AS
SELECT
    id,
    file_name,
    file_size,
    file_type,
    contact_method,
    status,
    created_at,
    CASE
        WHEN status = 'completed' THEN 'Reviewed'
        WHEN status = 'reviewing' THEN 'In Progress'
        ELSE 'Pending'
    END as status_label
FROM public.contract_submissions
ORDER BY created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.contract_submissions_summary TO authenticated;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Add your admin email to the admin_users table
-- 2. Update your .env file with Supabase credentials
-- 3. Test the upload functionality

