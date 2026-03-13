import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

const ADMIN_CSS = `
  .admin-bg { min-height: 100vh; background: #f8fafc; padding: 32px 24px; }
  .admin-header { display: flex; justify-content: space-between; align-items: center; max-width: 1000px; margin: 0 auto; margin-bottom: 24px; }
  .title-group h1 { font-family: 'Syne', sans-serif; font-size: 28px; color: #0f172a; font-weight: 800; }
  .title-group p { font-size: 14px; color: #64748b; margin-top: 4px; }
  
  .back-btn {
    background: #fff; border: 1.5px solid #e2e8f0; color: #475569;
    padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 14px;
    cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  }
  .back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }

  .log-container {
    max-width: 1000px; margin: 0 auto; background: #fff;
    border-radius: 16px; border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); overflow: hidden;
  }

  .log-row {
    padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
    display: flex; align-items: center; gap: 16px;
  }
  .log-row:last-child { border-bottom: none; }
  .log-row:hover { background: #f8fafc; }

  .log-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .icon-added { background: #dcfce7; color: #16a34a; }
  .icon-updated { background: #fef9c3; color: #ca8a04; }
  .icon-moved { background: #e0e7ff; color: #4f46e5; }
  .icon-deleted { background: #fee2e2; color: #dc2626; }

  .log-content { flex: 1; min-width: 0; }
  .log-title { font-size: 14px; color: #1e293b; font-weight: 600; margin-bottom: 4px; }
  .log-meta { font-size: 12px; color: #64748b; display: flex; gap: 12px; }
  
  .timestamp { font-size: 12px; color: #94a3b8; font-weight: 500; white-space: nowrap; }

  .pill {
    padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600;
    background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  }
`;

function getActionIcon(action) {
    if (action === 'ADDED') return <div className="log-icon icon-added">✨</div>;
    if (action === 'UPDATED') return <div className="log-icon icon-updated">✏️</div>;
    if (action === 'MOVED') return <div className="log-icon icon-moved">➡️</div>;
    if (action === 'DELETED') return <div className="log-icon icon-deleted">🗑</div>;
    return <div className="log-icon" style={{ background: '#f1f5f9' }}>📌</div>;
}

export default function AdminPage({ onBack }) {
    const { isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) return;
        
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (!error) setLogs(data || []);
            setLoading(false);
        };
        fetchLogs();

        // Optional: Real-time listener for the admin log feed
        const channel = supabase.channel('admin_activity_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
                setLogs(prev => [payload.new, ...prev].slice(0, 50));
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                <h2>Unauthorized</h2>
                <p>You do not have permission to view the activity logs.</p>
                <button onClick={onBack} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>Back to Board</button>
            </div>
        );
    }

    return (
        <div className="admin-bg">
            <style>{ADMIN_CSS}</style>
            
            <div className="admin-header">
                <div className="title-group">
                    <h1>Activity Logs</h1>
                    <p>Live feed of platform-wide user activity (Admin Only)</p>
                </div>
                <button className="back-btn" onClick={onBack}>
                    <span>←</span> Return to Board
                </button>
            </div>

            <div className="log-container">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No activity logs found yet.</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="log-row">
                            {getActionIcon(log.action)}
                            <div className="log-content">
                                <div className="log-title">
                                    <span style={{ color: "#3b82f6" }}>{log.user_email || 'Unknown User'}</span>
                                    {" "}{log.details}
                                </div>
                                <div className="log-meta">
                                    <span className="pill">🏢 {log.company}</span>
                                    <span className="pill">💼 {log.role}</span>
                                </div>
                            </div>
                            <div className="timestamp">
                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
