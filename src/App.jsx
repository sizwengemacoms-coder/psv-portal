import { useState } from "react";
import PortalView from "./components/PortalView.jsx";
import AdminView from "./components/AdminView.jsx";
import { INITIAL_JOBS, INITIAL_ADS } from "./constants/psvData.js";

export default function App() {
  const [view, setView] = useState("portal");
  const [jobs] = useState(INITIAL_JOBS);
  const [ads, setAds] = useState(INITIAL_ADS);

  return view === "portal" ? (
    <PortalView jobs={jobs} ads={ads} onSwitchToAdmin={() => setView("admin")} />
  ) : (
    <AdminView jobs={jobs} ads={ads} setAds={setAds} onViewPortal={() => setView("portal")} />
  );
}
