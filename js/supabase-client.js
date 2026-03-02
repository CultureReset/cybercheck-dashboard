// ============================================
// Supabase Client — UPDATE THESE VALUES
// ============================================
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current session cache
let _session = null;
let _business = null;

async function getSession() {
  if (_session) return _session;
  const { data } = await supabase.auth.getSession();
  _session = data.session;
  return _session;
}

async function getBusiness() {
  if (_business) return _business;
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', session.user.id)
    .single();
  _business = data;
  return _business;
}

function clearCache() {
  _session = null;
  _business = null;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
