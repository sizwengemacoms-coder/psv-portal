// src/components/AdminView.jsx
import { useState, useRef } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "../App.jsx";

const LEVEL_COLORS = {
  "OSD": { bg:"#F0F4FF", text:"#3D52A0" },
  "Level 02": { bg:"#F5F5F7", text:"#636366" },
  "Level 03": { bg:"#F5F5F7", text:"#636366" },
  "Level 04": { bg:"#F5F5F7", text:"#636366" },
  "Level 05": { bg:"#F0F4FF", text:"#3D52A0" },
  "Level 06": { bg:"#F0F7FF", text:"#0369A1" },
  "Level 07": { bg:"#F0F7FF", text:"#0369A1" },
  "Level 08": { bg:"#F0FDF4", text:"#166534" },
  "Level 09": { bg:"#F0FDF4", text:"#166534" },
  "Level 10": { bg:"#FEFCE8", text:"#854D0E" },
  "Level 11": { bg:"#FFF7ED", text:"#9A3412" },
  "Level 12": { bg:"#FDF4FF", text:"#7E22CE" },
  "Level 13": { bg:"#FDF4FF", text:"#7E22CE" },
  "Level 14": { bg:"#FFF1F2", text:"#9F1239" },
  "Level 15": { bg:"#1C1C1E", text:"#FFFFFF" },
};
const getLevelStyle = (l) => LEVEL_COLORS[l] || { bg:"#F3F4F6", text:"#374151" };

async function sbInsertJobs(jobs) {
  const rows = jobs.map(j => ({
    circular: j.circular,
    post_no: j.postNo,
    title: j.title,
    department: j.department || "",
    salary: j.salary || "",
    level: j.level || "Unknown",
    centre: j.centre || "",
    closing: j.closing || "",
    page_number: j.pageNumber || null,
    ref: j.ref || "",
    requirements: j.requirements || "",
    enquiries: j.enquiries || "",
    category: j.category || "Administration",
  }));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/psv_jobs?on_conflict=circular,post_no`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sbDeleteCircular(circular) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/psv_jobs?circular=eq.${circular}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sbInsertAd(ad) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/psv_ads`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ title: ad.title, subtitle: ad.subtitle, cta: ad.cta, color: ad.color, position: ad.position }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json())[0];
}

async function sbDeleteAd(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/psv_ads?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── AI parser via Claude API ────────────────────────────────────────
async function parseWithAI(pdfText, circularNo, onProgress) {
  // Split into chunks of ~12000 chars to stay within token limits
  const CHUNK = 12000;
  const chunks = [];
  for (let i = 0; i < pdfText.length; i += CHUNK) chunks.push(pdfText.slice(i, i + CHUNK));

  const allJobs = [];
  let currentDept = "";

  for (let ci = 0; ci < chunks.length; ci++) {
    onProgress(`AI reading page ${ci + 1} of ${chunks.length}…`);

    const prompt = `You are parsing a South African Government Public Service Vacancies circular PDF.
Extract ONLY actual job vacancy entries from the text below. Ignore preamble, index pages, instructions, and boilerplate.

For each job post found, return a JSON array of objects with these exact fields:
- postNo: string (e.g. "14/96")
- title: string (job title only, no department)
- department: string (department name, infer from context if not on same line)
- salary: string (e.g. "R407 337 per annum (OSD)")
- level: string (e.g. "Level 08" or "OSD" — extract from salary bracket or explicit mention)
- centre: string (location/province)
- closing: string (closing date)
- ref: string (reference number)
- pageNumber: number or null (approximate page number if you can tell)
- requirements: string (first 300 chars of requirements)
- enquiries: string (contact person and number)
- category: string (one of: Administration, Finance, Human Resources, Legal, IT & Technology, Education, Compliance, Economics, Supply Chain, Management, Business Development)

Current department context from previous chunk: "${currentDept}"
Circular number: ${circularNo}

Return ONLY a valid JSON array, no markdown, no explanation. If no jobs found return [].

TEXT:
${chunks[ci]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const jobs = JSON.parse(clean);
      if (Array.isArray(jobs) && jobs.length > 0) {
        // Update dept context for next chunk
        const lastDept = jobs.filter(j => j.department).pop()?.department;
        if (lastDept) currentDept = lastDept;
        allJobs.push(...jobs.map(j => ({ ...j, circular: circularNo })));
      }
    } catch(e) {
      console.warn("AI chunk parse error:", e, text.slice(0, 200));
    }
  }

  return allJobs;
}

export default function AdminView({ jobs, setJobs, ads, setAds, onViewPortal }) {
  const [tab, setTab] = useState("circulars");
  const [newAd, setNewAd] = useState({ title:"", subtitle:"", cta:"", color:"#0A2540", position:"sidebar" });
  const [showAdForm, setShowAdForm] = useState(false);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const circulars = [...new Set(jobs.map(j => j.circular))].sort((a,b) => b-a);

  const processFile = async (file) => {
    if (!file || file.type !== "application/pdf") { setStatus("⚠ Please select a PDF file."); return; }
    setUploading(true);
    setStatus("Loading PDF…");
    try {
      if (!window.pdfjsLib) {
        await new Promise((res,rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      setStatus(`Extracting text from ${pdf.numPages} pages…`);

      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += ` ${content.items.map(i => i.str).join(" ")} `;
        if (p % 10 === 0) setStatus(`Extracting… ${p}/${pdf.numPages} pages`);
      }
      fullText = fullText.replace(/\s+/g, " ").trim();

      const fileNum = file.name.match(/circular[_\s-]*(\d+)/i) || file.name.match(/(\d{1,3})/);
      const headerNum = fullText.match(/PUBLICATION\s+NO\s+(\d+)\s+OF/i);
      const circularNo = headerNum ? parseInt(headerNum[1]) : fileNum ? parseInt(fileNum[1]) : (circulars.length > 0 ? Math.max(...circulars) + 1 : 1);

      const parsed = await parseWithAI(fullText, circularNo, setStatus);

      if (parsed.length === 0) {
        setStatus("⚠ No job listings found. Check the PDF is a valid PSV circular.");
        return;
      }

      setStatus(`Saving ${parsed.length} jobs to database…`);
      await sbInsertJobs(parsed);

      const normalized = parsed.map(j => ({ ...j, postNo: j.postNo, pageNumber: j.pageNumber }));
      setJobs(prev => [...prev.filter(j => j.circular !== circularNo), ...normalized]);
      setStatus(`✓ Circular ${circularNo} — ${parsed.length} posts saved and live for all users.`);
    } catch(e) {
      console.error(e);
      setStatus(`✗ Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeCircular = async (c) => {
    try {
      await sbDeleteCircular(c);
      setJobs(prev => prev.filter(j => j.circular !== c));
    } catch(e) { alert("Failed to remove: " + e.message); }
  };

  const saveAd = async (e) => {
    e.preventDefault();
    if (!newAd.title.trim()) return;
    try {
      const saved = await sbInsertAd(newAd);
      setAds(prev => [...prev, saved]);
      setNewAd({ title:"", subtitle:"", cta:"", color:"#0A2540", position:"sidebar" });
      setShowAdForm(false);
    } catch(e) { alert("Failed to save ad: " + e.message); }
  };

  const removeAd = async (id) => {
    try {
      await sbDeleteAd(id);
      setAds(prev => prev.filter(a => a.id !== id));
    } catch(e) { alert("Failed to remove: " + e.message); }
  };

  const tabs = [["circulars","ti-file-upload","Circulars"],["ads","ti-speakerphone","Ads"],["listings","ti-briefcase","Listings"]];

  return (
    <div style={a.page}>
      <div style={a.header}>
        <div style={a.logoGroup}>
          <div style={a.logoBadge}>PSV</div>
          <div>
            <p style={a.adminTitle}>Admin</p>
            <p style={a.subTitle}>Circular Manager</p>
          </div>
        </div>
        <button onClick={onViewPortal} style={a.portalBtn}>View Portal ↗</button>
      </div>

      <div style={a.tabBar}>
        {tabs.map(([id,icon,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{...a.tabBtn, borderBottom: tab===id?"2px solid #3B82F6":"2px solid transparent", color: tab===id?"#3B82F6":"#8E8E93"}}>
            <i className={`ti ${icon}`} style={{fontSize:18,display:"block",marginBottom:2}} />
            <span style={{fontSize:11,fontWeight:tab===id?600:400}}>{label}</span>
          </button>
        ))}
      </div>

      <div style={a.content}>
        {tab === "circulars" && (
          <div>
            <p style={a.sectionHeading}>Upload Circular</p>
            <input ref={fileRef} type="file" accept="application/pdf" style={{display:"none"}} onChange={e=>{processFile(e.target.files?.[0]); e.target.value="";}} />
            <div onClick={()=>!uploading&&fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files?.[0]);}}
              style={{...a.dropzone, borderColor:dragOver?"#2563EB":"#D1D1D6", background:dragOver?"#EFF6FF":"#fff", opacity:uploading?0.6:1, cursor:uploading?"default":"pointer"}}>
              <div style={a.uploadIcon}><i className="ti ti-file-upload" style={{fontSize:28,color:"#2563EB"}} /></div>
              <p style={a.dropMain}>{uploading?"Processing…":"Drop PDF or tap to upload"}</p>
              <p style={a.dropSub}>AI extracts job listings automatically</p>
            </div>
            {status && (
              <div style={{...a.alert,
                background: uploading?"#EFF6FF":status.startsWith("✓")?"#F0FDF4":status.startsWith("✗")?"#FEF2F2":"#FFFBEB",
                color: uploading?"#1D4ED8":status.startsWith("✓")?"#166534":status.startsWith("✗")?"#991B1B":"#92400E",
                borderColor: uploading?"#BFDBFE":status.startsWith("✓")?"#BBF7D0":status.startsWith("✗")?"#FECACA":"#FDE68A",
              }}>{status}</div>
            )}
            <p style={a.upperLabel}>Active Circulars</p>
            {circulars.length === 0
              ? <p style={{fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0"}}>No circulars uploaded yet.</p>
              : circulars.map(c => (
                <div key={c} style={a.listItem}>
                  <div>
                    <p style={{fontWeight:600,fontSize:14,color:"#1C1C1E"}}>Circular {c} of 2026</p>
                    <p style={{fontSize:12,color:"#8E8E93"}}>{jobs.filter(j=>j.circular===c).length} posts</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={a.liveBadge}>Live</span>
                    <button onClick={()=>removeCircular(c)} style={a.removeBtn}>Remove</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "ads" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <p style={a.sectionHeading}>Advertisements</p>
              <button onClick={()=>setShowAdForm(v=>!v)} style={a.actionBtn}>+ New Ad</button>
            </div>
            {showAdForm && (
              <form onSubmit={saveAd} style={a.formCard}>
                <p style={{fontWeight:600,fontSize:14,marginBottom:12}}>New Advertisement</p>
                <input required placeholder="Headline" value={newAd.title} onChange={e=>setNewAd(p=>{...p,title:e.target.value})} style={a.input} />
                <input placeholder="Subline" value={newAd.subtitle} onChange={e=>setNewAd(p=>{...p,subtitle:e.target.value})} style={a.input} />
                <input placeholder="CTA label" value={newAd.cta} onChange={e=>setNewAd(p=>{...p,cta:e.target.value})} style={a.input} />
                <div style={a.selectWrap}>
                  <select value={newAd.position} onChange={e=>setNewAd(p=>{...p,position:e.target.value})} style={a.select}>
                    <option value="sidebar">Sidebar</option>
                    <option value="banner">Top Banner</option>
                  </select>
                  <i className="ti ti-chevron-down" style={a.selectArrow} />
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"10px 0"}}>
                  <label style={{fontSize:13,color:"#636366"}}>Background Color</label>
                  <input type="color" value={newAd.color} onChange={e=>setNewAd(p=>{...p,color:e.target.value})} style={{width:40,height:32,border:"1px solid #E5E5EA",borderRadius:6}} />
                </div>
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <button type="submit" style={a.actionBtn}>Save</button>
                  <button type="button" onClick={()=>setShowAdForm(false)} style={a.cancelBtn}>Cancel</button>
                </div>
              </form>
            )}
            {ads.length===0&&!showAdForm && <p style={{fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0"}}>No ads yet.</p>}
            {ads.map(ad => (
              <div key={ad.id} style={a.listItem}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:8,background:ad.color,flexShrink:0}} />
                  <div>
                    <p style={{fontWeight:600,fontSize:13,margin:0}}>{ad.title}</p>
                    <p style={{fontSize:11,color:"#8E8E93",margin:0}}>{ad.position}</p>
                  </div>
                </div>
                <button onClick={()=>removeAd(ad.id)} style={a.removeBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {tab === "listings" && (
          <div>
            <p style={a.sectionHeading}>Job Listings — {jobs.length} posts</p>
            {jobs.length===0
              ? <p style={{fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0"}}>No listings yet.</p>
              : jobs.map(job => {
                  const ls = getLevelStyle(job.level);
                  return (
                    <div key={`${job.circular}-${job.postNo}`} style={a.listItem}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontWeight:600,fontSize:13,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.title}</p>
                        <p style={{fontSize:11,color:"#8E8E93",margin:0}}>Post {job.postNo} · {(job.centre||"").split(":").pop().trim()||"—"} {job.pageNumber ? `· p.${job.pageNumber}` : ""}</p>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5,background:ls.bg,color:ls.text,flexShrink:0,marginLeft:8}}>{job.level}</span>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
}

const a = {
  page:{ minHeight:"100dvh", background:"#F5F5F7", fontFamily:"system-ui,sans-serif" },
  header:{ background:"#1C1C1E", padding:"12px 16px", paddingTop:"calc(12px + var(--safe-top))", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logoGroup:{ display:"flex", alignItems:"center", gap:10 },
  logoBadge:{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#2563EB,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:11 },
  adminTitle:{ color:"#EBEBF5", fontSize:14, fontWeight:700, margin:0, lineHeight:1.2 },
  subTitle:{ color:"#636366", fontSize:11, margin:0 },
  portalBtn:{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"7px 12px", color:"#EBEBF5", fontSize:13, fontWeight:500, cursor:"pointer" },
  tabBar:{ background:"#1C1C1E", borderBottom:"1px solid #3A3A3C", display:"flex" },
  tabBtn:{ flex:1, background:"none", border:"none", padding:"10px 4px 8px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" },
  content:{ padding:"16px", paddingBottom:"calc(24px + var(--safe-bottom))" },
  sectionHeading:{ fontSize:16, fontWeight:700, color:"#1C1C1E", margin:"0 0 14px" },
  dropzone:{ border:"1.5px dashed", borderRadius:14, padding:"2rem 1rem", textAlign:"center", marginBottom:12, transition:"all 0.15s" },
  uploadIcon:{ width:52, height:52, borderRadius:14, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" },
  dropMain:{ fontWeight:600, fontSize:15, color:"#1C1C1E", marginBottom:4 },
  dropSub:{ fontSize:13, color:"#8E8E93" },
  alert:{ border:"1px solid", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:16 },
  upperLabel:{ fontSize:12, fontWeight:600, color:"#8E8E93", textTransform:"uppercase", letterSpacing:0.5, margin:"16px 0 8px" },
  listItem:{ background:"#fff", border:"1px solid #F0F0F0", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" },
  liveBadge:{ fontSize:11, fontWeight:600, background:"#F0FDF4", color:"#166534", padding:"3px 10px", borderRadius:20, border:"1px solid #BBF7D0" },
  actionBtn:{ background:"#2563EB", color:"#fff", border:"none", borderRadius:10, padding:"9px 16px", fontSize:14, fontWeight:600, cursor:"pointer" },
  cancelBtn:{ background:"#F5F5F7", border:"none", borderRadius:10, padding:"9px 16px", fontSize:14, color:"#636366", cursor:"pointer" },
  removeBtn:{ background:"transparent", border:"1px solid #FECACA", borderRadius:8, padding:"4px 10px", fontSize:12, color:"#EF4444", cursor:"pointer" },
  formCard:{ background:"#fff", border:"1px solid #E5E5EA", borderRadius:14, padding:"14px", marginBottom:16 },
  input:{ width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, fontSize:15, background:"#F9F9F9", marginBottom:10, outline:"none", display:"block" },
  selectWrap:{ position:"relative", marginBottom:10 },
  select:{ width:"100%", height:42, border:"1px solid #E5E5EA", borderRadius:10, paddingInline:12, paddingRight:30, fontSize:15, background:"#F9F9F9", outline:"none" },
  selectArrow:{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#8E8E93", pointerEvents:"none" },
};
