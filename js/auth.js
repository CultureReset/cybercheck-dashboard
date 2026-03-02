// ============================================
// Auth — Signup, Login, Logout
// ============================================

async function signup(email, password, businessName, businessType) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Create business row
  const { error: bizError } = await supabase.from('businesses').insert({
    owner_id: data.user.id,
    type: businessType,
    name: businessName
  });
  if (bizError) throw bizError;

  return data;
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  clearCache();
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/dashboard/login.html'
  });
  if (error) throw error;
}

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  _session = session;
  if (event === 'SIGNED_OUT') {
    clearCache();
  }
});
