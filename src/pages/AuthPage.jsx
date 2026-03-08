import { useState } from "react";
import { useAuth } from "../AuthContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }

  .auth-bg {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 55% at 5% -5%,  rgba(167,139,250,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 45% at 95% 5%,  rgba(99,200,255,0.16) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 50% 105%, rgba(251,191,36,0.12) 0%, transparent 55%),
      #f0f2ff;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }

  .auth-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(16px);
    border: 1.5px solid rgba(99,91,255,0.1);
    border-radius: 28px;
    padding: 40px 36px;
    width: 100%; max-width: 420px;
    box-shadow: 0 24px 64px rgba(99,91,255,0.13), 0 2px 12px rgba(99,91,255,0.06);
    animation: cardIn 0.4s cubic-bezier(0.34,1.3,0.64,1);
  }
  @keyframes cardIn { from { transform: translateY(24px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }

  .auth-input {
    width: 100%;
    background: #f8f7ff;
    border: 1.5px solid #e0e7ff;
    border-radius: 12px;
    padding: 11px 14px;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e1b4b;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .auth-input::placeholder { color: #a5b4fc; }
  .auth-input:focus {
    border-color: #818cf8;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(129,140,248,0.16);
  }

  .auth-btn {
    width: 100%;
    background: linear-gradient(135deg, #635bff 0%, #818cf8 100%);
    color: #fff; border: none; border-radius: 13px;
    padding: 13px;
    font-weight: 700; font-size: 15px;
    font-family: 'Syne', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99,91,255,0.35);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .auth-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,91,255,0.45); }
  .auth-btn:active { transform: scale(0.98); }
  .auth-btn:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }

  .magic-btn {
    width: 100%;
    background: transparent;
    border: 1.5px solid #e0e7ff;
    border-radius: 13px;
    padding: 11px;
    font-weight: 600; font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #6366f1; cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .magic-btn:hover { background: #ede9fe; border-color: #818cf8; }

  .auth-label {
    font-size: 11px; font-weight: 700;
    color: #6366f1; display: block;
    margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase;
  }

  .auth-toggle {
    background: none; border: none; cursor: pointer;
    color: #635bff; font-weight: 700; font-size: 14px;
    font-family: inherit; text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.2s;
  }
  .auth-toggle:hover { text-decoration-color: #635bff; }

  .divider {
    display: flex; align-items: center; gap: 12px;
    color: #c7d2fe; font-size: 12px; font-weight: 500;
  }
  .divider::before, .divider::after {
    content: ''; flex: 1; height: 1px; background: #e0e7ff;
  }

  .error-box {
    background: #fff1f2; border: 1px solid #fecdd3;
    border-radius: 10px; padding: 10px 14px;
    color: #e11d48; font-size: 13px; font-weight: 500;
    animation: shake 0.3s ease;
  }
  .success-box {
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 10px; padding: 10px 14px;
    color: #16a34a; font-size: 13px; font-weight: 500;
  }
  @keyframes shake {
    0%,100%{ transform: translateX(0); }
    20%{ transform: translateX(-6px); }
    60%{ transform: translateX(6px); }
  }

  .feature-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f0f2ff; border: 1px solid #e0e7ff;
    border-radius: 99px; padding: 4px 10px;
    font-size: 11px; font-weight: 600; color: #6366f1;
  }

  /* Mobile Responsive */
  @media (max-width: 480px) {
    .auth-bg { padding: 16px; }
    .auth-card { padding: 30px 24px; border-radius: 20px; }
    .auth-btn { font-size: 14px; padding: 12px; }
  }
`;

function StyleInjector({ css }) {
  const { useEffect } = require !== undefined ? { useEffect: null } : {};
  // inject inline via <style> rendered in JSX instead
  return <style>{css}</style>;
}

export default function AuthPage() {
  const { signIn, signUp, signInWithMagicLink } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); reset();

    const { error: err } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name);

    setLoading(false);
    if (err) {
      setError(err.message);
    } else if (mode === "signup") {
      setSuccess("✉️ Check your email to confirm your account, then sign in.");
      setMode("signin");
    }
    // on sign-in success, AuthContext updates user → App re-renders to BoardPage
  };

  const handleMagicLink = async () => {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true); reset();
    const { error: err } = await signInWithMagicLink(email);
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess("✉️ Magic link sent! Check your inbox.");
  };

  const isSignIn = mode === "signin";

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-bg">
        <div className="auth-card">

          {/* Logo + Title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, margin: "0 auto 14px",
              background: "linear-gradient(135deg, #635bff 0%, #818cf8 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, boxShadow: "0 8px 24px rgba(99,91,255,0.35)"
            }}>🎓</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#1e1b4b", letterSpacing: "-0.5px" }}>
              InternTrack
            </div>
            <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 4, fontWeight: 500 }}>
              {isSignIn ? "Welcome back! Sign in to continue." : "Create your free account."}
            </div>
          </div>

          {/* Feature chips */}
          {!isSignIn && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
              {["🔖 Track Apps", "📊 Live Stats", "⚡ Real-time"].map(f => (
                <span key={f} className="feature-chip">{f}</span>
              ))}
            </div>
          )}

          {/* Status messages */}
          {error && <div className="error-box" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isSignIn && (
              <div style={{ marginBottom: 14 }}>
                <label className="auth-label">Full Name</label>
                <input
                  className="auth-input"
                  type="text" required
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email" required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password" required
                placeholder={isSignIn ? "Your password" : "Min. 6 characters"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                autoComplete={isSignIn ? "current-password" : "new-password"}
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "⏳ Please wait…" : isSignIn ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Switch mode */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#94a3b8" }}>
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              className="auth-toggle"
              onClick={() => { setMode(isSignIn ? "signup" : "signin"); reset(); }}
            >
              {isSignIn ? "Sign Up" : "Sign In"}
            </button>
          </p>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#c7d2fe" }}>
            🔒 Secured by Supabase · Your data is private
          </p>
        </div>
      </div>
    </>
  );
}
