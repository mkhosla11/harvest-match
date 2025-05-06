import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function MapPage() {
  const [selectedState, setSelectedState] = useState(null);
  const navigate = useNavigate();

  const routes = [
    { name: "Home", path: "/" },
    { name: "Search", path: "/search" },
  ];

  return (
    <div style={styles.page}>
      {/* ✅ NAVBAR */}
      <header style={styles.navbar}>
        <HomeButton onClick={() => navigate("/")} />
        <nav style={styles.navLinks}>
          {routes.map((route, i) => (
            <HoverButton
              key={i}
              label={route.name}
              onClick={() => navigate(route.path)}
            />
          ))}
        </nav>
      </header>

      <div style={styles.mapContainer}>
        <ComposableMap projection="geoAlbersUsa" style={styles.map}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => setSelectedState(geo.properties.name)}
                  style={{
                    default: {
                      fill: "#cdeac0",
                      stroke: "#607D8B",
                      strokeWidth: 0.75,
                      outline: "none",
                    },
                    hover: {
                      fill: "#88cc88",
                      stroke: "#607D8B",
                      strokeWidth: 1,
                      outline: "none",
                    },
                    pressed: {
                      fill: "#3e8e41",
                      stroke: "#607D8B",
                      strokeWidth: 1,
                      outline: "none",
                    },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>

        {selectedState && (
          <div style={styles.popup}>
            <button
              style={styles.closeButton}
              onClick={() => setSelectedState(null)}
            >
              ×
            </button>
            <h2 style={styles.popupTitle}>{selectedState}</h2>
            <p>
              This is placeholder info for <strong>{selectedState}</strong>. You can
              replace this with climate, crop, or weather data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HoverButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "white" : "transparent",
        border: "2px solid white",
        color: hovered ? "#3e8e41" : "white",
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        fontSize: "1rem",
        cursor: "pointer",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        transition: "all 0.3s ease",
      }}
    >
      {label}
    </button>
  );
}

function HomeButton({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "white" : "#3e8e41",
        color: hovered ? "#3e8e41" : "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "bold",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      🌾 HarvestMatch: The Crop Matching Interface
    </button>
  );
}

const styles = {
  page: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    backgroundColor: "#f0f9f4",
    minHeight: "100vh",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3e8e41",
    padding: "1rem 2rem",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
    color: "white",
  },
  navLinks: {
    display: "flex",
    gap: "1.2rem",
  },
  title: {
    textAlign: "center",
    color: "#2f4f2f",
    margin: "2rem 0 1rem",
  },
  mapContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    maxWidth: "1000px",
  },
  popup: {
    position: "absolute",
    top: "15%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    width: "80%",
    maxWidth: "400px",
    zIndex: 10,
    textAlign: "center",
    color: "#2f4f2f",
  },
  popupTitle: {
    marginTop: 0,
    fontSize: "1.5rem",
  },
  closeButton: {
    position: "absolute",
    top: "0.5rem",
    right: "0.75rem",
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#2f4f2f",
  },
};
