# AISG Growth & Reflection Dashboard

Responsive observation dashboard for AISG classroom observation data.

## Published dashboard data

The GitHub repository and GitHub Pages site now publish the **complete source observation CSV** used by the dashboard. This includes:

- faculty and observer names
- faculty email addresses
- observation dates, divisions and time of class
- observation notes
- commendation facets, guiding questions and written commendation feedback
- wondering facet, guiding question and written wondering feedback
- faculty response text
- source observation IDs / PowerApps IDs where present

The production data file is `data/observations-full.csv`. The dashboard loads that complete source by default. If the full CSV cannot be fetched, the dashboard now shows a data-loading error rather than substituting a reduced or redacted dataset.

## Data verification

The published CSV is the 23 September 2026 source supplied for this dashboard and validates to 741 observation rows. Windows-1252 punctuation was normalized to UTF-8 for browser display, and three quote-sensitive historical records were checked against the prior canonical rows and repaired without changing their field values. Dashboard totals reconcile to the source totals below.

Current totals:

- **741** observations overall
- **2025–26:** 538 observations, 108 faculty after name normalization, 487 responses
- **2026–27:** 203 observations, 106 faculty observed, 188 responses
- **2026–27 division:** 92 Elementary observations, 111 Secondary observations
- **2026–27 time of class:** 61 Beginning, 107 Middle, 35 End

Five source-name aliases sharing the same faculty email are normalized to a single display name in dashboard calculations: Cat/Cathryn Mund, Eric/Eric R. Little, Gaby Montejano/Gaby Montejano Gauna, Jackie/Jacqueline Cloete, and Michael/Mike Morrison.

## 2026–27 coverage

The dashboard now includes a **working faculty-roster coverage view**. It starts with all faculty appearing in the current 2026–27 observation data and adds unmatched teachers from the latest accessible AISG teacher-upload roster. This produces a working roster of **112 faculty**, with **106 currently reached** in the observation data.

The six roster names not yet matched to a 2026–27 observation are shown directly in the Coverage & Cadence view. This roster is intentionally labelled as a working source and should be replaced with the authoritative 2026–27 HR/faculty roster when one is available.

## Observer group filter

A dashboard-wide **Observer group** control supports two views:

- **All leaders** — includes all observers.
- **Principals + APs** — excludes the four coordinator observers: Ralph Emmerink, Katriona Hoskins, Flavia Di Luccio and Samantha Rogers.

The control filters every KPI, chart, coverage calculation, pattern view and Observation Explorer result. The individual Observer dropdown is also restricted to the selected observer group.

With the 23 September 2026 data, the Principals + APs view contains **123 observations across 102 faculty**, compared with **203 observations across 106 faculty** for all leaders.

## Views

- **Overview** — KPIs, roster reach, monthly cadence, division and time-of-class distribution, TLF facet profile, and evidence patterns.
- **TLF facets** — commendation/wondering profiles, lens summaries, and Elementary vs Secondary comparison.
- **Coverage & cadence** — roster coverage, faculty not yet observed, observations per faculty, observer activity, timing, and data-health checks.
- **Observation explorer** — searchable observation-level evidence with complete notes, feedback and faculty responses in the detail drawer.

School years run from **August 1 through July 31**.

## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages.
