import { useState, useEffect } from "react";
import PortalView from "./components/PortalView.jsx";
import AdminView from "./components/AdminView.jsx";
import { supabase } from "./supabase.js";

const ADMIN_PIN = "2525";

function PinModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pin === ADMIN_PIN) { onSuccess(); }
    else { setError(true); setShake(true); setPin(""); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div style={m.overlay}>
      <div style={{ ...m.card, animation: shake ? "shake 0.4s ease" : "none" }}>
        <div style={m.logo}><span>PSV</span></div>
        <h2 style={m.title}>Admin Access</h2>
        <p style={m.sub}>Enter your PIN to continue</p>
        <div style={m.dots}>{[0,1,2,3].map(i => <div key={i} style={{ ...m.dot, background: pin.length > i ? "#2563EB" : "#E5E5EA", transform: pin.length > i ? "scale(1.2)" : "scale(1)" }} />)}</div>
        <input type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g,"")); setError(false); }}
          onKeyDown={e => { if(e.key==="Enter") submit(); if(e.key==="Escape") onCancel(); }}
          autoFocus style={m.hidden} />
        <div style={m.numpad}>
          {["1","2","3","4","5","6","7","8","9","","0","\u232b"].map((k,i) => (
            <button key={i} onClick={() => { if(k==="\u232b") setPin(p=>p.slice(0,-1)); else if(k&&pin.length<4) setPin(p=>p+k); setError(false); }}
              style={{ ...m.key, opacity:k===""?0:1, pointerEvents:k===""?"none":"auto" }}>{k}</button>
          ))}
        </div>
        {error && <p style={m.err}>Incorrect PIN</p>}
        <div style={m.row}>
          <button onClick={onCancel} style={m.cancel}>Cancel</button>
          <button onClick={submit} style={m.confirm}>Unlock</button>
        </div>
      </div>
      <style>{"@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}"}</style>
    </div>
  );
}
const m = {
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
  card:{background:"#fff",borderRadius:20,padding:"2rem 2rem 1.5rem",width:300,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
  logo:{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#2563EB,#1E40AF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:800,fontSize:14,margin:"0 auto 1rem"},
  title:{margin:"0 0 4px",fontSize:18,fontWeight:700,color:"#1C1C1E"},
  sub:{margin:"0 0 1.5rem",fontSize:13,color:"#8E8E93"},
  dots:{display:"flex",justifyContent:"center",gap:14,marginBottom:"1.5rem"},
  dot:{width:14,height:14,borderRadius:"50%",transition:"all 0.15s ease"},
  hidden:{position:"absolute",opacity:0,pointerEvents:"none",width:1,height:1},
  numpad:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:"1.25rem"},
  key:{background:"#F5F5F7",border:"none",borderRadius:10,height:52,fontSize:18,fontWeight:500,cursor:"pointer",color:"#1C1C1E"},
  err:{color:"#EF4444",fontSize:12,margin:"-4px 0 12px",fontWeight:500},
  row:{display:"flex",gap:10},
  cancel:{flex:1,background:"#F5F5F7",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,color:"#636366",cursor:"pointer"},
  confirm:{flex:1,background:"#2563EB",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer"},
};

export default function App() {
  const [view, setView] = useState("portal");
  const [showPin, setShowPin] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: jd }, { data: ad }] = await Promise.all([
        supabase.from("psv_jobs").select("*").order("circular", { ascending: false }),
        supabase.from("psv_ads").select("*").order("created_at", { ascending: true }),
      ]);
      if (jd) setJobs(jd.map(j => ({ postNo:j.post_no, title:j.title, ref:j.ref, salary:j.salary, level:j.level, centre:j.centre, department:j.department, closing:j.closing, requirements:j.requirements, enquiries:j.enquiries, category:j.category, circular:j.circular, pageNumber:j.page_number })));
      if (ad) setAds(ad.map(a => ({ id:a.id, title:a.title, subtitle:a.subtitle, cta:a.cta, color:a.color, position:a.position })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F5F7",fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#2563EB,#1E40AF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,margin:"0 auto 12px" }}>PSV</div>
        <p style={{ color:"#8E8E93",fontSize:13 }}>Loading vacancies…</p>
      </div>
    </div>
  );

  return (
    <>
      {showPin && <PinModal onSuccess={() => { setShowPin(false); setView("admin"); }} onCancel={() => setShowPin(false)} />}
      {view === "portal"
        ? <PortalView jobs={jobs} ads={ads} onSwitchToAdmin={() => setShowPin(true)} />
        : <AdminView jobs={jobs} setJobs={setJobs} ads={ads} setAds={setAds} onViewPortal={() => setView("portal")} />
      }
    </>
  );
}
