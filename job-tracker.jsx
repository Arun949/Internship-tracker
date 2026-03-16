import { useState } from "react";
import { useAuth } from "./src/AuthContext";
import AuthPage from "./src/pages/AuthPage";
import BoardPage from "./src/pages/BoardPage";
import AdminPage from "./src/pages/AdminPage";

const LOADING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .splash-bg {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 55% at 5% -5%,  rgba(167,139,250,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 60% 45% at 95% 5%,  rgba(99,200,255,0.16) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 50% 105%, rgba(251,191,36,0.12) 0%, transparent 55%),
      #f0f2ff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .splash-logo {
    width: 72px; height: 72px; border-radius: 22px;
    background: linear-gradient(135deg, #635bff 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px;
    box-shadow: 0 12px 40px rgba(99,91,255,0.4);
    animation: splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
    margin-bottom: 18px;
  }
  @keyframes splashPop {
    from { transform: scale(0.5) rotate(-10deg); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }

  .splash-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 30px;
    color: #1e1b4b; letter-spacing: -0.5px;
    animation: fadeUp 0.5s 0.15s ease both;
    margin-bottom: 6px;
  }
  .splash-sub {
    font-size: 13px; color: #a5b4fc; font-weight: 500;
    animation: fadeUp 0.5s 0.25s ease both;
    margin-bottom: 32px;
  }
  @keyframes fadeUp {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }

  .spinner-track {
    width: 36px; height: 36px;
    border: 3px solid rgba(99,91,255,0.15);
    border-top-color: #635bff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState("board");

  if (loading) {
    return (
      <>
        <style>{LOADING_CSS}</style>
        <div className="splash-bg">
          <div className="splash-logo">🎓</div>
          <div className="splash-title">JobTrack</div>
          <div className="splash-sub">Your Job Command Center</div>
          <div className="spinner-track" />
        </div>
      </>
    );
  }

  if (!user) return <AuthPage />;

  if (currentView === "admin" && isAdmin) {
    return <AdminPage onBack={() => setCurrentView("board")} />;
  }

  return <BoardPage onOpenAdmin={() => setCurrentView("admin")} />;
}
