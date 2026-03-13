import { useState } from "react";
import { useAuth } from "./src/AuthContext";
import AuthPage from "./src/pages/AuthPage";
import BoardPage from "./src/pages/BoardPage";
import AdminPage from "./src/pages/AdminPage";

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState("board"); // "board" or "admin"

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f0f2ff", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#6366f1",
        fontWeight: 600, fontSize: 14
      }}>
        Starting InternTrack...
      </div>
    );
  }

  // If no user is logged in, show the login/signup page.
  if (!user) return <AuthPage />;

  // Admin routing
  if (currentView === "admin" && isAdmin) {
      return <AdminPage onBack={() => setCurrentView("board")} />;
  }

  // Otherwise, show the main Kanban board
  return <BoardPage onOpenAdmin={() => setCurrentView("admin")} />;
}
