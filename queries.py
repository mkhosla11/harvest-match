"""
QUERIES
"""

## COMPLEX QUERIES
query1 = """ /* COMPLEX QUERY 1: HISTORICAL AVERAGES BY STATE AND SEASON */
WITH pollution_avg AS (
  SELECT UPPER("State") AS state, INITCAP("Season") AS season,
         AVG("CO Mean") AS avg_co,
         AVG("NO2 Mean") AS avg_no2,
         AVG("SO2 Mean") AS avg_so2,
         AVG("O3 Mean") AS avg_o3
  FROM pollution_data
  GROUP BY UPPER("State"), INITCAP("Season")
),
weather_avg AS (
  SELECT UPPER(state) AS state, INITCAP(season) AS season,
         AVG(precipitation) AS avg_precipitation
  FROM weather_events
  GROUP BY UPPER(state), INITCAP(season)
),
temperature_avg AS (
  SELECT UPPER(state) AS state, INITCAP(season) AS season,
         AVG(average_temp) AS avg_temp
  FROM temperature_data
  GROUP BY UPPER(state), INITCAP(season)
),
crop_yield_ranked AS (
  SELECT UPPER(state) AS state, INITCAP(season) AS season,
         crop,
         AVG(yield_kg_per_acre) AS avg_yield,
         ROW_NUMBER() OVER (
           PARTITION BY UPPER(state), INITCAP(season)
           ORDER BY AVG(yield_kg_per_acre) DESC
         ) AS rank
  FROM crop_data
  GROUP BY UPPER(state), INITCAP(season), crop
),
crop_summary AS (
  SELECT state, season, crop AS dominant_crop
  FROM crop_yield_ranked
  WHERE rank = 1
)

SELECT
  p.state,
  p.season,
  ROUND(p.avg_co::numeric, 4) AS avg_co,
  ROUND(p.avg_no2::numeric, 4) AS avg_no2,
  ROUND(p.avg_so2::numeric, 4) AS avg_so2,
  ROUND(p.avg_o3::numeric, 4) AS avg_o3,
  ROUND(w.avg_precipitation::numeric, 4) AS avg_precipitation,
  ROUND(t.avg_temp::numeric, 2) AS avg_temp,
  c.dominant_crop

FROM pollution_avg p
LEFT JOIN weather_avg w ON p.state = w.state AND p.season = w.season
LEFT JOIN temperature_avg t ON p.state = t.state AND p.season = t.season
LEFT JOIN crop_summary c ON p.state = c.state AND p.season = c.season
ORDER BY p.state, p.season; """

query1a = """ /* SAME AS COMPLEX QUERY 1 BUT DOES NOT GROUP BY SEASONS */
  WITH pollution_avg AS (
  SELECT
    "Year" AS year,
    UPPER("State") AS state,
    AVG("CO Mean") AS avg_co,
    AVG("NO2 Mean") AS avg_no2,
    AVG("SO2 Mean") AS avg_so2,
    AVG("O3 Mean") AS avg_o3
  FROM pollution_data
  WHERE "Year" BETWEEN 2016 AND 2022
  GROUP BY "Year", UPPER("State")
),
weather_avg AS (
  SELECT
    EXTRACT(YEAR FROM start_date)::int AS year,
    UPPER(state) AS state,
    AVG(precipitation) AS avg_precipitation
  FROM weather_events
  WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
  GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
),
temperature_avg AS (
  SELECT
    year,
    UPPER(state) AS state,
    AVG(average_temp) AS avg_temp
  FROM temperature_data
  WHERE year BETWEEN 2016 AND 2022
  GROUP BY year, UPPER(state)
),
crop_yield_ranked AS (
  SELECT
    year,
    UPPER(state) AS state,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    ROW_NUMBER() OVER (
      PARTITION BY year, UPPER(state)
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM crop_data
  WHERE year BETWEEN 2016 AND 2022
  GROUP BY year, UPPER(state), crop
),
crop_summary AS (
  SELECT
    year,
    state,
    crop AS dominant_crop
  FROM crop_yield_ranked
  WHERE rank = 1
)

SELECT
  p.year,
  p.state,
  ROUND(p.avg_co::numeric, 4) AS avg_co,
  ROUND(p.avg_no2::numeric, 4) AS avg_no2,
  ROUND(p.avg_so2::numeric, 4) AS avg_so2,
  ROUND(p.avg_o3::numeric, 4) AS avg_o3,
  ROUND(w.avg_precipitation::numeric, 2) AS avg_precipitation,
  ROUND(t.avg_temp::numeric, 2) AS avg_temp,
  c.dominant_crop

FROM pollution_avg p
LEFT JOIN weather_avg w ON p.year = w.year AND p.state = w.state
LEFT JOIN temperature_avg t ON p.year = t.year AND p.state = t.state
LEFT JOIN crop_summary c ON p.year = c.year AND p.state = c.state
ORDER BY p.state, p.year; """

query2 = """/* COMPLEX QUERY 2: AVG CROP YIELD BASED ON AVG POLLUTION, PRECIPITATION, AND TEMPERATURE (takes 27s) */
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
ORDER BY c.state, c.year;"""

query3 = """ /*COMPLEX QUERY 3: DETERMINES BEST CONDITIONS TO GROW EACH CROP (takes 17s)*/
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
-- Temperature
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
-- Precipitation
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

-- Final Output
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
ORDER BY avg_yield_in_extremes DESC; """


## SIMPLE QUERIES
query5 = """/* SIMPLE QUERY 1: BEST CROP TO PLANT BY STATE BASED ON YIELD */
WITH crop_yield_ranked AS (
  SELECT
    UPPER(state) AS state,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(state)
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM crop_data
  GROUP BY UPPER(state), crop
)

SELECT
  state,
  crop AS best_crop_to_plant,
  ROUND(avg_yield::numeric, 2) AS avg_yield_kg_per_acre
FROM crop_yield_ranked
WHERE rank = 1
ORDER BY state; """

query6 = """/* SIMPLE QUERY 2: BEST CROPS TO PLANT BASED ON POLLUTION */
WITH crop_pollution AS (
  SELECT
    c.crop,
    c.yield_kg_per_acre,
    (p."CO Mean" + p."NO2 Mean" + p."SO2 Mean" + p."O3 Mean") AS pollution_score
  FROM crop_data c
  JOIN pollution_data p ON c.year = p."Year" AND UPPER(c.state) = UPPER(p."State")
  WHERE c.year BETWEEN 2016 AND 2021
),
ranked_pollution AS (
  SELECT *,
    NTILE(3) OVER (ORDER BY pollution_score) AS pollution_level
  FROM crop_pollution
),
pollution_category AS (
  SELECT *,
    CASE
      WHEN pollution_level = 1 THEN 'Low'
      WHEN pollution_level = 2 THEN 'Mid'
      ELSE 'High'
    END AS pollution_group
  FROM ranked_pollution
),
avg_yield_by_pollution AS (
  SELECT
    pollution_group,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    ROW_NUMBER() OVER (PARTITION BY pollution_group ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
  FROM pollution_category
  GROUP BY pollution_group, crop
)

SELECT pollution_group, crop, ROUND(avg_yield::numeric, 2) AS avg_yield
FROM avg_yield_by_pollution
WHERE rank = 1
ORDER BY pollution_group; """

query7 = """/* SIMPLE QUERY 3: BEST CROP TO PLANT BASED ON TEMPERATURE */
WITH crop_temp AS (
  SELECT
    c.crop,
    c.yield_kg_per_acre,
    t.average_temp
  FROM crop_data c
  JOIN temperature_data t ON c.year = t.year AND UPPER(c.state) = UPPER(t.state)
  WHERE c.year BETWEEN 2016 AND 2021
),
ranked_temp AS (
  SELECT *,
    NTILE(3) OVER (ORDER BY average_temp) AS temp_level
  FROM crop_temp
),
temp_category AS (
  SELECT *,
    CASE
      WHEN temp_level = 1 THEN 'Low'
      WHEN temp_level = 2 THEN 'Mid'
      ELSE 'High'
    END AS temp_group
  FROM ranked_temp
),
avg_yield_by_temp AS (
  SELECT
    temp_group,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    ROW_NUMBER() OVER (PARTITION BY temp_group ORDER BY AVG(yield_kg_per_acre) DESC) AS rank
  FROM temp_category
  GROUP BY temp_group, crop
)

SELECT temp_group, crop, ROUND(avg_yield::numeric, 2) AS avg_yield
FROM avg_yield_by_temp
WHERE rank = 1
ORDER BY temp_group; """

query8 = """ /* SIMPLE QUERY 4: BEST CROP TO PLANT BASED ON PRECIPITATION */
WITH yearly_precip AS (
  SELECT
    EXTRACT(YEAR FROM start_date)::int AS year,
    UPPER(state) AS state,
    AVG(precipitation) AS avg_precip
  FROM weather_events
  WHERE start_date BETWEEN '2016-01-01' AND '2021-12-31'
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
  WHERE c.year BETWEEN 2016 AND 2021
),
ranked_precip AS (
  SELECT *,
    NTILE(3) OVER (ORDER BY avg_precip) AS precip_level
  FROM crop_precip
),
precip_category AS (
  SELECT *,
    CASE
      WHEN precip_level = 1 THEN 'Low'
      WHEN precip_level = 2 THEN 'Mid'
      ELSE 'High'
    END AS precip_group
  FROM ranked_precip
),
avg_yield_by_precip AS (
  SELECT
    precip_group,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    ROW_NUMBER() OVER (
      PARTITION BY precip_group
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM precip_category
  GROUP BY precip_group, crop
)

SELECT precip_group, crop, ROUND(avg_yield::numeric, 2) AS avg_yield
FROM avg_yield_by_precip
WHERE rank = 1
ORDER BY precip_group; """

query9 = """/* SIMPLE QUERY 5: BEST CROP TO PLANT BY STATE BASED ON POLLUTION */
WITH crop_pollution_joined AS (
  SELECT
    c.year,
    UPPER(c.state) AS state,
    c.crop,
    c.yield_kg_per_acre,
    p."CO Mean" AS co,
    p."NO2 Mean" AS no2,
    p."SO2 Mean" AS so2,
    p."O3 Mean" AS o3
  FROM crop_data c
  JOIN pollution_data p
    ON c.year = p."Year" AND UPPER(c.state) = UPPER(p."State")
  WHERE c.year BETWEEN 2016 AND 2022
),
crop_pollution_avg AS (
  SELECT
    state,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    AVG(co) AS avg_co,
    AVG(no2) AS avg_no2,
    AVG(so2) AS avg_so2,
    AVG(o3) AS avg_o3,
    ROW_NUMBER() OVER (
      PARTITION BY state
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM crop_pollution_joined
  GROUP BY state, crop
)

SELECT
  state,
  crop AS best_crop_by_pollution,
  ROUND(avg_yield::numeric, 2) AS avg_yield_kg_per_acre,
  ROUND(avg_co::numeric, 4) AS avg_co,
  ROUND(avg_no2::numeric, 4) AS avg_no2,
  ROUND(avg_so2::numeric, 4) AS avg_so2,
  ROUND(avg_o3::numeric, 4) AS avg_o3
FROM crop_pollution_avg
WHERE rank = 1
ORDER BY state; """

query10 = """ /* SIMPLE QUERY 6: BEST CROP TO PLANT BY STATE BASED ON TEMPERATURE */
WITH crop_temperature_joined AS (
  SELECT
    c.year,
    UPPER(c.state) AS state,
    c.crop,
    c.yield_kg_per_acre,
    t.average_temp AS temp
  FROM crop_data c
  JOIN temperature_data t
    ON c.year = t.year AND UPPER(c.state) = UPPER(t.state)
  WHERE c.year BETWEEN 2016 AND 2022
),
crop_temperature_avg AS (
  SELECT
    state,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    AVG(temp) AS avg_temp,
    ROW_NUMBER() OVER (
      PARTITION BY state
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM crop_temperature_joined
  GROUP BY state, crop
)

SELECT state, crop, ROUND(avg_yield::numeric, 2) AS avg_yield, ROUND(avg_temp::numeric, 2) AS avg_temp
FROM crop_temperature_avg
WHERE rank = 1
ORDER BY state; """

query11 = """ /* SIMPLE QUERY 7: BEST CROP TO PLANT BY STATE BASED ON PRECIPITATION */
WITH yearly_precip AS (
  SELECT
    EXTRACT(YEAR FROM start_date)::int AS year,
    UPPER(state) AS state,
    AVG(precipitation) AS avg_precip
  FROM weather_events
  WHERE start_date BETWEEN '2016-01-01' AND '2022-12-31'
  GROUP BY EXTRACT(YEAR FROM start_date), UPPER(state)
),
crop_precip_joined AS (
  SELECT
    c.year,
    UPPER(c.state) AS state,
    c.crop,
    c.yield_kg_per_acre,
    y.avg_precip AS precip
  FROM crop_data c
  JOIN yearly_precip y
    ON c.year = y.year AND UPPER(c.state) = y.state
  WHERE c.year BETWEEN 2016 AND 2022
),
crop_precip_avg AS (
  SELECT
    state,
    crop,
    AVG(yield_kg_per_acre) AS avg_yield,
    AVG(precip) AS avg_precip,
    ROW_NUMBER() OVER (
      PARTITION BY state
      ORDER BY AVG(yield_kg_per_acre) DESC
    ) AS rank
  FROM crop_precip_joined
  GROUP BY state, crop
)

SELECT state, crop, ROUND(avg_yield::numeric, 2) AS avg_yield, ROUND(avg_precip::numeric, 2) AS avg_precip
FROM crop_precip_avg
WHERE rank = 1
ORDER BY state; """

query12 = """ /*SIMPLE QUERY 8: BEST CROP BY SEASON*/
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

query13 = """ /*SIMPLE QUERY 9: BEST SEASON FOR EACH CROP*/
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

