import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
  const [formData, setFormData] = useState({
    region: "",
    temperature: "",
    rainfall: "",
    soilType: "",
  });

  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const routes = [
    { name: "Home", path: "/" },
    { name: "Map", path: "/map" },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy results – replace with actual logic later
    const dummyCrops = [
      { name: "Corn", match: "High yield in warm, wet regions" },
      { name: "Wheat", match: "Adaptable to moderate climates" },
      { name: "Soybean", match: "Requires rich soil and warm weather" },
    ];

    setResults(dummyCrops);
  };

  return (
    <div style={styles.page}>
      {/* ✅ Navbar */}
      <header style={styles.navbar}>
        <HomeButton onClick={() => navigate("/")} />
        <nav style={styles.navLinks}>
          {routes.map((route, i) => (
            <HoverButton key={i} label={route.name} onClick={() => navigate(route.path)} />
          ))}
        </nav>
      </header>

      <div style={styles.container}>
        <h1 style={styles.heading}>🌿 Find the Right Crop for Your Needs</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Region:
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g. Southeast US"
            />
          </label>
          <label style={styles.label}>
            Avg Temperature (°C):
            <input
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Avg Rainfall (mm/year):
            <input
              type="number"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Soil Type:
            <input
              type="text"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g. Loamy"
            />
          </label>
          <button type="submit" style={styles.button}>
            Search Crops →
          </button>
        </form>

        {results.length > 0 && (
          <div style={styles.results}>
            <h2 style={styles.resultsHeading}>Recommended Crops:</h2>
            <ul>
              {results.map((crop, index) => (
                <li key={index} style={styles.resultItem}>
                  <strong>{crop.name}</strong> — <em>{crop.match}</em>
                </li>
              ))}
            </ul>
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
  container: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
  },
  heading: {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  input: {
    marginTop: "0.5rem",
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    marginTop: "1rem",
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "#3e8e41",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  results: {
    marginTop: "2rem",
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  resultsHeading: {
    marginBottom: "1rem",
    fontSize: "1.3rem",
    color: "#3e8e41",
  },
  resultItem: {
    marginBottom: "0.8rem",
    fontSize: "1.05rem",
  },
};
