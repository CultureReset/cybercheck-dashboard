// ============================================
// Supabase Client — Direct browser connection
// ============================================
const SUPABASE_URL = 'https://mhafixflyffflwjhcgfn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYWZpeGZseWZmZmx3amhjZ2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTA4MzUsImV4cCI6MjA4NzM4NjgzNX0.3KW-rGnLhJQ1u3IsSeoGFfgQpcoJNdBGFOGnhc88tHw';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Session + business cache
let _session = null;
let _business = null;
let _siteId = null;

async function getSupabaseSession() {
  if (_session) return _session;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  _session = data.session;
  return _session;
}

async function getSupabaseBusiness() {
  if (_business) return _business;
  var session = await getSupabaseSession();
  if (!session) return null;

  // Look up user record to get site_id
  var { data: user } = await supabase
    .from('users')
    .select('site_id, name, role')
    .eq('auth_id', session.user.id)
    .single();

  if (!user) return null;
  _siteId = user.site_id;

  // Get business record
  var { data: biz } = await supabase
    .from('businesses')
    .select('*')
    .eq('site_id', user.site_id)
    .single();

  _business = biz;
  return _business;
}

function getSiteId() { return _siteId; }

function clearSupabaseCache() {
  _session = null;
  _business = null;
  _siteId = null;
}

async function requireSupabaseAuth() {
  var session = await getSupabaseSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
