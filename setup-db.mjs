import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://frdnyopuifabdsmtwrof.supabase.co';
// Publishable Key (Anon Key) - Not used for admin operations but good to have
const SUPABASE_ANON_KEY = 'sb_publishable_SaFFLpdTFRNTNtfMTmRwMg_ISHNV3Iy'; 
// Service Role Key - Used for admin operations like table creation and data import
const SERVICE_ROLE_KEY = 'dycmiq-4tivca-gurkaJ'; 

// Use the Service Role Key for operations requiring elevated privileges
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Rest of the script remains the same...
// ... (previous script content) ...

// Step 1: Check if the table exists. If not, print SQL to create it.
async function checkTableAndCreate() {
    console.log('Checking if shipping_data table exists...');

    // Attempting to query a column that would exist if the table was created correctly.
    // Using `select` on a non-existent table throws an error.
    // We are also checking headers on the response for a specific error code if possible,
    // but error.message is often sufficient.
    const { data, error } = await supabase.from('shipping_data').select('id').limit(1);

    let tableExists = true;
    if (error) {
        // Supabase errors are often in error.message. Look for patterns indicating table not found.
        // For example, "relation \"shipping_data\" does not exist"
        if (error.message.includes('does not exist') || error.message.includes('relation "shipping_data" does not exist')) {
            tableExists = false;
        } else {
            // A different error occurred, re-throw or handle.
            console.error('An unexpected error occurred while checking table existence:', error.message);
            throw error; // Re-throw to stop execution if it's a serious error.
        }
    } else if (data && data.length > 0) {
        console.log('Table shipping_data already exists and has data.');
        // If data is returned, the table exists and is queryable.
        // We might want to clear it first if we are doing a fresh import.
    } else {
        console.log('Table shipping_data exists but is empty or query returned no data.');
        // Table exists, but is empty. Proceed to data insertion.
    }

    if (!tableExists) {
        console.log('');
        console.log('=== ACTION REQUIRED ===');
        console.log('The "shipping_data" table does not exist. Please create it in your Supabase SQL Editor with the following SQL:');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS shipping_data (
  id SERIAL PRIMARY KEY,
  poe TEXT,
  shipping_company TEXT,
  container_id TEXT,
  eta_los_angeles TEXT,
  status TEXT,
  port_of_discharge TEXT,
  days_until_arrival INTEGER,
  last_event_date TEXT,
  vessel TEXT,
  last_checked TEXT,
  paid_vendor TEXT,
  paid_cargo TEXT
);

-- Enable RLS but allow public read
ALTER TABLE shipping_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON shipping_data FOR SELECT USING (true);
-- This policy requires the service role key to bypass RLS for write operations.
CREATE POLICY "Allow service write" ON shipping_data FOR ALL USING (auth.role() = 'authenticated'); -- This policy is more restrictive for authenticated users.
-- The service_role key bypasses RLS, so writes will succeed IF the key is correct.
-- The above policy is mainly for future reference for app users.
`);
        console.log('');
        console.log('After creating the table, please reply to me, and I will re-run the script to insert the data.');
        return false; // Indicate that the user needs to perform an action
    }
    
    return true; // Indicate that the table exists and we can proceed
}


// Step 2: Parse CSV and insert data
async function insertData() {
  console.log('Proceeding to insert data...');
  const csvContent = readFileSync('Dashboard.csv', 'utf-8');
  const lines = csvContent.trim().split('\n');
  // Dynamic header parsing
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    // Skip empty rows
    if (values.every(v => !v.trim())) continue;
    
    const rowObject = {};
    headers.forEach((header, index) => {
      // Map CSV headers to Supabase column names
      let colName = header.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, ''); // Sanitize header
      // Specific mappings based on CSV
      if (colName === 'container_') colName = 'container_id'; // Fix for 'container #'
      if (colName === 'eta_los_angeles') colName = 'eta_los_angeles'; // Original name
      if (colName === 'port_of_discharge') colName = 'port_of_discharge';
      if (colName === 'days_until_arrival') colName = 'days_until_arrival';
      if (colName === 'last_event_date') colName = 'last_event_date';
      if (colName === 'paid_vendor') colName = 'paid_vendor';
      if (colName === 'paid_cargo') colName = 'paid_cargo';
      if (colName === 'poe') colName = 'poe'; // Added Poe
      if (colName === 'shipping_company') colName = 'shipping_company';
      if (colName === 'status') colName = 'status';
      if (colName === 'vessel') colName = 'vessel';
      if (colName === 'last_checked') colName = 'last_checked';

      let value = values[index] ? values[index].trim() : null;

      // Data type conversion attempts
      if (colName === 'days_until_arrival' && value) {
        const parsedInt = parseInt(value);
        value = isNaN(parsedInt) ? null : parsedInt;
      }
      
      // You might want more robust date parsing here if Supabase struggles.
      // For now, keeping as TEXT and letting Supabase handle it.
      
      rowObject[colName] = value;
    });
    rows.push(rowObject);
  }
  
  console.log(`Parsed ${rows.length} data rows from CSV`);
  // console.log('Sample row:', JSON.stringify(rows[0], null, 2)); // Log a sample row for debugging

  // Clear existing data first if needed, or just insert.
  // For now, let's assume we want to overwrite. Use with caution.
  console.log('Deleting existing data from shipping_data...');
  const { error: deleteError } = await supabase.from('shipping_data').delete().neq('id', 0); // Using .neq to avoid deleting row with id 0 if it exists, essentially targeting all rows with non-zero IDs (or all if no specific ID 0 is guaranteed)
  if (deleteError) {
      console.log('Warning: Could not clear existing data (may not exist yet or other error):', deleteError.message);
  } else {
      console.log('Existing data cleared (or table was empty).');
  }
  
  console.log('Inserting new data...');
  // Insert new data in batches if table gets very large (e.g., > 1000 rows)
  // For now, inserting all at once.
  const { data: insertData, error: insertError } = await supabase.from('shipping_data').insert(rows);
  
  if (insertError) {
    console.error('Insert error:', insertError.message);
    // Log the specific data that failed to insert if possible for easier debugging
    // console.error('Failed to insert data:', rows); 
    return;
  }
  
  console.log(`Successfully inserted ${rows.length} rows into shipping_data!`);
  // console.log('Inserted data sample:', JSON.stringify(insertData.slice(0, 5), null, 2)); // Log a sample of inserted data
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Toggle inQuotes flag if we encounter a double quote
      inQuotes = !inQuotes;
      // If it's an escaped quote (""), we need to handle it
      if (i + 1 < line.length && line[i+1] === '"') {
        current += '"'; // Add a single double quote
        i++; // Skip the next quote
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim()); // Add the last part
  return result;
}

async function main() {
  const tableCreated = await checkTableAndCreate();
  if (tableCreated) {
    await insertData();
  }
}

main().catch(err => {
  console.error('An error occurred during script execution:', err);
});
