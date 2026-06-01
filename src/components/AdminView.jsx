// src/components/AdminView.jsx
import { useState, useRef } from "react";
import { getLevelStyle } from "../constants/psvData.js";

// ────────────────────────────────────────────────────────────────────────────
// Salary → level lookup (SA public service salary bands 2026)
// ────────────────────────────────────────────────────────────────────────────
const SALARY_LEVEL_MAP = {
  170226: "Level 02", 184704: "Level 03", 201093: "Level 04",
  221184: "Level 05", 237453: "Level 05", 255450: "Level 06",
  280278: "Level 06", 308154: "Level 07", 338106: "Level 07",
  371730: "Level 07", 407337: "Level 08", 413001: "Level 08",
  453957: "Level 08", 487197: "Level 09", 556368: "Level 09",
  605745: "Level 10", 605742: "Level 10", 698388: "Level 10",
  756879: "Level 11", 932292: "Level 11", 1101468: "Level 12",
  1338636: "Level 13", 1494900: "Level 14", 1813182: "Level 15",
};

function salaryToLevel(salaryStr) {
  if (!salaryStr) return "Unknown";
  // Explicit "(Level N)" or "( Level N)"
  const explicit = salaryStr.match(/\(\s*[Ll]evel\s+(\d+)\s*\)/);
  if (explicit) return `Level ${String(parseInt(explicit[1], 10)).padStart(2, "0")}`;
  if (/OSD/i.test(salaryStr)) return "OSD";
  // Numeric match
  const nums = salaryStr.match(/R\s*([\d\s]+)\s*(?:per|\.|,)/);
  if (nums) {
    const sal = parseInt(nums[1].replace(/\s/g, ""), 10);
    if (SALARY_LEVEL_MAP[sal]) return SALARY_LEVEL_MAP[sal];
    // Closest within 2%
    const closest = Object.keys(SALARY_LEVEL_MAP).reduce((a, b) =>
      Math.abs(b - sal) < Math.abs(a - sal) ? b : a
    );
    if (Math.abs(closest - sal) / closest < 0.02) return SALARY_LEVEL_MAP[closest];
  }
  // All-inclusive package strings
  if (/1[\s,]813[\s,]182/.test(salaryStr)) return "Level 15";
  if (/1[\s,]494[\s,]900/.test(salaryStr)) return "Level 14";
  if (/1[\s,]338[\s,]636/.test(salaryStr)) return "Level 13";
  if (/1[\s,]101[\s,]468/.test(salaryStr)) return "Level 12";
  if (/932[\s,]292/.test(salaryStr))        return "Level 11";
  if (/756[\s,]879/.test(salaryStr))        return "Level 11";
  if (/605[\s,]74[25]/.test(salaryStr))     return "Level 10";
  return "Unknown";
}

// ────────────────────────────────────────────────────────────────────────────
// Category inference from title / department
// ────────────────────────────────────────────────────────────────────────────
function inferCategory(title, dept) {
  const t = (title + " " + dept).toLowerCase();
  if (/\b(director|chief director|dg|ddg|manager|head of|ceo|cfo|coo)\b/.test(t)) return "Management";
  if (/\b(deputy director|assistant director)\b/.test(t)) return "Management";
  if (/\b(finance|financial|accountant|accounting|budget|revenue|expenditure|cfm)\b/.test(t)) return "Finance";
  if (/\b(human resource|hr |personnel|labour relations|recruitment|compensation)\b/.test(t)) return "Human Resources";
  if (/\b(legal|attorney|advocate|law|litigation|contract|state law|justice)\b/.test(t)) return "Legal";
  if (/\b(it |ict|information technology|software|developer|systems|data|network|cyber|digital|technician|technical)\b/.test(t)) return "IT & Technology";
  if (/\b(education|teacher|school|training|curriculum|lecturer|tutor|nsnp|nutrition programme)\b/.test(t)) return "Education";
  if (/\b(compliance|audit|inspector|forensic|integrity|risk)\b/.test(t)) return "Compliance";
  if (/\b(econom|economist|econometri)\b/.test(t)) return "Economics";
  if (/\b(supply chain|scm|procurement|logistics|demand management|warehouse|inventory)\b/.test(t)) return "Supply Chain";
  if (/\b(communications|media|content|public relations|spokesperson|journalism|marketing)\b/.test(t)) return "Business Development";
  return "Administration";
}

// ────────────────────────────────────────────────────────────────────────────
// Improved PSV circular parser (handles pdf.js text without newlines)
// Format:  POST XX/YY : TITLE [multi-line] (REF NO: xxx)
//          [Branch/Directorate lines]
//          SALARY : Rxxx (Level N)
//          CENTRE : location
//          REQUIREMENTS : ...
//          DUTIES : ...
//          ENQUIRIES : ...
//          APPLICATIONS : ...
//          CLOSING DATE : DD Month YYYY
// ────────────────────────────────────────────────────────────────────────────
function parsePsvCircular(rawText, circularNo) {
  const jobs = [];

  // ── Step 1: Strip preamble ─────────────────────────────────────────
  // Everything before "OTHER POSTS" or "ANNEXURE A" or the first POST XX/YY
  // is boilerplate (index, instructions). Drop it.
  const firstPostIdx = rawText.search(/\bPOST\s+\d+\/\d+\b/i);
  if (firstPostIdx === -1) {
    console.log("[PDF Parser] No POST XX/YY found in text");
    return jobs;
  }

  // Walk back to find "OTHER POSTS" or "ANNEXURE" section heading before firstPost
  const preambleEnd = (() => {
    const slice = rawText.slice(0, firstPostIdx);
    const markers = [
      /OTHER\s+POSTS\s*$/im,
      /ANNEXURE\s+[A-Z]+\s*$/im,
      /DEPARTMENT\s+OF\s+[A-Z]/im,
    ];
    let best = 0;
    for (const m of markers) {
      const match = slice.search(m);
      if (match !== -1 && match > best) best = match;
    }
    return best;
  })();

  const body = rawText.slice(preambleEnd);

  // ── Step 2: Split on POST XX/YY boundaries ─────────────────────────
  // PSV circulars use POST <circularNo>/<postSeq> : TITLE
  // e.g. "POST 14/96 : DEPUTY DIRECTOR"
  const chunks = body.split(/(?=\bPOST\s+\d+\/\d+\b)/i).filter(c => /\bPOST\s+\d+\/\d+\b/i.test(c));

  console.log(`[PDF Parser] Body chunks: ${chunks.length}`);

  // Track department across chunks (resets per annexure/department heading)
  let currentDept = "";

  for (const chunk of chunks) {
    // ── Detect department heading before POST in this chunk ────────
    const deptMatch = chunk.match(/DEPARTMENT\s+OF\s+([A-Z][^\n\.]{3,60}?)(?=\s+POST\s+\d+)/i);
    if (deptMatch) currentDept = deptMatch[1].trim();

    // Also check for "DEPARTMENT OF X" anywhere before the POST keyword in this chunk
    const prePost = chunk.slice(0, chunk.search(/\bPOST\s+\d+\/\d+\b/i));
    const deptInPre = prePost.match(/DEPARTMENT\s+OF\s+([A-Z][^\n]{3,60})/i);
    if (deptInPre) currentDept = deptInPre[1].trim();

    // ── POST number ────────────────────────────────────────────────
    const postNumMatch = chunk.match(/\bPOST\s+(\d+)\/(\d+)\b/i);
    if (!postNumMatch) continue;
    const postNo = `${postNumMatch[1]}/${postNumMatch[2]}`;

    // ── Title: text after POST XX/YY until REF NO or first field ──
    const afterPost = chunk.slice(postNumMatch.index + postNumMatch[0].length);
    const titleRaw = afterPost
      .replace(/^\s*:\s*/, "")                        // strip leading colon
      .match(/^(.+?)(?=\s+(?:REF\s*NO|SALARY|CENTRE|REQUIREMENTS|DUTIES|ENQUIRIES)\s*:)/i);

    if (!titleRaw) continue;

    const title = titleRaw[1]
      .replace(/\(\s*REF\s*NO[\s\S]*/i, "")
      .replace(/REF\s*NO[:\s].*/gi, "")
      .replace(/\b(Directorate|Branch|Chief Directorate|Sub-?Directorate)\s*:.*/gi, "")
      .replace(/\s+/g, " ").trim().replace(/:$/, "").trim();

    if (!title || title.length < 3) continue;

    // ── REF NO ────────────────────────────────────────────────────
    const refMatch = chunk.match(/REF\s*NO[:\s]+([\w\/\s]+?)(?=\s+(?:SALARY|CENTRE|REQUIREMENTS|\())/i);
    const ref = refMatch ? refMatch[1].trim() : "";

    // ── SALARY ────────────────────────────────────────────────────
    const salaryMatch = chunk.match(/SALARY\s*:\s*(.+?)(?=\s+(?:CENTRE|REQUIREMENTS|DUTIES|ENQUIRIES|APPLICATIONS|CLOSING\s+DATE)\s*:)/i);
    const salary = salaryMatch ? salaryMatch[1].replace(/\s+/g, " ").trim() : "";
    const level = salaryToLevel(salary);

    // ── CENTRE ────────────────────────────────────────────────────
    const centreMatch = chunk.match(/CENTRE\s*:\s*(.+?)(?=\s+(?:REQUIREMENTS|DUTIES|ENQUIRIES|APPLICATIONS|CLOSING\s+DATE|NOTE)\s*:)/i);
    const centre = centreMatch ? centreMatch[1].replace(/\s+/g, " ").trim().replace(/\.$/, "") : "";

    // ── CLOSING DATE ──────────────────────────────────────────────
    const closingMatch = chunk.match(/CLOSING\s+DATE\s*:\s*(.+?)(?=\s+(?:NOTE|REQUIREMENTS|POST\s+\d+\/\d+|$))/i);
    let closing = closingMatch ? closingMatch[1].replace(/\s+at\s+\d+[:.].*/i, "").replace(/\s+/g, " ").trim() : "See circular";

    // ── REQUIREMENTS ──────────────────────────────────────────────
    const reqMatch = chunk.match(/REQUIREMENTS\s*:\s*([\s\S]+?)(?=\s+(?:DUTIES|ENQUIRIES|APPLICATIONS|CLOSING\s+DATE|NOTE|POST\s+\d+\/\d+)\s*:)/i);
    const requirements = reqMatch ? reqMatch[1].replace(/\s+/g, " ").trim().slice(0, 500) : "";

    // ── ENQUIRIES ─────────────────────────────────────────────────
    const enqMatch = chunk.match(/ENQUIRIES\s*:\s*([\s\S]+?)(?=\s+(?:APPLICATIONS|NOTE|CLOSING\s+DATE|POST\s+\d+\/\d+)\s*:)/i);
    const enquiries = enqMatch ? enqMatch[1].replace(/\s+/g, " ").trim() : "";

    // ── Department fallback: scan full text before this post ──────
    if (!currentDept) {
      const posInFull = rawText.indexOf(`POST ${postNo}`);
      if (posInFull > 0) {
        const before = rawText.slice(0, posInFull);
        const allDepts = [...before.matchAll(/DEPARTMENT\s+OF\s+([A-Z][^\n.]{3,60})/gi)];
        if (allDepts.length) currentDept = allDepts[allDepts.length - 1][1].trim();
      }
    }

    const category = inferCategory(title, currentDept);

    jobs.push({ postNo, title, ref, salary, level, centre, department: currentDept, closing, requirements, enquiries, category, circular: circularNo });
  }

  console.log(`[PDF Parser] Parsed ${jobs.length} jobs`);
  return jobs;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function AdminView({ jobs, setJobs, ads, setAds, onViewPortal }) {
  const [adminTab, setAdminTab]   = useState("circulars");
  const [newAd, setNewAd]         = useState({ title: "", subtitle: "", cta: "", color: "#0A2540", position: "sidebar" });
  const [showAdForm, setShowAdForm] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);

  const circulars = [...new Set(jobs.map(j => j.circular))].sort((a, b) => b - a);

  const processFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setUploadMsg("⚠ Please select a PDF file.");
      return;
    }
    setUploading(true);
    setUploadMsg("Loading PDF library…");
    try {
      // Load pdf.js from CDN once
      if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      setUploadMsg("Reading PDF…");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setUploadMsg(`Extracting text from ${pdf.numPages} pages…`);
      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page    = await pdf.getPage(p);
        const content = await page.getTextContent();
        // Join items with spaces (pdf.js doesn't preserve newlines)
        // Add a space between pages to prevent word concatenation
        fullText += " " + content.items.map(i => i.str).join(" ") + " ";
        if (p % 20 === 0) setUploadMsg(`Extracting… page ${p}/${pdf.numPages}`);
      }
      
      // Clean up multiple spaces
      fullText = fullText.replace(/\s+/g, " ").trim();

      // Detect circular number from filename or PDF header
      const fileNumMatch = file.name.match(/circular[_\s-]*(\d+)/i) || file.name.match(/(\d{1,3})/);
      const headerMatch  = fullText.match(/PUBLICATION\s+NO\s+(\d+)\s+OF/i);
      const circularNo   = headerMatch
        ? parseInt(headerMatch[1], 10)
        : fileNumMatch ? parseInt(fileNumMatch[1], 10)
        : (circulars.length > 0 ? Math.max(...circulars) + 1 : 1);

      setUploadMsg("Parsing job listings…");
      const parsed = parsePsvCircular(fullText, circularNo);

      if (parsed.length === 0) {
        setUploadMsg("⚠ No job listings detected. Check the PDF is a valid PSV circular.");
      } else {
        setJobs(prev => [...prev.filter(j => j.circular !== circularNo), ...parsed]);
        setUploadMsg(`✓ Circular ${circularNo} of 2026 — ${parsed.length} posts loaded.`);
      }
    } catch (err) {
      console.error("[PDF Parser] Error:", err);
      setUploadMsg(`✗ Error: ${err.message || "Could not read PDF."}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    await processFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    await processFile(e.dataTransfer.files?.[0]);
  };

  const handleSaveAd = (e) => {
    e.preventDefault();
    if (!newAd.title.trim()) return;
    setAds(prev => [...prev, { ...newAd, id: Date.now() }]);
    setNewAd({ title: "", subtitle: "", cta: "", color: "#0A2540", position: "sidebar" });
    setShowAdForm(false);
  };

  const tabs = [["circulars","ti-file-upload","Circulars"],["ads","ti-speakerphone","Ads"],["listings","ti-briefcase","Listings"]];

  return (
    <div style={a.page}>
      {/* Header */}
      <div style={a.header}>
        <div style={a.logoGroup}>
          <div style={a.logoBadge}><span>PSV</span></div>
          <div>
            <p style={a.adminTitle}>Admin</p>
            <p style={a.subTitle}>Circular Manager</p>
          </div>
        </div>
        <button onClick={onViewPortal} style={a.portalBtn}>View Portal ↗</button>
      </div>

      {/* Tab Bar */}
      <div style={a.tabBar}>
        {tabs.map(([id, icon, label]) => (
          <button key={id} onClick={() => setAdminTab(id)}
            style={{ ...a.tabBtn, borderBottom: adminTab===id ? "2px solid #3B82F6" : "2px solid transparent", color: adminTab===id ? "#3B82F6" : "#8E8E93" }}>
            <i className={`ti ${icon}`} style={{ fontSize:18, display:"block", marginBottom:2 }} />
            <span style={{ fontSize:11, fontWeight: adminTab===id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={a.content}>

        {/* ── CIRCULARS TAB ── */}
        {adminTab === "circulars" && (
          <div>
            <p style={a.sectionHeading}>Upload Circular</p>
            <input ref={fileInputRef} type="file" accept="application/pdf"
              style={{ display:"none" }} onChange={handleFileChange} />

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                ...a.dropzone,
                borderColor: dragOver ? "#2563EB" : "#D1D1D6",
                background: dragOver ? "#EFF6FF" : "#fff",
                opacity: uploading ? 0.6 : 1,
                cursor: uploading ? "default" : "pointer",
              }}
            >
              <div style={a.uploadIcon}>
                <i className="ti ti-file-upload" style={{ fontSize:28, color:"#2563EB" }} />
              </div>
              <p style={a.dropMain}>{uploading ? "Processing…" : "Drop PDF or click to upload"}</p>
              <p style={a.dropSub}>Posts are extracted and indexed automatically</p>
            </div>

            {uploadMsg && (
              <div style={{
                ...a.alert,
                background:   uploading ? "#EFF6FF" : uploadMsg.startsWith("✓") ? "#F0FDF4" : uploadMsg.startsWith("✗") ? "#FEF2F2" : "#FFFBEB",
                color:        uploading ? "#1D4ED8" : uploadMsg.startsWith("✓") ? "#166534" : uploadMsg.startsWith("✗") ? "#991B1B" : "#92400E",
                borderColor:  uploading ? "#BFDBFE" : uploadMsg.startsWith("✓") ? "#BBF7D0" : uploadMsg.startsWith("✗") ? "#FECACA" : "#FDE68A",
              }}>
                {uploadMsg}
              </div>
            )}

            <p style={a.upperLabel}>Active Circulars</p>
            {circulars.length === 0 ? (
              <p style={{ fontSize:13, color:"#8E8E93", textAlign:"center", padding:"2rem 0" }}>No circulars uploaded yet.</p>
            ) : circulars.map(c => (
              <div key={c} style={a.listItem}>
                <div>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1C1C1E" }}>Circular {c} of 2026</p>
                  <p style={{ fontSize:12, color:"#8E8E93" }}>{jobs.filter(j => j.circular === c).length} posts</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={a.liveBadge}>Live</span>
                  <button onClick={() => setJobs(prev => prev.filter(j => j.circular !== c))}
                    style={a.removeBtn}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ADS TAB ── */}
        {adminTab === "ads" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={a.sectionHeading}>Advertisements</p>
              <button onClick={() => setShowAdForm(v => !v)} style={a.actionBtn}>+ New Ad</button>
            </div>
            {showAdForm && (
              <form onSubmit={handleSaveAd} style={a.formCard}>
                <p style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>New Advertisement</p>
                <input required placeholder="Headline" value={newAd.title} onChange={e => setNewAd(p=>({...p,title:e.target.value}))} style={a.input} />
                <input placeholder="Subline" value={newAd.subtitle} onChange={e => setNewAd(p=>({...p,subtitle:e.target.value}))} style={a.input} />
                <input placeholder="CTA label" value={newAd.cta} onChange={e => setNewAd(p=>({...p,cta:e.target.value}))} style={a.input} />
                <div style={a.selectWrap}>
                  <select value={newAd.position} onChange={e => setNewAd(p=>({...p,position:e.target.value}))} style={a.select}>
                    <option value="sidebar">Sidebar</option>
                    <option value="banner">Top Banner</option>
                  </select>
                  <i className="ti ti-chevron-down" style={a.selectArrow} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0" }}>
                  <label style={{ fontSize:13, color:"#636366" }}>Background Color</label>
                  <input type="color" value={newAd.color} onChange={e => setNewAd(p=>({...p,color:e.target.value}))} style={{ width:40, height:32, border:"1px solid #E5E5EA", borderRadius:6 }} />
                </div>
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button type="submit" style={a.actionBtn}>Save</button>
                  <button type="button" onClick={() => setShowAdForm(false)} style={a.cancelBtn}>Cancel</button>
                </div>
              </form>
            )}
            {ads.length === 0 && !showAdForm && (
              <p style={{ fontSize:13, color:"#8E8E93", textAlign:"center", padding:"2rem 0" }}>No ads yet.</p>
            )}
            {ads.map(ad => (
              <div key={ad.id} style={a.listItem}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:ad.color, flexShrink:0 }} />
                  <div>
                    <p style={{ fontWeight:600, fontSize:13, margin:0 }}>{ad.title}</p>
                    <p style={{ fontSize:11, color:"#8E8E93", margin:0 }}>{ad.position}</p>
                  </div>
                </div>
                <button onClick={() => setAds(p => p.filter(x => x.id !== ad.id))} style={a.removeBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* ── LISTINGS TAB ── */}
        {adminTab === "listings" && (
          <div>
            <p style={a.sectionHeading}>Job Listings — {jobs.length} posts</p>
            {jobs.length === 0 ? (
              <p style={{ fontSize:13, color:"#8E8E93", textAlign:"center", padding:"2rem 0" }}>No listings yet. Upload a circular first.</p>
            ) : jobs.map(job => {
              const ls = getLevelStyle(job.level);
              return (
                <div key={`${job.circular}-${job.postNo}`} style={a.listItem}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.title}</p>
                    <p style={{ fontSize:11, color:"#8E8E93", margin:0 }}>
                      Post {job.postNo} · {(job.centre || "").split(":").pop().trim() || job.centre || "—"}
                    </p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:5, background:ls.bg, color:ls.text, flexShrink:0, marginLeft:8 }}>{job.level}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const a = {
  page:          { minHeight:"100dvh", background:"#F5F5F7", fontFamily:"system-ui, sans-serif" },
  header:        { background:"#1C1C1E", padding:"12px 16px", paddingTop:"calc(12px + var(--safe-top))", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logoGroup:     { display:"flex", alignItems:"center", gap:10 },
  logoBadge:     { width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#2563EB,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:11 },
  adminTitle:    { color:"#EBEBF5", fontSize:14, fontWeight:700, margin:0, lineHeight:1.2 },
  subTitle:      { color:"#636366", fontSize:11, margin:0 },
  portalBtn:     { background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"7px 12px", color:"#EBEBF5", fontSize:13, fontWeight:500, cursor:"pointer" },
  tabBar:        { background:"#1C1C1E", borderBottom:"1px solid #3A3A3C", display:"flex" },
  tabBtn:        { flex:1, background:"none", border:"none", padding:"10px 4px 8px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" },
  content:       { padding:"16px", paddingBottom:"calc(24px + var(--safe-bottom))" },
  sectionHeading:{ fontSize:16, fontWeight:700, color:"#1C1C1E", margin:"0 0 14px" },
  dropzone:      { border:"1.5px dashed #D1D1D6", borderRadius:14, padding:"2rem 1rem", textAlign:"center", marginBottom:12, transition:"all 0.15s ease" },
  uploadIcon:    { width:52, height:52, borderRadius:14, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" },
  dropMain:      { fontWeight:600, fontSize:15, color:"#1C1C1E", marginBottom:4 },
  dropSub:       { fontSize:13, color:"#8E8E93" },
  alert:         { border:"1px solid", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:16 },
  upperLabel:    { fontSize:12, fontWeight:600, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5, margin:"16px 0 8px" },
  listItem:      { background:"#fff", border:"1px solid #F0F0F0", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" },
  liveBadge:     { fontSize:11, fontWeight:600, background:"#F0FDF4", color:"#166534", padding:"3px 10px", borderRadius:20, border:"1px solid #BBF7D0", flexShrink:0 },
  actionBtn:     { background:"#2563EB", color:"#fff", border:"none", borderRadius:10, padding:"9px 16px", fontSize:14, fontWeight:600, cursor:"pointer" },
  cancelBtn:     { background:"#F5F5F7", border:"none", borderRadius:10, padding:"9px 16px", fontSize:14, color:"#636366", cursor:"pointer" },
  removeBtn:     { background:"transparent", border:"1px solid #FECACA", borderRadius:8, padding:"4px 10px", fontSize:12, color:"#EF4444", flexShrink:0, cursor:"pointer" },
  formCard:      { background:"#fff", border:"1px solid #E5E5EA", borderRadius:14, padding:"14px", marginBottom:16 },
  input:         { width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, fontSize:15, background:"#F9F9F9", marginBottom:10, outline:"none", display:"block" },
  selectWrap:    { position:"relative", marginBottom:10 },
  select:        { width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, paddingRight:30, fontSize:15, background:"#F9F9F9", outline:"none" },
  selectArrow:   { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#8E8E93", pointerEvents:"none" },
};
