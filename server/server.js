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
app.get('/map', routes.mapPage);

app.get('/state/:state', routes.getStateAverages);

app.get('/best-region-by-crop', routes.bestRegionForCrop);
app.get('/best-temp-range-by-crop', routes.bestTemperatureRange);
app.get('/best-precip-range-by-crop', routes.bestPrecipitationRange);
app.get('/best-pollution-range-by-crop', routes.bestPollutionRange);
app.get('/best-conditions', routes.bestConditionsByCrop);
app.get('/crop-trends', routes.cropTrends);
app.get('/best-climate-resilient-crops', routes.bestClimateResilientCrops);
app.get('/best-crop-by-season', routes.bestCropBySeason);
app.get('/best-season-for-crop', routes.bestSeasonForCrop);


app.use((req, res, next) => {
  console.log(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
