import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
  const [region, setRegion] = useState("Northeast");
  const [temperatureMin, setTemperatureMin] = useState(0);
  const [temperatureMax, setTemperatureMax] = useState(120);
  const [rainfallMin, setRainfallMin] = useState(0);
  const [rainfallMax, setRainfallMax] = useState(2);
  const [pollutionMin, setPollutionMin] = useState(0);
  const [pollutionMax, setPollutionMax] = useState(20);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const [regionRes, tempRes, rainRes, pollRes] = await Promise.all([
        fetch("http://localhost:8080/best-region-by-crop"),
        fetch("http://localhost:8080/best-temp-range-by-crop"),
        fetch("http://localhost:8080/best-precip-range-by-crop"),
        fetch("http://localhost:8080/best-pollution-range-by-crop")
      ]);

      const [regionData, tempData, rainData, pollData] = await Promise.all([
        regionRes.json(),
        tempRes.json(),
        rainRes.json(),
        pollRes.json()
      ]);

      const filtered = regionData.filter((crop) => {
        const temp = tempData.find((t) => t.crop === crop.crop);
        const rain = rainData.find((r) => r.crop === crop.crop);
        const poll = pollData.find((p) => p.crop === crop.crop);
        return (
          crop.best_region === region &&
          temp && temp.min_temp_f >= temperatureMin && temp.max_temp_f <= temperatureMax &&
          rain && rain.min_precip_mm >= rainfallMin && rain.max_precip_mm <= rainfallMax &&
          poll && poll.min_pollution_index >= pollutionMin && poll.max_pollution_index <= pollutionMax
        );
      });

      setResults(filtered);
      setShowPopup(true);
    } catch (error) {
      console.error("Error fetching crop data:", error);
    }
  };

  const regions = [
    "Northeast",
    "Southeast",
    "Midwest",
    "Southwest",
    "West",
    "Northwest",
    "Central",
    "Pacific",
  ];

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

      <h1 style={styles.title}>Filter for Your Best Crop</h1>

      <div style={styles.formContainer}>
        <label>Region:</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={styles.input}
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label>Temperature Range (°F): {temperatureMin} - {temperatureMax}</label>
        <input type="range" min="0" max="120" value={temperatureMin} onChange={(e) => setTemperatureMin(Number(e.target.value))} style={styles.slider} />
        <input type="range" min="0" max="120" value={temperatureMax} onChange={(e) => setTemperatureMax(Number(e.target.value))} style={styles.slider} />

        <label>Rainfall Range (m/year): {rainfallMin} - {rainfallMax}</label>
        <input type="range" min="0" max="2" step="0.01" value={rainfallMin} onChange={(e) => setRainfallMin(Number(e.target.value))} style={styles.slider} />
        <input type="range" min="0" max="2" step="0.01" value={rainfallMax} onChange={(e) => setRainfallMax(Number(e.target.value))} style={styles.slider} />

        <label>Pollution Index: {pollutionMin} - {pollutionMax}</label>
        <input type="range" min="0" max="20" step="0.1" value={pollutionMin} onChange={(e) => setPollutionMin(Number(e.target.value))} style={styles.slider} />
        <input type="range" min="0" max="20" step="0.1" value={pollutionMax} onChange={(e) => setPollutionMax(Number(e.target.value))} style={styles.slider} />

        <button style={styles.button} onClick={handleSearch}>
          Search Crops →
        </button>

        {showPopup && (
          <div style={styles.popupOverlay}>
            <div style={styles.popup}>
              <button onClick={() => setShowPopup(false)} style={styles.closeButton}>
                ×
              </button>
              <h3>Best Matching Crops:</h3>
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {results.map((crop, i) => (
                  <li key={i} style={{ marginBottom: "0.5rem" }}>
                    <strong>{crop.crop}</strong>
                  </li>
                ))}
              </ul>
            </div>
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
  formContainer: {
    maxWidth: "450px",
    background: "#fff",
    margin: "0 auto",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  slider: {
    width: "100%",
  },
  button: {
    backgroundColor: "#3e8e41",
    color: "white",
    border: "none",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
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