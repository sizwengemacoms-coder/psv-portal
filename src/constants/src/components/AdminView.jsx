// src/components/AdminView.jsx
import { useState } from "react";
import { getLevelStyle } from "../constants/psvData";

export default function AdminView({ jobs, ads, setAds, onViewPortal }) {
  const [adminTab, setAdminTab] = useState("circulars");
  const [newAd, setNewAd] = useState({ title: "", subtitle: "", cta: "", color: "#0A2540", position: "sidebar" });
  const [showAdForm, setShowAdForm] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const circulars = [...new Set(jobs.map(j => j.circular))].sort((a, b) => b - a);

  const handleSimulateUpload = () => {
    setUploading(true);
    setUploadMsg("Parsing PDF…");
    setTimeout(() => setUploadMsg("Extracting job listings…"), 1200);
    setTimeout(() => {
      setUploadMsg("✓ Circular uploaded successfully. 87 posts added.");
      setUploading(false);
    }, 2500);
  };

  const handleSaveAd = (e) => {
    e.preventDefault();
    if (!newAd.title.trim()) return;
    setAds(prev => [...prev, { ...newAd, id: Date.now() }]);
    setNewAd({ title: "", subtitle: "", cta: "", color: "#0A2540", position: "sidebar" });
    setShowAdForm(false);
  };

  return (
    <div style={styles.container}>
      {/* Admin Header */}
      <div style={styles.header}>
        <div style={styles.logoGroup}>
          <div style={styles.logoBadge}><span>PSV</span></div>
          <span style={styles.adminTitle}>Admin</span>
          <span style={styles.subTitle}>/ Circular Manager</span>
        </div>
        <button onClick={onViewPortal} style={styles.portalBtn}>View Portal ↗</button>
      </div>

      <div style={styles.workspace}>
        {/* Sidebar Nav */}
        <div style={styles.sidebar}>
          {[["circulars", "Circulars"], ["ads", "Advertisements"], ["listings", "Job Listings"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAdminTab(id)}
              style={{
                ...styles.tabBtn,
                background: adminTab === id ? "rgba(59,130,246,0.15)" : "transparent",
                borderLeft: adminTab === id ? "2px solid #3B82F6" : "2px solid transparent",
                color: adminTab === id ? "#60A5FA" : "#8E8E93",
                fontWeight: adminTab === id ? 600 : 400
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Panel Container */}
        <div style={styles.contentBody}>
          {adminTab === "circulars" && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={styles.sectionHeading}>Upload Circular</h2>
              <div onClick={handleSimulateUpload} style={styles.dropzone}>
                <div style={styles.uploadIconContainer}>
                  <i className="ti ti-file-upload" style={{ fontSize: 22, color: "#2563EB" }} aria-hidden="true"></i>
                </div>
                <p style={styles.dropzoneMainText}>Drop PDF or click to upload</p>
                <p style={styles.dropzoneSubText}>Posts are extracted and indexed automatically</p>
              </div>
              {uploadMsg && (
                <div style={{ 
                  ...styles.alertBanner, 
                  background: uploading ? "#EFF6FF" : "#F0FDF4", 
                  color: uploading ? "#1D4ED8" : "#166534",
                  borderColor: uploading ? "#BFDBFE" : "#BBF7D0"
                }}>
                  {uploadMsg}
                </div>
              )}
              <div style={{ marginTop: "1.5rem" }}>
                <p style={styles.upperLabel}>Active Circulars</p>
                {circulars.map(c => (
                  <div key={c} style={styles.listItem}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#1C1C1E" }}>Circular {c} of 2026</span>
                      <span style={{ marginLeft: 10, fontSize: 12, color: "#8E8E93" }}>
                        {jobs.filter(j => j.circular === c).length} posts
                      </span>
                    </div>
                    <span style={styles.liveBadge}>Live</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "ads" && (
            <div style={{ maxWidth: 620 }}>
              <div style={styles.flexJustifyBetween}>
                <h2 style={styles.sectionHeading}>Advertisements</h2>
                <button onClick={() => setShowAdForm(!showAdForm)} style={styles.actionBtn}>+ New Ad</button>
              </div>
              {showAdForm && (
                <form onSubmit={handleSaveAd} style={styles.formCard}>
                  <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14 }}>New advertisement</p>
                  <div style={styles.formGrid}>
                    <input required placeholder="Headline" value={newAd.title} onChange={e => setNewAd(p => ({ ...p, title: e.target.value }))} />
                    <input placeholder="Subline" value={newAd.subtitle} onChange={e => setNewAd(p => ({ ...p, subtitle: e.target.value }))} />
                    <input placeholder="CTA label e.g. Learn more" value={newAd.cta} onChange={e => setNewAd(p => ({ ...p, cta: e.target.value }))} />
                    <select value={newAd.position} onChange={e => setNewAd(p => ({ ...p, position: e.target.value }))}>
                      <option value="sidebar">Sidebar</option>
                      <option value="banner">Top Banner</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                    <label style={{ fontSize: 12, color: "#8E8E93" }}>Bg Color:</label>
                    <input type="color" value={newAd.color} onChange={e => setNewAd(p => ({ ...p, color: e.target.value }))} style={styles.colorPicker} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={styles.actionBtn}>Save</button>
                    <button type="button" onClick={() => setShowAdForm(false)} style={styles.cancelBtn}>Cancel</button>
                  </div>
                </form>
              )}
              {ads.map(ad => (
                <div key={ad.id} style={styles.listItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ ...styles.adPreviewBox, background: ad.color }}>
                      <i className="ti ti-photo" style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }} aria-hidden="true"></i>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{ad.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#8E8E93" }}>{ad.subtitle} · {ad.position}</p>
                    </div>
                  </div>
                  <button onClick={() => setAds(p => p.filter(a => a.id !== ad.id))} style={styles.removeBtn}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {adminTab === "listings" && (
            <div>
              <h2 style={styles.sectionHeading}>Job Listings — {jobs.length} posts</h2>
              {jobs.map(job => {
                const ls = getLevelStyle(job.level);
                return (
                  <div key={job.postNo} style={styles.listItem}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{job.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8E8E93" }}>Post {job.postNo} · {job.department} · {job.centre}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#AEAEB2" }}>Closes {job.closing}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: ls.bg, color: ls.text }}>{job.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Clean production style encapsulation mapping out of JSX markup loops
const styles = {
  container: { minHeight: 600, background: "#F5F5F7", fontFamily: "system-ui, sans-serif" },
  header: { background: "#1C1C1E", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 52, borderBottom: "1px solid #3A3A3C" },
  logoGroup: { display: "flex", alignItems: "center", gap: 10, flex: 1 },
  logoBadge: { width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#2563EB,#1E40AF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11 },
  adminTitle: { color: "#EBEBF5", fontSize: 13, fontWeight: 600 },
  subTitle: { color: "#636366", fontSize: 13 },
  portalBtn: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 14px", color: "#EBEBF5", cursor: "pointer", fontSize: 12 },
  workspace: { display: "flex", minHeight: 548 },
  sidebar: { width: 200, background: "#1C1C1E", borderRight: "1px solid #3A3A3C", padding: "1rem 0" },
  tabBtn: { display: "flex", width: "100%", alignItems: "center", padding: "9px 16px", border: "none", cursor: "pointer", fontSize: 13, textAlign: "left" },
  contentBody: { flex: 1, padding: "1.5rem", overflowY: "auto" },
  sectionHeading: { margin: "0 0 1.25rem", fontSize: 17, fontWeight: 600, color: "#1C1C1E" },
  dropzone: { background: "#fff", border: "1.5px dashed #D1D1D6", borderRadius: 12, padding: "2.5rem", textAlign: "center", marginBottom: "1rem", cursor: "pointer" },
  uploadIconContainer: { width: 44, height: 44, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  dropzoneMainText: { margin: "0 0 4px", fontWeight: 600, fontSize: 14, color: "#1C1C1E" },
  dropzoneSubText: { margin: 0, fontSize: 12, color: "#8E8E93" },
  alertBanner: { border: "1px solid", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: "1rem" },
  upperLabel: { margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" },
  listItem: { background: "#fff", border: "1px solid #E5E5EA", borderRadius: 10, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" },
  liveBadge: { fontSize: 11, fontWeight: 600, background: "#F0FDF4", color: "#166534", padding: "3px 9px", borderRadius: 20, border: "1px solid #BBF7D0" },
  flexJustifyBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  actionBtn: { background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  cancelBtn: { background: "transparent", border: "1px solid #E5E5EA", borderRadius: 7, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "#636366" },
  removeBtn: { background: "transparent", border: "1px solid #FECACA", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, color: "#EF4444" },
  formCard: { background: "#fff", border: "1px solid #E5E5EA", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  colorPicker: { width: 36, height: 30, border: "1px solid #E5E5EA", borderRadius: 6, cursor: "pointer" },
  adPreviewBox: { width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
};
