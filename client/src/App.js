import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage"; 
import SearchPage from "./pages/SearchPage";
import BestConditionsPage from './pages/BestConditionsPage';
import CropTrendsPage from './pages/CropTrendsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SeasonalInfoPage from './pages/SeasonalInfoPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapPage />} /> 
        <Route path="/best-conditions" element={<BestConditionsPage />} />
        <Route path="/crop-trends" element={<CropTrendsPage />} />
        <Route path="/best-climate-resilient-crops" element={<LeaderboardPage />} />
        <Route path="/seasonal-crop-info" element={<SeasonalInfoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
