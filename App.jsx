import { useState, useEffect } from "react";
import { Plus, Search, ExternalLink, Trash2, X, Loader2, Link as LinkIcon, Filter, Pencil, Archive, ArchiveRestore, History, Settings as SettingsIcon, ChevronDown } from "lucide-react";

const GAS_URL = "/api/db";

const DEFAULT_PROJECTS = ["Aura", "R1", "Comisario", "Final Pixel Studio", "IR TH", "IR SG", "EVP"];
const DEFAULT_CATEGORIES = ["Financial", "Info", "Social Media", "Artwork", "Clip"];

const PALETTE = ["#7C3AED","#059669","#D97706","#2563EB","#DC2626","#DB2777","#0891B2","#10B981","#6366F1","#F59E0B","#EC4899","#EF4444","#14B8A6","#8B5CF6"];

const CATEGORY_ICONS = {
  "Financial": "\uD83D\uDCB0",
  "Info": "\uD83D\uDCCB",
  "Social Media": "\uD83D\uDCF1",
  "Artwork": "\uD83C\uDFA8",
  "Clip": "\uD83C\uDFAC",
};

function colorFor(name, list) {
  const i = Math.max(0, list.indexOf(name));
  return PALETTE[i % PALETTE.length];
}

const C = {
  bg: "#0a0c10", surface: "#13171f", surface2: "#1c2230", border: "#252d3d",
  text: "#f0f4ff", muted: "#6b7a99", accent: "#4F8EF7",
};

function getFavicon(url) {
  try { const d = new URL(url).hostname; return "https://www.google.com/s2/favicons?domain=" + d + "&sz=32"; }
  catch { return null; }
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + "d ago";
  return new Date(dateStr).toLocaleDateString();
}
function fmtDate(s) { try { return new Date(s).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return s; } }

const inputStyle = { width: "100%", background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

function LinkCard({ link, projects, categories, onEdit, onArchive, onUnarchive, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const favicon = getFavicon(link.url);
  const pColor = colorFor(link.project, projects);
  const cColor = colorFor(link.category, categories);
  const history = Array.isArray(link.history) ? link.history : [];
  const version = history.length + 1;

  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, opacity: link.status === "archived" ? 0.6 : 1 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#3a4560"}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {favicon && !imgError
          ? <img src={favicon} onError={() => setImgError(true)} width={20} height={20} style={{ borderRadius: 4, flexShrink: 0, marginTop: 2 }} />
          : <div style={{ width: 20, height: 20, background: C.surface2, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}><LinkIcon size={11} color={C.muted} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.title || link.url}</div>
          <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.url}</div>
        </div>
        {version > 1 && (
          <button onClick={() => setShowHist(s => !s)} title="Version history" style={{ background: C.surface2, border: "1px solid " + C.border, borderRadius: 20, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
            <History size={11} /> v{version}
          </button>
        )}
      </div>

      {link.note && (<div style={{ fontSize: 12, color: "#8b9bb8", lineHeight: 1.4, padding: "8px 10px", background: C.surface2, borderRadius: 8 }}>{link.note}</div>)}

      {showHist && version > 1 && (
        <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, display: "flex", alignItems: "center", gap: 5 }}><History size={11} /> Version history</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 11, color: C.text }}>
              <span style={{ color: "#10B981", fontWeight: 700 }}>v{version} \u00B7 current</span>
              <span style={{ color: C.muted }}> \u00B7 {fmtDate(link.dateAdded)}</span>
              <div style={{ color: C.muted, wordBreak: "break-all" }}>{link.url}</div>
            </div>
            {history.slice().reverse().map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: C.muted, borderTop: "1px solid " + C.border, paddingTop: 6 }}>
                <span style={{ fontWeight: 700 }}>v{history.length - i}</span> \u00B7 {fmtDate(h.date)}
                {h.note && <span style={{ color: "#8b9bb8" }}> \u2014 {h.note}</span>}
                <div style={{ wordBreak: "break-all" }}>{h.url}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: pColor + "22", color: pColor, border: "1px solid " + pColor + "44" }}>{link.project}</span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: cColor + "22", color: cColor, border: "1px solid " + cColor + "44" }}>{(CATEGORY_ICONS[link.category] || "") + " " + link.category}</span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{timeAgo(link.dateAdded)}</span>
        <a href={link.url} target="_blank" rel="noopener noreferrer" title="Open" style={{ color: C.accent, display: "flex" }}><ExternalLink size={14} /></a>
        <button onClick={() => onEdit(link)} title="Edit" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 0 }}><Pencil size={14} /></button>
        {link.status === "archived"
          ? <button onClick={() => onUnarchive(link)} title="Unarchive" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 0 }}><ArchiveRestore size={14} /></button>
          : <button onClick={() => onArchive(link)} title="Archive" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 0 }}><Archive size={14} /></button>}
        <button onClick={() => onDelete(link)} title="Delete" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 0 }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function ConfirmModal({ data, onCancel, onConfirm }) {
  if (!data) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{data.title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>{data.message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, padding: "9px 16px", color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: data.danger ? "#DC2626" : C.accent, border: "none", borderRadius: 8, padding: "9px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{data.confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

export default function LinkVault() {
  const [links, setLinks] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [archivedTags, setArchivedTags] = useState({ projects: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ url: "", title: "", project: "", category: "", note: "", changeNote: "" });
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [titleFetched, setTitleFetched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch(GAS_URL + "?action=getLinks");
      const data = await res.json();
      const sorted = (data.links || []).map(normalize).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      setLinks(sorted);
      if (data.config) {
        if (Array.isArray(data.config.projects) && data.config.projects.length) setProjects(data.config.projects);
        if (Array.isArray(data.config.categories) && data.config.categories.length) setCategories(data.config.categories);
        setArchivedTags({ projects: data.config.archivedProjects || [], categories: data.config.archivedCategories || [] });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }
  function normalize(l) {
    let history = [];
    if (l.history) { try { history = typeof l.history === "string" ? JSON.parse(l.history) : l.history; } catch { history = []; } }
    return { ...l, history: Array.isArray(history) ? history : [], status: l.status || "active" };
  }

  async function fetchTitle(url) {
    if (!url || !url.startsWith("http")) return;
    setFetchingTitle(true); setTitleFetched(false);
    try {
      const res = await fetch(GAS_URL + "?action=fetchTitle&url=" + encodeURIComponent(url));
      const data = await res.json();
      if (data.title) { setForm(f => ({ ...f, title: f.title || data.title })); setTitleFetched(true); }
    } catch {}
    setFetchingTitle(false);
  }

  function openAdd() { setEditing(null); setForm({ url: "", title: "", project: "", category: "", note: "", changeNote: "" }); setTitleFetched(false); setShowForm(true); }
  function openEdit(link) { setEditing(link); setForm({ url: link.url, title: link.title, project: link.project, category: link.category, note: link.note || "", changeNote: "" }); setTitleFetched(false); setShowForm(true); }

  async function post(body) {
    return fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  async function submitForm() {
    if (!form.url || !form.project || !form.category) return;
    setSaving(true);
    if (editing) {
      const urlChanged = form.url.trim() !== editing.url.trim();
      let history = editing.history.slice();
      if (urlChanged) history.push({ url: editing.url, note: form.changeNote || "", date: editing.dateAdded });
      const updated = { ...editing, url: form.url, title: form.title || form.url, project: form.project, category: form.category, note: form.note, history, dateAdded: urlChanged ? new Date().toISOString() : editing.dateAdded };
      setLinks(ls => ls.map(l => l.id === editing.id ? updated : l));
      try { await post({ action: "updateLink", link: { ...updated, history: JSON.stringify(updated.history) } }); } catch (e) { console.error(e); }
    } else {
      const link = { id: Date.now().toString(), url: form.url, title: form.title || form.url, project: form.project, category: form.category, note: form.note, dateAdded: new Date().toISOString(), status: "active", history: [] };
      setLinks(ls => [link, ...ls]);
      try { await post({ action: "saveLink", link: { ...link, history: "[]" } }); } catch (e) { console.error(e); }
    }
    setSaving(false); setShowForm(false); setEditing(null);
    setForm({ url: "", title: "", project: "", category: "", note: "", changeNote: "" });
  }

  function setStatus(link, status) {
    const updated = { ...link, status };
    setLinks(ls => ls.map(l => l.id === link.id ? updated : l));
    post({ action: "updateLink", link: { ...updated, history: JSON.stringify(updated.history || []) } }).catch(console.error);
  }
  function doDelete(link) {
    setConfirm({ title: "Delete link?", message: 'Permanently remove "' + (link.title || link.url) + '". This cannot be undone.', confirmLabel: "Delete", danger: true, onYes: () => {
      setLinks(ls => ls.filter(l => l.id !== link.id));
      post({ action: "deleteLink", id: link.id }).catch(console.error);
    }});
  }

  async function saveConfig(next) {
    const payload = { projects: next.projects ?? projects, categories: next.categories ?? categories, archivedProjects: next.archivedProjects ?? archivedTags.projects, archivedCategories: next.archivedCategories ?? archivedTags.categories };
    if (next.projects) setProjects(next.projects);
    if (next.categories) setCategories(next.categories);
    setArchivedTags({ projects: payload.archivedProjects, categories: payload.archivedCategories });
    try { await post({ action: "saveConfig", config: payload }); } catch (e) { console.error(e); }
  }

  const activeProjects = projects.filter(p => !archivedTags.projects.includes(p));
  const activeCategories = categories.filter(c => !archivedTags.categories.includes(c));

  const filtered = links.filter(l => {
    const archMatch = showArchived ? l.status === "archived" : l.status !== "archived";
    const mp = filterProject === "All" || l.project === filterProject;
    const mc = filterCategory === "All" || l.category === filterCategory;
    const q = search.toLowerCase();
    const ms = !search || l.title?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q) || l.note?.toLowerCase().includes(q) || l.project?.toLowerCase().includes(q);
    return archMatch && mp && mc && ms;
  });
  const archivedCount = links.filter(l => l.status === "archived").length;
  const canSubmit = form.url && form.project && form.category;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #4F8EF7, #7C3AED)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><LinkIcon size={16} color="#fff" /></div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>Link Vault</span>
          <span style={{ fontSize: 12, color: C.muted, background: C.surface2, padding: "2px 8px", borderRadius: 20, border: "1px solid " + C.border }}>{filtered.length} / {links.length}</span>
        </div>
        <div style={{ position: "relative", flex: "0 1 280px" }}>
          <Search size={14} color={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search links..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <button onClick={() => setShowManage(true)} title="Manage projects & categories" style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, padding: "8px 12px", color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}><SettingsIcon size={15} /> Manage</button>
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.accent, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={15} /> Add Link</button>
      </div>

      <div style={{ background: C.surface, borderBottom: "1px solid " + C.border, padding: "10px 24px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={13} color={C.muted} style={{ flexShrink: 0 }} />
        {["All", ...activeProjects].map(p => (
          <button key={p} onClick={() => setFilterProject(p)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid", background: filterProject === p ? (p === "All" ? C.accent : colorFor(p, projects)) : "transparent", borderColor: filterProject === p ? (p === "All" ? C.accent : colorFor(p, projects)) : C.border, color: filterProject === p ? "#fff" : C.muted }}>{p}</button>
        ))}
        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
        {["All", ...activeCategories].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid", background: filterCategory === c ? (c === "All" ? C.accent : colorFor(c, categories)) : "transparent", borderColor: filterCategory === c ? (c === "All" ? C.accent : colorFor(c, categories)) : C.border, color: filterCategory === c ? "#fff" : C.muted }}>{c === "All" ? "All Types" : ((CATEGORY_ICONS[c] || "") + " " + c)}</button>
        ))}
        <button onClick={() => setShowArchived(s => !s)} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", background: showArchived ? "#6b7a99" : "transparent", borderColor: showArchived ? "#6b7a99" : C.border, color: showArchived ? "#fff" : C.muted, display: "flex", alignItems: "center", gap: 5 }}><Archive size={12} /> Archived{archivedCount ? " (" + archivedCount + ")" : ""}</button>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: C.muted }}><Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} /><div style={{ fontSize: 14 }}>Loading your links...</div></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: C.muted }}><LinkIcon size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} /><div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>{showArchived ? "No archived links" : (links.length === 0 ? "No links yet" : "No matches")}</div><div style={{ fontSize: 13 }}>{showArchived ? "Archived links will appear here" : (links.length === 0 ? 'Click "Add Link" to save your first link' : "Try a different filter or search term")}</div></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {filtered.map(link => <LinkCard key={link.id} link={link} projects={projects} categories={categories} onEdit={openEdit} onArchive={l => setStatus(l, "archived")} onUnarchive={l => setStatus(l, "active")} onDelete={doDelete} />)}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 16, width: "100%", maxWidth: 480, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>{editing ? "Edit Link" : "Add New Link"}</span>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>URL *</label>
              <input value={form.url} onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setTitleFetched(false); }} onBlur={e => !editing && fetchTitle(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            {editing && form.url.trim() !== editing.url.trim() && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#F59E0B", display: "block", marginBottom: 6 }}>\u26A1 URL changed \u2014 what changed? (saved to history)</label>
                <input value={form.changeNote} onChange={e => setForm(f => ({ ...f, changeNote: e.target.value }))} placeholder="e.g. redeployed, new figma frame..." style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Title{fetchingTitle && <span style={{ color: C.accent }}> \u2014 fetching...</span>}{titleFetched && <span style={{ color: "#10B981" }}> \u2014 auto-filled \u2713</span>}</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-fetched or type your own" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Project *</label>
                <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} style={{ ...inputStyle, color: form.project ? C.text : C.muted }}><option value="">Select...</option>{activeProjects.map(p => <option key={p} value={p}>{p}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, color: form.category ? C.text : C.muted }}><option value="">Select...</option>{activeCategories.map(c => <option key={c} value={c}>{(CATEGORY_ICONS[c] || "") + " " + c}</option>)}</select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Note (optional)</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Short description..." style={inputStyle} />
            </div>
            <button onClick={submitForm} disabled={saving || !canSubmit} style={{ width: "100%", background: !canSubmit ? C.surface2 : C.accent, border: "none", borderRadius: 10, padding: 12, color: !canSubmit ? C.muted : "#fff", fontWeight: 700, fontSize: 14, cursor: !canSubmit ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : (editing ? "Save Changes" : "Save Link")}</button>
          </div>
        </div>
      )}

      {showManage && <ManagePanel projects={projects} categories={categories} archivedTags={archivedTags} onClose={() => setShowManage(false)} onSave={saveConfig} />}

      <ConfirmModal data={confirm} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.onYes(); setConfirm(null); }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #6b7a99; }
        select option { background: #1c2230; color: #f0f4ff; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0c10; } ::-webkit-scrollbar-thumb { background: #252d3d; border-radius: 3px; }
      `}</style>
    </div>
  );
}

function TagManager({ label, items, archived, onAdd, onRename, onArchive, onUnarchive }) {
  const [adding, setAdding] = useState("");
  const [editIdx, setEditIdx] = useState(-1);
  const [editVal, setEditVal] = useState("");
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {items.map((it, i) => {
          const isArch = archived.includes(it);
          const color = colorFor(it, items);
          return (
            <div key={it} style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, borderRadius: 8, padding: "6px 10px", opacity: isArch ? 0.55 : 1 }}>
              {editIdx === i ? (
                <>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...inputStyle, padding: "4px 8px", flex: 1 }} />
                  <button onClick={() => { if (editVal.trim()) onRename(it, editVal.trim()); setEditIdx(-1); }} style={{ background: C.accent, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditIdx(-1)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={14} /></button>
                </>
              ) : (
                <>
                  <span style={{ width: 9, height: 9, borderRadius: 9, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{it}{isArch && <span style={{ color: C.muted, fontSize: 11 }}> \u00B7 archived</span>}</span>
                  <button onClick={() => { setEditIdx(i); setEditVal(it); }} title="Rename" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}><Pencil size={13} /></button>
                  {isArch
                    ? <button onClick={() => onUnarchive(it)} title="Unarchive" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}><ArchiveRestore size={13} /></button>
                    : <button onClick={() => onArchive(it)} title="Archive" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}><Archive size={13} /></button>}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && adding.trim()) { onAdd(adding.trim()); setAdding(""); } }} placeholder={"Add new " + label.toLowerCase().replace(/s$/, "") + "..."} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => { if (adding.trim()) { onAdd(adding.trim()); setAdding(""); } }} style={{ background: C.accent, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, padding: "0 16px", cursor: "pointer" }}>Add</button>
      </div>
    </div>
  );
}

function ManagePanel({ projects, categories, archivedTags, onClose, onSave }) {
  function addProject(name) { if (!projects.includes(name)) onSave({ projects: [...projects, name] }); }
  function renameProject(oldN, newN) { onSave({ projects: projects.map(p => p === oldN ? newN : p), archivedProjects: archivedTags.projects.map(p => p === oldN ? newN : p) }); }
  function archiveProject(name) { onSave({ archivedProjects: [...archivedTags.projects, name] }); }
  function unarchiveProject(name) { onSave({ archivedProjects: archivedTags.projects.filter(p => p !== name) }); }
  function addCategory(name) { if (!categories.includes(name)) onSave({ categories: [...categories, name] }); }
  function renameCategory(oldN, newN) { onSave({ categories: categories.map(c => c === oldN ? newN : c), archivedCategories: archivedTags.categories.map(c => c === oldN ? newN : c) }); }
  function archiveCategory(name) { onSave({ archivedCategories: [...archivedTags.categories, name] }); }
  function unarchiveCategory(name) { onSave({ archivedCategories: archivedTags.categories.filter(c => c !== name) }); }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Manage</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>Add, rename, or archive projects and categories. Archived ones are hidden from filters but existing links keep their tags.</div>
        <TagManager label="Projects" items={projects} archived={archivedTags.projects} onAdd={addProject} onRename={renameProject} onArchive={archiveProject} onUnarchive={unarchiveProject} />
        <TagManager label="Categories" items={categories} archived={archivedTags.categories} onAdd={addCategory} onRename={renameCategory} onArchive={archiveCategory} onUnarchive={unarchiveCategory} />
      </div>
    </div>
  );
}
