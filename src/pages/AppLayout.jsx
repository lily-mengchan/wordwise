import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Map from "../components/Map";
import User from "../components/User";
import styles from "./AppLayout.module.css";

function AppLayout() {
  const [pendingLocation, setPendingLocation] = useState(null);
  const [showVisitChoice, setShowVisitChoice] = useState(false);
  const navigate = useNavigate();

  function handleVisited() {
    if (!pendingLocation) return;

    navigate(`/app/form?lat=${pendingLocation.lat}&lng=${pendingLocation.lng}`);
    setShowVisitChoice(false);
    setPendingLocation(null);
  }

  function handleExplore() {
    if (!pendingLocation) return;

    navigate(`/app/explore?lat=${pendingLocation.lat}&lng=${pendingLocation.lng}`);
    setShowVisitChoice(false);
    setPendingLocation(null);
  }

  function handleCancel() {
    setShowVisitChoice(false);
    setPendingLocation(null);
  }

  return (
    <div className={styles.app}>
      <Sidebar />

      <Map
        setPendingLocation={setPendingLocation}
        setShowVisitChoice={setShowVisitChoice}
      />

      <User />

      {showVisitChoice && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            backgroundColor: "#242a2e",
            color: "#fff",
            padding: "2rem",
            borderRadius: "12px",
            minWidth: "320px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ marginBottom: "1.2rem", fontSize: "1.6rem" }}>
            Have you been here before?
          </p>

          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button type="button" onClick={handleVisited}>
              Yes, I&apos;ve been there
            </button>
            <button type="button" onClick={handleExplore}>
              No, just exploring
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;
