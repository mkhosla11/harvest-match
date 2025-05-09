import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SeasonalInfo() {
  const [bestBySeason, setBestBySeason] = useState([]);
  const [bestForCrop, setBestForCrop] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/best-crop-by-season")
      .then((res) => res.json())
      .then((data) => setBestBySeason(data));

    fetch("http://localhost:8080/best-season-for-crop")
      .then((res) => res.json())
      .then((data) => setBestForCrop(data));
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

      <div style={{ ...styles.section }}>
  <h2 style={styles.sectionTitle}>Best Crop by Season</h2>
  <table style={styles.table}>
    <thead>
      <tr>
        <th>Season</th>
        <th>Best Crop</th>
        <th>Avg Yield (kg/acre)</th>
      </tr>
    </thead>
    <tbody>
      {bestBySeason.map((row, index) => (
        <tr key={index}>
          <td>{row.season}</td>
          <td>{row.best_crop}</td>
          <td>{row.avg_yield_kg_per_acre}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div style={{ ...styles.section }}>
  <h2 style={styles.sectionTitle}>Best Season to Plant Each Crop</h2>
  <table style={styles.table}>
    <thead>
      <tr>
        <th>Crop</th>
        <th>Best Season</th>
        <th>Avg Yield (kg/acre)</th>
      </tr>
    </thead>
    <tbody>
      {bestForCrop.map((row, index) => (
        <tr key={index}>
          <td>{row.crop}</td>
          <td>{row.best_season_to_plant}</td>
          <td>{row.avg_yield_kg_per_acre}</td>
        </tr>
      ))}
    </tbody>
  </table>
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
    paddingBottom: "3rem",
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
    margin: "2rem 0 1rem",
    color: "#2f4f2f",
  },
  section: {
    margin: "2rem auto",
    padding: "1.5rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
    width: "90%",
    maxWidth: "800px",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "'Georgia', serif",
    fontSize: "1.75rem",
    marginBottom: "1rem",
    color: "#2e4e2e",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'Georgia', serif",
  },
  th: {
    backgroundColor: "#f0f9f4",
    fontWeight: "bold",
    padding: "0.75rem",
    borderBottom: "2px solid #ccc",
  },
  td: {
    padding: "0.75rem",
    borderBottom: "1px solid #ddd",
  },
};

