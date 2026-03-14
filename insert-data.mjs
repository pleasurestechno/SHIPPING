import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://frdnyopuifabdsmtwrof.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SaFFLpdTFRNTNtfMTmRwMg_ISHNV3Iy';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  // Step 1: Verify table access
  console.log('Testing connection to shipping_data...');
  const { data: testData, error: testError } = await supabase.from('shipping_data').select('id').limit(1);
  
  if (testError) {
    console.error('Cannot access table:', testError.message);
    console.error('Full error:', JSON.stringify(testError));
    return;
  }
  console.log('Table accessible!');

  // Step 2: Parse CSV
  const csvContent = readFileSync('Dashboard.csv', 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every(v => !v.trim())) continue;
    
    rows.push({
      poe: values[0] || null,
      shipping_company: values[1] || null,
      container_id: values[2] || null,
      eta_los_angeles: values[3] || null,
      status: values[4] || null,
      port_of_discharge: values[5] || null,
      days_until_arrival: values[6] ? parseInt(values[6]) : null,
      last_event_date: values[7] || null,
      vessel: values[8] || null,
      last_checked: values[9] || null,
      paid_vendor: values[10] || null,
      paid_cargo: values[11] || null,
    });
  }
  
  console.log(`Parsed ${rows.length} rows from CSV`);
  console.log('Sample:', JSON.stringify(rows[0], null, 2));

  // Step 3: Clear and insert
  console.log('Clearing existing data...');
  const { error: delErr } = await supabase.from('shipping_data').delete().gte('id', 0);
  if (delErr) console.log('Delete note:', delErr.message);

  console.log('Inserting data...');
  const { data: inserted, error: insertErr } = await supabase.from('shipping_data').insert(rows).select();
  
  if (insertErr) {
    console.error('Insert error:', insertErr.message);
    console.error('Full error:', JSON.stringify(insertErr));
    return;
  }
  
  console.log(`Successfully inserted ${inserted.length} rows!`);
  inserted.forEach(r => console.log(`  - ${r.container_id} | ${r.shipping_company} | ${r.status}`));
}

main().catch(console.error);
