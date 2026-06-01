// src/components/PortalView.jsx
import { useState, useMemo } from "react";
import { CATEGORIES, LEVELS, getLevelStyle } from "../constants/psvData.js";

export default function PortalView({ jobs, ads, onSwitchToAdmin }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All Levels");
  const [filterCircular, setFilterCircular] = useState("All");
  const [filterCentre, setFilterCentre] = useState("");
  const [sortBy, setSortBy] = useState("circular");

  const circulars = useMemo(() => [...new Set(jobs.map(j => j.circular))].sort((a, b) => b - a), [jobs]);
  const bannerAd = ads.find(a => a.position === "banner");
  const sidebarAds = ads.filter(a => a.position === "sidebar");

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchCat = filterCategory === "All" || j.category === filterCategory;
      const matchLevel = filterLevel === "All Levels" || j.level === filterLevel;
      const matchCirc = filterCircular === "All" || j.circular === parseInt(filterCircular, 10);
      const matchCentre = !filterCentre || j.centre.toLowerCase().includes(filterCentre.toLowerCase());
      return matchCat && matchLevel && matchCirc && matchCentre;
    }).sort((a, b) => {
      if (sortBy === "circular") return b.circular - a.circular || a.postNo.localeCompare(b.postNo);
      if (sortBy === "level") return b.level.localeCompare(a.level);
      if (sortBy === "closing") return a.closing.localeCompare(b.closing);
      return a.title.localeCompare(b.title);
    });
  }, [jobs, filterCategory, filterLevel, filterCircular, filterCentre, sortBy]);

  return (
    <div style={styles.container}>
      {/* Dynamic Header */}
      <header style={styles.header}>
        <div style={styles.branding}>
          <div style={styles.logoSquare}><span>PSV</span></div>
          <div>
            <h1 style={styles.mainHeading}>Public Service Vacancies</h1>
            <span style={styles.subText}>Weekly Circular Portal</span>
          </div>
        </div>
        <button onClick={onSwitchToAdmin} style={styles.adminToggle}>ADMIN DASHBOARD</button>
      </header>

      {/* Dynamic Top Banner Space */}
      {bannerAd && (
        <section style={{ ...styles.bannerAdContainer, background: bannerAd.color }}>
          <div>
            <span style={styles.adTitle}>{bannerAd.title}</span>
            <span style={styles.adSubtitle}>{bannerAd.subtitle}</span>
          </div>
          <div style={styles.adActionFlex}>
            {bannerAd.cta && <button style={styles.adCtaBtn}>{bannerAd.cta}</button>}
            <span style={styles.adLabel}>SPONSORED</span>
          </div>
        </section>
      )}

      {/* Modular Filtering Hub */}
      <section style={styles.filterBar}>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setSelectedJob(null); }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setSelectedJob(null); }}>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterCircular} onChange={e => { setFilterCircular(e.target.value); setSelectedJob(null); }}>
          <option value="All">All Active Circulars</option>
          {circulars.map(c => <option key={c} value={c}>Circular {c} of 2026</option>)}
        </select>
        <input 
          placeholder="Search location (e.g. Pretoria)…" 
          value={filterCentre} 
          onChange={e => { setFilterCentre(e.target.value); setSelectedJob(null); }} 
        />
        <div style={styles.sortContainer}>
          <span>Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="circular">Latest Release</option>
            <option value="level">Highest Salary Grading</option>
            <option value="closing">Closing Date Approaching</option>
            <option value="title">Alphabetical A–Z</option>
          </select>
        </div>
      </section>

      {/* Main Structural Layout split */}
      <main style={{ ...styles.splitGrid, gridTemplateColumns: selectedJob ? "1fr 420px" : "1fr 260px" }}>
        
        {/* Left Side: Job Post List */}
        <div style={styles.listColumn}>
          <div style={styles.metaSummaryHeader}>
            <span>{filteredJobs.length} matching position{filteredJobs.length !== 1 ? "s" : ""} found</span>
          </div>
          <div style={styles.cardsStack}>
            {filteredJobs.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="ti ti-search-off" style={{ fontSize: 36, color: "#D1D1D6" }} aria-hidden="true"></i>
                <p>No listings match your filter parameters.</p>
              </div>
            ) : (
              filteredJobs.map(job => {
                const isSelected = selectedJob?.postNo === job.postNo;
                const ls = getLevelStyle(job.level);
                return (
                  <article 
                    key={job.postNo} 
                    onClick={() => setSelectedJob(isSelected ? null : job)}
                    style={{ ...styles.jobCard, borderColor: isSelected ? "#3B82F6" : "#E5E5EA", background: isSelected ? "#F0F6FF" : "#FFF" }}
                  >
                    <div style={styles.cardHeader}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.badgeRow}>
                          <span style={styles.postNoBadge}>POST {job.postNo}</span>
                          <span style={{ ...styles.levelBadge, background: ls.bg, color: ls.text }}>{job.level}</span>
                        </div>
                        <h3 style={styles.cardJobTitle}>{job.title}</h3>
                        <p style={styles.cardDept}>{job.department}</p>
                      </div>
                      <i className="ti ti-chevron-right" style={{ 
                        fontSize: 14, 
                        color: isSelected ? "#2563EB" : "#C7C7CC",
                        transform: isSelected ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s" 
                      }} aria-hidden="true"></i>
                    </div>
                    <div style={styles.cardMetaFooter}>
                      <span><i className="ti ti-map-pin" aria-hidden="true"></i> {job.centre.split(":").pop().trim()}</span>
                      <span><i className="ti ti-calendar" aria-hidden="true"></i> Closes {job.closing}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Split View Context Engine (Detail view or Summary widgets) */}
        <aside style={styles.rightSidebarSpace}>
          {selectedJob ? (
            <div style={styles.detailStickyCard}>
              <button onClick={() => setSelectedJob(null)} style={styles.backBtn}>← Return to full list</button>
              <div style={styles.badgeRow}>
                <span style={styles.postNoBadge}>POST {selectedJob.postNo}</span>
                <span style={styles.levelBadge}>{selectedJob.level}</span>
                <span style={styles.genericBadge}>Circular {selectedJob.circular}</span>
              </div>
              <h2 style={styles.detailTitle}>{selectedJob.title}</h2>
              <p style={styles.detailDept}>{selectedJob.department}</p>
              
              <div style={styles.infoGrid}>
                <div style={styles.infoBlock}><strong>Salary</strong><p>{selectedJob.salary}</p></div>
                <div style={styles.infoBlock}><strong>Reference</strong><p>{selectedJob.ref}</p></div>
                <div style={styles.infoBlock}><strong>Location</strong><p>{selectedJob.centre}</p></div>
                <div style={styles.infoBlock}><strong>Closing Date</strong><p>{selectedJob.closing}</p></div>
              </div>

              <div style={styles.bodyBlock}>
                <h4>Minimum Requirements</h4>
                <p>{selectedJob.requirements}</p>
              </div>

              <div style={styles.bodyBlock}>
                <h4>Enquiries</h4>
                <p>{selectedJob.enquiries}</p>
              </div>

              <div style={styles.applyCallout}>
                <h4>How to Apply</h4>
                <p>Submit a fully completed official **Z83 application form** accompanied by an updated CV directly to the advertising department. You must clearly quote reference context code <strong>{selectedJob.ref}</strong>.</p>
              </div>
            </div>
          ) : (
            <div style={styles.asideWidgetStack}>
              <div style={styles.summaryWidget}>
                <h3>Circular Registry</h3>
                {circulars.map(c => (
                  <div key={c} onClick={() => setFilterCircular(String(c))} style={styles.summaryRow}>
                    <span>Circular {c}</span>
                    <span style={styles.countTag}>{jobs.filter(j => j.circular === c).length}</span>
                  </div>
                ))}
              </div>

              {sidebarAds.map(ad => (
                <div key={ad.id} style={{ ...styles.sidebarAdCard, background: ad.color }}>
                  <h4>{ad.title}</h4>
                  <p>{ad.subtitle}</p>
                  {ad.cta && <span style={styles.sidebarAdCta}>{ad.cta} →</span>}
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#F5F5F7", fontFamily: "system-ui, sans-serif" },
  header: { background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 50 },
  branding: { display: "flex", alignItems: "center", gap: 12 },
  logoSquare: { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#2563EB,#1E40AF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 800, fontSize: 11 },
  mainHeading: { margin: 0, fontSize: 14, fontWeight: 700, color: "#1C1C1E" },
  subText: { fontSize: 11, color: "#8E8E93" },
  adminToggle: { background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#48484A", cursor: "pointer", fontSize: 11, fontWeight: 600 },
  bannerAdContainer: { padding: "12px 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  adTitle: { color: "#fff", fontWeight: 700, fontSize: 13 },
  adSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 12 },
  adActionFlex: { display: "flex", alignItems: "center", gap: 16 },
  adCtaBtn: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" },
  adLabel: { fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700 },
  filterBar: { background: "#fff", borderBottom: "1px solid #E5E5EA", padding: "10px 1.5rem", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  sortContainer: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8E8E93" },
  splitGrid: { display: "grid", gap: 0, minHeight: "calc(100vh - 120px)" },
  listColumn: { borderRight: "1px solid #E5E5EA", background: "#FAFAFA" },
  metaSummaryHeader: { padding: "10px 16px", borderBottom: "1px solid #E5E5EA", background: "#FFF", fontSize: 12, color: "#8E8E93" },
  cardsStack: { padding: "12px", display: "flex", flexDirection: "column", gap: 6 },
  emptyState: { textAlign: "center", padding: "4rem 1rem", color: "#8E8E93" },
  jobCard: { border: "1px solid", borderRadius: 10, padding: "14px", cursor: "pointer", transition: "all 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  badgeRow: { display: "flex", gap: 6, marginBottom: 6 },
  postNoBadge: { fontSize: 9, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 4 },
  levelBadge: { fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4 },
  cardJobTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1C1C1E" },
  cardDept: { margin: 0, fontSize: 12, color: "#636366" },
  cardMetaFooter: { display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "#8E8E93" },
  rightSidebarSpace: { background: "#FFF", overflowY: "auto" },
  detailStickyCard: { padding: "1.5rem" },
  backBtn: { background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, marginBottom: "1rem" },
  genericBadge: { fontSize: 9, background: "#F2F2F7", color: "#636366", padding: "2px 6px", borderRadius: 4, fontWeight: 600 },
  detailTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 4px" },
  detailDept: { color: "#636366", fontSize: 13, margin: 0 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "1.25rem 0" },
  infoBlock: { background: "#F8F9FA", padding: "10px", borderRadius: 8, border: "1px solid #F2F2F7" },
  bodyBlock: { marginBottom: "1.25rem" },
  applyCallout: { background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "14px" },
  asideWidgetStack: { padding: "1rem", display: "flex", flexDirection: "column", gap: 12 },
  summaryWidget: { background: "#F8F9FA", borderRadius: 12, padding: "1rem", border: "1px solid #E5E5EA" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "6px 4px", cursor: "pointer", fontSize: 13 },
  countTag: { background: "#E5E5EA", borderRadius: 6, padding: "2px 6px", fontSize: 11, fontWeight: 600 },
  sidebarAdCard: { borderRadius: 12, padding: "1.25rem", color: "#FFF" }
};
