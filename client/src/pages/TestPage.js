import React, { useEffect, useState } from "react";

export default function ClimateSummaryPage() {
  const [year, setYear] = useState("2020");
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    fetch(`/api/climate-summary?year=${year}`)
      .then((res) => res.json())
      .then((data) => setSummaryData(data))
      .catch((err) => console.error("Error fetching climate summary:", err));
  }, [year]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Climate Summary for {year}</h2>

      <label htmlFor="year">Change Year: </label>
      <input
        id="year"
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        style={{ marginBottom: "1rem", marginLeft: "0.5rem" }}
      />

      {summaryData.length === 0 ? (
        <p>Loading or no data available.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Country</th>
              <th>Avg Temperature (°C)</th>
              <th>Avg CO₂ Emissions (tons)</th>
              <th>Avg Sea Level (m)</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row, index) => (
              <tr key={index}>
                <td>{row.country_name}</td>
                <td>{row.avg_daily_temp.toFixed(2)}</td>
                <td>{row.avg_co2_emissions.toFixed(2)}</td>
                <td>{row.avg_sea_level.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}