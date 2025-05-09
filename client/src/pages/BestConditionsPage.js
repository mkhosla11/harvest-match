import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BestConditionsPage() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/best-conditions")
      .then((res) => res.json())
      .then((data) => setCrops(data))
      .catch((err) => console.error("Failed to fetch crops:", err));
  }, []);

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

      <h1 style={styles.title}>Optimal Conditions for Crops</h1>
      <div style={styles.grid}>
        {crops.map((crop, index) => (
          <div
            key={index}
            style={styles.cropCard}
            onClick={() => setSelectedCrop(crop)}
          >
            <img
  src={`/images/${crop.crop.toLowerCase().replace(/\s+/g, '')}.jpg`}
  alt={crop.crop}
  style={{
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px"
  }}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "/images/placeholder.jpg"; // fallback image if not found
  }}
/>
            <div>{crop.crop}</div>
          </div>
        ))}
      </div>

      {selectedCrop && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>
            <button
              onClick={() => setSelectedCrop(null)}
              style={styles.closeButton}
            >
              ×
            </button>
            <h3>{selectedCrop.crop}</h3>
            <p>Best Temperature: <strong>{selectedCrop.best_temp}</strong></p>
            <p>Best Precipitation: <strong>{selectedCrop.best_precip}</strong></p>
            <p>Best Pollution: <strong>{selectedCrop.best_pollution}</strong></p>
          </div>
        </div>
      )}
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
    paddingBottom: "3rem",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3e8e41",
    padding: "1rem 2rem",
    color: "white",
  },
  navLinks: {
    display: "flex",
    gap: "1rem",
  },
  title: {
    textAlign: "center",
    color: "#2f4f2f",
    margin: "2rem 0 1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "1.5rem",
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  },
  cropCard: {
    background: "white",
    padding: "1rem",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
    cursor: "pointer",
  },
  placeholderImage: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popup: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1.5rem",
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};