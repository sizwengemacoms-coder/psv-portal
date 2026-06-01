import { useState } from "react";
import PortalView from "./components/PortalView.jsx";
import AdminView from "./components/AdminView.jsx";
import { INITIAL_JOBS, INITIAL_ADS } from "./constants/psvData.js";

const ADMIN_PIN = "2525";

function PinModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) { setError(false); onSuccess(); }
    else { setError(true); setShake(true); setPin(""); setTimeout(() => setShake(false), 500); }
  };
  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, animation: shake ? "shake 0.4s ease" : "none" }}>
        <div style={modalStyles.logoSquare}><span>PSV</span></div>
        <h2 style={modalStyles.title}>Admin Access</h2>
        <p style={modalStyles.subtitle}>Enter your PIN to continue</p>
        <div style={modalStyles.pinRow}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ ...modalStyles.pinDot, background: pin.length > i ? "#2563EB" : "#E5E5EA", transform: pin.length > i ? "scale(1.2)" : "scale(1)" }} />
          ))}
        </div>
        <input type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(false); }}
          onKeyDown={handleKey} autoFocus style={modalStyles.hiddenInput} />
        <div style={modalStyles.numpad}>
          {["1","2","3","4","5","6","7","8","9","","0","\u232b"].map((k, i) => (
            <button key={i} onClick={() => { if (k === "\u232b") setPin(p => p.slice(0,-1)); else if (k !== "" && pin.length < 4) setPin(p => p + k); setError(false); }}
              style={{ ...modalStyles.numKey, opacity: k === "" ? 0 : 1, pointerEvents: k === "" ? "none" : "auto" }}>{k}</button>
          ))}
        </div>
        {error && <p style={modalStyles.errorText}>Incorrect PIN. Try again.</p>}
        <div style={modalStyles.btnRow}>
          <button onClick={onCancel} style={modalStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} style={modalStyles.confirmBtn}>Unlock</button>
        </div>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

const modalStyles = {
  overlay: { position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 },
  card: { background:"#fff",borderRadius:20,padding:"2rem 2rem 1.5rem",width:300,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
  logoSquare: { width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#2563EB,#1E40AF)",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:800,fontSize:14,margin:"0 auto 1rem" },
  title: { margin:"0 0 4px",fontSize:18,fontWeight:700,color:"#1C1C1E" },
  subtitle: { margin:"0 0 1.5rem",fontSize:13,color:"#8E8E93" },
  pinRow: { display:"flex",justifyContent:"center",gap:14,marginBottom:"1.5rem" },
  pinDot: { width:14,height:14,borderRadius:"50%",transition:"all 0.15s ease" },
  hiddenInput: { position:"absolute",opacity:0,pointerEvents:"none",width:1,height:1 },
  numpad: { display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:"1.25rem" },
  numKey: { background:"#F5F5F7",border:"none",borderRadius:10,height:52,fontSize:18,fontWeight:500,cursor:"pointer",color:"#1C1C1E",transition:"background 0.1s" },
  errorText: { color:"#EF4444",fontSize:12,margin:"-4px 0 12px",fontWeight:500 },
  btnRow: { display:"flex",gap:10 },
  cancelBtn: { flex:1,background:"#F5F5F7",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,color:"#636366",cursor:"pointer" },
  confirmBtn: { flex:1,background:"#2563EB",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer" },
};

export default function App() {
  const [view, setView] = useState("portal");
  const [showPinModal, setShowPinModal] = useState(false);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [ads, setAds] = useState(INITIAL_ADS);

  const handleAdminClick = () => setShowPinModal(true);
  const handlePinSuccess = () => { setShowPinModal(false); setView("admin"); };
  const handlePinCancel = () => setShowPinModal(false);

  return (
    <>
      {showPinModal && <PinModal onSuccess={handlePinSuccess} onCancel={handlePinCancel} />}
      {view === "portal" ? (
        <PortalView jobs={jobs} ads={ads} onSwitchToAdmin={handleAdminClick} />
      ) : (
        <AdminView jobs={jobs} setJobs={setJobs} ads={ads} setAds={setAds} onViewPortal={() => setView("portal")} />
      )}
    </>
  );
}
