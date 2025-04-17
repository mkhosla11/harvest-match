const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// Root
app.get('/', routes.hello);
// New routes for project MS4
app.get('/api/climate_summary', routes.climate_summary);
app.get('/api/crop_wildfires', routes.crop_wildfires);
app.get('/api/continent_crop_yield', routes.continent_crop_yield);
app.get('/api/urban_co2', routes.urban_co2);
app.get('/api/urban_wildfires_co2', routes.urban_wildfires_co2);
app.get('/api/top_co2_countries', routes.top_co2_countries);
app.get('/api/urban_majority', routes.urban_majority);
app.get('/api/wildfire_hotspots', routes.wildfire_hotspots);
app.get('/api/wildfire-vs-crop-yield', routes.wildfire_vs_crop_yield);
app.get('/api/sea_level_vs_co2', routes.sea_level_vs_co2);

app.use((req, res, next) => {
  console.log(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
