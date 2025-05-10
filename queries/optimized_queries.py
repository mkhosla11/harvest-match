"""
QUERIES
"""

## COMPLEX QUERIES
query1 = """ /* COMPLEX QUERY 1: HISTORICAL AVERAGES BY STATE */
CREATE INDEX idx_pollution_state_upper ON pollution_data (UPPER("State"));
CREATE INDEX idx_temperature_state_upper ON temperature_data (UPPER(state));
CREATE INDEX idx_crop_state_upper ON crop_data (UPPER(state));
CREATE INDEX idx_pollution_year ON pollution_data ("Year");
CREATE INDEX idx_temperature_year ON temperature_data (year);
CREATE INDEX idx_crop_year ON crop_data (year);
CREATE INDEX idx_crop_yield_multi
  ON crop_data (UPPER(state), crop, year, yield_kg_per_acre);

DROP MATERIALIZED VIEW IF EXISTS weather_avg_mv;
CREATE MATERIALIZED VIEW weather_avg_mv AS
SELECT
  UPPER(state) AS state,
  AVG(precipitation) AS avg_precipitation
FROM weather_events
WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
GROUP BY UPPER(state);
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
LEFT JOIN weather_avg_mv w ON p.state = w.state
LEFT JOIN temperature_avg t ON p.state = t.state
LEFT JOIN crop_summary c ON p.state = c.state
WHERE p.state = 'STATE NAME'; """

query2 = """/* COMPLEX QUERY 2: AVG CROP YIELD BASED ON AVG POLLUTION, PRECIPITATION, AND TEMPERATURE (takes 27s) */
CREATE MATERIALIZED VIEW crop_yearly_mv AS
SELECT
  year,
  UPPER(state) AS state,
  ROUND(AVG(yield_kg_per_acre)::numeric, 2) AS avg_yield
FROM crop_data
WHERE year BETWEEN 2016 AND 2021
GROUP BY year, UPPER(state);

CREATE MATERIALIZED VIEW pollution_yearly_mv AS
SELECT
  "Year" AS year,
  UPPER("State") AS state,
  ROUND(AVG("CO Mean")::numeric, 4) AS avg_co,
  ROUND(AVG("NO2 Mean")::numeric, 4) AS avg_no2,
  ROUND(AVG("SO2 Mean")::numeric, 4) AS avg_so2,
  ROUND(AVG("O3 Mean")::numeric, 4) AS avg_o3
FROM pollution_data
WHERE "Year" BETWEEN 2016 AND 2021
GROUP BY "Year", UPPER("State");

CREATE MATERIALIZED VIEW precip_yearly_mv AS
SELECT
  EXTRACT(YEAR FROM start_date)::int AS year,
  UPPER(state) AS state,
  ROUND(AVG(precipitation)::numeric, 2) AS avg_precipitation
FROM weather_events
WHERE start_date >= '2016-01-01' AND start_date < '2022-01-01'
GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state);

CREATE MATERIALIZED VIEW temperature_yearly_mv AS
SELECT
  year,
  UPPER(state) AS state,
  ROUND(AVG(average_temp)::numeric, 2) AS avg_temp
FROM temperature_data
WHERE year BETWEEN 2016 AND 2021
GROUP BY year, UPPER(state);

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
FROM crop_yearly_mv c
LEFT JOIN pollution_yearly_mv p ON c.year = p.year AND c.state = p.state
LEFT JOIN precip_yearly_mv w ON c.year = w.year AND c.state = w.state
LEFT JOIN temperature_yearly_mv t ON c.year = t.year AND c.state = t.state
ORDER BY c.state, c.year;"""

query3 = """ /*COMPLEX QUERY 3: DETERMINES BEST CONDITIONS TO GROW EACH CROP (takes 17s)*/
CREATE MATERIALIZED VIEW pollution_label_mv AS
WITH pollution_avg AS (
  SELECT
    "Year" AS year,
    UPPER("State") AS state,
    AVG("CO Mean") + AVG("NO2 Mean") + AVG("SO2 Mean") + AVG("O3 Mean") AS pollution_score
  FROM pollution_data
  WHERE "Year" BETWEEN 2016 AND 2022
  GROUP BY "Year", UPPER("State")
)
SELECT
  c.crop,
  p.pollution_score,
  c.yield_kg_per_acre,
  CASE NTILE(3) OVER (ORDER BY p.pollution_score)
    WHEN 1 THEN 'Low'
    WHEN 2 THEN 'Mid'
    ELSE 'High'
  END AS pollution_group
FROM crop_data c
JOIN pollution_avg p
  ON c.year = p.year AND UPPER(c.state) = p.state
WHERE c.year BETWEEN 2016 AND 2022;

CREATE MATERIALIZED VIEW temp_label_mv AS
SELECT
  c.crop,
  t.average_temp,
  c.yield_kg_per_acre,
  CASE NTILE(3) OVER (ORDER BY t.average_temp)
    WHEN 1 THEN 'Low'
    WHEN 2 THEN 'Mid'
    ELSE 'High'
  END AS temp_group
FROM crop_data c
JOIN temperature_data t
  ON c.year = t.year AND UPPER(c.state) = UPPER(t.state)
WHERE c.year BETWEEN 2016 AND 2022;

CREATE MATERIALIZED VIEW precip_label_mv AS
WITH yearly_precip AS (
  SELECT
    EXTRACT(YEAR FROM start_date)::int AS year,
    UPPER(state) AS state,
    AVG(precipitation) AS avg_precip
  FROM weather_events
  WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
  GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
)
SELECT
  c.crop,
  y.avg_precip,
  c.yield_kg_per_acre,
  CASE NTILE(3) OVER (ORDER BY y.avg_precip)
    WHEN 1 THEN 'Low'
    WHEN 2 THEN 'Mid'
    ELSE 'High'
  END AS precip_group
FROM crop_data c
JOIN yearly_precip y
  ON c.year = y.year AND UPPER(c.state) = y.state
WHERE c.year BETWEEN 2016 AND 2022;

WITH crop_pollution_best AS (
  SELECT
    crop,
    pollution_group AS best_pollution,
    ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
  FROM pollution_label_mv
  GROUP BY crop, pollution_group
),
crop_temp_best AS (
  SELECT
    crop,
    temp_group AS best_temp,
    ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
  FROM temp_label_mv
  GROUP BY crop, temp_group
),
crop_precip_best AS (
  SELECT
    crop,
    precip_group AS best_precip,
    ROW_NUMBER() OVER (PARTITION BY crop ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
  FROM precip_label_mv
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
ORDER BY p.crop; """

query4 = """ /*COMPLEX QUERY 4: MOST CLIMATE RESILIENT CROPS --> LEAST CLIMATE RESILIENT (takes 35s) */
CREATE MATERIALIZED VIEW pollution_avg_by_year_state_mv AS
SELECT
  "Year" AS year,
  UPPER("State") AS state,
  AVG("CO Mean") + AVG("NO2 Mean") + AVG("SO2 Mean") + AVG("O3 Mean") AS pollution
FROM pollution_data
WHERE "Year" BETWEEN 2016 AND 2022
GROUP BY "Year", UPPER("State");

CREATE MATERIALIZED VIEW temperature_avg_by_year_state_mv AS
SELECT
  year,
  UPPER(state) AS state,
  AVG(average_temp) AS average_temp
FROM temperature_data
WHERE year BETWEEN 2016 AND 2022
GROUP BY year, UPPER(state);

CREATE MATERIALIZED VIEW precip_avg_by_year_state_mv AS
SELECT
  EXTRACT(YEAR FROM start_date)::int AS year,
  UPPER(state) AS state,
  AVG(precipitation) AS avg_precip
FROM weather_events
WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state);

WITH crop_env AS (
  SELECT
    c.crop,
    c.yield_kg_per_acre,
    p.pollution,
    t.average_temp,
    y.avg_precip
  FROM crop_data c
  LEFT JOIN pollution_avg_by_year_state_mv p ON c.year = p.year AND UPPER(c.state) = p.state
  LEFT JOIN temperature_avg_by_year_state_mv t ON c.year = t.year AND UPPER(c.state) = t.state
  LEFT JOIN precip_avg_by_year_state_mv y ON c.year = y.year AND UPPER(c.state) = y.state
  WHERE c.year BETWEEN 2016 AND 2022
),
classified AS (
  SELECT
    crop,
    yield_kg_per_acre,
    CASE
      WHEN pollution > 16 THEN 1 ELSE 0
    END +
    CASE
      WHEN average_temp < 20 OR average_temp > 80 THEN 1 ELSE 0
    END +
    CASE
      WHEN avg_precip <= 0.01 OR avg_precip > 0.16 THEN 1 ELSE 0
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
ORDER BY avg_yield_in_extremes DESC; """


## SIMPLE QUERIES
query5 = """/* SIMPLE QUERY 1: BEST CROPS TO PLANT BASED ON MIN/MAX POLLUTION */
CREATE INDEX idx_crop_state_year ON crop_data (UPPER(state), year, crop);
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
ORDER BY crop; """

query6 = """/* SIMPLE QUERY 2: BEST CROP TO PLANT BY REGION BASED ON YIELD */
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
ORDER BY crop; """

query7 = """/* SIMPLE QUERY 3: BEST CROP TO PLANT BASED ON MIN/MAX PRECIPITATION */
CREATE MATERIALIZED VIEW state_avg_precip_mv AS
SELECT
  UPPER(state) AS state,
  ROUND(AVG(precipitation)::numeric, 2) AS avg_precip
FROM weather_events
WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
GROUP BY UPPER(state);

SELECT
  c.crop,
  ROUND(MIN(p.avg_precip)::numeric, 2) AS min_precip_mm,
  ROUND(MAX(p.avg_precip)::numeric, 2) AS max_precip_mm
FROM (
  SELECT DISTINCT UPPER(state) AS state, crop
  FROM crop_data
  WHERE year BETWEEN 2016 AND 2022
) c
JOIN state_avg_precip_mv p ON c.state = p.state
GROUP BY c.crop
ORDER BY c.crop; """

query8 = """ /* SIMPLE QUERY 4: BEST CROP TO PLANT BASED ON MIN/MAX TEMPERATURE */
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
ORDER BY crop; """

query9 = """ /*SIMPLE QUERY 5: BEST CROP BY SEASON*/
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
ORDER BY season; """

query10 = """ /*SIMPLE QUERY 6: BEST SEASON FOR EACH CROP*/
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
ORDER BY crop; """

