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
      '/map'
    ]
  });
}

const path = require('path');

const mapPage = function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
};

const getStateAverages = async function (req, res) {
  const state = req.params.state.toUpperCase();
  console.log("STATE RECEIVED:", state);

  connection.query(`
    WITH pollution_avg AS (
      SELECT
        UPPER("State") AS state,
        AVG("CO Mean") AS avg_co,
        AVG("NO2 Mean") AS avg_no2,
        AVG("SO2 Mean") AS avg_so2,
        AVG("O3 Mean") AS avg_o3
      FROM pollution_data
      WHERE "Year" BETWEEN 2016 AND 2022
      GROUP BY UPPER("State")
    ),
    weather_avg AS (
      SELECT
        UPPER(state) AS state,
        AVG(precipitation) AS avg_precipitation
      FROM weather_events
      WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
      GROUP BY UPPER(state)
    ),
    temperature_avg AS (
      SELECT
        UPPER(state) AS state,
        AVG(average_temp) AS avg_temp
      FROM temperature_data
      WHERE year BETWEEN 2016 AND 2022
      GROUP BY UPPER(state)
    ),
    crop_yield_ranked AS (
      SELECT
        UPPER(state) AS state,
        crop,
        AVG(yield_kg_per_acre) AS avg_yield,
        ROW_NUMBER() OVER (
          PARTITION BY UPPER(state)
          ORDER BY AVG(yield_kg_per_acre) DESC
        ) AS rank
      FROM crop_data
      WHERE year BETWEEN 2016 AND 2022
      GROUP BY UPPER(state), crop
    ),
    crop_summary AS (
      SELECT
        state,
        crop AS dominant_crop
      FROM crop_yield_ranked
      WHERE rank = 1
    )

    SELECT
      p.state,
      ROUND(p.avg_co::numeric, 4) AS avg_co,
      ROUND(p.avg_no2::numeric, 4) AS avg_no2,
      ROUND(p.avg_so2::numeric, 4) AS avg_so2,
      ROUND(p.avg_o3::numeric, 4) AS avg_o3,
      ROUND(w.avg_precipitation::numeric, 2) AS avg_precipitation,
      ROUND(t.avg_temp::numeric, 2) AS avg_temp,
      c.dominant_crop
    FROM pollution_avg p
    LEFT JOIN weather_avg w ON p.state = w.state
    LEFT JOIN temperature_avg t ON p.state = t.state
    LEFT JOIN crop_summary c ON p.state = c.state
    WHERE p.state = $1;
  `, [state], (err, data) => {
    if (err) {
      console.log("Query failed:", err);
      res.status(500).json({ error: 'Query failed' });
    } else {
      console.log("Rows returned:", data.rows.length);
      res.json(data.rows);
    }
  });
};

const bestRegionForCrop = async function(req, res) {
  connection.query(`
    WITH state_regions AS (
      SELECT * FROM (VALUES
        ('MAINE','Northeast'), ('NEW HAMPSHIRE','Northeast'), ('VERMONT','Northeast'), ('MASSACHUSETTS','Northeast'), ('RHODE ISLAND','Northeast'), ('CONNECTICUT','Northeast'),
        ('NEW YORK','Northeast'), ('PENNSYLVANIA','Northeast'), ('NEW JERSEY','Northeast'),
        ('DELAWARE','Southeast'), ('MARYLAND','Southeast'), ('DISTRICT OF COLUMBIA','Southeast'), ('VIRGINIA','Southeast'), ('WEST VIRGINIA','Southeast'), ('NORTH CAROLINA','Southeast'),
        ('SOUTH CAROLINA','Southeast'), ('GEORGIA','Southeast'), ('FLORIDA','Southeast'), ('KENTUCKY','Southeast'), ('TENNESSEE','Southeast'), ('MISSISSIPPI','Southeast'),
        ('ALABAMA','Southeast'), ('ARKANSAS','Southeast'), ('LOUISIANA','Southeast'),
        ('OHIO','Midwest'), ('MICHIGAN','Midwest'), ('INDIANA','Midwest'), ('ILLINOIS','Midwest'), ('WISCONSIN','Midwest'),
        ('MINNESOTA','Midwest'), ('IOWA','Midwest'), ('MISSOURI','Midwest'), ('NORTH DAKOTA','Midwest'), ('SOUTH DAKOTA','Midwest'), ('NEBRASKA','Midwest'), ('KANSAS','Midwest'),
        ('TEXAS','Southwest'), ('OKLAHOMA','Southwest'), ('NEW MEXICO','Southwest'), ('ARIZONA','Southwest'),
        ('COLORADO','West'), ('UTAH','West'), ('NEVADA','West'), ('CALIFORNIA','West'),
        ('MONTANA','Northwest'), ('IDAHO','Northwest'), ('OREGON','Northwest'), ('WASHINGTON','Northwest'), ('WYOMING','Northwest'),
        ('ALASKA','Pacific'), ('HAWAII','Pacific')
      ) AS t(state, region)
    ),
    regional_yields AS (
      SELECT sr.region, c.crop, AVG(c.yield_kg_per_acre) AS avg_yield
      FROM crop_data c
      JOIN state_regions sr ON UPPER(c.state) = sr.state
      GROUP BY sr.region, c.crop
    ),
    ranked AS (
      SELECT crop, region, avg_yield,
             ROW_NUMBER() OVER (PARTITION BY crop ORDER BY avg_yield DESC) AS rank
      FROM regional_yields
    )
    SELECT crop, region AS best_region, ROUND(avg_yield::numeric, 2) AS avg_yield
    FROM ranked
    WHERE rank = 1
    ORDER BY crop;`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
};

const bestPollutionRange = async function(req, res) {
  connection.query(`
    WITH state_pollution_index AS (
      SELECT
        UPPER("State") AS state,
        AVG("CO Mean") + AVG("NO2 Mean") + AVG("SO2 Mean") + AVG("O3 Mean") AS pollution_index
      FROM pollution_data
      WHERE "Year" BETWEEN 2016 AND 2022
      GROUP BY UPPER("State")
    ),
    crop_states AS (
      SELECT DISTINCT UPPER(state) AS state, crop
      FROM crop_data
      WHERE year BETWEEN 2016 AND 2022
    ),
    crop_pollution_joined AS (
      SELECT
        cs.crop,
        spi.pollution_index
      FROM crop_states cs
      JOIN state_pollution_index spi ON cs.state = spi.state
    )
    SELECT
      crop,
      ROUND(MIN(pollution_index)::numeric, 2) AS min_pollution_index,
      ROUND(MAX(pollution_index)::numeric, 2) AS max_pollution_index
    FROM crop_pollution_joined
    GROUP BY crop
    ORDER BY crop;`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
};

const bestPrecipitationRange = async function(req, res) {
  connection.query(`
    WITH yearly_state_precip AS (
      SELECT
        EXTRACT(YEAR FROM start_date)::int AS year,
        UPPER(state) AS state,
        AVG(precipitation) AS yearly_avg_precip
      FROM weather_events
      WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
      GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
    ),
    state_avg_precip AS (
      SELECT
        state,
        AVG(yearly_avg_precip) AS avg_precip
      FROM yearly_state_precip
      GROUP BY state
    ),
    crop_states AS (
      SELECT DISTINCT UPPER(state) AS state, crop
      FROM crop_data
      WHERE year BETWEEN 2016 AND 2022
    ),
    crop_precip_joined AS (
      SELECT
        cs.crop,
        sap.avg_precip
      FROM crop_states cs
      JOIN state_avg_precip sap ON cs.state = sap.state
    )
    SELECT
      crop,
      ROUND(MIN(avg_precip)::numeric, 2) AS min_precip_mm,
      ROUND(MAX(avg_precip)::numeric, 2) AS max_precip_mm
    FROM crop_precip_joined
    GROUP BY crop
    ORDER BY crop;`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
};

const bestTemperatureRange = async function(req, res) {
  connection.query(`
    WITH yearly_state_temp AS (
      SELECT
        year,
        UPPER(state) AS state,
        AVG(average_temp) AS yearly_avg_temp
      FROM temperature_data
      WHERE year BETWEEN 2016 AND 2022
      GROUP BY year, UPPER(state)
    ),
    state_avg_temp AS (
      SELECT
        state,
        AVG(yearly_avg_temp) AS avg_temp_f
      FROM yearly_state_temp
      GROUP BY state
    ),
    crop_states AS (
      SELECT DISTINCT UPPER(state) AS state, crop
      FROM crop_data
      WHERE year BETWEEN 2016 AND 2022
    ),
    crop_temp_joined AS (
      SELECT
        cs.crop,
        sat.avg_temp_f
      FROM crop_states cs
      JOIN state_avg_temp sat ON cs.state = sat.state
    )
    SELECT
      crop,
      ROUND(MIN(avg_temp_f)::numeric, 1) AS min_temp_f,
      ROUND(MAX(avg_temp_f)::numeric, 1) AS max_temp_f
    FROM crop_temp_joined
    GROUP BY crop
    ORDER BY crop;`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    });
};

const bestConditionsByCrop = async function(req, res) {
  const query = `
    WITH crop_pollution AS (
      SELECT
        c.crop,
        c.yield_kg_per_acre,
        (p."CO Mean" + p."NO2 Mean" + p."SO2 Mean" + p."O3 Mean") AS pollution_score
      FROM crop_data c
      JOIN pollution_data p
        ON c.year = p."Year" AND UPPER(c.state) = UPPER(p."State")
      WHERE c.year BETWEEN 2016 AND 2022
    ),
    ranked_pollution AS (
      SELECT *,
        NTILE(3) OVER (ORDER BY pollution_score) AS pollution_level
      FROM crop_pollution
    ),
    pollution_label AS (
      SELECT *,
        CASE
          WHEN pollution_level = 1 THEN 'Low'
          WHEN pollution_level = 2 THEN 'Mid'
          ELSE 'High'
        END AS pollution_group
      FROM ranked_pollution
    ),
    crop_pollution_best AS (
      SELECT
        crop,
        pollution_group AS best_pollution,
        ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
      FROM pollution_label
      GROUP BY crop, pollution_group
    ),
    crop_temp AS (
      SELECT
        c.crop,
        c.yield_kg_per_acre,
        t.average_temp
      FROM crop_data c
      JOIN temperature_data t
        ON c.year = t.year AND UPPER(c.state) = UPPER(t.state)
      WHERE c.year BETWEEN 2016 AND 2022
    ),
    ranked_temp AS (
      SELECT *,
        NTILE(3) OVER (ORDER BY average_temp) AS temp_level
      FROM crop_temp
    ),
    temp_label AS (
      SELECT *,
        CASE
          WHEN temp_level = 1 THEN 'Low'
          WHEN temp_level = 2 THEN 'Mid'
          ELSE 'High'
        END AS temp_group
      FROM ranked_temp
    ),
    crop_temp_best AS (
      SELECT
        crop,
        temp_group AS best_temp,
        ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
      FROM temp_label
      GROUP BY crop, temp_group
    ),
    yearly_precip AS (
      SELECT
        EXTRACT(YEAR FROM start_date)::int AS year,
        UPPER(state) AS state,
        AVG(precipitation) AS avg_precip
      FROM weather_events
      WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
      GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
    ),
    crop_precip AS (
      SELECT
        c.crop,
        c.yield_kg_per_acre,
        y.avg_precip
      FROM crop_data c
      JOIN yearly_precip y
        ON c.year = y.year AND UPPER(c.state) = y.state
      WHERE c.year BETWEEN 2016 AND 2022
    ),
    ranked_precip AS (
      SELECT *,
        NTILE(3) OVER (ORDER BY avg_precip) AS precip_level
      FROM crop_precip
    ),
    precip_label AS (
      SELECT *,
        CASE
          WHEN precip_level = 1 THEN 'Low'
          WHEN precip_level = 2 THEN 'Mid'
          ELSE 'High'
        END AS precip_group
      FROM ranked_precip
    ),
    crop_precip_best AS (
      SELECT
        crop,
        precip_group AS best_precip,
        ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
      FROM precip_label
      GROUP BY crop, precip_group
    )

    SELECT
      p.crop,
      p.best_pollution,
      t.best_temp,
      r.best_precip
    FROM crop_pollution_best p
    JOIN crop_temp_best t ON p.crop = t.crop AND t.rank = 1
    JOIN crop_precip_best r ON p.crop = r.crop AND r.rank = 1
    WHERE p.rank = 1
    ORDER BY p.crop;
  `;

  connection.query(query, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
};

const cropTrends = async function(req, res) {
  connection.query(`
    WITH crop_yearly AS (
      SELECT
        year,
        UPPER(state) AS state,
        AVG(yield_kg_per_acre) AS avg_yield
      FROM crop_data
      WHERE year BETWEEN 2016 AND 2021
      GROUP BY year, UPPER(state)
    ),
    pollution_yearly AS (
      SELECT
        "Year" AS year,
        UPPER("State") AS state,
        AVG("CO Mean") AS avg_co,
        AVG("NO2 Mean") AS avg_no2,
        AVG("SO2 Mean") AS avg_so2,
        AVG("O3 Mean") AS avg_o3
      FROM pollution_data
      WHERE "Year" BETWEEN 2016 AND 2021
      GROUP BY "Year", UPPER("State")
    ),
    precip_yearly AS (
      SELECT
        EXTRACT(YEAR FROM start_date)::int AS year,
        UPPER(state) AS state,
        AVG(precipitation) AS avg_precipitation
      FROM weather_events
      WHERE EXTRACT(YEAR FROM start_date)::int BETWEEN 2016 AND 2021
      GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
    ),
    temperature_yearly AS (
      SELECT
        year,
        UPPER(state) AS state,
        AVG(average_temp) AS avg_temp
      FROM temperature_data
      WHERE year BETWEEN 2016 AND 2021
      GROUP BY year, UPPER(state)
    )

    SELECT
      c.year,
      c.state,
      ROUND(c.avg_yield::numeric, 2) AS avg_yield,
      ROUND(p.avg_co::numeric, 4) AS avg_co,
      ROUND(p.avg_no2::numeric, 4) AS avg_no2,
      ROUND(p.avg_so2::numeric, 4) AS avg_so2,
      ROUND(p.avg_o3::numeric, 4) AS avg_o3,
      ROUND(w.avg_precipitation::numeric, 2) AS avg_precipitation,
      ROUND(t.avg_temp::numeric, 2) AS avg_temp
    FROM crop_yearly c
    LEFT JOIN pollution_yearly p ON c.year = p.year AND c.state = p.state
    LEFT JOIN precip_yearly w ON c.year = w.year AND c.state = w.state
    LEFT JOIN temperature_yearly t ON c.year = t.year AND c.state = t.state
    ORDER BY c.state, c.year;`,
    (err, data) => {
      if (err) {
        console.log(err);
        res.json({});
      } else {
        res.json(data.rows);
      }
    }
  );
};

const bestClimateResilientCrops = async function(req, res) {
  connection.query(`
    WITH yearly_precip AS (
      SELECT
        EXTRACT(YEAR FROM start_date)::int AS year,
        UPPER(state) AS state,
        AVG(precipitation) AS avg_precip
      FROM weather_events
      WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
      GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
    ),
    crop_env AS (
      SELECT
        c.crop,
        c.yield_kg_per_acre,
        (p."CO Mean" + p."NO2 Mean" + p."SO2 Mean" + p."O3 Mean") AS pollution,
        t.average_temp,
        y.avg_precip
      FROM crop_data c
      JOIN pollution_data p ON c.year = p."Year" AND UPPER(c.state) = UPPER(p."State")
      JOIN temperature_data t ON c.year = t.year AND UPPER(c.state) = UPPER(t.state)
      JOIN yearly_precip y ON c.year = y.year AND UPPER(c.state) = y.state
      WHERE c.year BETWEEN 2016 AND 2022
    ),
    classified AS (
      SELECT
        crop,
        yield_kg_per_acre,
        CASE
          WHEN pollution < 15 OR pollution > 35 THEN 1 ELSE 0
        END +
        CASE
          WHEN average_temp < 15 OR average_temp > 25 THEN 1 ELSE 0
        END +
        CASE
          WHEN avg_precip < 400 OR avg_precip > 900 THEN 1 ELSE 0
        END AS extreme_score
      FROM crop_env
    ),
    crop_resilience AS (
      SELECT
        crop,
        AVG(yield_kg_per_acre) FILTER (WHERE extreme_score >= 2) AS avg_yield_in_extremes
      FROM classified
      GROUP BY crop
      HAVING COUNT(*) FILTER (WHERE extreme_score >= 2) > 1
    )
    SELECT
      crop,
      ROUND(avg_yield_in_extremes::numeric, 2) AS avg_yield_in_extremes
    FROM crop_resilience
    ORDER BY avg_yield_in_extremes DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
};

const bestCropBySeason = async function (req, res) {
  connection.query(`
    WITH crop_season_yields AS (
      SELECT
        season,
        crop,
        AVG(yield_kg_per_acre) AS avg_yield,
        ROW_NUMBER() OVER (
          PARTITION BY season
          ORDER BY AVG(yield_kg_per_acre) DESC
        ) AS rank
      FROM crop_data
      WHERE season IS NOT NULL
      GROUP BY season, crop
    )
    SELECT
      season,
      crop AS best_crop,
      ROUND(avg_yield::numeric, 2) AS avg_yield_kg_per_acre
    FROM crop_season_yields
    WHERE rank = 1
    ORDER BY season;
  `, (err, data) => {
    if (err) {
      console.error("Query error:", err);
      res.status(500).json({ error: "Query failed" });
    } else {
      res.json(data.rows);
    }
  });
};

const bestSeasonForCrop = async function (req, res) {
  connection.query(`
    WITH crop_season_yields AS (
      SELECT
        crop,
        season,
        AVG(yield_kg_per_acre) AS avg_yield,
        ROW_NUMBER() OVER (
          PARTITION BY crop
          ORDER BY AVG(yield_kg_per_acre) DESC
        ) AS rank
      FROM crop_data
      WHERE season IS NOT NULL
      GROUP BY crop, season
    )
    SELECT
      crop,
      season AS best_season_to_plant,
      ROUND(avg_yield::numeric, 2) AS avg_yield_kg_per_acre
    FROM crop_season_yields
    WHERE rank = 1
    ORDER BY crop;
  `, (err, data) => {
    if (err) {
      console.error("Query error:", err);
      res.status(500).json({ error: "Query failed" });
    } else {
      res.json(data.rows);
    }
  });
};





module.exports = {
  hello,
  mapPage,
  getStateAverages,
  bestRegionForCrop,
  bestPollutionRange,
  bestPrecipitationRange,
  bestTemperatureRange,
  bestConditionsByCrop,
  cropTrends,
  bestClimateResilientCrops,
  bestCropBySeason,
  bestSeasonForCrop
};
