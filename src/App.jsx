// src/App.jsx
import { useState } from "react";
import PortalView from "./components/PortalView";
import AdminView from "./components/AdminView";
import { INITIAL_JOBS, INITIAL_ADS } from "./constants/psvData";

export default function App() {
  const [view, setView] = useState("portal"); // "portal" or "admin"
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [ads, setAds] = useState(INITIAL_ADS);

  if (view === "admin") {
    return (
      <AdminView 
        jobs={jobs} 
        setJobs={setJobs} 
        ads={ads} 
        setAds={setAds} 
        onViewPortal={() => setView("portal")} 
      />
    );
  }

  return (
    <PortalView 
      jobs={jobs} 
      ads={ads} 
      onSwitchToAdmin={() => setView("admin")} 
    />
  );
}
