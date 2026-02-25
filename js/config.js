// Supabase Configuration - Micro Sharks Tank
// Complete database schema with success tracking

const SUPABASE_URL = 'https://gydalmfllybzgwnjsnnm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGFsbWZsbHliemd3bmpzbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMyODksImV4cCI6MjA4NjE0OTI4OX0.H1OqD3rOpqM5j-e3cK8UgvYOm6v8Q6uBBAe2gQCXiX4';
// Initialize Supabase client with error handling
let supabase;

try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        window.supabase = supabase;
        console.log('✅ Supabase client initialized successfully');
    } else {
        console.error('❌ Supabase library not loaded. Please check your internet connection.');
    }
} catch (error) {
    console.error('❌ Error initializing Supabase:', error);
}

// Test connection function
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}