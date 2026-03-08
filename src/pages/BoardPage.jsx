import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

/* ─── GLOBAL STYLES ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f2ff; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e1b4b; min-height: 100vh; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }

  .app-bg {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 10% -10%, rgba(167,139,250,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 90% 0%,   rgba(99,200,255,0.14) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 50% 100%, rgba(251,191,36,0.10) 0%, transparent 60%),
      #f0f2ff;
  }

  .card {
    background: #ffffff;
    border-radius: 18px; padding: 16px; margin-bottom: 10px;
    cursor: grab;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease;
    position: relative; overflow: hidden; user-select: none;
    box-shadow: 0 2px 8px rgba(99,91,255,0.07), 0 0 0 1px rgba(99,91,255,0.06);
  }
  .card:active { cursor: grabbing; }
  .card:hover {
    transform: translateY(-4px) scale(1.015);
    box-shadow: 0 16px 40px rgba(99,91,255,0.14), 0 0 0 1.5px rgba(99,91,255,0.15);
  }
  .card.dragging { opacity: 0.35; transform: scale(0.96) rotate(-1deg); }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(30,27,75,0.35); backdrop-filter: blur(10px);
    z-index: 1000; display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  }
  .modal-box {
    background: #ffffff; border-radius: 24px; padding: 30px;
    width: 100%; max-width: 500px; max-height: 92vh; overflow-y: auto;
    box-shadow: 0 30px 80px rgba(99,91,255,0.2), 0 0 0 1px rgba(99,91,255,0.08);
    animation: slideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);
  }
  .delete-overlay {
    position: fixed; inset: 0;
    background: rgba(30,27,75,0.35); backdrop-filter: blur(10px);
    z-index: 1100; display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  }
  .delete-box {
    background: #fff; border-radius: 22px; padding: 30px;
    width: 100%; max-width: 360px; text-align: center;
    box-shadow: 0 30px 80px rgba(239,68,68,0.15);
    animation: slideUp 0.18s cubic-bezier(0.34,1.3,0.64,1);
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(24px) scale(0.96); opacity: 0; } to { transform: none; opacity: 1; } }

  .input-field {
    width: 100%; background: #f8f7ff; border: 1.5px solid #e0e7ff;
    border-radius: 11px; padding: 9px 13px; font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif; color: #1e1b4b; outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .input-field::placeholder { color: #a5b4fc; }
  .input-field:focus { border-color: #818cf8; background: #fff; box-shadow: 0 0 0 3px rgba(129,140,248,0.15); }

  .tag {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 600; border-radius: 7px; padding: 2px 8px; white-space: nowrap;
  }

  .add-btn {
    background: linear-gradient(135deg, #635bff 0%, #818cf8 100%);
    color: #fff; border: none; border-radius: 12px;
    padding: 10px 22px; font-weight: 700; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; white-space: nowrap;
    box-shadow: 0 4px 16px rgba(99,91,255,0.35);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,91,255,0.45); }
  .add-btn:active { transform: scale(0.97); }

  .signout-btn {
    background: #f8f7ff; border: 1.5px solid #e0e7ff;
    color: #6366f1; border-radius: 10px; padding: 8px 16px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s, border-color 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .signout-btn:hover { background: #ede9fe; border-color: #818cf8; }

  .btn-icon {
    background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 12px; transition: background 0.15s, transform 0.15s; flex-shrink: 0;
  }
  .btn-icon:hover { background: #e0e7ff; transform: scale(1.1); }

  .save-btn {
    flex: 2; padding: 11px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #635bff, #818cf8); color: #fff; cursor: pointer;
    font-weight: 700; font-size: 14px; font-family: 'Syne', sans-serif;
    box-shadow: 0 4px 14px rgba(99,91,255,0.3);
    transition: opacity 0.2s, transform 0.15s;
  }
  .save-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .save-btn:disabled { opacity: 0.5; transform: none; cursor: not-allowed; }
  .cancel-btn {
    flex: 1; padding: 11px; border-radius: 12px;
    border: 1.5px solid #e0e7ff; background: #f8f7ff; color: #6366f1;
    cursor: pointer; font-weight: 600; font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }
  .cancel-btn:hover { background: #e0e7ff; border-color: #818cf8; }

  .quick-add-btn {
    width: 100%; margin-top: 8px; background: transparent; border-radius: 11px; padding: 8px;
    color: #a5b4fc; font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; border: 1.5px dashed #c7d2fe;
  }
  .quick-add-btn:hover { background: #ede9fe; border-color: #818cf8; color: #635bff; }

  .stat-pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.8); border: 1.5px solid rgba(99,91,255,0.1);
    border-radius: 14px; padding: 9px 16px; backdrop-filter: blur(4px);
    transition: transform 0.2s, box-shadow 0.2s; cursor: default;
    box-shadow: 0 2px 8px rgba(99,91,255,0.05);
  }
  .stat-pill:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,91,255,0.1); }

  .label { font-size: 11px; font-weight: 700; color: #6366f1; display: block; margin-bottom: 5px; letter-spacing: 0.06em; text-transform: uppercase; }
  .search-input {
    background: rgba(255,255,255,0.75); border: 1.5px solid rgba(99,91,255,0.15);
    border-radius: 12px; padding: 9px 16px; color: #1e1b4b; font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif; outline: none; width: 240px;
    backdrop-filter: blur(4px); box-shadow: 0 2px 8px rgba(99,91,255,0.05);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input::placeholder { color: #a5b4fc; }
  .search-input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.15); background: #fff; }

  .empty-drop {
    border: 2px dashed; border-radius: 14px; min-height: 80px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 5px; font-size: 12px; font-weight: 500; transition: all 0.2s; color: #c7d2fe;
  }

  .realtime-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #10b981;
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{ opacity:1; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50%{ opacity:0.7; box-shadow: 0 0 0 4px rgba(16,185,129,0); } }

  .skeleton {
    background: linear-gradient(90deg, #f0f2ff 25%, #e8eaff 50%, #f0f2ff 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 12px; height: 110px; margin-bottom: 10px;
  }
  @keyframes shimmer { 0%{ background-position: 200% 0; } 100%{ background-position: -200% 0; } }

  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: #1e1b4b; color: #fff;
    padding: 12px 18px; border-radius: 12px; font-size: 13px; font-weight: 600;
    box-shadow: 0 8px 24px rgba(30,27,75,0.25);
    animation: toastIn 0.3s cubic-bezier(0.34,1.3,0.64,1);
    z-index: 2000;
  }
  @keyframes toastIn { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: none; opacity: 1; } }

  /* Mobile Responsive */
  .header-container { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:16px; }
  .header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .stats-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .stats-right { margin-left:auto; display:flex; gap:8px; flex-wrap:wrap; }

  @media (max-width: 768px) {
    header { padding: 16px 20px 14px !important; }
    .header-container { flex-direction: column; align-items: stretch; gap: 16px; margin-bottom: 20px; }
    .header-logo-wrap { justify-content: flex-start; }
    .header-actions { flex-direction: column; align-items: stretch; gap: 12px; }
    .search-input { width: 100%; }
    .add-btn { width: 100%; }
    .user-info-wrap { justify-content: space-between; border-top: 1px solid rgba(99,91,255,0.08); padding-top: 12px; }
    
    .stats-row { justify-content: center; gap: 8px; }
    .stat-pill { padding: 6px 12px; }
    .stat-pill > span:first-child { width: 20px; height: 20px; font-size: 11px; }
    .stat-pill > span:nth-child(2) { font-size: 11px; }
    .stat-pill > span:last-child { font-size: 16px; }
    .stats-right { margin-left: 0; width: 100%; justify-content: space-between; margin-top: 8px; }
    .stats-right .stat-pill { flex: 1; justify-content: center; }

    main { padding: 20px 16px 32px !important; }
    .modal-box { padding: 24px; border-radius: 20px; }
    .delete-box { padding: 24px; border-radius: 20px; }
  }
`;

/* ─── CONSTANTS ─── */
const COLUMNS = [
    { id: "saved", label: "Saved", emoji: "🔖", color: "#8B5CF6", pastel: "#ede9fe", text: "#7c3aed", border: "#ddd6fe" },
    { id: "applied", label: "Applied", emoji: "📤", color: "#3B82F6", pastel: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
    { id: "interview", label: "Interview", emoji: "🎯", color: "#F59E0B", pastel: "#fef3c7", text: "#b45309", border: "#fde68a" },
    { id: "offer", label: "Offer", emoji: "🎉", color: "#10B981", pastel: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    { id: "rejected", label: "Rejected", emoji: "✖", color: "#F43F5E", pastel: "#ffe4e6", text: "#9f1239", border: "#fecdd3" },
];

const EMPTY_FORM = { company: "", role: "", location: "", deadline: "", salary: "", notes: "", status: "saved" };
const LOGO_COLORS = ["#635bff", "#3b82f6", "#f59e0b", "#10b981", "#f43f5e", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];
const logoColor = (n) => LOGO_COLORS[(n?.charCodeAt(0) || 65) % LOGO_COLORS.length];

/* ─── UTILS ─── */
function formatDate(d) {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function daysLeft(deadline) {
    if (!deadline) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(deadline + "T00:00:00") - now) / 86400000);
}

/* ─── SUB-COMPONENTS ─── */
function LogoBadge({ letter, name, size = 42 }) {
    const bg = logoColor(name || letter);
    return (
        <div style={{
            width: size, height: size, borderRadius: Math.round(size * 0.32),
            background: `linear-gradient(135deg, ${bg}22 0%, ${bg}11 100%)`,
            border: `2px solid ${bg}33`, color: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: Math.round(size * 0.42), flexShrink: 0,
        }}>
            {(letter || "?").toUpperCase()}
        </div>
    );
}

function DeadlineBadge({ deadline }) {
    const days = daysLeft(deadline);
    if (days === null) return null;
    let bg, color, text;
    if (days < 0) { bg = "#fff1f2"; color = "#f43f5e"; text = "Expired"; }
    else if (days === 0) { bg = "#fff1f2"; color = "#f43f5e"; text = "Due today!"; }
    else if (days <= 3) { bg = "#fff7ed"; color = "#ea580c"; text = `${days}d left`; }
    else if (days <= 7) { bg = "#fefce8"; color = "#ca8a04"; text = `${days}d left`; }
    else { bg = "#f0fdf4"; color = "#16a34a"; text = `${days}d`; }
    return (
        <span className="tag" style={{ background: bg, color, border: `1px solid ${color}22` }}>⏰ {text}</span>
    );
}

function Card({ card, col, onEdit, onDelete, onDragStart, dragging }) {
    return (
        <div
            className={`card${dragging ? " dragging" : ""}`}
            draggable onDragStart={() => onDragStart(card.id)}
            style={{ borderTop: `3px solid ${col.color}` }}
        >
            <div style={{ position: "absolute", top: -20, right: -20, width: 64, height: 64, borderRadius: "50%", background: col.color, opacity: 0.07, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                <LogoBadge letter={card.logo || card.company?.[0]} name={card.company} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.company}</div>
                    <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{card.role}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(card); }}>✏️</button>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(card.id); }}>🗑</button>
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                {card.location && <span className="tag" style={{ background: "#f0f2ff", color: "#4f46e5", border: "1px solid #e0e7ff" }}>📍 {card.location}</span>}
                {card.salary && <span className="tag" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>💰 {card.salary}</span>}
                {card.deadline && <DeadlineBadge deadline={card.deadline} />}
            </div>
            {card.deadline && <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 600, marginBottom: 5 }}>📅 {formatDate(card.deadline)}</div>}
            {card.notes && (
                <div style={{ fontSize: 11.5, color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: 7, marginTop: 3, lineHeight: 1.6, fontStyle: "italic" }}>
                    {card.notes.length > 90 ? card.notes.slice(0, 90) + "…" : card.notes}
                </div>
            )}
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, type = "text", isTextarea }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label className="label">{label}</label>
            {isTextarea
                ? <textarea className="input-field" value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ resize: "vertical" }} />
                : <input className="input-field" type={type} value={value} onChange={onChange} placeholder={placeholder} />
            }
        </div>
    );
}

function Modal({ form, setForm, onSave, onClose, isEdit, saving }) {
    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
    const col = COLUMNS.find(c => c.id === form.status) || COLUMNS[0];
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: col.pastel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                {isEdit ? "✏️" : col.emoji}
                            </div>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#1e1b4b" }}>
                                {isEdit ? "Edit Application" : "New Application"}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#a5b4fc", marginLeft: 46 }}>
                            {isEdit ? "Update the details below" : "Track your next opportunity"}
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32, fontSize: 15 }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                    <div style={{ gridColumn: "1/-1" }}><FormField label="Company *" value={form.company} onChange={f("company")} placeholder="e.g. Airbus" /></div>
                    <div style={{ gridColumn: "1/-1" }}><FormField label="Role *" value={form.role} onChange={f("role")} placeholder="e.g. Data Engineer Intern" /></div>
                    <FormField label="Location" value={form.location} onChange={f("location")} placeholder="Paris, France" />
                    <FormField label="Salary / Stipend" value={form.salary} onChange={f("salary")} placeholder="1200€/mo" />
                    <FormField label="Deadline" value={form.deadline} onChange={f("deadline")} type="date" />
                    <div style={{ marginBottom: 14 }}>
                        <label className="label">Status</label>
                        <select className="input-field" value={form.status} onChange={f("status")} style={{ appearance: "auto", cursor: "pointer" }}>
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}><FormField label="Notes" value={form.notes} onChange={f("notes")} placeholder="Any extra details…" isTextarea /></div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={onSave} disabled={!form.company || !form.role || saving}>
                        {saving ? "⏳ Saving…" : isEdit ? "Save Changes" : "Add Application"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirm({ card, onConfirm, onCancel, saving }) {
    return (
        <div className="delete-overlay">
            <div className="delete-box">
                <div style={{ fontSize: 38, marginBottom: 12 }}>🗑️</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: "#1e1b4b", marginBottom: 8 }}>Remove Application?</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 22, lineHeight: 1.6 }}>
                    Permanently remove <strong style={{ color: "#6366f1" }}>{card?.company}</strong> — {card?.role}?
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="cancel-btn" style={{ flex: 1 }} onClick={onCancel}>Keep It</button>
                    <button disabled={saving} onClick={onConfirm} style={{
                        flex: 1, padding: "11px", borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg,#f43f5e,#e11d48)",
                        color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14,
                        fontFamily: "'Syne',sans-serif", opacity: saving ? 0.6 : 1,
                        boxShadow: "0 4px 14px rgba(244,63,94,0.3)",
                    }}>{saving ? "Deleting…" : "Delete"}</button>
                </div>
            </div>
        </div>
    );
}

function Toast({ message, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return <div className="toast">{message}</div>;
}

/* ─── MAIN BOARD PAGE ─── */
export default function BoardPage() {
    const { user, signOut } = useAuth();

    const [cards, setCards] = useState([]);
    const [loadingCards, setLoadingCards] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCard, setEditCard] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [dragId, setDragId] = useState(null);
    const [dragOver, setDragOver] = useState(null);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const styleRef = useRef(null);

    /* Inject styles once */
    useEffect(() => {
        const el = document.createElement("style");
        el.textContent = GLOBAL_CSS;
        document.head.appendChild(el);
        styleRef.current = el;
        return () => el.remove();
    }, []);

    /* ── Load cards from Supabase ── */
    useEffect(() => {
        if (!user) return;
        setLoadingCards(true);
        supabase
            .from("internship_cards")
            .select("*")
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (!error) setCards(data || []);
                setLoadingCards(false);
            });
    }, [user]);

    /* ── Real-time subscription ── */
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("internship_cards_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "internship_cards", filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setCards(prev => [...prev, payload.new]);
                    } else if (payload.eventType === "UPDATE") {
                        setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
                    } else if (payload.eventType === "DELETE") {
                        setCards(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    /* Escape closes modals */
    useEffect(() => {
        const fn = e => { if (e.key === "Escape") { setShowModal(false); setDeleteTarget(null); } };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);

    /* ── Derived state ── */
    const filtered = cards.filter(c =>
        !search ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(search.toLowerCase())
    );
    const total = cards.length;
    const responseRate = total ? Math.round((cards.filter(c => ["interview", "offer"].includes(c.status)).length / total) * 100) : 0;
    const statMap = Object.fromEntries(COLUMNS.map(col => [col.id, cards.filter(c => c.status === col.id).length]));

    /* ── Open modal helpers ── */
    const openAdd = useCallback(() => { setForm(EMPTY_FORM); setEditCard(null); setShowModal(true); }, []);
    const openEdit = useCallback((card) => { setForm({ ...card, deadline: card.deadline || "" }); setEditCard(card.id); setShowModal(true); }, []);
    const showToast = (msg) => setToast(msg);

    /* ── CRUD: Save ── */
    const handleSave = async () => {
        if (!form.company.trim() || !form.role.trim()) return;
        setSaving(true);
        const logo = form.company[0].toUpperCase();
        const payload = {
            company: form.company.trim(),
            role: form.role.trim(),
            location: form.location || null,
            deadline: form.deadline || null,
            salary: form.salary || null,
            notes: form.notes || null,
            status: form.status,
            logo,
            user_id: user.id,
        };

        if (editCard) {
            const { error } = await supabase
                .from("internship_cards")
                .update(payload)
                .eq("id", editCard);
            if (!error) showToast("✅ Application updated!");
        } else {
            const { error } = await supabase
                .from("internship_cards")
                .insert([payload]);
            if (!error) showToast("🎉 Application added!");
        }
        setSaving(false);
        setShowModal(false);
    };

    /* ── CRUD: Delete ── */
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        await supabase.from("internship_cards").delete().eq("id", deleteTarget.id);
        setSaving(false);
        setDeleteTarget(null);
        showToast("🗑 Application removed.");
    };

    /* ── Drag & drop: update status ── */
    const handleDrop = async (colId) => {
        if (dragId === null) return;
        const card = cards.find(c => c.id === dragId);
        if (!card || card.status === colId) { setDragId(null); setDragOver(null); return; }
        // Optimistic UI update
        setCards(prev => prev.map(c => c.id === dragId ? { ...c, status: colId } : c));
        setDragId(null); setDragOver(null);
        await supabase.from("internship_cards").update({ status: colId }).eq("id", card.id);
    };

    /* ── Sign out ── */
    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="app-bg">

            {/* HEADER */}
            <header style={{
                background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(99,91,255,0.08)",
                padding: "22px 32px 18px", position: "sticky", top: 0, zIndex: 100,
                boxShadow: "0 4px 24px rgba(99,91,255,0.07)",
            }}>
                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                    <div className="header-container">

                        {/* Logo */}
                        <div className="header-logo-wrap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#635bff 0%,#818cf8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 14px rgba(99,91,255,0.3)" }}>🎓</div>
                            <div>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#1e1b4b", letterSpacing: "-0.5px" }}>InternTrack</div>
                                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 1, fontWeight: 500 }}>Your Internship Command Center</div>
                            </div>
                        </div>

                        {/* Right controls */}
                        <div className="header-actions">
                            {/* Real-time indicator */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
                                <span className="realtime-dot" />
                                Live
                            </div>

                            <input className="search-input" placeholder="🔍  Search company, role or city…" value={search} onChange={e => setSearch(e.target.value)} />
                            <button className="add-btn" onClick={openAdd}>+ Add</button>

                            {/* User info + sign out */}
                            <div className="user-info-wrap" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 12, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                                        {(user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>{user?.user_metadata?.full_name || "User"}</span>
                                        <span style={{ fontSize: 10, color: "#a5b4fc" }}>{user?.email}</span>
                                    </div>
                                </div>
                                <button className="signout-btn" onClick={handleSignOut} title="Sign out" style={{ marginLeft: "auto" }}>
                                    👋 Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="stats-row">
                        {COLUMNS.map(col => (
                            <div key={col.id} className="stat-pill" style={{ borderColor: `${col.color}20` }}>
                                <span style={{ width: 24, height: 24, borderRadius: 8, background: col.pastel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{col.emoji}</span>
                                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{col.label}</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: col.color }}>{statMap[col.id]}</span>
                            </div>
                        ))}
                        <div className="stats-right">
                            <div className="stat-pill" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
                                <span style={{ fontSize: 16 }}>📊</span>
                                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Response Rate</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#10B981" }}>{responseRate}%</span>
                            </div>
                            <div className="stat-pill" style={{ borderColor: "rgba(99,91,255,0.15)", background: "rgba(99,91,255,0.05)" }}>
                                <span style={{ fontSize: 16 }}>📋</span>
                                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Total</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#635bff" }}>{total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* BOARD */}
            <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px", overflowX: "auto" }}>
                {loadingCards ? (
                    /* Skeleton */
                    <div style={{ display: "flex", gap: 14, minWidth: 980 }}>
                        {COLUMNS.map(col => (
                            <div key={col.id} style={{ flex: 1, minWidth: 205 }}>
                                <div style={{ background: col.pastel, borderRadius: 13, padding: "9px 12px", marginBottom: 11, height: 44 }} />
                                <div className="skeleton" />
                                <div className="skeleton" style={{ opacity: 0.6 }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 14, minWidth: 980 }}>
                        {COLUMNS.map(col => {
                            const colCards = filtered.filter(c => c.status === col.id);
                            const isOver = dragOver === col.id;
                            return (
                                <div key={col.id}
                                    onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                                    onDragLeave={() => setDragOver(null)}
                                    onDrop={() => handleDrop(col.id)}
                                    style={{
                                        flex: 1, minWidth: 205,
                                        background: isOver ? col.pastel : "rgba(255,255,255,0.4)",
                                        border: `1.5px solid ${isOver ? col.color + "50" : "rgba(99,91,255,0.07)"}`,
                                        borderRadius: 20, padding: "12px 10px",
                                        backdropFilter: "blur(6px)",
                                        transition: "background 0.2s, border-color 0.2s",
                                        boxShadow: isOver ? `0 0 0 3px ${col.color}22, 0 8px 30px ${col.color}14` : "0 2px 12px rgba(99,91,255,0.04)",
                                    }}
                                >
                                    <div style={{ background: col.pastel, border: `1.5px solid ${col.border}`, borderRadius: 13, padding: "9px 12px", marginBottom: 11, display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>{col.emoji}</span>
                                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: col.text }}>{col.label}</span>
                                        <span style={{ marginLeft: "auto", background: col.color, color: "#fff", borderRadius: 99, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, padding: "0 6px", boxShadow: `0 2px 8px ${col.color}44` }}>
                                            {colCards.length}
                                        </span>
                                    </div>

                                    <div style={{ minHeight: 80 }}>
                                        {colCards.map(card => (
                                            <Card key={card.id} card={card} col={col}
                                                onEdit={openEdit}
                                                onDelete={id => setDeleteTarget(cards.find(c => c.id === id))}
                                                onDragStart={setDragId}
                                                dragging={dragId === card.id}
                                            />
                                        ))}
                                        {colCards.length === 0 && (
                                            <div className="empty-drop" style={{ borderColor: isOver ? col.color : col.border, color: isOver ? col.text : "#c7d2fe", background: isOver ? `${col.color}08` : "transparent" }}>
                                                <span style={{ fontSize: 20, opacity: 0.5 }}>{col.emoji}</span>
                                                <span>{isOver ? "Drop here!" : "No applications yet"}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button className="quick-add-btn"
                                        style={{ borderColor: col.border }}
                                        onClick={() => { setForm({ ...EMPTY_FORM, status: col.id }); setEditCard(null); setShowModal(true); }}
                                        onMouseEnter={e => { e.currentTarget.style.background = col.pastel; e.currentTarget.style.color = col.text; e.currentTarget.style.borderColor = col.color + "60"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a5b4fc"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                                    >
                                        + Add to {col.label}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <footer style={{ textAlign: "center", paddingBottom: 32, color: "#c7d2fe", fontSize: 12, fontWeight: 500 }}>
                💡 Drag & drop cards between columns · Changes sync in real-time · Press <kbd style={{ background: "#e0e7ff", color: "#635bff", borderRadius: 5, padding: "1px 6px", fontSize: 11 }}>Esc</kbd> to close
            </footer>

            {/* MODALS */}
            {showModal && (
                <Modal form={form} setForm={setForm} onSave={handleSave} onClose={() => setShowModal(false)} isEdit={editCard !== null} saving={saving} />
            )}
            {deleteTarget && (
                <DeleteConfirm card={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} saving={saving} />
            )}
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
