"use client";
import { useState } from "react";
import { browserDb } from "../../lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"signin" | "signup">("signin"); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setMessage(""); const db = browserDb(); const result = mode === "signin" ? await db.auth.signInWithPassword({ email, password }) : await db.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/confirm` } }); if (result.error) return setMessage(result.error.message); if (mode === "signup") return setMessage("Check your email to confirm your account."); location.assign("/dashboard"); }
  return <main className="login-page"><form className="login-card" onSubmit={submit}><span className="studio-eyebrow">CYBERCHECK PROFILE OS</span><h1>{mode === "signin" ? "Welcome back." : "Create your workspace."}</h1><p>Your account owns its profiles, installed apps, and page data.</p><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <small className="form-message">{message}</small>}<button className="publish" type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button><button className="auth-switch" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button></form></main>;
}
