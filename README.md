# AISG Growth & Reflection Dashboard

Responsive observation dashboard for AISG classroom observation data.

## Public dashboard data

The repository is public. The dashboard now includes the **verified structural observation data** needed for accurate filtering and analysis, including:

- faculty name
- observer name
- observation date
- division
- time of class
- commendation facet selections
- wondering facet selection
- whether a faculty response was recorded

The public repository intentionally excludes email addresses, observation notes, written commendations, written wonderings, and faculty response text.

For full narrative analysis, use **Load private CSV**. The CSV is parsed in the browser and stored only in that browser using IndexedDB. The app does not upload the CSV to GitHub or another server.

## Data verification

The public structural dataset was generated directly from the supplied source CSV and checked against it row-for-row.

Current source totals:

- **732** observations overall
- **2025–26:** 538 observations, 112 faculty, 487 responses
- **2026–27:** 194 observations, 106 faculty, 181 responses
- **2026–27 division:** 89 Elementary, 105 Secondary
- **2026–27 time of class:** 59 Beginning, 100 Middle, 35 End

The packed public dataset and the source CSV match on row sequence and all encoded structural fields.

## Views

- **Overview** — KPIs, monthly cadence, division and time-of-class distribution, TLF facet profile, and evidence patterns.
- **TLF facets** — commendation/wondering profiles, lens summaries, and Elementary vs Secondary comparison.
- **Coverage & cadence** — observations per faculty, observer activity, time of class, and data-health checks.
- **Observation explorer** — searchable observation-level structural evidence with a detail drawer.

School years run from **August 1 through July 31**.

## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages.
