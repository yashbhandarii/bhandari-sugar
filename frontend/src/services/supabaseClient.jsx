import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jaokadmipvnmceqxqisj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphb2thZG1pcHZubWNlcXhxaXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTE4NzYsImV4cCI6MjA4NzQyNzg3Nn0.wbQEtt77Y8n6ZXj3Kqv-kcqnfuYG46Of5bR1HAgRE5Q';

export const supabase = createClient(supabaseUrl, supabaseKey);
