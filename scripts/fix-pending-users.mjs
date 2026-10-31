/**
 * Script untuk cek dan fix status user di database.
 * Jalankan: node scripts/fix-pending-users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('=== Checking all profiles ===\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, email, role, status')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error.message);
    process.exit(1);
  }

  console.log('All profiles:');
  for (const p of profiles) {
    console.log(`  - ${p.username} (${p.email}) | role: ${p.role} | status: ${p.status}`);
  }

  // Find non-owner users that are still pending
  const pendingUsers = profiles.filter(p => p.role !== 'owner' && p.status === 'pending');
  
  if (pendingUsers.length === 0) {
    console.log('\nNo pending users found. All users are already approved or rejected.');
    console.log('If users still see "Menunggu Persetujuan", restart the dev server.');
    return;
  }

  console.log(`\nFound ${pendingUsers.length} pending user(s):`);
  for (const p of pendingUsers) {
    console.log(`  - ${p.username} (${p.email})`);
  }

  // Approve all pending users
  console.log('\nApproving all pending users...\n');
  
  for (const p of pendingUsers) {
    // Update profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', p.id);

    if (updateError) {
      console.error(`  FAIL: ${p.username}: ${updateError.message}`);
      continue;
    }

    // Also update user metadata
    const { error: metaError } = await supabase.auth.admin.updateUserById(p.id, {
      user_metadata: { status: 'approved' },
    });

    if (metaError) {
      console.error(`  WARN: Profile OK but metadata failed for ${p.username}: ${metaError.message}`);
    } else {
      console.log(`  OK: ${p.username} -> approved`);
    }
  }

  // Verify
  console.log('\n=== Verification ===\n');
  const { data: updated } = await supabase
    .from('profiles')
    .select('id, username, email, role, status')
    .order('created_at', { ascending: true });

  for (const p of (updated || [])) {
    console.log(`  [${p.status}] ${p.username} (${p.email})`);
  }

  console.log('\nDone! Restart dev server and ask user to log out & log in again.');
}

main().catch(console.error);
