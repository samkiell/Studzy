import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with Service Role Key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cleanup function to delete unverified users older than X days.
 * Run this as a scheduled job (e.g., via Vercel Cron or GitHub Actions).
 */
export async function cleanupUnverifiedUsers(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Note: Supabase doesn't allow bulk querying 'auth.users' directly via API
  // You usually need to query a public 'profiles' table if you sync users there
  // Or use an edge function / database function to find old unverified users.
  
  // Implementation tip: In your signup action, you should also insert a row into a 'profiles' 
  // table that tracks 'is_verified'.
  
  console.log(`Cleaning up users unverified since ${cutoffDate.toISOString()}`);
  
  // Example SQL for a Postgres Cron job in Supabase:
  /*
  delete from auth.users 
  where email_confirmed_at is null 
  and created_at < now() - interval '7 days';
  */

  return { success: true, message: 'Cleanup logic should ideally be implemented via edge function or DB cron' };
}
