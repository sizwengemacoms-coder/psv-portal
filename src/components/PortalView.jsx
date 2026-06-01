// src/components/PortalView.jsx
import { useState, useMemo } from "react";
import { CATEGORIES, LEVELS, getLevelStyle } from "../constants/psvData.js";

export default function PortalView({ jobs, ads, onSwitchToAdmin }) {
  const [selectedJob, setSelectedJob]     = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLevel, setFilterLevel]     = useState("All Levels");
  const [filterCircular, setFilterCircular] = useState("All");
  const [filterCentre, setFilterCentre]   = useState("");
  const [sortBy, setSortBy]               = useState("circular");
  const [showFilters, setShowFilters]     = useState(false);

  const circulars = useMemo(
    () => [...new Set(jobs.map(j => j.circular))].sort((a, b) => b - a),
    [jobs]
  );
  const bannerAd   = ads.find(a => a.position === "banner");
  const sidebarAds = ads.filter(a => a.position === "sidebar");

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(j => {
        const matchCat    = filterCategory === "All" || j.category === filterCategory;
        const matchLevel  = filterLevel === "All Levels" || j.level === filterLevel;
        const matchCirc   = filterCircular === "All" || Number(j.circular) === Number(filterCircular);
        const searchQ = filterCentre.toLowerCase();
        const matchCentre = !filterCentre || (j.centre || "").toLowerCase().includes(searchQ) || (j.title || "").toLowerCase().includes(searchQ);
        return matchCat && matchLevel && matchCirc && matchCentre;
      })
      .sort((a, b) => {
        if (sortBy === "circular") return (b.circular - a.circular) || (a.postNo || "").localeCompare(b.postNo || "");
        if (sortBy === "level")    return (b.level || "").localeCompare(a.level || "");
        if (sortBy === "closing")  return (a.closing || "").localeCompare(b.closing || "");
        return (a.title || "").localeCompare(b.title || "");
      });
  }, [jobs, filterCategory, filterLevel, filterCircular, filterCentre, sortBy]);

  const activeFilterCount = [
    filterCategory !== "All",
    filterLevel    !== "All Levels",
    filterCircular !== "All",
    filterCentre   !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory("All");
    setFilterLevel("All Levels");
    setFilterCircular("All");
    setFilterCentre("");
    setSelectedJob(null);
  };

  // ── Detail screen ──────────────────────────────────────────────────────────
  if (selectedJob) {
    const ls = getLevelStyle(selectedJob.level);
    return (
      <div style={s.detailScreen}>
        <div style={s.detailHeader}>
          <button onClick={() => setSelectedJob(null)} style={s.backBtn}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <span style={s.detailHeaderTitle}>Job Details</span>
          <div style={{ width: 36 }} />
        </div>

        <div style={s.detailBody}>
          <div style={s.detailBadgeRow}>
            <span style={s.postNoBadge}>POST {selectedJob.postNo}</span>
            <span style={{ ...s.levelBadge, background: ls.bg, color: ls.text }}>{selectedJob.level}</span>
            <span style={s.circBadge}>Circular {selectedJob.circular}</span>
          </div>

          <h2 style={s.detailTitle}>{selectedJob.title || "—"}</h2>
          {selectedJob.department && <p style={s.detailDept}>{selectedJob.department}</p>}

          <div style={s.infoGrid}>
            <div style={s.infoBlock}><p style={s.infoLabel}>Salary</p>    <p style={s.infoValue}>{selectedJob.salary   || "—"}</p></div>
            <div style={s.infoBlock}><p style={s.infoLabel}>Reference</p> <p style={s.infoValue}>{selectedJob.ref      || "—"}</p></div>
            <div style={s.infoBlock}><p style={s.infoLabel}>Location</p>  <p style={s.infoValue}>{selectedJob.centre   || "—"}</p></div>
            <div style={s.infoBlock}><p style={s.infoLabel}>Closing</p>   <p style={s.infoValue}>{selectedJob.closing  || "—"}</p></div>
            {selectedJob.pageNumber && <div style={s.infoBlock}><p style={s.infoLabel}>Circular Page</p><p style={s.infoValue}>Page {selectedJob.pageNumber}</p></div>}
          </div>

          {selectedJob.requirements && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Requirements</p>
              <p style={s.sectionText}>{selectedJob.requirements}</p>
            </div>
          )}

          {selectedJob.enquiries && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Enquiries</p>
              <p style={s.sectionText}>{selectedJob.enquiries}</p>
            </div>
          )}

          <div style={s.applyBox}>
            <p style={s.sectionLabel}>How to Apply</p>
            <p style={s.sectionText}>
              Submit a fully completed Z83 form with an updated CV to the advertising department.
              {selectedJob.ref ? <> Quote reference <strong>{selectedJob.ref}</strong>.</> : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── List screen ────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.branding}>
          <div style={s.logo}><span>PSV</span></div>
          <div>
            <p style={s.logoTitle}>Public Service Vacancies</p>
            <p style={s.logoSub}>Weekly Circular Portal</p>
          </div>
        </div>
        <button onClick={onSwitchToAdmin} style={s.adminBtn}>
          <i className="ti ti-lock" style={{ fontSize: 14 }} />
        </button>
      </header>

      {bannerAd && (
        <div style={{ ...s.banner, background: bannerAd.color }}>
          <div>
            <p style={s.bannerTitle}>{bannerAd.title}</p>
            {bannerAd.subtitle && <p style={s.bannerSub}>{bannerAd.subtitle}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {bannerAd.cta && <button style={s.bannerCta}>{bannerAd.cta}</button>}
            <span style={s.sponsoredTag}>AD</span>
          </div>
        </div>
      )}

      <div style={s.searchBar}>
        <div style={s.searchInputWrap}>
          <i className="ti ti-search" style={s.searchIcon} />
          <input style={s.searchInput} placeholder="Search location or title…"
            value={filterCentre}
            onChange={e => { setFilterCentre(e.target.value); setSelectedJob(null); }} />
          {filterCentre && (
            <button onClick={() => setFilterCentre("")} style={s.clearBtn}>
              <i className="ti ti-x" style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          style={{ ...s.filterToggleBtn, background: activeFilterCount > 0 ? "#2563EB" : "#F5F5F7", color: activeFilterCount > 0 ? "#fff" : "#1C1C1E" }}>
          <i className="ti ti-adjustments-horizontal" style={{ fontSize: 16 }} />
          {activeFilterCount > 0 && <span style={s.filterBadge}>{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div style={s.filterPanel}>
          <div style={s.filterGrid}>
            <div style={s.filterItem}>
              <label style={s.filterLabel}>Category</label>
              <div style={s.selectWrap}>
                <select style={s.select} value={filterCategory}
                  onChange={e => { setFilterCategory(e.target.value); setSelectedJob(null); }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <i className="ti ti-chevron-down" style={s.selectArrow} />
              </div>
            </div>
            <div style={s.filterItem}>
              <label style={s.filterLabel}>Salary Level</label>
              <div style={s.selectWrap}>
                <select style={s.select} value={filterLevel}
                  onChange={e => { setFilterLevel(e.target.value); setSelectedJob(null); }}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <i className="ti ti-chevron-down" style={s.selectArrow} />
              </div>
            </div>
            <div style={s.filterItem}>
              <label style={s.filterLabel}>Circular</label>
              <div style={s.selectWrap}>
                <select style={s.select} value={filterCircular}
                  onChange={e => { setFilterCircular(e.target.value); setSelectedJob(null); }}>
                  <option value="All">All Circulars</option>
                  {circulars.map(c => <option key={c} value={c}>Circular {c} / 2026</option>)}
                </select>
                <i className="ti ti-chevron-down" style={s.selectArrow} />
              </div>
            </div>
            <div style={s.filterItem}>
              <label style={s.filterLabel}>Sort By</label>
              <div style={s.selectWrap}>
                <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="circular">Latest Release</option>
                  <option value="level">Salary Level</option>
                  <option value="closing">Closing Soon</option>
                  <option value="title">A–Z</option>
                </select>
                <i className="ti ti-chevron-down" style={s.selectArrow} />
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={s.clearAllBtn}>Clear all filters</button>
          )}
        </div>
      )}

      <div style={s.resultsBar}>
        <span style={s.resultsText}>{filteredJobs.length} position{filteredJobs.length !== 1 ? "s" : ""} found</span>
      </div>

      <div style={s.cardList}>
        {filteredJobs.length === 0 ? (
          <div style={s.emptyState}>
            <i className="ti ti-mood-empty" style={{ fontSize: 48, color: "#D1D1D6", display: "block", marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "#3C3C43", marginBottom: 4 }}>No positions found</p>
            <p style={{ fontSize: 13, color: "#8E8E93" }}>
              {jobs.length === 0 ? "Upload a circular in Admin to get started." : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const ls = getLevelStyle(job.level);
            const locationLabel = (job.centre || "").split(":").pop().trim() || job.centre || "—";
            return (
              <article key={`${job.circular}-${job.postNo}`} onClick={() => setSelectedJob(job)} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.badgeRow}>
                      <span style={s.postNoBadge}>POST {job.postNo}</span>
                      <span style={{ ...s.levelBadge, background: ls.bg, color: ls.text }}>{job.level}</span>
                    </div>
                    <p style={s.cardTitle}>{job.title}</p>
                    {job.department && <p style={s.cardDept}>{job.department}</p>}
                  </div>
                  <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "#C7C7CC", flexShrink: 0, marginLeft: 8, marginTop: 4 }} />
                </div>
                <div style={s.cardFoot}>
                  <span><i className="ti ti-map-pin" style={{ marginRight: 4 }} />{locationLabel}</span>
                  {job.closing && <span><i className="ti ti-calendar" style={{ marginRight: 4 }} />Closes {job.closing.replace(/ at \d+:\d+$/, "")}</span>}
                  {job.pageNumber && <span><i className="ti ti-book" style={{ marginRight: 4 }} />p.{job.pageNumber}</span>}
                </div>
              </article>
            );
          })
        )}

        {sidebarAds.map(ad => (
          <div key={ad.id} style={{ ...s.inlineAd, background: ad.color }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{ad.title}</p>
            {ad.subtitle && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{ad.subtitle}</p>}
            {ad.cta && <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#fff" }}>{ad.cta} →</p>}
            <span style={s.sponsoredTag}>AD</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page:            { minHeight: "100dvh", background: "#F5F5F7", fontFamily: "system-ui, sans-serif", paddingBottom: "calc(16px + var(--safe-bottom))" },
  header:          { background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 16px", paddingTop: "var(--safe-top)", display: "flex", alignItems: "center", justifyContent: "space-between", height: "calc(56px + var(--safe-top))", position: "sticky", top: 0, zIndex: 50 },
  branding:        { display: "flex", alignItems: "center", gap: 10 },
  logo:            { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563EB,#1E40AF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 800, fontSize: 11, flexShrink: 0 },
  logoTitle:       { fontSize: 14, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.2 },
  logoSub:         { fontSize: 11, color: "#8E8E93" },
  adminBtn:        { width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.05)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#48484A", flexShrink: 0, cursor: "pointer" },
  banner:          { padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  bannerTitle:     { color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 2 },
  bannerSub:       { color: "rgba(255,255,255,0.75)", fontSize: 11 },
  bannerCta:       { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" },
  sponsoredTag:    { fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 1 },
  searchBar:       { padding: "10px 16px", background: "#fff", borderBottom: "1px solid #F0F0F0", display: "flex", gap: 8 },
  searchInputWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchIcon:      { position: "absolute", left: 10, fontSize: 16, color: "#8E8E93", pointerEvents: "none" },
  searchInput:     { width: "100%", height: 40, borderRadius: 10, border: "1px solid #E5E5EA", paddingLeft: 34, paddingRight: 34, fontSize: 15, background: "#F5F5F7", outline: "none" },
  clearBtn:        { position: "absolute", right: 8, background: "none", border: "none", color: "#8E8E93", display: "flex", alignItems: "center", cursor: "pointer" },
  filterToggleBtn: { height: 40, minWidth: 40, borderRadius: 10, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, paddingInline: 12, fontWeight: 600, fontSize: 13, position: "relative", cursor: "pointer" },
  filterBadge:     { position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  filterPanel:     { background: "#fff", borderBottom: "1px solid #E5E5EA", padding: "12px 16px 16px" },
  filterGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  filterItem:      { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel:     { fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 0.5 },
  selectWrap:      { position: "relative" },
  select:          { width: "100%", height: 38, borderRadius: 8, border: "1px solid #E5E5EA", paddingLeft: 10, paddingRight: 28, fontSize: 14, background: "#F9F9F9", outline: "none" },
  selectArrow:     { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#8E8E93", pointerEvents: "none" },
  clearAllBtn:     { marginTop: 12, background: "none", border: "1px solid #E5E5EA", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#636366", fontWeight: 500, cursor: "pointer" },
  resultsBar:      { padding: "8px 16px", background: "#F5F5F7" },
  resultsText:     { fontSize: 12, color: "#8E8E93", fontWeight: 500 },
  cardList:        { padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 },
  emptyState:      { textAlign: "center", padding: "4rem 1rem", color: "#8E8E93" },
  card:            { background: "#fff", borderRadius: 14, padding: "14px", border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  cardTop:         { display: "flex", alignItems: "flex-start", marginBottom: 10 },
  badgeRow:        { display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" },
  postNoBadge:     { fontSize: 10, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 7px", borderRadius: 5 },
  levelBadge:      { fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5 },
  cardTitle:       { fontSize: 15, fontWeight: 600, color: "#1C1C1E", marginBottom: 3, lineHeight: 1.3 },
  cardDept:        { fontSize: 12, color: "#636366" },
  cardFoot:        { display: "flex", gap: 14, fontSize: 12, color: "#8E8E93" },
  inlineAd:        { borderRadius: 14, padding: "14px", position: "relative", overflow: "hidden" },
  detailScreen:    { minHeight: "100dvh", background: "#F5F5F7", display: "flex", flexDirection: "column" },
  detailHeader:    { background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 16px", paddingTop: "var(--safe-top)", display: "flex", alignItems: "center", justifyContent: "space-between", height: "calc(56px + var(--safe-top))", position: "sticky", top: 0, zIndex: 50 },
  backBtn:         { width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.05)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#1C1C1E", cursor: "pointer" },
  detailHeaderTitle: { fontSize: 15, fontWeight: 600, color: "#1C1C1E" },
  detailBody:      { padding: "16px 16px calc(32px + var(--safe-bottom))", flex: 1, overflowY: "auto" },
  detailBadgeRow:  { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  circBadge:       { fontSize: 10, background: "#F2F2F7", color: "#636366", padding: "2px 7px", borderRadius: 5, fontWeight: 600 },
  detailTitle:     { fontSize: 20, fontWeight: 700, color: "#1C1C1E", marginBottom: 4, lineHeight: 1.25 },
  detailDept:      { fontSize: 14, color: "#636366", marginBottom: 16 },
  infoGrid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 },
  infoBlock:       { background: "#fff", border: "1px solid #F0F0F0", borderRadius: 10, padding: 12 },
  infoLabel:       { fontSize: 11, color: "#8E8E93", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 },
  infoValue:       { fontSize: 13, color: "#1C1C1E", fontWeight: 500 },
  section:         { marginBottom: 16 },
  sectionLabel:    { fontSize: 12, fontWeight: 700, color: "#1C1C1E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  sectionText:     { fontSize: 14, color: "#3C3C43", lineHeight: 1.5 },
  applyBox:        { background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 14, marginTop: 8 },
};
