import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  const routes = [
    { name: "Map", path: "/map" },
    { name: "Search", path: "/search" },
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

      <main style={styles.heroWrapper}>
        <section style={styles.hero}>
          <div style={styles.leafAccent}>🧑‍🌾</div>
          <h1 style={styles.heroTitle}>Rooted in Data. Grown for You.</h1>
          <hr style={styles.divider} />

          <div style={styles.descriptionBlock}>
            <p>Discover optimal crops using real climate data and smart matching.</p>
            <p>Visualize trends. Unlock insights. Plant with confidence.</p>
          </div>

          <HoverCTA onClick={() => navigate("/map")} />
        </section>
      </main>
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

function HoverCTA({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.ctaButton,
        backgroundColor: hovered ? "white" : "#3e8e41",
        color: hovered ? "#3e8e41" : "white",
        borderColor: "#3e8e41",
      }}
    >
      Start Exploring →
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
    background: "linear-gradient(to bottom right, #e8f5e9, #f0f9f4)",
    minHeight: "100vh",
    margin: 0,
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3e8e41",
    padding: "1rem 2rem",
    color: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  navLinks: {
    display: "flex",
    gap: "1.2rem",
  },
  heroWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem 2rem",
  },
  hero: {
    backgroundColor: "#ffffff",
    textAlign: "center",
    padding: "4rem 2rem",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
    maxWidth: "800px",
    width: "100%",
  },
  leafAccent: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#2f4f2f",
  },
  divider: {
    width: "80px",
    height: "2px",
    backgroundColor: "#a8d5ba",
    border: "none",
    margin: "1rem auto",
  },
  descriptionBlock: {
    fontSize: "1.2rem",
    lineHeight: "1.7",
    color: "#3b5d3b",
    maxWidth: "600px",
    margin: "1rem auto",
  },
  ctaButton: {
    marginTop: "2.5rem",
    fontSize: "1rem",
    padding: "0.75rem 1.5rem",
    border: "2px solid",
    borderRadius: "8px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  },
};
