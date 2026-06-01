import { useState, useEffect } from "react";
import PortalView from "./components/PortalView.jsx";
import AdminView from "./components/AdminView.jsx";

export const SUPABASE_URL = "https://yyzqcblaadyurbvhthaf.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5enFjYmxhYWR5dXJidmh0aGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzg5NjYsImV4cCI6MjA5NTkxNDk2Nn0.x3ojLZckeiUmvznUtKHI9r0BHjfj8YYztKxBrOwp2u4";

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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"2rem", width:300, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", animation: shake ? "shake 0.4s ease" : "none" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, margin:"0 auto 1rem" }}>PSV</div>
        <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700 }}>Admin Access</h2>
        <p style={{ margin:"0 0 1.5rem", fontSize:13, color:"#8E8E93" }}>Enter your PIN to continue</p>
        <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:"1.5rem" }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: pin.length > i ? "#2563EB" : "#E5E5EA", transition:"all 0.15s" }} />)}
        </div>
        <input type="password" inputMode="numeric" maxLength={4} value={pin} autoFocus
          onChange={e => { setPin(e.target.value.replace(/\D/g,"")); setError(false); }}
          onKeyDown={e => { if(e.key==="Enter") submit(); if(e.key==="Escape") onCancel(); }}
          style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1 }} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1.25rem" }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i) => (
            <button key={i} onClick={() => { if(k==="⌫") setPin(p=>p.slice(0,-1)); else if(k&&pin.length<4) setPin(p=>p+k); setError(false); }}
              style={{ background:"#F5F5F7", border:"none", borderRadius:10, height:52, fontSize:18, fontWeight:500, cursor:"pointer", opacity: k===""?0:1, pointerEvents: k===""?"none":"auto" }}>{k}</button>
          ))}
        </div>
        {error && <p style={{ color:"#EF4444", fontSize:12, margin:"-4px 0 12px" }}>Incorrect PIN</p>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, background:"#F5F5F7", border:"none", borderRadius:10, padding:10, fontSize:14, fontWeight:600, color:"#636366", cursor:"pointer" }}>Cancel</button>
          <button onClick={submit} style={{ flex:1, background:"#2563EB", border:"none", borderRadius:10, padding:10, fontSize:14, fontWeight:600, color:"#fff", cursor:"pointer" }}>Unlock</button>
        </div>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("portal");
  const [showPin, setShowPin] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jr, ar] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/psv_jobs?select=*&order=circular.desc,post_no.asc`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          }),
          fetch(`${SUPABASE_URL}/rest/v1/psv_ads?select=*`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          })
        ]);
        const [jobData, adData] = await Promise.all([jr.json(), ar.json()]);
        setJobs(Array.isArray(jobData) ? jobData.map(j => ({
          ...j,
          postNo: String(j.post_no ?? j.postNo ?? ''),
          pageNumber: j.page_number ?? j.pageNumber ?? null,
        })) : []);
        setAds(Array.isArray(adData) ? adData : []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F5F5F7", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#2563EB,#1E40AF)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, margin:"0 auto 12px" }}>PSV</div>
        <p style={{ color:"#8E8E93", fontSize:14 }}>Loading...</p>
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
