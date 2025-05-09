import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function MapPage() {
  const [selectedState, setSelectedState] = useState(null);
  const [stateClimateData, setStateClimateData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedState) {
      const url = `http://localhost:8080/state/${encodeURIComponent(selectedState)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setStateClimateData(data[0]); 
        })
        .catch((err) => {
          console.error(err);
          setStateClimateData(null);
        });
    }
  }, [selectedState]);

  const routes = [
    { name: "Home", path: "/" },
    { name: "Map", path: "/map" },
    { name: "Search", path: "/search" },
    {name: "Crop Info", path: "/best-conditions"},
    {name: "Crop Trends", path: "/crop-trends"},
    {name: "Crop Leaderboard", path: "/best-climate-resilient-crops"},
    { name: "Seasonal Info", path: "/seasonal-crop-info" }
  ];

  return (
    <div style={styles.page}>
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
                  onClick={() => {
                    setStateClimateData(null); 
                    setSelectedState(geo.properties.name);
                  }}
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
            <button style={styles.closeButton} onClick={() => setSelectedState(null)}>×</button>
            <h2 style={styles.popupTitle}>{selectedState}</h2>
            {stateClimateData ? (
              <div>
                Dominant Crop: <strong>{stateClimateData.dominant_crop}</strong><br/>
                Avg Temp: {stateClimateData.avg_temp}°F<br/>
                Avg Precip: {stateClimateData.avg_precipitation} mm<br/>
                Avg CO: {stateClimateData.avg_co}<br/>
                Avg NO₂: {stateClimateData.avg_no2}, Avg SO₂: {stateClimateData.avg_so2}, Avg O₃: {stateClimateData.avg_o3}
              </div>
            ) : (
              <p>Loading climate data for <strong>{selectedState}</strong>...</p>
            )}
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
      HarvestMatch
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
    maxWidth: "450px",
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
