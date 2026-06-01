// src/components/AdminView.jsx
import { useState, useRef } from "react";
import { getLevelStyle } from "../constants/psvData.js";

// Parses raw PDF text into job objects.
// Expects lines like:
//   POST NO: 123   TITLE   CENTRE: X   LEVEL: Level 09
// Falls back to a best-effort heuristic if the exact format differs.
function parsePdfText(text, circularNo) {
  const jobs = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Try to detect repeating blocks via POST NO pattern
  const postPattern = /POST\s*(?:NO\.?|NUMBER)?\s*[:#]?\s*(\d+)/i;
  const levelPattern = /LEVEL\s*[:#]?\s*(Level\s*\d+)/i;
  const centrePattern = /(?:CENTRE|CENTER|LOCATION|STATION)\s*[:#]?\s*(.+)/i;

  let i = 0;
  while (i < lines.length) {
    const postMatch = lines[i].match(postPattern);
    if (postMatch) {
      const postNo = parseInt(postMatch[1], 10);
      let title = "";
      let centre = "";
      let level = "";

      // Look ahead up to 8 lines for title / centre / level
      for (let j = i + 1; j < Math.min(i + 9, lines.length); j++) {
        const lm = lines[j].match(levelPattern);
        const cm = lines[j].match(centrePattern);
        if (lm) { level = lm[1].trim(); }
        else if (cm) { centre = cm[1].trim(); }
        else if (!title && lines[j].length > 4 && !postPattern.test(lines[j])) {
          title = lines[j];
        }
      }

      if (title || level) {
        jobs.push({
          postNo,
          title: title || `Post ${postNo}`,
          circular: circularNo,
          centre: centre || "PSV",
          level: level || "Level 05",
        });
      }
    }
    i++;
  }

  // Fallback: if nothing was parsed, create one entry per non-trivial line cluster
  if (jobs.length === 0) {
    let counter = 1;
    for (let j = 0; j < lines.length; j += 3) {
      if (lines[j] && lines[j].length > 5) {
        jobs.push({
          postNo: counter++,
          title: lines[j],
          circular: circularNo,
          centre: lines[j + 1] || "PSV",
          level: "Level 05",
        });
      }
    }
  }

  return jobs;
}

export default function AdminView({ jobs, setJobs, ads, setAds, onViewPortal }) {
  const [adminTab, setAdminTab] = useState("circulars");
  const [newAd, setNewAd] = useState({ title: "", subtitle: "", cta: "", color: "#0A2540", position: "sidebar" });
  const [showAdForm, setShowAdForm] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const circulars = [...new Set(jobs.map(j => j.circular))].sort((a, b) => b - a);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      setUploadMsg("Please select a valid PDF file.");
      return;
    }

    setUploading(true);
    setUploadMsg("Reading PDF…");

    try {
      // Dynamically load pdf.js from CDN
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setUploadMsg(`Extracting text from ${pdf.numPages} page(s)…`);

      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + "\n";
      }

      // Derive circular number from filename or existing circulars
      const fileCircularMatch = file.name.match(/(\d+)/);
      const circularNo = fileCircularMatch
        ? parseInt(fileCircularMatch[1], 10)
        : (circulars.length > 0 ? Math.max(...circulars) + 1 : 1);

      setUploadMsg("Parsing job listings…");
      const parsed = parsePdfText(fullText, circularNo);

      if (parsed.length === 0) {
        setUploadMsg("⚠ No job listings found. Check the PDF format.");
      } else {
        setJobs(prev => {
          // Remove any existing jobs for this circular, then add new
          const without = prev.filter(j => j.circular !== circularNo);
          return [...without, ...parsed];
        });
        setUploadMsg(`✓ Circular ${circularNo} uploaded. ${parsed.length} posts added.`);
      }
    } catch (err) {
      console.error(err);
      setUploadMsg("✗ Failed to read PDF. " + (err.message || ""));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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

      {/* Content */}
      <div style={a.content}>

        {adminTab === "circulars" && (
          <div>
            <p style={a.sectionHeading}>Upload Circular</p>

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display:"none" }}
              onChange={handleFileChange}
            />

            <div onClick={() => !uploading && fileInputRef.current?.click()} style={{ ...a.dropzone, opacity: uploading ? 0.6 : 1, cursor: uploading ? "default" : "pointer" }}>
              <div style={a.uploadIcon}>
                <i className="ti ti-file-upload" style={{ fontSize:28, color:"#2563EB" }} />
              </div>
              <p style={a.dropMain}>Drop PDF or click to upload</p>
              <p style={a.dropSub}>Posts are extracted and indexed automatically</p>
            </div>

            {uploadMsg && (
              <div style={{ ...a.alert,
                background: uploading ? "#EFF6FF" : uploadMsg.startsWith("✓") ? "#F0FDF4" : uploadMsg.startsWith("✗") ? "#FEF2F2" : "#FFFBEB",
                color: uploading ? "#1D4ED8" : uploadMsg.startsWith("✓") ? "#166534" : uploadMsg.startsWith("✗") ? "#991B1B" : "#92400E",
                borderColor: uploading ? "#BFDBFE" : uploadMsg.startsWith("✓") ? "#BBF7D0" : uploadMsg.startsWith("✗") ? "#FECACA" : "#FDE68A",
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
                <span style={a.liveBadge}>Live</span>
              </div>
            ))}
          </div>
        )}

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

        {adminTab === "listings" && (
          <div>
            <p style={a.sectionHeading}>Job Listings — {jobs.length} posts</p>
            {jobs.length === 0 ? (
              <p style={{ fontSize:13, color:"#8E8E93", textAlign:"center", padding:"2rem 0" }}>No listings yet. Upload a circular first.</p>
            ) : jobs.map(job => {
              const ls = getLevelStyle(job.level);
              return (
                <div key={job.postNo} style={a.listItem}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.title}</p>
                    <p style={{ fontSize:11, color:"#8E8E93", margin:0 }}>Post {job.postNo} · {job.centre.split(":").pop().trim()}</p>
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
  page: { minHeight:"100dvh", background:"#F5F5F7", fontFamily:"system-ui, sans-serif" },
  header: { background:"#1C1C1E", padding:"12px 16px", paddingTop:"calc(12px + var(--safe-top))", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logoGroup: { display:"flex", alignItems:"center", gap:10 },
  logoBadge: { width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#2563EB,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:11, flexShrink:0 },
  adminTitle: { color:"#EBEBF5", fontSize:14, fontWeight:700, margin:0, lineHeight:1.2 },
  subTitle: { color:"#636366", fontSize:11, margin:0 },
  portalBtn: { background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"7px 12px", color:"#EBEBF5", fontSize:13, fontWeight:500, cursor:"pointer" },
  tabBar: { background:"#1C1C1E", borderBottom:"1px solid #3A3A3C", display:"flex" },
  tabBtn: { flex:1, background:"none", border:"none", padding:"10px 4px 8px", display:"flex", flexDirection:"column", alignItems:"center" },
  content: { padding:"16px", paddingBottom:"calc(24px + var(--safe-bottom))" },
  sectionHeading: { fontSize:16, fontWeight:700, color:"#1C1C1E", margin:"0 0 14px" },
  dropzone: { background:"#fff", border:"1.5px dashed #D1D1D6", borderRadius:14, padding:"2rem 1rem", textAlign:"center", marginBottom:12 },
  uploadIcon: { width:52, height:52, borderRadius:14, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" },
  dropMain: { fontWeight:600, fontSize:15, color:"#1C1C1E", marginBottom:4 },
  dropSub: { fontSize:13, color:"#8E8E93" },
  alert: { border:"1px solid", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:16 },
  upperLabel: { fontSize:12, fontWeight:600, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5, margin:"16px 0 8px" },
  listItem: { background:"#fff", border:"1px solid #F0F0F0", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" },
  liveBadge: { fontSize:11, fontWeight:600, background:"#F0FDF4", color:"#166534", padding:"3px 10px", borderRadius:20, border:"1px solid #BBF7D0", flexShrink:0 },
  actionBtn: { background:"#2563EB", color:"#fff", border:"none", borderRadius:10, padding:"9px 16px", fontSize:14, fontWeight:600, cursor:"pointer" },
  cancelBtn: { background:"transparent", border:"1px solid #E5E5EA", borderRadius:10, padding:"9px 16px", fontSize:14, color:"#636366", cursor:"pointer" },
  removeBtn: { background:"transparent", border:"1px solid #FECACA", borderRadius:8, padding:"4px 10px", fontSize:12, color:"#EF4444", flexShrink:0, cursor:"pointer" },
  formCard: { background:"#fff", border:"1px solid #E5E5EA", borderRadius:14, padding:"14px", marginBottom:16 },
  input: { width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, fontSize:15, background:"#F9F9F9", marginBottom:10, outline:"none", display:"block" },
  selectWrap: { position:"relative", marginBottom:10 },
  select: { width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, paddingRight:30, fontSize:15, background:"#F9F9F9", outline:"none" },
  selectArrow: { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#8E8E93", pointerEvents:"none" },
};
