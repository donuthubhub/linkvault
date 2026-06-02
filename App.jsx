import { useState, useEffect } from "react";
import { Plus, Search, ExternalLink, Trash2, X, Loader2, Link as LinkIcon, Filter } from "lucide-react";

const GAS_URL = "/api/db";

const PROJECTS = ["Aura", "R1", "Comisario", "Final Pixel Studio", "IR TH", "IR SG", "EVP"];
const CATEGORIES = ["Financial", "Info", "Social Media", "Artwork", "Clip"];

const PROJECT_COLORS = {
  "Aura":               "#7C3AED",
  "R1":                 "#059669",
  "Comisario":          "#D97706",
  "Final Pixel Studio": "#2563EB",
  "IR TH":              "#DC2626",
  "IR SG":              "#DB2777",
  "EVP":                "#0891B2",
};

const CATEGORY_COLORS = {
  "Financial":   "#10B981",
  "Info":        "#6366F1",
  "Social Media":"#F59E0B",
  "Artwork":     "#EC4899",
  "Clip":        "#EF4444",
};

const CATEGORY_ICONS = {
  "Financial":   "💰",
  "Info":        "📋",
  "Social Media":"📱",
  "Artwork":     "🎨",
  "Clip":        "🎬",
};

const C = {
  bg:       "#0a0c10",
  surface:  "#13171f",
  surface2: "#1c2230",
  border:   "#252d3d",
  text:     "#f0f4ff",
  muted:    "#6b7a99",
  accent:   "#4F8EF7",
};

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function LinkCard({ link, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const favicon = getFavicon(link.url);

  return (
    <div
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#3a4560"}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {favicon && !imgError
          ? <img src={favicon} onError={() => setImgError(true)} width={20} height={20} style={{ borderRadius: 4, flexShrink: 0, marginTop: 2 }} />
          : <div style={{ width: 20, height: 20, background: C.surface2, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}><LinkIcon size={11} color={C.muted} /></div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {link.title || link.url}
          </div>
          <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.url}</div>
        </div>
      </div>

      {link.note && (
        <div style={{ fontSize: 12, color: "#8b9bb8", lineHeight: 1.4, padding: "8px 10px", background: C.surface2, borderRadius: 8 }}>{link.note}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: (PROJECT_COLORS[link.project] || C.accent) + "22", color: PROJECT_COLORS[link.project] || C.accent, border: `1px solid ${(PROJECT_COLORS[link.project] || C.accent)}44` }}>
          {link.project}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: (CATEGORY_COLORS[link.category] || "#6366F1") + "22", color: CATEGORY_COLORS[link.category] || "#6366F1", border: `1px solid ${(CATEGORY_COLORS[link.category] || "#6366F1")}44` }}>
          {CATEGORY_ICONS[link.category]} {link.category}
        </span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{timeAgo(link.dateAdded)}</span>
        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, display: "flex" }}><ExternalLink size={14} /></a>
        <button onClick={() => onDelete(link.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 0 }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function LinkVault() {
  const [links, setLinks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [search, setSearch]             = useState("");
  const [filterProject, setFilterProject]   = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [form, setForm]                 = useState({ url: "", title: "", project: "", category: "", note: "" });
  const [fetchingTitle, setFetchingTitle]   = useState(false);
  const [titleFetched, setTitleFetched]     = useState(false);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { loadLinks(); }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const res  = await fetch(`${GAS_URL}?action=getLinks`);
      const data = await res.json();
      // Sort newest first
      const sorted = (data.links || []).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      setLinks(sorted);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function fetchTitle(url) {
    if (!url || !url.startsWith("http")) return;
    setFetchingTitle(true);
    setTitleFetched(false);
    try {
      const res  = await fetch(`${GAS_URL}?action=fetchTitle&url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.title) { setForm(f => ({ ...f, title: data.title })); setTitleFetched(true); }
    } catch {}
    setFetchingTitle(false);
  }

  async function saveLink() {
    if (!form.url || !form.project || !form.category) return;
    setSaving(true);
    const link = {
      id: Date.now().toString(),
      url: form.url,
      title: form.title || form.url,
      project: form.project,
      category: form.category,
      note: form.note,
      dateAdded: new Date().toISOString(),
    };
    try {
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveLink", link }),
      });
      setLinks(l => [link, ...l]);
      setForm({ url: "", title: "", project: "", category: "", note: "" });
      setTitleFetched(false);
      setShowAdd(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  async function deleteLink(id) {
    if (!window.confirm("Remove this link?")) return;
    setLinks(l => l.filter(x => x.id !== id));
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteLink", id }),
    });
  }

  const filtered = links.filter(l => {
    const mp = filterProject  === "All" || l.project  === filterProject;
    const mc = filterCategory === "All" || l.category === filterCategory;
    const q  = search.toLowerCase();
    const ms = !search || l.title?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q) || l.note?.toLowerCase().includes(q);
    return mp && mc && ms;
  });

  const inputStyle = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #4F8EF7, #7C3AED)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LinkIcon size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>Link Vault</span>
          <span style={{ fontSize: 12, color: C.muted, background: C.surface2, padding: "2px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>
            {filtered.length} / {links.length}
          </span>
        </div>
        <div style={{ position: "relative", flex: "0 1 300px" }}>
          <Search size={14} color={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search links..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.accent, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Plus size={15} /> Add Link
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "10px 24px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={13} color={C.muted} style={{ flexShrink: 0 }} />
        {["All", ...PROJECTS].map(p => (
          <button key={p} onClick={() => setFilterProject(p)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid", background: filterProject === p ? (PROJECT_COLORS[p] || C.accent) : "transparent", borderColor: filterProject === p ? (PROJECT_COLORS[p] || C.accent) : C.border, color: filterProject === p ? "#fff" : C.muted, transition: "all 0.15s" }}>{p}</button>
        ))}
        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid", background: filterCategory === c ? (CATEGORY_COLORS[c] || C.accent) : "transparent", borderColor: filterCategory === c ? (CATEGORY_COLORS[c] || C.accent) : C.border, color: filterCategory === c ? "#fff" : C.muted, transition: "all 0.15s" }}>
            {c === "All" ? "All Types" : `${CATEGORY_ICONS[c]} ${c}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize: 14 }}>Loading your links...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
            <LinkIcon size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>{links.length === 0 ? "No links yet" : "No matches"}</div>
            <div style={{ fontSize: 13 }}>{links.length === 0 ? 'Click "Add Link" to save your first link' : "Try a different filter or search term"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {filtered.map(link => <LinkCard key={link.id} link={link} onDelete={deleteLink} />)}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Add New Link</span>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>URL *</label>
              <input value={form.url} onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setTitleFetched(false); }} onBlur={e => fetchTitle(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>
                Title
                {fetchingTitle && <span style={{ color: C.accent }}> — fetching...</span>}
                {titleFetched  && <span style={{ color: "#10B981" }}> — auto-filled ✓</span>}
              </label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-fetched or type your own" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Project *</label>
                <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} style={{ ...inputStyle, color: form.project ? C.text : C.muted }}>
                  <option value="">Select...</option>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, color: form.category ? C.text : C.muted }}>
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Note (optional)</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Short description..." style={inputStyle} />
            </div>

            <button onClick={saveLink} disabled={saving || !form.url || !form.project || !form.category}
              style={{ width: "100%", background: (!form.url || !form.project || !form.category) ? C.surface2 : C.accent, border: "none", borderRadius: 10, padding: 12, color: (!form.url || !form.project || !form.category) ? C.muted : "#fff", fontWeight: 700, fontSize: 14, cursor: (!form.url || !form.project || !form.category) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : "Save Link"}
            </button>
          </div>
        </div>
      )}

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
