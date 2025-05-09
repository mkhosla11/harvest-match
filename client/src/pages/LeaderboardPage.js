import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/best-climate-resilient-crops")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err));
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

      <h1 style={styles.title}>Most Climate-Resilient Crops</h1>
      <p style={styles.subtitle}>Crops with the highest average yield under extreme environmental conditions.</p>

      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}  barCategoryGap={50}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="crop" style={{ fontFamily: 'Georgia',fontSize: '8px' }} angle={-25}
            textAnchor="end"/>
            <YAxis label={{ value: 'Avg Yield (kg/acre)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="avg_yield_in_extremes" fill="#3e8e41" />
          </BarChart>
        </ResponsiveContainer>
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
    color: "white",
  },
  navLinks: {
    display: "flex",
    gap: "1rem",
  },
  navButton: {
    backgroundColor: "transparent",
    border: "2px solid white",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  logoButton: {
    backgroundColor: "#3e8e41",
    border: "none",
    color: "white",
    fontSize: "1.2rem",
    fontWeight: "bold",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    cursor: "pointer",
  },
  title: {
    textAlign: "center",
    marginTop: "2rem",
    color: "#2f4f2f",
    fontSize: "2rem",
  },
  subtitle: {
    textAlign: "center",
    color: "#4e704e",
    marginBottom: "2rem",
  },
  chartContainer: {
    width: "90%",
    maxWidth: "1000px",
    margin: "0 auto",
  },
};
