import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qmfvbtgqfpcuzkjxvzwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZnZidGdxZnBjdXpranh2endxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Njg5ODgsImV4cCI6MjA3ODA0NDk4OH0.DFmwWEhgkoeKXp_GpAnwSBY6IFygUZxRQO7Ho031G0U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
