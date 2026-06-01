// src/components/AdminView.jsx
import { useState, useRef } from "react";
import { supabase } from "../supabase.js";
import { getLevelStyle } from "../constants/psvData.js";

export default function AdminView({ jobs, setJobs, ads, setAds, onViewPortal }) {
  const [tab, setTab]             = useState("circulars");
  const [status, setStatus]       = useState("");
  const [busy, setBusy]           = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [newAd, setNewAd]         = useState({ title:"", subtitle:"", cta:"", color:"#0A2540", position:"sidebar" });
  const [showAdForm, setShowAdForm] = useState(false);
  const fileRef                   = useRef(null);
  const circulars = [...new Set(jobs.map(j => j.circular))].sort((a,b) => b - a);

  async function extractPdfText(file) {
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
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      pages.push({ page: p, text: content.items.map(i => i.str).join(" ") });
    }
    return pages;
  }

  async function parseWithAI(pages, circularNo, onProgress) {
    const allJobs = [];
    const batchSize = 15;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      onProgress(`AI parsing pages ${batch[0].page}–${batch[batch.length-1].page} of ${pages.length}…`);
      const pageText = batch.map(p => `=== PAGE ${p.page} ===\n${p.text}`).join("\n\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: `You are a parser for South African Public Service Vacancy circulars. Extract every job post. Each post starts with "POST XX/YY". Return ONLY a valid JSON array, no markdown, no explanation. Each item: { "postNo": "14/96", "title": "JOB TITLE", "ref": "ref number", "salary": "salary string", "level": "Level 10", "centre": "location", "department": "department name", "closing": "closing date", "requirements": "first 300 chars", "enquiries": "contact info", "category": "Management|Finance|Human Resources|Legal|IT & Technology|Education|Supply Chain|Administration", "pageNumber": N }. Use empty string for missing fields. Skip preamble and index pages.`,
          messages: [{ role: "user", content: `Circular: ${circularNo}\n\n${pageText}` }]
        })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "[]";
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        if (Array.isArray(parsed)) allJobs.push(...parsed);
      } catch(e) { console.warn("Batch parse error:", e, text.slice(0,200)); }
    }
    return allJobs;
  }

  async function processFile(file) {
    if (!file || file.type !== "application/pdf") { setStatus("Please upload a PDF."); return; }
    setBusy(true);
    try {
      setStatus("Reading PDF…");
      const pages = await extractPdfText(file);
      const fullText = pages.map(p => p.text).join(" ");
      const circMatch = fullText.match(/CIRCULAR\s+(\d+)\s+OF/i) || file.name.match(/(\d{1,3})/);
      const circularNo = circMatch ? parseInt(circMatch[1], 10) : (circulars.length > 0 ? Math.max(...circulars) + 1 : 1);
      const parsed = await parseWithAI(pages, circularNo, setStatus);
      if (!parsed.length) { setStatus("No jobs found. Check it is a PSV circular PDF."); return; }
      setStatus(`Saving ${parsed.length} posts…`);
      await supabase.from("psv_jobs").delete().eq("circular", circularNo);
      const rows = parsed.map(j => ({
        circular: circularNo, post_no: j.postNo||"", title: j.title||"",
        ref: j.ref||"", salary: j.salary||"", level: j.level||"Unknown",
        centre: j.centre||"", department: j.department||"", closing: j.closing||"",
        requirements: j.requirements||"", enquiries: j.enquiries||"",
        category: j.category||"Administration", page_number: j.pageNumber||null,
      }));
      const { error } = await supabase.from("psv_jobs").insert(rows);
      if (error) throw error;
      setJobs(prev => [
        ...prev.filter(j => j.circular !== circularNo),
        ...rows.map(r => ({ postNo:r.post_no, title:r.title, ref:r.ref, salary:r.salary, level:r.level, centre:r.centre, department:r.department, closing:r.closing, requirements:r.requirements, enquiries:r.enquiries, category:r.category, circular:r.circular, pageNumber:r.page_number }))
      ]);
      setStatus(`✓ Circular ${circularNo} — ${parsed.length} posts live for all users.`);
    } catch(err) {
      setStatus(`Error: ${err.message}`);
    } finally { setBusy(false); }
  }

  async function handleSaveAd(e) {
    e.preventDefault();
    if (!newAd.title.trim()) return;
    const { data, error } = await supabase.from("psv_ads").insert([newAd]).select().single();
    if (!error && data) { setAds(prev => [...prev, { id:data.id, ...newAd }]); setNewAd({ title:"", subtitle:"", cta:"", color:"#0A2540", position:"sidebar" }); setShowAdForm(false); }
  }

  async function removeAd(id) { await supabase.from("psv_ads").delete().eq("id", id); setAds(prev => prev.filter(a => a.id !== id)); }
  async function removeCircular(c) { await supabase.from("psv_jobs").delete().eq("circular", c); setJobs(prev => prev.filter(j => j.circular !== c)); }

  const tabs = [["circulars","ti-file-upload","Circulars"],["ads","ti-speakerphone","Ads"],["listings","ti-briefcase","Listings"]];

  return (
    <div style={a.page}>
      <div style={a.header}>
        <div style={a.logoGroup}>
          <div style={a.logoBadge}><span>PSV</span></div>
          <div><p style={a.adminTitle}>Admin</p><p style={a.subTitle}>Circular Manager</p></div>
        </div>
        <button onClick={onViewPortal} style={a.portalBtn}>View Portal ↗</button>
      </div>
      <div style={a.tabBar}>
        {tabs.map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ ...a.tabBtn, borderBottom:tab===id?"2px solid #3B82F6":"2px solid transparent", color:tab===id?"#3B82F6":"#8E8E93" }}>
            <i className={`ti ${icon}`} style={{ fontSize:18,display:"block",marginBottom:2 }} />
            <span style={{ fontSize:11,fontWeight:tab===id?600:400 }}>{label}</span>
          </button>
        ))}
      </div>
      <div style={a.content}>
        {tab === "circulars" && (
          <div>
            <p style={a.heading}>Upload Circular PDF</p>
            <p style={{ fontSize:13,color:"#636366",marginBottom:14 }}>Claude AI reads the PDF and extracts each job post. Jobs are saved to the database and instantly visible to all users on any device.</p>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display:"none" }} onChange={e => { processFile(e.target.files?.[0]); e.target.value=""; }} />
            <div onClick={() => !busy && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); }}
              style={{ ...a.dropzone, borderColor:dragOver?"#2563EB":"#D1D1D6", background:dragOver?"#EFF6FF":"#fff", opacity:busy?0.6:1, cursor:busy?"default":"pointer" }}>
              <div style={a.uploadIcon}><i className="ti ti-file-upload" style={{ fontSize:28,color:"#2563EB" }} /></div>
              <p style={a.dropMain}>{busy?"Processing…":"Drop PDF or tap to upload"}</p>
              <p style={a.dropSub}>Powered by Claude AI · Saved to database</p>
            </div>
            {status && (
              <div style={{ ...a.alert,
                background:  busy?"#EFF6FF":status.startsWith("✓")?"#F0FDF4":status.startsWith("Error")?"#FEF2F2":"#FFFBEB",
                color:       busy?"#1D4ED8":status.startsWith("✓")?"#166534":status.startsWith("Error")?"#991B1B":"#92400E",
                borderColor: busy?"#BFDBFE":status.startsWith("✓")?"#BBF7D0":status.startsWith("Error")?"#FECACA":"#FDE68A",
              }}>{status}</div>
            )}
            <p style={a.upperLabel}>Active Circulars</p>
            {circulars.length === 0
              ? <p style={{ fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0" }}>No circulars yet.</p>
              : circulars.map(c => (
                <div key={c} style={a.listItem}>
                  <div>
                    <p style={{ fontWeight:600,fontSize:14,color:"#1C1C1E",margin:0 }}>Circular {c} of 2026</p>
                    <p style={{ fontSize:12,color:"#8E8E93",margin:0 }}>{jobs.filter(j=>j.circular===c).length} posts</p>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <span style={a.liveBadge}>Live</span>
                    <button onClick={() => removeCircular(c)} style={a.removeBtn}>Remove</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
        {tab === "ads" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <p style={a.heading}>Advertisements</p>
              <button onClick={() => setShowAdForm(v=>!v)} style={a.actionBtn}>+ New Ad</button>
            </div>
            {showAdForm && (
              <form onSubmit={handleSaveAd} style={a.formCard}>
                <p style={{ fontWeight:600,fontSize:14,marginBottom:12 }}>New Advertisement</p>
                <input required placeholder="Headline" value={newAd.title} onChange={e=>setNewAd(p=>({...p,title:e.target.value}))} style={a.input} />
                <input placeholder="Subline" value={newAd.subtitle} onChange={e=>setNewAd(p=>({...p,subtitle:e.target.value}))} style={a.input} />
                <input placeholder="CTA label" value={newAd.cta} onChange={e=>setNewAd(p=>({...p,cta:e.target.value}))} style={a.input} />
                <div style={a.selectWrap}>
                  <select value={newAd.position} onChange={e=>setNewAd(p=>({...p,position:e.target.value}))} style={a.select}>
                    <option value="sidebar">Sidebar</option><option value="banner">Top Banner</option>
                  </select>
                  <i className="ti ti-chevron-down" style={a.selectArrow} />
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10,margin:"10px 0" }}>
                  <label style={{ fontSize:13,color:"#636366" }}>Color</label>
                  <input type="color" value={newAd.color} onChange={e=>setNewAd(p=>({...p,color:e.target.value}))} style={{ width:40,height:32,border:"1px solid #E5E5EA",borderRadius:6 }} />
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button type="submit" style={a.actionBtn}>Save</button>
                  <button type="button" onClick={()=>setShowAdForm(false)} style={a.cancelBtn}>Cancel</button>
                </div>
              </form>
            )}
            {ads.length===0&&!showAdForm&&<p style={{ fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0" }}>No ads yet.</p>}
            {ads.map(ad => (
              <div key={ad.id} style={a.listItem}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:36,height:36,borderRadius:8,background:ad.color,flexShrink:0 }} />
                  <div><p style={{ fontWeight:600,fontSize:13,margin:0 }}>{ad.title}</p><p style={{ fontSize:11,color:"#8E8E93",margin:0 }}>{ad.position}</p></div>
                </div>
                <button onClick={()=>removeAd(ad.id)} style={a.removeBtn}>Remove</button>
              </div>
            ))}
          </div>
        )}
        {tab === "listings" && (
          <div>
            <p style={a.heading}>All Listings — {jobs.length} posts</p>
            {jobs.length===0
              ? <p style={{ fontSize:13,color:"#8E8E93",textAlign:"center",padding:"2rem 0" }}>No listings yet.</p>
              : jobs.map(job => {
                const ls = getLevelStyle(job.level);
                return (
                  <div key={`${job.circular}-${job.postNo}`} style={a.listItem}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontWeight:600,fontSize:13,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{job.title}</p>
                      <p style={{ fontSize:11,color:"#8E8E93",margin:0 }}>Post {job.postNo}{job.pageNumber?` · Page ${job.pageNumber}`:""} · {(job.centre||"").split(":").pop().trim()}</p>
                    </div>
                    <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5,background:ls.bg,color:ls.text,flexShrink:0,marginLeft:8 }}>{job.level}</span>
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
  page:{minHeight:"100dvh",background:"#F5F5F7",fontFamily:"system-ui,sans-serif"},
  header:{background:"#1C1C1E",padding:"12px 16px",paddingTop:"calc(12px + var(--safe-top))",display:"flex",alignItems:"center",justifyContent:"space-between"},
  logoGroup:{display:"flex",alignItems:"center",gap:10},
  logoBadge:{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#2563EB,#1E40AF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11},
  adminTitle:{color:"#EBEBF5",fontSize:14,fontWeight:700,margin:0,lineHeight:1.2},
  subTitle:{color:"#636366",fontSize:11,margin:0},
  portalBtn:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"7px 12px",color:"#EBEBF5",fontSize:13,cursor:"pointer"},
  tabBar:{background:"#1C1C1E",borderBottom:"1px solid #3A3A3C",display:"flex"},
  tabBtn:{flex:1,background:"none",border:"none",padding:"10px 4px 8px",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer"},
  content:{padding:"16px",paddingBottom:"calc(24px + var(--safe-bottom))"},
  heading:{fontSize:16,fontWeight:700,color:"#1C1C1E",margin:"0 0 8px"},
  dropzone:{border:"1.5px dashed #D1D1D6",borderRadius:14,padding:"2rem 1rem",textAlign:"center",marginBottom:12,transition:"all 0.15s"},
  uploadIcon:{width:52,height:52,borderRadius:14,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"},
  dropMain:{fontWeight:600,fontSize:15,color:"#1C1C1E",marginBottom:4},
  dropSub:{fontSize:13,color:"#8E8E93"},
  alert:{border:"1px solid",borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:16},
  upperLabel:{fontSize:12,fontWeight:600,color:"#8E8E93",textTransform:"uppercase",letterSpacing:0.5,margin:"16px 0 8px"},
  listItem:{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"},
  liveBadge:{fontSize:11,fontWeight:600,background:"#F0FDF4",color:"#166534",padding:"3px 10px",borderRadius:20,border:"1px solid #BBF7D0"},
  actionBtn:{background:"#2563EB",color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:14,fontWeight:600,cursor:"pointer"},
  cancelBtn:{background:"#F5F5F7",border:"none",borderRadius:10,padding:"9px 16px",fontSize:14,color:"#636366",cursor:"pointer"},
  removeBtn:{background:"transparent",border:"1px solid #FECACA",borderRadius:8,padding:"4px 10px",fontSize:12,color:"#EF4444",cursor:"pointer"},
  formCard:{background:"#fff",border:"1px solid #E5E5EA",borderRadius:14,padding:"14px",marginBottom:16},
  input:{width:"100%",height:42,border:"1px solid #E5E5EA",borderRadius:10,paddingInline:12,fontSize:15,background:"#F9F9F9",marginBottom:10,outline:"none",display:"block"},
  selectWrap:{position:"relative",marginBottom:10},
  select:{width:"100%",height:42,border:"1px solid #E5E5EA",borderRadius:10,paddingInline:12,paddingRight:30,fontSize:15,background:"#F9F9F9",outline:"none"},
  selectArrow:{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#8E8E93",pointerEvents:"none"},
};
