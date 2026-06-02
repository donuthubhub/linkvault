export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const GAS_URL = process.env.GAS_URL;

  // ── Title fetcher ──────────────────────────────────────────────
  if (req.query.action === "fetchTitle") {
    const url = req.query.url;
    if (!url) return res.status(200).json({ title: "" });
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkVault/1.0)" },
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });
      const html = await response.text();
      const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
      const raw   = match ? match[1].trim() : "";
      const title = raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ");
      return res.status(200).json({ title });
    } catch {
      return res.status(200).json({ title: "" });
    }
  }

  // ── GAS proxy ─────────────────────────────────────────────────
  try {
    let gasRes;
    const body    = req.body ? JSON.stringify(req.body) : null;
    const isLarge = body && body.length > 7000;

    if (req.method === "POST" || isLarge) {
      gasRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body || JSON.stringify(req.query),
        redirect: "follow",
      });
    } else {
      const params = new URLSearchParams(req.query);
      gasRes = await fetch(`${GAS_URL}?${params}`, { redirect: "follow" });
    }

    const text = await gasRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
