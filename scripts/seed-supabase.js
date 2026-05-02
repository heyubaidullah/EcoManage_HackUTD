/**
 * EcoManage — Supabase Seed Script
 *
 * Seeds 5 demo buildings with 90 days of realistic sensor data.
 * Run once after creating your Supabase project and running schema.sql.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/seed-supabase.js
 *
 * To wipe and re-seed:
 *   node scripts/seed-supabase.js --force
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Deterministic PRNG (seed=42) — mirrors Python's random.seed(42) outputs closely enough
// for demo purposes
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const randBetween = (min, max) => min + rand() * (max - min);

const DEMO_BUILDINGS = [
  { name: 'CBRE Downtown',         address: '500 Main Street, Dallas, TX 75201'       },
  { name: 'CBRE Tech Hub',          address: '1200 Innovation Drive, Austin, TX 78701' },
  { name: 'CBRE Innovation Center', address: '900 Commerce Blvd, Houston, TX 77002'    },
  { name: 'CBRE Plaza Tower',       address: '300 Travis Street, Houston, TX 77002'    },
  { name: 'CBRE Commerce Park',     address: '8080 Park Lane, Dallas, TX 75231'        },
];

function toDateStr(d) { return d.toISOString().split('T')[0]; }

async function seed() {
  const { count } = await sb
    .from('buildings')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    if (!process.argv.includes('--force')) {
      console.log(`Already seeded (${count} building(s) found). Use --force to wipe and re-seed.`);
      process.exit(0);
    }
    console.log('--force: clearing existing data…');
    await sb.from('daily_data').delete().neq('id', 0);
    await sb.from('buildings').delete().neq('id', 0);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const info of DEMO_BUILDINGS) {
    console.log(`Seeding: ${info.name}`);

    const { data: building, error } = await sb
      .from('buildings').insert(info).select().single();
    if (error) { console.error(error); process.exit(1); }

    const baseEnergy = randBetween(120, 170);
    const baseHvac   = randBetween(50,  75);
    const baseTemp   = randBetween(20,  24);
    const baseWaste  = randBetween(7,   12);

    const rows = [];
    for (let i = 90; i >= 1; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);

      const energy = Math.max(100, Math.min(200, baseEnergy + randBetween(-18, 18) + Math.sin(i / 7) * 8));
      const hvac   = Math.max(40,  Math.min(85,  baseHvac   + randBetween(-10, 10) + Math.cos(i / 14) * 6));
      const temp   = Math.max(18,  Math.min(26,  baseTemp   + randBetween(-2, 2)));
      const waste  = Math.max(5,   Math.min(15,  baseWaste  + randBetween(-2.5, 2.5)));

      rows.push({
        building_id: building.id,
        date:        toDateStr(day),
        energy:      Math.round(energy * 10) / 10,
        hvac:        Math.round(hvac   * 10) / 10,
        temperature: Math.round(temp   * 10) / 10,
        waste:       Math.round(waste  * 10) / 10,
      });
    }

    // Insert in batches of 50 to stay within Supabase limits
    for (let i = 0; i < rows.length; i += 50) {
      const { error: batchErr } = await sb.from('daily_data').insert(rows.slice(i, i + 50));
      if (batchErr) { console.error(batchErr); process.exit(1); }
    }
  }

  console.log('\nDone! 5 buildings seeded with 90 days of demo data.');
  console.log('Open your Netlify site and the dashboard will load immediately.');
}

seed().catch(err => { console.error(err); process.exit(1); });
