import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { readSheet } from "read-excel-file/browser";
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

  /* ── Dark Mode overrides ── */
  [data-theme="dark"] body { color: #e8e6ff; }
  [data-theme="dark"] .app-bg {
    background:
      radial-gradient(ellipse 80% 50% at 10% -10%, rgba(99,91,255,0.13) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 90% 0%,   rgba(30,80,255,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 50% 100%, rgba(99,91,255,0.07) 0%, transparent 60%),
      #0d0d1a;
  }
  [data-theme="dark"] .card {
    background: #1a1830;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,91,255,0.1);
  }
  [data-theme="dark"] .card:hover {
    box-shadow: 0 16px 40px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(99,91,255,0.22);
  }
  [data-theme="dark"] .modal-box,
  [data-theme="dark"] .delete-box { background: #1a1830; }
  [data-theme="dark"] .modal-overlay,
  [data-theme="dark"] .delete-overlay { background: rgba(4,4,14,0.65); }
  [data-theme="dark"] .input-field {
    background: #13111f; border-color: rgba(99,91,255,0.25); color: #e8e6ff;
  }
  [data-theme="dark"] .input-field:focus { border-color: #818cf8; background: #1a1830; }
  [data-theme="dark"] .search-input {
    background: rgba(26,24,48,0.8); border-color: rgba(99,91,255,0.2); color: #e8e6ff;
  }
  [data-theme="dark"] .search-input:focus { background: #1a1830; }
  [data-theme="dark"] .stat-pill { background: rgba(26,24,48,0.85); border-color: rgba(99,91,255,0.15); }
  [data-theme="dark"] .signout-btn { background: #13111f; border-color: rgba(99,91,255,0.25); color: #818cf8; }
  [data-theme="dark"] .signout-btn:hover { background: rgba(99,91,255,0.15); border-color: rgba(99,91,255,0.4); }
  [data-theme="dark"] .btn-icon { background: #1a1830; border-color: rgba(99,91,255,0.2); }
  [data-theme="dark"] .btn-icon:hover { background: rgba(99,91,255,0.2); }
  [data-theme="dark"] .quick-add-btn { color: rgba(165,180,252,0.55); border-color: rgba(99,91,255,0.18); }
  [data-theme="dark"] .quick-add-btn:hover { background: rgba(99,91,255,0.12); color: #818cf8; border-color: rgba(99,91,255,0.4); }
  [data-theme="dark"] .skeleton {
    background: linear-gradient(90deg, #1a1830 25%, #201d42 50%, #1a1830 75%);
    background-size: 200% 100%;
  }
  [data-theme="dark"] .cancel-btn { border-color: rgba(99,91,255,0.25); background: #13111f; color: #818cf8; }
  [data-theme="dark"] .cancel-btn:hover { background: rgba(99,91,255,0.15); border-color: rgba(99,91,255,0.4); }
  [data-theme="dark"] ::-webkit-scrollbar-thumb { background: rgba(99,91,255,0.3); }
  [data-theme="dark"] select option { background: #1a1830; color: #e8e6ff; }
`;

/* ─── CONSTANTS ─── */
const COLUMNS = [
    { id: "saved", label: "Saved", emoji: "🔖", color: "#8B5CF6", pastel: "#ede9fe", text: "#7c3aed", border: "#ddd6fe" },
    { id: "applied", label: "Applied", emoji: "📤", color: "#3B82F6", pastel: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
    { id: "interview", label: "Interview", emoji: "🎯", color: "#F59E0B", pastel: "#fef3c7", text: "#b45309", border: "#fde68a" },
    { id: "offer", label: "Offer", emoji: "🎉", color: "#10B981", pastel: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    { id: "rejected", label: "Rejected", emoji: "✖", color: "#F43F5E", pastel: "#ffe4e6", text: "#9f1239", border: "#fecdd3" },
];

const EMPTY_FORM = { company: "", role: "", location: "", deadline: "", salary: "", notes: "", status: "saved", resume_url: "", job_link: "", tags: [] };
const LOGO_COLORS = ["#635bff", "#3b82f6", "#f59e0b", "#10b981", "#f43f5e", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];
const logoColor = (n) => LOGO_COLORS[(n?.charCodeAt(0) || 65) % LOGO_COLORS.length];
const ATTACHMENT_LABELS = ["Resume", "Cover Letter", "Other Document"];
const PRESET_TAGS = [
    { label: "Remote",    color: "#10b981" },
    { label: "Hybrid",    color: "#3b82f6" },
    { label: "On-site",   color: "#8b5cf6" },
    { label: "Dream Job", color: "#f59e0b" },
    { label: "Urgent",    color: "#ef4444" },
    { label: "Referral",  color: "#06b6d4" },
    { label: "Startup",   color: "#ec4899" },
    { label: "Part-time", color: "#84cc16" },
];
const tagColor = (label) => PRESET_TAGS.find(p => p.label === label)?.color ?? "#6366f1";

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

/* ─── IMPORT (Excel / CSV) ─── */
const IMPORT_FIELD_ALIASES = {
    company: ["company", "company name", "employer"],
    role: ["role", "position", "job title", "title"],
    location: ["location", "city"],
    status: ["status"],
    deadline: ["deadline", "application deadline", "due date"],
    salary: ["salary", "salary / stipend", "salary/stipend", "stipend"],
    job_link: ["job link", "link", "url", "job url"],
    notes: ["notes", "note", "comments"],
    resume: ["resume", "resume link", "resume url", "cv"],
    date_applied: ["date applied", "applied date", "date added", "added"],
};

function parseCSVText(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
            else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
            if (c === "\r" && text[i + 1] === "\n") i++;
            row.push(field); rows.push(row); row = []; field = "";
        } else field += c;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows.filter(r => r.length > 1 || r[0] !== "");
}

function resolveImportColumns(headerRow) {
    const norm = headerRow.map(h => String(h ?? "").trim().toLowerCase());
    const find = (aliases) => { const idx = norm.findIndex(h => aliases.includes(h)); return idx === -1 ? null : idx; };
    return Object.fromEntries(Object.entries(IMPORT_FIELD_ALIASES).map(([field, aliases]) => [field, find(aliases)]));
}

const cellStr = (v) => (v === undefined || v === null ? "" : String(v).trim());

function normalizeImportDate(v) {
    if (!v) return "";
    // Date objects from parsed Excel cells are built in UTC — read them back with UTC getters.
    if (v instanceof Date) {
        if (isNaN(v)) return "";
        return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
    }
    const s = String(v).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    // Non-ISO strings (e.g. "08/15/2026") are parsed by Date() in local time —
    // read them back with local getters, or toISOString()'s UTC conversion can shift the day.
    const d = new Date(s);
    return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeImportStatus(v) {
    const s = cellStr(v).toLowerCase();
    if (!s) return "saved";
    return COLUMNS.find(c => c.id === s || c.label.toLowerCase() === s)?.id || "saved";
}

async function parseImportFile(file) {
    const isCSV = /\.csv$/i.test(file.name);
    let headerRow, dataRows;
    if (isCSV) {
        const text = await file.text();
        [headerRow, ...dataRows] = parseCSVText(text);
    } else {
        const rows = await readSheet(file); // flat rows for the first sheet
        [headerRow, ...dataRows] = rows;
    }
    return { headerRow: headerRow || [], dataRows: dataRows || [] };
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

function Card({ card, col, onEdit, onDelete, onDragStart, dragging, T, selectMode, selected, onToggleSelect, onView }) {
    const divider = T.divider;
    return (
        <div
            className={`card${dragging ? " dragging" : ""}`}
            draggable={!selectMode} onDragStart={() => onDragStart(card.id)}
            onClick={() => { if (selectMode) onToggleSelect(card.id); else onView(card); }}
            style={{
                borderTop: `3px solid ${col.color}`, cursor: selectMode ? "pointer" : "grab",
                boxShadow: selected ? `0 0 0 2px #635bff, 0 2px 8px rgba(99,91,255,0.07)` : undefined,
            }}
        >
            <div style={{ position: "absolute", top: -20, right: -20, width: 64, height: 64, borderRadius: "50%", background: col.color, opacity: 0.07, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                {selectMode && (
                    <input
                        type="checkbox" checked={!!selected}
                        onChange={() => onToggleSelect(card.id)} onClick={e => e.stopPropagation()}
                        style={{ width: 18, height: 18, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
                    />
                )}
                <LogoBadge letter={card.logo || card.company?.[0]} name={card.company} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.company}</div>
                    <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{card.role}</div>
                </div>
                {!selectMode && (
                    <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(card); }}>✏️</button>
                        <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(card.id); }}>🗑</button>
                    </div>
                )}
            </div>

            {/* Location / Salary / Deadline badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                {card.location && <span className="tag" style={{ background: "#f0f2ff", color: "#4f46e5", border: "1px solid #e0e7ff" }}>📍 {card.location}</span>}
                {card.salary && <span className="tag" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>💰 {card.salary}</span>}
                {card.deadline && <DeadlineBadge deadline={card.deadline} />}
            </div>

            {/* Tags */}
            {card.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {card.tags.map((tag, i) => {
                        const c = tagColor(tag);
                        return (
                            <span key={i} className="tag" style={{ background: `${c}18`, color: c, border: `1px solid ${c}30`, fontSize: 10 }}>
                                {tag}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Attachments */}
            {(() => {
                const atts = card.attachments?.length > 0 ? card.attachments : card.resume_url ? [{ label: "Resume", url: card.resume_url }] : [];
                return atts.length > 0 ? (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                        {atts.map((att, i) => (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="tag"
                                style={{ background: T.tagBg, color: T.tagText, border: `1px solid ${T.tagBorder}`, textDecoration: "none" }}
                                onClick={e => e.stopPropagation()}>📄 {att.label}</a>
                        ))}
                    </div>
                ) : null;
            })()}

            {/* Job links */}
            {(() => {
                const links = card.job_links?.length > 0 ? card.job_links : card.job_link ? [card.job_link] : [];
                return links.length > 0 ? (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                        {links.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="tag"
                                style={{ background: T.tagBg, color: T.tagText, border: `1px solid ${T.tagBorder}`, textDecoration: "none" }}
                                onClick={e => e.stopPropagation()}>🔗 {links.length > 1 ? `Link ${i + 1}` : "Job Link"}</a>
                        ))}
                    </div>
                ) : null;
            })()}

            {card.deadline && <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 600, marginBottom: 5 }}>📅 {formatDate(card.deadline)}</div>}

            {card.notes && (
                <div style={{ fontSize: 11.5, color: T.textSec, borderTop: `1px solid ${divider}`, paddingTop: 7, marginTop: 3, lineHeight: 1.6, fontStyle: "italic" }}>
                    {card.notes.length > 90 ? card.notes.slice(0, 90) + "…" : card.notes}
                </div>
            )}

            {/* Status history timeline */}
            {card.status_history?.length > 1 && (
                <div style={{ marginTop: 7, paddingTop: 6, borderTop: `1px solid ${divider}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {card.status_history.map((h, i) => {
                            const hCol = COLUMNS.find(c => c.id === h.status);
                            if (!hCol) return null;
                            const dateStr = new Date(h.changed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                            return (
                                <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    <span title={`${hCol.label}: ${dateStr}`}
                                        style={{ width: 9, height: 9, borderRadius: "50%", background: hCol.color, flexShrink: 0, cursor: "help", display: "inline-block" }} />
                                    {i < card.status_history.length - 1 &&
                                        <span style={{ width: 10, height: 1, background: divider, display: "inline-block" }} />}
                                </span>
                            );
                        })}
                    </div>
                    <div style={{ fontSize: 9, color: "#a5b4fc", marginTop: 2, fontWeight: 600 }}>
                        {card.status_history.length} status {card.status_history.length === 1 ? "state" : "moves"} · hover dots for dates
                    </div>
                </div>
            )}

            {/* Date added */}
            {card.created_at && (
                <div style={{ fontSize: 10, color: "#c7d2fe", fontWeight: 500, marginTop: 7, paddingTop: 6, borderTop: `1px solid ${divider}` }}>
                    🗓 Added {new Date(card.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
            )}
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, type = "text", isTextarea, accept }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label className="label">{label}</label>
            {isTextarea
                ? <textarea className="input-field" value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ resize: "vertical" }} />
                : <input className="input-field" type={type} accept={accept} value={value} onChange={onChange} placeholder={placeholder} />
            }
        </div>
    );
}

function Modal({ form, setForm, onSave, onClose, isEdit, saving, attachmentSlots, setAttachmentSlots, jobLinks, setJobLinks, T }) {
    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
    const fileInputRefs = useRef({});
    const [customTag, setCustomTag] = useState("");
    const col = COLUMNS.find(c => c.id === form.status) || COLUMNS[0];

    const addTag = (label) => {
        if (!label.trim() || (form.tags || []).includes(label.trim())) return;
        setForm(p => ({ ...p, tags: [...(p.tags || []), label.trim()] }));
    };
    const removeTag = (label) => setForm(p => ({ ...p, tags: (p.tags || []).filter(t => t !== label) }));
    const addCustomTag = () => { addTag(customTag); setCustomTag(""); };

    const addSlot = () => {
        if (attachmentSlots.length >= 3) return;
        const used = attachmentSlots.map(s => s.label);
        const next = ATTACHMENT_LABELS.find(l => !used.includes(l)) || "Other Document";
        setAttachmentSlots(prev => [...prev, { label: next, existingUrl: "", file: null }]);
    };
    const removeSlot = (i) => setAttachmentSlots(prev => prev.filter((_, idx) => idx !== i));
    const updateSlotLabel = (i, label) => setAttachmentSlots(prev => prev.map((s, idx) => idx === i ? { ...s, label } : s));
    const handleSlotFile = (i, file) => setAttachmentSlots(prev => prev.map((s, idx) => idx === i ? { ...s, file, existingUrl: "" } : s));

    const addLink = () => setJobLinks(prev => [...prev, ""]);
    const removeLink = (i) => setJobLinks(prev => prev.filter((_, idx) => idx !== i));
    const updateLink = (i, val) => setJobLinks(prev => prev.map((l, idx) => idx === i ? val : l));

    const removeBtn = (onClick) => (
        <button type="button" onClick={onClick} style={{
            background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8,
            width: 28, height: 28, cursor: "pointer", fontSize: 13, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
    );

    const addBtn = (onClick, label) => (
        <button type="button" onClick={onClick} style={{
            background: "#ede9fe", border: "none", borderRadius: 8,
            padding: "4px 10px", fontSize: 12, fontWeight: 700,
            color: "#635bff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}>+ {label}</button>
    );

    const modalContent = (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: col.pastel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                                {isEdit ? "✏️" : col.emoji}
                            </div>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.text }}>
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

                    {/* ── Documents (multi-upload) ── */}
                    <div style={{ gridColumn: "1/-1", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <label className="label" style={{ margin: 0 }}>Documents (PDF / DOC)</label>
                            {attachmentSlots.length < 3 && addBtn(addSlot, "Add Document")}
                        </div>
                        {attachmentSlots.map((slot, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                <select
                                    value={slot.label}
                                    onChange={e => updateSlotLabel(i, e.target.value)}
                                    className="input-field"
                                    style={{ width: 148, flexShrink: 0, appearance: "auto", cursor: "pointer", fontSize: 12 }}
                                >
                                    {ATTACHMENT_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <input
                                    ref={el => fileInputRefs.current[i] = el}
                                    type="file" accept=".pdf,.doc,.docx"
                                    onChange={e => e.target.files?.[0] && handleSlotFile(i, e.target.files[0])}
                                    style={{ display: "none" }}
                                />
                                <div
                                    onClick={() => fileInputRefs.current[i]?.click()}
                                    className="input-field"
                                    style={{
                                        flex: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                        color: (slot.file || slot.existingUrl) ? "#1e1b4b" : "#a5b4fc",
                                        userSelect: "none", fontSize: 12, overflow: "hidden",
                                    }}
                                >
                                    <span style={{ flexShrink: 0 }}>📎</span>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {slot.file
                                            ? slot.file.name
                                            : slot.existingUrl
                                                ? "Click to replace file"
                                                : "Choose file (PDF / DOC)"}
                                    </span>
                                </div>
                                {attachmentSlots.length > 1 && removeBtn(() => removeSlot(i))}
                            </div>
                        ))}
                        <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>
                            Add up to 3 documents — e.g. Resume, Cover Letter, Portfolio
                        </div>
                    </div>

                    {/* ── Job Links (multi-link) ── */}
                    <div style={{ gridColumn: "1/-1", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <label className="label" style={{ margin: 0 }}>Job Links</label>
                            {addBtn(addLink, "Add Link")}
                        </div>
                        {jobLinks.map((link, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                <input
                                    className="input-field"
                                    type="url"
                                    value={link}
                                    onChange={e => updateLink(i, e.target.value)}
                                    placeholder="https://linkedin.com/jobs/..."
                                    style={{ flex: 1 }}
                                />
                                {jobLinks.length > 1 && removeBtn(() => removeLink(i))}
                            </div>
                        ))}
                    </div>

                    <FormField label="Deadline" value={form.deadline} onChange={f("deadline")} type="date" />
                    <div style={{ marginBottom: 14 }}>
                        <label className="label">Status</label>
                        <select className="input-field" value={form.status} onChange={f("status")} style={{ appearance: "auto", cursor: "pointer" }}>
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}><FormField label="Notes" value={form.notes} onChange={f("notes")} placeholder="Any extra details…" isTextarea /></div>

                    {/* ── Tags ── */}
                    <div style={{ gridColumn: "1/-1", marginBottom: 6 }}>
                        <label className="label" style={{ display: "block", marginBottom: 8 }}>Tags</label>

                        {/* Active tags */}
                        {(form.tags || []).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                                {(form.tags || []).map((tag, i) => {
                                    const c = tagColor(tag);
                                    return (
                                        <span key={i} onClick={() => removeTag(tag)} style={{
                                            display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                                            background: `${c}18`, color: c, border: `1px solid ${c}35`,
                                            borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 600,
                                        }}>
                                            {tag} <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Preset suggestions */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                            {PRESET_TAGS.filter(p => !(form.tags || []).includes(p.label)).map(p => (
                                <span key={p.label} onClick={() => addTag(p.label)} style={{
                                    display: "inline-flex", cursor: "pointer",
                                    background: T.tagBg, color: T.tagText,
                                    border: `1px solid ${T.tagBorder}`,
                                    borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 600,
                                    transition: "all 0.15s",
                                }}>+ {p.label}</span>
                            ))}
                        </div>

                        {/* Custom tag input */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                className="input-field"
                                placeholder="Custom tag…"
                                value={customTag}
                                onChange={e => setCustomTag(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                                style={{ flex: 1, fontSize: 12 }}
                            />
                            <button type="button" onClick={addCustomTag} style={{
                                background: "linear-gradient(135deg,#635bff,#818cf8)", color: "#fff",
                                border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 700,
                                fontSize: 13, cursor: "pointer", flexShrink: 0,
                            }}>Add</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={() => onSave()} disabled={!form.company || !form.role || saving}>
                        {saving ? "⏳ Saving…" : isEdit ? "Save Changes" : "Add Application"}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

function DeleteConfirm({ card, onConfirm, onCancel, saving }) {
    const content = (
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
    return ReactDOM.createPortal(content, document.body);
}

function DuplicateConfirm({ company, role, onConfirm, onCancel, saving }) {
    const content = (
        <div className="delete-overlay">
            <div className="delete-box">
                <div style={{ fontSize: 38, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: "#1e1b4b", marginBottom: 8 }}>Possible Duplicate</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 22, lineHeight: 1.6 }}>
                    You already have an application for <strong style={{ color: "#6366f1" }}>{company}</strong> — {role}. Add it anyway?
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="cancel-btn" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
                    <button disabled={saving} onClick={onConfirm} style={{
                        flex: 1, padding: "11px", borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg,#635bff,#818cf8)",
                        color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14,
                        fontFamily: "'Syne',sans-serif", opacity: saving ? 0.6 : 1,
                        boxShadow: "0 4px 14px rgba(99,91,255,0.3)",
                    }}>{saving ? "Saving…" : "Add Anyway"}</button>
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(content, document.body);
}

function DetailField({ label, value, color }) {
    return (
        <div>
            <div className="label" style={{ marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
        </div>
    );
}

function DetailModal({ card, col, T, onEdit, onClose }) {
    const atts = card.attachments?.length > 0 ? card.attachments : card.resume_url ? [{ label: "Resume", url: card.resume_url }] : [];
    const links = card.job_links?.length > 0 ? card.job_links : card.job_link ? [card.job_link] : [];

    const content = (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 480 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <LogoBadge letter={card.logo || card.company?.[0]} name={card.company} size={48} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: T.text, overflowWrap: "break-word" }}>{card.company}</div>
                            <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, marginTop: 2 }}>{card.role}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32, fontSize: 15, flexShrink: 0 }}>✕</button>
                </div>

                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6, background: col.pastel, color: col.text,
                    border: `1px solid ${col.border}`, borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700, marginBottom: 18,
                }}>
                    {col.emoji} {col.label}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                    <DetailField label="Location" value={card.location || "—"} color={T.text} />
                    <DetailField label="Salary / Stipend" value={card.salary || "—"} color={T.text} />
                    <DetailField label="Deadline" value={card.deadline ? formatDate(card.deadline) : "—"} color={T.text} />
                    <DetailField label="Date Added" value={card.created_at ? new Date(card.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} color={T.text} />
                </div>

                {card.tags?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Tags</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                            {card.tags.map((t, i) => {
                                const c = tagColor(t);
                                return <span key={i} className="tag" style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{t}</span>;
                            })}
                        </div>
                    </div>
                )}

                {links.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Job Links</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                            {links.map((l, i) => (
                                <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#635bff", fontWeight: 600, wordBreak: "break-all" }}>🔗 {l}</a>
                            ))}
                        </div>
                    </div>
                )}

                {atts.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Documents</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            {atts.map((a, i) => (
                                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="tag"
                                    style={{ background: T.tagBg, color: T.tagText, border: `1px solid ${T.tagBorder}`, textDecoration: "none" }}>📄 {a.label}</a>
                            ))}
                        </div>
                    </div>
                )}

                {card.notes && (
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Notes</label>
                        <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, marginTop: 6, whiteSpace: "pre-wrap" }}>{card.notes}</div>
                    </div>
                )}

                {card.status_history?.length > 0 && (
                    <div>
                        <label className="label">Status History</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                            {card.status_history.map((h, i) => {
                                const hCol = COLUMNS.find(c => c.id === h.status);
                                return (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: hCol?.color || "#ccc", flexShrink: 0 }} />
                                        <span style={{ color: T.text, fontWeight: 600 }}>{hCol?.label || h.status}</span>
                                        <span style={{ color: "#a5b4fc", marginLeft: "auto", flexShrink: 0 }}>
                                            {new Date(h.changed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button className="cancel-btn" onClick={onClose}>Close</button>
                    <button className="save-btn" onClick={onEdit}>✏️ Edit</button>
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(content, document.body);
}

function Toast({ message, onDone, actionLabel, onAction }) {
    useEffect(() => { const t = setTimeout(onDone, actionLabel ? 5000 : 3000); return () => clearTimeout(t); }, [onDone, actionLabel]);
    return (
        <div className="toast" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>{message}</span>
            {actionLabel && (
                <button onClick={() => { onAction(); onDone(); }} style={{
                    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                    color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", flexShrink: 0,
                }}>{actionLabel}</button>
            )}
        </div>
    );
}

/* ─── INSIGHTS (status funnel + weekly activity) ─── */
function weeklyActivity(cards) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
        const start = new Date(today); start.setDate(start.getDate() - i * 7 - 6);
        const end = new Date(today); end.setDate(end.getDate() - i * 7);
        weeks.push({ start, end, count: 0 });
    }
    cards.forEach(c => {
        if (!c.created_at) return;
        const d = new Date(c.created_at);
        const w = weeks.find(w => d >= w.start && d <= new Date(w.end.getTime() + 86399999));
        if (w) w.count++;
    });
    return weeks;
}
const shortDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function InsightsModal({ cards, T, onClose }) {
    const total = cards.length;
    const statusCounts = COLUMNS.map(col => ({ col, count: cards.filter(c => c.status === col.id).length }));
    const maxStatus = Math.max(1, ...statusCounts.map(s => s.count));

    const weeks = weeklyActivity(cards);
    const maxWeek = Math.max(1, ...weeks.map(w => w.count));

    const content = (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 560 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.text }}>Insights</span>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32, fontSize: 15 }}>✕</button>
                </div>

                <div className="label" style={{ marginBottom: 10 }}>Application Funnel</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {statusCounts.map(({ col, count }) => {
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        const widthPct = (count / maxStatus) * 100;
                        return (
                            <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 104, flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                                    <span>{col.emoji}</span><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.label}</span>
                                </div>
                                <div title={`${count} of ${total} application${total === 1 ? "" : "s"} (${pct}%)`}
                                    style={{ flex: 1, height: 16, background: T.divider, borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        width: `${widthPct}%`, minWidth: count > 0 ? 4 : 0, height: "100%",
                                        background: col.color, borderRadius: "0 4px 4px 0", transition: "width 0.4s ease",
                                    }} />
                                </div>
                                <div style={{ width: 26, textAlign: "right", flexShrink: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: T.text }}>
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="label" style={{ marginBottom: 10 }}>Weekly Activity (applications added)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                    {weeks.map((w, i) => {
                        const h = Math.round((w.count / maxWeek) * 64);
                        return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, minHeight: 12 }}>{w.count > 0 ? w.count : ""}</div>
                                <div
                                    title={`${shortDate(w.start)} – ${shortDate(w.end)}: ${w.count} added`}
                                    style={{
                                        width: "100%", height: Math.max(h, w.count > 0 ? 4 : 2),
                                        background: w.count > 0 ? "#635bff" : T.divider,
                                        borderRadius: "4px 4px 0 0",
                                    }}
                                />
                                {(i === 0 || i === weeks.length - 1) && (
                                    <div style={{ fontSize: 9, color: "#a5b4fc", fontWeight: 600 }}>{shortDate(w.start)}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(content, document.body);
}

function ImportPreviewModal({ rows, skipped, onToggle, onSetAllDup, onConfirm, onCancel, importing, T }) {
    const dupCount = rows.filter(r => r._dup).length;
    const includeCount = rows.filter(r => r._include).length;

    const linkBtn = (onClick, label) => (
        <button type="button" onClick={onClick} style={{
            background: T.tagBg, border: `1px solid ${T.tagBorder}`, borderRadius: 8,
            padding: "5px 10px", fontSize: 11.5, fontWeight: 700, color: "#635bff", cursor: "pointer",
        }}>{label}</button>
    );

    const content = (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
            <div className="modal-box" style={{ maxWidth: 640 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📥</div>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.text }}>Import Preview</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#a5b4fc", marginLeft: 46 }}>
                            {rows.length} job{rows.length === 1 ? "" : "s"} found
                            {dupCount > 0 && ` · ${dupCount} possible duplicate${dupCount === 1 ? "" : "s"}`}
                            {skipped > 0 && ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (missing Company/Role)`}
                        </div>
                    </div>
                    <button onClick={onCancel} className="btn-icon" style={{ width: 32, height: 32, fontSize: 15 }}>✕</button>
                </div>

                {dupCount > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        {linkBtn(() => onSetAllDup(true), `Include all ${dupCount} duplicates`)}
                        {linkBtn(() => onSetAllDup(false), `Exclude all duplicates`)}
                    </div>
                )}

                <div style={{ maxHeight: 360, overflowY: "auto", border: `1px solid ${T.divider}`, borderRadius: 12 }}>
                    {rows.map(r => (
                        <label key={r._rowId} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                            borderBottom: `1px solid ${T.divider}`, cursor: "pointer",
                            background: r._dup ? "rgba(245,158,11,0.07)" : "transparent",
                        }}>
                            <input type="checkbox" checked={r._include} onChange={() => onToggle(r._rowId)} style={{ flexShrink: 0, width: 15, height: 15, cursor: "pointer" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {r.company} <span style={{ fontWeight: 500, color: "#6366f1" }}>— {r.role}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 1 }}>
                                    {r.location || "—"}{r.deadline ? ` · due ${r.deadline}` : ""}{r.dateApplied ? ` · applied ${r.dateApplied}` : ""}{r.resume ? " · 📎 resume" : ""}
                                </div>
                            </div>
                            {r._dup && <span className="tag" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", flexShrink: 0 }}>⚠ Already exists</span>}
                        </label>
                    ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="save-btn" onClick={onConfirm} disabled={importing || includeCount === 0}>
                        {importing ? "⏳ Importing…" : `Import ${includeCount} Job${includeCount === 1 ? "" : "s"}`}
                    </button>
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(content, document.body);
}

/* ─── MAIN BOARD PAGE ─── */
export default function BoardPage({ onOpenAdmin }) {
    const { user, signOut, isAdmin } = useAuth();

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
    const [filterStatus, setFilterStatus] = useState(null); // null = show all
    const [sortBy, setSortBy] = useState("newest"); // "newest" | "deadline" | "company"

    const [attachmentSlots, setAttachmentSlots] = useState([{ label: "Resume", existingUrl: "", file: null }]);
    const [jobLinks, setJobLinks] = useState([""]);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("jt-dark") === "1");

    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [viewCard, setViewCard] = useState(null);
    const [reminderDismissed, setReminderDismissed] = useState(false);
    const [notifPermission, setNotifPermission] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "unsupported"));
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [importRows, setImportRows] = useState(null); // null = modal closed
    const [importSkipped, setImportSkipped] = useState(0);
    const [importing, setImporting] = useState(false);
    const importInputRef = useRef(null);

    const T = {
        text:      darkMode ? "#e8e6ff" : "#1e1b4b",
        textSec:   darkMode ? "#9ca3af" : "#6b7280",
        headerBg:  darkMode ? "rgba(13,13,26,0.9)"  : "rgba(255,255,255,0.72)",
        colBg:     darkMode ? "rgba(26,24,48,0.55)"  : "rgba(255,255,255,0.4)",
        colBorder: darkMode ? "rgba(99,91,255,0.13)" : "rgba(99,91,255,0.07)",
        pillBg:    darkMode ? "rgba(26,24,48,0.85)"  : "rgba(255,255,255,0.8)",
        divider:   darkMode ? "rgba(99,91,255,0.14)" : "#f3f4f6",
        tagBg:     darkMode ? "#13111f"  : "#f8fafc",
        tagText:   darkMode ? "#a5b4fc"  : "#334155",
        tagBorder: darkMode ? "rgba(99,91,255,0.2)"  : "#e2e8f0",
        sortBg:    darkMode ? "rgba(26,24,48,0.8)"   : "rgba(255,255,255,0.8)",
    };

    const styleRef = useRef(null);

    /* Inject styles once */
    useEffect(() => {
        const el = document.createElement("style");
        el.textContent = GLOBAL_CSS;
        document.head.appendChild(el);
        styleRef.current = el;
        return () => el.remove();
    }, []);

    /* Sync dark mode to <html> and localStorage */
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
        localStorage.setItem("jt-dark", darkMode ? "1" : "0");
    }, [darkMode]);

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

    /* Keep the open detail view in sync if the card changes elsewhere (e.g. another tab) */
    useEffect(() => {
        if (!viewCard) return;
        const latest = cards.find(c => c.id === viewCard.id);
        if (latest && latest !== viewCard) setViewCard(latest);
        if (!latest) setViewCard(null);
    }, [cards, viewCard]);

    /* Keyboard shortcuts */
    useEffect(() => {
        const fn = e => {
            if (e.key === "Escape") { setShowModal(false); setDeleteTarget(null); setDuplicateWarning(false); setViewCard(null); }
            // Press 'N' to open Add modal (when not typing in an input)
            if (e.key === "n" && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "SELECT") {
                setForm(EMPTY_FORM); setEditCard(null); setAttachmentSlots([{ label: "Resume", existingUrl: "", file: null }]); setJobLinks([""]); setDuplicateWarning(false); setShowModal(true);
            }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);

    /* CSV Export */
    const exportCSV = useCallback(() => {
        const headers = ["Company", "Role", "Location", "Status", "Deadline", "Salary", "Job Link", "Job Links", "Tags", "Attachments", "Notes"];
        const rows = cards.map(c => {
            const links = c.job_links?.length > 0 ? c.job_links : c.job_link ? [c.job_link] : [];
            const atts = c.attachments?.length > 0 ? c.attachments : c.resume_url ? [{ label: "Resume", url: c.resume_url }] : [];
            return [
                c.company, c.role, c.location || "", c.status, c.deadline || "", c.salary || "",
                links[0] || "", links.join("; "),
                (c.tags || []).join("; "),
                atts.map(a => `${a.label}: ${a.url}`).join("; "),
                c.notes || "",
            ];
        });
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `jobtrack-export-${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
        showToast("📥 Exported to CSV!");
    }, [cards]);

    /* ── Import from Excel/CSV ── */
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        try {
            const { headerRow, dataRows } = await parseImportFile(file);
            if (dataRows.length === 0) { showToast("⚠️ No rows found in file"); return; }

            const cols = resolveImportColumns(headerRow);
            if (cols.company === null || cols.role === null) {
                showToast("❌ Couldn't find Company/Role columns — check the file's headers");
                return;
            }

            const existingKeys = new Set(cards.map(c => `${c.company.trim().toLowerCase()}|${c.role.trim().toLowerCase()}`));
            const parsed = dataRows.map((row, i) => {
                const company = cellStr(row[cols.company]);
                const role = cellStr(row[cols.role]);
                if (!company || !role) return null;
                const isDup = existingKeys.has(`${company.toLowerCase()}|${role.toLowerCase()}`);
                const resumeRaw = cols.resume !== null ? cellStr(row[cols.resume]) : "";
                return {
                    _rowId: i,
                    company, role,
                    location: cols.location !== null ? cellStr(row[cols.location]) : "",
                    status: cols.status !== null ? normalizeImportStatus(row[cols.status]) : "saved",
                    deadline: cols.deadline !== null ? normalizeImportDate(row[cols.deadline]) : "",
                    salary: cols.salary !== null ? cellStr(row[cols.salary]) : "",
                    job_link: cols.job_link !== null ? cellStr(row[cols.job_link]) : "",
                    notes: cols.notes !== null ? cellStr(row[cols.notes]) : "",
                    resume: resumeRaw.includes("://") ? resumeRaw : "",
                    dateApplied: cols.date_applied !== null ? normalizeImportDate(row[cols.date_applied]) : "",
                    _dup: isDup,
                    _include: !isDup,
                };
            }).filter(Boolean);

            if (parsed.length === 0) { showToast("❌ No valid rows (need Company + Role)"); return; }
            setImportSkipped(dataRows.length - parsed.length);
            setImportRows(parsed);
        } catch (err) {
            showToast("❌ Couldn't read file: " + err.message);
        }
    };

    const toggleImportRow = (rowId) => setImportRows(prev => prev.map(r => r._rowId === rowId ? { ...r, _include: !r._include } : r));
    const setAllImportDup = (include) => setImportRows(prev => prev.map(r => r._dup ? { ...r, _include: include } : r));

    const confirmImport = async () => {
        const selected = importRows.filter(r => r._include);
        if (selected.length === 0) { setImportRows(null); return; }
        setImporting(true);
        const now = new Date().toISOString();
        const payloads = selected.map(r => {
            // "Date Applied" from the sheet becomes the card's created_at, so imported
            // history keeps its real date instead of showing today as "date added".
            const appliedAt = r.dateApplied ? new Date(r.dateApplied + "T12:00:00").toISOString() : now;
            const attachments = r.resume ? [{ label: "Resume", url: r.resume }] : [];
            return {
                company: r.company,
                role: r.role,
                location: r.location || null,
                deadline: r.deadline || null,
                salary: r.salary || null,
                notes: r.notes || null,
                status: r.status,
                attachments,
                job_links: r.job_link ? [r.job_link] : [],
                resume_url: r.resume || null,
                job_link: r.job_link || null,
                tags: [],
                status_history: [{ status: r.status, changed_at: appliedAt }],
                logo: r.company[0].toUpperCase(),
                created_at: appliedAt,
                user_id: user.id,
            };
        });

        const { error } = await supabase.from("internship_cards").insert(payloads);
        setImporting(false);
        if (error) { showToast("❌ Import failed: " + error.message); return; }

        const skippedDup = importRows.length - selected.length;
        showToast(`📥 Imported ${selected.length} job${selected.length === 1 ? "" : "s"}` + (skippedDup ? ` · ${skippedDup} skipped` : ""));
        setImportRows(null);
    };

    /* ── Derived state ── */
    const sortCards = useCallback((arr) => {
        if (sortBy === "company") return [...arr].sort((a, b) => a.company.localeCompare(b.company));
        if (sortBy === "deadline") return [...arr].sort((a, b) => {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
        // newest first (default)
        return [...arr].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [sortBy]);

    const filtered = sortCards(cards.filter(c =>
        (!search ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(search.toLowerCase()))
    ));
    const total = cards.length;
    const responseRate = total ? Math.round((cards.filter(c => ["interview", "offer"].includes(c.status)).length / total) * 100) : 0;
    const statMap = Object.fromEntries(COLUMNS.map(col => [col.id, cards.filter(c => c.status === col.id).length]));
    const visibleColumns = filterStatus ? COLUMNS.filter(c => c.id === filterStatus) : COLUMNS;
    const dueSoonCards = cards.filter(c => {
        if (c.status === "offer" || c.status === "rejected") return false;
        const d = daysLeft(c.deadline);
        return d !== null && d >= 0 && d <= 3;
    });

    /* Browser notification for upcoming deadlines — at most once per day */
    useEffect(() => {
        if (notifPermission !== "granted" || dueSoonCards.length === 0) return;
        const today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem("jt-last-notified") === today) return;
        localStorage.setItem("jt-last-notified", today);
        new Notification("JobTrack — deadlines coming up", {
            body: `${dueSoonCards.length} application${dueSoonCards.length === 1 ? "" : "s"} due within 3 days.`,
            icon: "/icon-192.png",
        });
    }, [dueSoonCards.length, notifPermission]);

    const enableReminders = () => {
        if (typeof Notification === "undefined") return;
        Notification.requestPermission().then(setNotifPermission);
    };

    /* ── Open modal helpers ── */
    const openAdd = useCallback(() => {
        setForm(EMPTY_FORM);
        setEditCard(null);
        setAttachmentSlots([{ label: "Resume", existingUrl: "", file: null }]);
        setJobLinks([""]);
        setDuplicateWarning(false);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((card) => {
        setForm({ ...card, deadline: card.deadline || "", tags: card.tags || [] });
        setEditCard(card.id);
        const existingAtts = card.attachments?.length > 0
            ? card.attachments.map(a => ({ label: a.label, existingUrl: a.url, file: null }))
            : card.resume_url
                ? [{ label: "Resume", existingUrl: card.resume_url, file: null }]
                : [{ label: "Resume", existingUrl: "", file: null }];
        setAttachmentSlots(existingAtts);
        const existingLinks = card.job_links?.length > 0
            ? card.job_links
            : card.job_link ? [card.job_link] : [""];
        setJobLinks(existingLinks);
        setShowModal(true);
    }, []);
    const showToast = (msg) => setToast({ message: msg });
    const showUndoToast = (msg, onAction) => setToast({ message: msg, actionLabel: "Undo", onAction });

    /* ── CRUD: Save ── */
    const handleSave = async (force = false) => {
        if (!form.company.trim() || !form.role.trim()) return;

        if (!editCard && force !== true) {
            const isDup = cards.some(c =>
                c.company.trim().toLowerCase() === form.company.trim().toLowerCase() &&
                c.role.trim().toLowerCase() === form.role.trim().toLowerCase()
            );
            if (isDup) { setDuplicateWarning(true); return; }
        }
        setDuplicateWarning(false);
        setSaving(true);

        // Upload any new files in attachment slots
        const finalAttachments = [];
        for (let i = 0; i < attachmentSlots.length; i++) {
            const slot = attachmentSlots[i];
            if (slot.file) {
                const ext = slot.file.name.split(".").pop();
                const fileName = `${user.id}-${slot.label.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}-${i}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("resumes")
                    .upload(fileName, slot.file, { upsert: true });
                if (uploadError) {
                    showToast("❌ Upload failed: " + uploadError.message);
                    setSaving(false);
                    return;
                }
                const { data } = supabase.storage.from("resumes").getPublicUrl(fileName);
                if (data?.publicUrl) finalAttachments.push({ label: slot.label, url: data.publicUrl });
            } else if (slot.existingUrl) {
                finalAttachments.push({ label: slot.label, url: slot.existingUrl });
            }
        }

        const finalJobLinks = jobLinks.filter(l => l.trim());
        const now = new Date().toISOString();

        // Build status_history
        let statusHistory;
        if (editCard) {
            const existing = cards.find(c => c.id === editCard);
            const prev = existing?.status_history || [];
            const lastStatus = prev.length > 0 ? prev[prev.length - 1].status : null;
            statusHistory = lastStatus !== form.status
                ? [...prev, { status: form.status, changed_at: now }]
                : prev;
        } else {
            statusHistory = [{ status: form.status, changed_at: now }];
        }

        const logo = form.company[0].toUpperCase();
        const payload = {
            company: form.company.trim(),
            role: form.role.trim(),
            location: form.location || null,
            deadline: form.deadline || null,
            salary: form.salary || null,
            notes: form.notes || null,
            status: form.status,
            attachments: finalAttachments,
            job_links: finalJobLinks,
            resume_url: finalAttachments.find(a => a.label === "Resume")?.url || null,
            job_link: finalJobLinks[0] || null,
            tags: form.tags || [],
            status_history: statusHistory,
            logo,
            user_id: user.id,
        };

        if (editCard) {
            const { error } = await supabase.from("internship_cards").update(payload).eq("id", editCard);
            if (error) { showToast("❌ Error: " + error.message); setSaving(false); return; }
            showToast("✅ Application updated!");
        } else {
            const { error } = await supabase.from("internship_cards").insert([payload]);
            if (error) { showToast("❌ Error: " + error.message); setSaving(false); return; }
            showToast("🎉 Application added!");
        }
        setSaving(false);
        setAttachmentSlots([{ label: "Resume", existingUrl: "", file: null }]);
        setJobLinks([""]);
        setShowModal(false);
    };

    /* ── CRUD: Delete (soft — 5s undo window before the row is actually deleted) ── */
    const confirmDelete = () => {
        const card = deleteTarget;
        if (!card) return;
        setDeleteTarget(null);
        setCards(prev => prev.filter(c => c.id !== card.id));

        const timeoutId = setTimeout(async () => {
            await supabase.from("internship_cards").delete().eq("id", card.id);
        }, 5000);

        showUndoToast(`🗑 Removed ${card.company}`, () => {
            clearTimeout(timeoutId);
            setCards(prev => prev.some(c => c.id === card.id) ? prev : [...prev, card]);
        });
    };

    /* ── Bulk select actions ── */
    const toggleSelect = (id) => setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)));
    const clearSelection = () => setSelectedIds(new Set());
    const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

    const bulkDelete = () => {
        const ids = [...selectedIds];
        const removedCards = cards.filter(c => ids.includes(c.id));
        if (removedCards.length === 0) return;
        setCards(prev => prev.filter(c => !ids.includes(c.id)));
        exitSelectMode();

        const timeoutId = setTimeout(async () => {
            await supabase.from("internship_cards").delete().in("id", ids);
        }, 5000);

        showUndoToast(`🗑 Removed ${removedCards.length} application${removedCards.length === 1 ? "" : "s"}`, () => {
            clearTimeout(timeoutId);
            setCards(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                return [...prev, ...removedCards.filter(c => !existingIds.has(c.id))];
            });
        });
    };

    const bulkMoveTo = async (status) => {
        const ids = [...selectedIds];
        const now = new Date().toISOString();
        const targets = cards.filter(c => ids.includes(c.id) && c.status !== status);
        if (targets.length === 0) { exitSelectMode(); return; }

        setCards(prev => prev.map(c => {
            const t = targets.find(x => x.id === c.id);
            if (!t) return c;
            const prevHistory = c.status_history?.length > 0 ? c.status_history : [{ status: c.status, changed_at: c.created_at || now }];
            return { ...c, status, status_history: [...prevHistory, { status, changed_at: now }] };
        }));
        exitSelectMode();
        showToast(`↪ Moved ${targets.length} application${targets.length === 1 ? "" : "s"} to ${COLUMNS.find(c => c.id === status)?.label}`);

        await Promise.all(targets.map(t => {
            const prevHistory = t.status_history?.length > 0 ? t.status_history : [{ status: t.status, changed_at: t.created_at || now }];
            return supabase.from("internship_cards").update({ status, status_history: [...prevHistory, { status, changed_at: now }] }).eq("id", t.id);
        }));
    };

    /* ── Drag & drop: update status ── */
    const handleDrop = async (colId) => {
        if (dragId === null) return;
        const card = cards.find(c => c.id === dragId);
        if (!card || card.status === colId) { setDragId(null); setDragOver(null); return; }
        const prevHistory = card.status_history || [{ status: card.status, changed_at: card.created_at || new Date().toISOString() }];
        const newHistory = [...prevHistory, { status: colId, changed_at: new Date().toISOString() }];
        setCards(prev => prev.map(c => c.id === dragId ? { ...c, status: colId, status_history: newHistory } : c));
        setDragId(null); setDragOver(null);
        await supabase.from("internship_cards").update({ status: colId, status_history: newHistory }).eq("id", card.id);
    };

    /* ── Sign out ── */
    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="app-bg">

            {/* HEADER */}
            <header style={{
                background: T.headerBg, backdropFilter: "blur(16px)",
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
                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-0.5px" }}>JobTrack</div>
                                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 1, fontWeight: 500 }}>Your Job Command Center</div>
                            </div>
                        </div>

                        {/* Right controls */}
                        <div className="header-actions">
                            {/* Real-time indicator */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSec, fontWeight: 500 }}>
                                <span className="realtime-dot" />
                                Live
                            </div>

                            <input className="search-input" placeholder="🔍  Search company, role or city…" value={search} onChange={e => setSearch(e.target.value)} />

                            {/* Sort selector */}
                            <select
                                value={sortBy} onChange={e => setSortBy(e.target.value)}
                                style={{
                                    background: T.sortBg, border: "1.5px solid rgba(99,91,255,0.15)",
                                    borderRadius: 12, padding: "9px 12px", color: T.text, fontSize: 13,
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
                                    cursor: "pointer", fontWeight: 600,
                                }}
                            >
                                <option value="newest">🕐 Newest</option>
                                <option value="deadline">⏰ By Deadline</option>
                                <option value="company">🔤 By Company</option>
                            </select>

                            {/* CSV Export */}
                            <button onClick={exportCSV} title="Export to CSV" style={{
                                background: T.sortBg, border: "1.5px solid rgba(99,91,255,0.15)",
                                borderRadius: 12, padding: "9px 14px", fontWeight: 600, cursor: "pointer",
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#6366f1",
                                whiteSpace: "nowrap", transition: "background 0.15s",
                            }}>📥 Export</button>

                            {/* Excel/CSV Import */}
                            <input
                                ref={importInputRef} type="file" accept=".xlsx,.xls,.csv"
                                onChange={handleImportFile} style={{ display: "none" }}
                            />
                            <button onClick={() => importInputRef.current?.click()} title="Import jobs from Excel/CSV" style={{
                                background: T.sortBg, border: "1.5px solid rgba(99,91,255,0.15)",
                                borderRadius: 12, padding: "9px 14px", fontWeight: 600, cursor: "pointer",
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#6366f1",
                                whiteSpace: "nowrap", transition: "background 0.15s",
                            }}>📁 Import</button>

                            {/* Insights */}
                            <button onClick={() => setShowInsights(true)} title="View application insights" style={{
                                background: T.sortBg, border: "1.5px solid rgba(99,91,255,0.15)",
                                borderRadius: 12, padding: "9px 14px", fontWeight: 600, cursor: "pointer",
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#6366f1",
                                whiteSpace: "nowrap", transition: "background 0.15s",
                            }}>📊 Insights</button>

                            {/* Bulk select toggle */}
                            <button
                                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                                title={selectMode ? "Exit select mode" : "Select multiple applications"}
                                style={{
                                    background: selectMode ? "#635bff" : T.sortBg,
                                    border: `1.5px solid ${selectMode ? "#635bff" : "rgba(99,91,255,0.15)"}`,
                                    borderRadius: 12, padding: "9px 14px", fontWeight: 600, cursor: "pointer",
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                                    color: selectMode ? "#fff" : "#6366f1",
                                    whiteSpace: "nowrap", transition: "background 0.15s",
                                }}
                            >{selectMode ? "✕ Cancel" : "☑️ Select"}</button>

                            {/* Dark mode toggle */}
                            <button
                                onClick={() => setDarkMode(d => !d)}
                                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                                style={{
                                    background: T.sortBg, border: "1.5px solid rgba(99,91,255,0.15)",
                                    borderRadius: 10, padding: "8px 12px", fontSize: 16,
                                    cursor: "pointer", lineHeight: 1, transition: "all 0.2s",
                                }}
                            >{darkMode ? "☀️" : "🌙"}</button>

                            <button className="add-btn" onClick={openAdd}>+ Add <span style={{opacity:0.7, fontSize:11, fontWeight:500}}>(N)</span></button>

                            {isAdmin && (
                                <button onClick={onOpenAdmin} style={{
                                    background: "#1e293b", color: "#fff", border: "none", borderRadius: 12,
                                    padding: "10px 18px", fontWeight: 700, cursor: "pointer",
                                    fontFamily: "'Syne', sans-serif", fontSize: 14, whiteSpace: "nowrap",
                                    boxShadow: "0 4px 16px rgba(30,39,59,0.25)"
                                }}>🛡️ Admin Dashboard</button>
                            )}

                            {/* User info + sign out */}
                            <div className="user-info-wrap" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 12, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                                        {(user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{user?.user_metadata?.full_name || "User"}</span>
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
                        {COLUMNS.map(col => {
                            const active = filterStatus === col.id;
                            return (
                            <div key={col.id} className="stat-pill"
                                onClick={() => setFilterStatus(active ? null : col.id)}
                                title={active ? "Click to show all" : `Filter to ${col.label} only`}
                                style={{
                                    borderColor: active ? col.color : `${col.color}20`,
                                    background: active ? col.pastel : T.pillBg,
                                    cursor: "pointer",
                                    boxShadow: active ? `0 0 0 2px ${col.color}55, 0 2px 8px ${col.color}22` : undefined,
                                    transform: active ? "translateY(-2px)" : undefined,
                                }}
                            >
                                <span style={{ width: 24, height: 24, borderRadius: 8, background: col.pastel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{col.emoji}</span>
                                <span style={{ fontSize: 12, color: active ? col.text : T.textSec, fontWeight: active ? 700 : 500 }}>{col.label}</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: col.color }}>{statMap[col.id]}</span>
                            </div>
                        );})}
                        <div className="stats-right">
                            <div className="stat-pill" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
                                <span style={{ fontSize: 16 }}>📊</span>
                                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>Response Rate</span>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#10B981" }}>{responseRate}%</span>
                            </div>
                            <div className="stat-pill" style={{ borderColor: "rgba(99,91,255,0.15)", background: "rgba(99,91,255,0.05)" }}>
                                <span style={{ fontSize: 16 }}>📋</span>
                                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>Total</span>
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
                    <>
                    {dueSoonCards.length > 0 && !reminderDismissed && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                            background: "#fff7ed", border: "1.5px solid #fde68a", borderRadius: 14,
                            padding: "10px 16px", marginBottom: 14, fontSize: 13, color: "#92400e", fontWeight: 600,
                        }}>
                            <span>⏰ {dueSoonCards.length} application{dueSoonCards.length === 1 ? "" : "s"} due within 3 days: {dueSoonCards.slice(0, 3).map(c => c.company).join(", ")}{dueSoonCards.length > 3 ? "…" : ""}</span>
                            {notifPermission === "default" && (
                                <button onClick={enableReminders} style={{ background: "#fde68a", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#92400e", cursor: "pointer" }}>
                                    🔔 Enable notifications
                                </button>
                            )}
                            <button onClick={() => setReminderDismissed(true)} style={{ background: "none", border: "none", color: "#92400e", cursor: "pointer", marginLeft: "auto", fontWeight: 700 }}>✕</button>
                        </div>
                    )}
                    {filterStatus && (
                        <div style={{ textAlign: "center", marginBottom: 12, fontSize: 13, color: "#6366f1", fontWeight: 600 }}>
                            Showing <strong>{COLUMNS.find(c => c.id === filterStatus)?.label}</strong> only ·{" "}
                            <button onClick={() => setFilterStatus(null)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}>Show all</button>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 14, minWidth: filterStatus ? 400 : 980 }}>
                        {visibleColumns.map(col => {
                            const colCards = filtered.filter(c => c.status === col.id);
                            const isOver = dragOver === col.id;
                            return (
                                <div key={col.id}
                                    onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                                    onDragLeave={() => setDragOver(null)}
                                    onDrop={() => handleDrop(col.id)}
                                    style={{
                                        flex: 1, minWidth: 205,
                                        background: isOver ? col.pastel : T.colBg,
                                        border: `1.5px solid ${isOver ? col.color + "50" : T.colBorder}`,
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
                                                T={T}
                                                selectMode={selectMode}
                                                selected={selectedIds.has(card.id)}
                                                onToggleSelect={toggleSelect}
                                                onView={setViewCard}
                                            />
                                        ))}
                                        {colCards.length === 0 && (
                                            <div className="empty-drop" style={{ borderColor: isOver ? col.color : col.border, color: isOver ? col.text : "#c7d2fe", background: isOver ? `${col.color}08` : "transparent", minHeight: 120 }}>
                                                <span style={{ fontSize: 28, opacity: 0.4 }}>{col.emoji}</span>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{isOver ? "Drop here!" : search ? "No matches" : "Nothing here yet"}</span>
                                                {!search && !isOver && <span style={{ fontSize: 11, opacity: 0.7 }}>+ Add to {col.label}</span>}
                                            </div>
                                        )}
                                    </div>

                                    <button className="quick-add-btn"
                                        style={{ borderColor: col.border }}
                                        onClick={() => { setForm({ ...EMPTY_FORM, status: col.id }); setEditCard(null); setAttachmentSlots([{ label: "Resume", existingUrl: "", file: null }]); setJobLinks([""]); setDuplicateWarning(false); setShowModal(true); }}
                                        onMouseEnter={e => { e.currentTarget.style.background = col.pastel; e.currentTarget.style.color = col.text; e.currentTarget.style.borderColor = col.color + "60"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a5b4fc"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                                    >
                                        + Add to {col.label}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}
            </main>

            {selectMode && (
                <div style={{
                    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                    background: "#1e1b4b", color: "#fff", borderRadius: 16, padding: "12px 18px",
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.28)", zIndex: 500, fontSize: 13, fontWeight: 600,
                    maxWidth: "92vw",
                }}>
                    <span>{selectedIds.size} selected</span>
                    <button onClick={selectAll} style={{ background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", fontWeight: 700, fontSize: 12, textDecoration: "underline" }}>Select all</button>
                    <button onClick={clearSelection} style={{ background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", fontWeight: 700, fontSize: 12, textDecoration: "underline" }}>Clear</button>
                    <select
                        value=""
                        onChange={e => { if (e.target.value) bulkMoveTo(e.target.value); }}
                        disabled={selectedIds.size === 0}
                        style={{
                            background: "#2a2660", border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
                            borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        <option value="">Move to…</option>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                    </select>
                    <button
                        onClick={bulkDelete} disabled={selectedIds.size === 0}
                        style={{
                            background: "#f43f5e", border: "none", color: "#fff", borderRadius: 8,
                            padding: "6px 12px", fontSize: 12, fontWeight: 700,
                            cursor: selectedIds.size === 0 ? "not-allowed" : "pointer", opacity: selectedIds.size === 0 ? 0.5 : 1,
                        }}
                    >🗑 Delete</button>
                    <button
                        onClick={exitSelectMode}
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >Done</button>
                </div>
            )}

            <footer style={{ textAlign: "center", paddingBottom: 32, color: "#c7d2fe", fontSize: 12, fontWeight: 500 }}>
                💡 Drag & drop cards between columns · Changes sync in real-time · Press <kbd style={{ background: "#e0e7ff", color: "#635bff", borderRadius: 5, padding: "1px 6px", fontSize: 11 }}>Esc</kbd> to close
            </footer>

            {/* MODALS */}
            {showModal && (
                <Modal
                    form={form} setForm={setForm}
                    onSave={handleSave} onClose={() => { setShowModal(false); setDuplicateWarning(false); }}
                    isEdit={editCard !== null} saving={saving}
                    attachmentSlots={attachmentSlots} setAttachmentSlots={setAttachmentSlots}
                    jobLinks={jobLinks} setJobLinks={setJobLinks}
                    T={T}
                />
            )}
            {deleteTarget && (
                <DeleteConfirm card={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} saving={false} />
            )}
            {duplicateWarning && (
                <DuplicateConfirm
                    company={form.company} role={form.role}
                    onConfirm={() => handleSave(true)}
                    onCancel={() => setDuplicateWarning(false)}
                    saving={saving}
                />
            )}
            {showInsights && (
                <InsightsModal cards={cards} T={T} onClose={() => setShowInsights(false)} />
            )}
            {viewCard && (
                <DetailModal
                    card={viewCard} col={COLUMNS.find(c => c.id === viewCard.status) || COLUMNS[0]} T={T}
                    onEdit={() => { setViewCard(null); openEdit(viewCard); }}
                    onClose={() => setViewCard(null)}
                />
            )}
            {importRows && (
                <ImportPreviewModal
                    rows={importRows} skipped={importSkipped}
                    onToggle={toggleImportRow} onSetAllDup={setAllImportDup}
                    onConfirm={confirmImport} onCancel={() => setImportRows(null)}
                    importing={importing} T={T}
                />
            )}
            {toast && <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={toast.onAction} onDone={() => setToast(null)} />}
        </div>
    );
}
