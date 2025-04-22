const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

/**********************
 * PROJECT MS4 ROUTES *
 **********************/

const hello = async function(req, res) {
  res.json({
    message: 'Welcome to the Climate Data API! Use the endpoints to explore climate data.',
    endpoints: [
      '/api/climate_summary?year=YYYY',
      '/api/crop_wildfires?continent=CONTINENT&year=YYYY',
      '/api/continent_crop_yield',
      '/api/urban_co2',
      '/api/urban_wildfires_co2',
      '/api/top_co2_countries?limit=N',
      '/api/urban_majority',
      '/api/wildfire_hotspots',
      '/api/wildfire-vs-crop-yield',
      '/api/sea_level_vs_co2'
    ]
  });
}

// Route 1: GET /api/climate_summary
// Query: year
const climate_summary = async function(req, res) {
  const year = req.query.year;
  if (!year) {
    return res.status(400).json({
      error: 'Missing required query parameters: year',
    });
  }
  const q = `
    SELECT c.name AS country_name,
      AVG(st.daily_avg_temp) AS avg_daily_temp,
      AVG(ce.co2_production) AS avg_co2_emissions,
      AVG(sl.global_mean_sea_level) AS avg_sea_level
    FROM country c
      JOIN surface_temp st ON c.country_id = st.country_id
      JOIN co2_emissions ce ON c.country_id = ce.country_id
      JOIN sea_level sl ON c.country_id = sl.country_id
    WHERE st.year = ${year} AND ce.year = ${year} AND EXTRACT(YEAR FROM sl.date) = ${year}
    GROUP BY c.name;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 2: GET /api/crop_wildfires
// Query: continent, year
const crop_wildfires = async function(req, res) {
  const year = req.query.year;
  const continent = req.query.continent;
  if (!year || !continent) {
    return res.status(400).json({
      error: 'Missing required query parameters: year and continent',
    });
  }
  const q = `
    SELECT c.name AS country_name,
      SUM(wf.area_ha) AS total_wildfire_area,
      SUM(ce.co2_production) AS total_co2_production,
      cy.crop AS crop_type,
      AVG(cy.crop_yield) AS avg_crop_yield
    FROM country c
    JOIN wildfires wf ON c.country_id = wf.country_id
    JOIN co2_emissions ce ON c.country_id = ce.country_id
    JOIN crop_yield cy ON c.country_id = cy.country_id
    WHERE wf.continent = ${continent} AND cy.year = ${year} AND ce.year = ${year}
    GROUP BY c.name, cy.crop;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 3: GET /api/continent_crop_yield
const continent_crop_yield = async function(req, res) {
  const q = `
    WITH continent_yield AS (
      SELECT c.name AS country_name, w.continent, cy.crop, cy.crop_yield, cy.irrigation_access
      FROM crop_yield cy
      JOIN country c ON cy.country_id = c.country_id
      JOIN wildfires w ON c.country_id = w.country_id
    )
    SELECT continent, crop,
      AVG(crop_yield) AS avg_yield,
      AVG(irrigation_access) AS avg_irrigation_access
    FROM continent_yield
    GROUP BY continent, crop
    ORDER BY avg_yield DESC;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 4: GET /api/urban_co2
const urban_co2 = async function(req, res) {
  const q = `
    WITH metro_stats AS (
      SELECT mm.country_id, c.name AS country_name, mm.year, mm.urban_pop, mm.rural_pop,
        (mm.urban_pop * 1.0) / NULLIF(mm.rural_pop, 0) AS urban_rural_ratio
      FROM metropolis_momentum mm
      JOIN country c ON mm.country_id = c.country_id
    ),
    co2_stats AS (
      SELECT country_id, year, co2_per_capita FROM co2_emissions
    )
    SELECT m.country_name, m.year, m.urban_rural_ratio, cs.co2_per_capita
    FROM metro_stats m
    JOIN co2_stats cs ON m.country_id = cs.country_id AND m.year = cs.year
    WHERE m.urban_rural_ratio IS NOT NULL
    ORDER BY m.year, m.urban_rural_ratio DESC;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 5: GET /api/urban_wildfires_co2
const urban_wildfires_co2 = async function(req, res) {
  const q = `
    SELECT c.name AS country_name, mm.year, mm.urban_pop, mm.rural_pop,
    AVG(ce.co2_production) AS avg_co2_emissions,
    SUM(wf.area_ha) AS total_wildfire_area
    FROM country c
    JOIN metropolis_momentum mm ON c.country_id = mm.country_id
    JOIN co2_emissions ce ON c.country_id = ce.country_id
    JOIN wildfires wf ON c.country_id = wf.country_id
    WHERE mm.year = 2020
    GROUP BY c.name, mm.year, mm. urban_pop, mm.rural_pop
    ORDER BY c.name;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 6: GET /api/top_co2_countries
const top_co2_countries = async function(req, res) {
  const limit = req.query.limit || 10; // Default to 10 if not specified
  const year = req.query.year || 2019; // Default to 2019 if not specified
  const q = `
    SELECT c.name, ce.co2_per_capita
    FROM co2_emissions ce
    JOIN country c ON ce.country_id = c.country_id
    WHERE ce.year = ${year}
    ORDER BY ce.co2_per_capita DESC
    LIMIT ${limit};
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 7: GET /api/urban_majority
const urban_majority = async function(req, res) {
  const q = `
    WITH latest_year AS (
      SELECT MAX (year) AS max_year FROM metropolis_momentum
    }
    SELECT
      c.name AS country_name,
      mm.urban_pop,
      mm.rural_pop
    FROM metropolis momentum mm
      JOIN country c ON mm.country_id = c.country_id
      JOIN latest_year ly ON mm.year = ly.max year
    WHERE mm.urban _pop > mm.rural_pop
    ORDER BY mm.urban_pop DESC;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 8: GET /api/wildfire_hotspots
const wildfire_hotspots = async function(req, res) {
  const q = `
    SELECT c.name AS country_name, COUNT(w.wildfire_id) AS wildfire_events
    FROM wildfires w
    JOIN country c ON w.country_id = c.country_id
    GROUP BY c.name
    HAVING COUNT(w.wildfire_id) > 10
    ORDER BY wildfire _events DESC;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 9: GET /api/wildfire-vs-crop-yield
const wildfire_vs_crop_yield = async function(req, res) {
  const q = `
    SELECT c.name AS country_name,
      SUM(wf.area_ha) AS total_wildfire_area,
      AVG(cy.crop_yield) AS avg_crop_yield
    FROM countries c
    JOIN wildfires wf ON c.country_id = wf.country_id
    JOIN crop_yield cy ON c.country_id = cy.country_id
    WHERE extreme_weather IS NOT NULL
    GROUP BY c.name
    ORDER BY total_wildfire_area DESC;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 10: GET /api/sea_level_vs_co2
const sea_level_vs_co2 = async function(req, res) {
  const q = `
    SELECT c.name AS country_name, ce.year, ce.co2_production AS co2_emissions,
      AVG(sl.global_mean_sea_level) AS avg_sea_level,
    FROM country c
    JOIN co2_emissions ce ON c.country_id = ce.country_id
    JOIN sea_level sl ON c.country_id = sl.country_id
    GROUP BY c.name, ce.year
    ORDER BY c.name, ce.year;
  `
  connection.query(q, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({});
    } else {
      res.json(data.rows);
    }
  });
}

module.exports = {
  hello,
  climate_summary,
  crop_wildfires,
  continent_crop_yield,
  urban_co2,
  urban_wildfires_co2,
  top_co2_countries,
  urban_majority,
  wildfire_hotspots,
  wildfire_vs_crop_yield,
  sea_level_vs_co2
};