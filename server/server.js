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

app.use((req, res, next) => {
  console.log(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
