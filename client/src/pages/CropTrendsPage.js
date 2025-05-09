import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CropTrendsPage() {
  const [data, setData] = useState([]);
  const [selectedState, setSelectedState] = useState("NEW YORK");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/crop-trends")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("Failed to fetch crop trends:", err));
  }, []);

  const states = [...new Set(data.map((row) => row.state))];
  const filteredData = data.filter((row) => row.state === selectedState);

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

      <div style={styles.container}>
        <h1 style={styles.title}>Crop Yield & Climate Trends by State</h1>

        <label style={styles.label}>Select State:</label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={styles.dropdown}
        >
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <ChartBlock title="Yield vs. Temperature" data={filteredData} yKey="avg_temp" />
        <ChartBlock title="Yield vs. Precipitation" data={filteredData} yKey="avg_precipitation" />
        <ChartBlock title="Yield vs. CO Mean" data={filteredData} yKey="avg_co" />
        <ChartBlock title="Yield vs. NO₂ Mean" data={filteredData} yKey="avg_no2" />
        <ChartBlock title="Yield vs. SO₂ Mean" data={filteredData} yKey="avg_so2" />
        <ChartBlock title="Yield vs. O₃ Mean" data={filteredData} yKey="avg_o3" />
      </div>
    </div>
  );
}

function ChartBlock({ title, data, yKey }) {
  return (
    <div style={styles.chartBlock}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis yAxisId="left" label={{ value: yKey, angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: "Yield", angle: -90, position: "insideRight" }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey={yKey} stroke="#8884d8" />
          <Line yAxisId="right" type="monotone" dataKey="avg_yield" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
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
  container: {
    padding: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "2rem",
    color: "#2f4f2f",
  },
  label: {
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  dropdown: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "2rem",
  },
  chartBlock: {
    marginBottom: "3rem",
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
};
