const SUPABASE_URL = 'https://gydalmfllybzgwnjsnnm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGFsbWZsbHliemd3bmpzbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMyODksImV4cCI6MjA4NjE0OTI4OX0.H1OqD3rOpqM5j-e3cK8UgvYOm6v8Q6uBBAe2gQCXiX4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
