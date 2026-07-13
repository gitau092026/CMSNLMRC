const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) envConfig[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  let { data, error } = await supabase
    .from('clients')
    .select('id, name, status')
    .limit(20);
  console.log("All clients:", data);

  let { data: filtered, error: err2 } = await supabase
    .from('clients')
    .select('id, name, status')
    .or('status.like.Alumni%,status.eq.Complete');
    
  console.log("Filtered:", filtered);
  console.log("Error:", err2);
}

test();
