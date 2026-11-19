const { createClient } = require('@supabase/supabase-js');

let client;

function bucket() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY');
    }

    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  return client.storage.from('attachments');
}

module.exports = { bucket };
