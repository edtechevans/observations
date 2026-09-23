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

The dashboard now includes a **working faculty-roster coverage view**. It starts with all faculty appearing in the current 2026–27 observation data and adds unmatched teachers from the latest accessible AISG teacher-upload roster. This produces a working roster of **106 faculty**, all currently represented in the observation data.

No additional unmatched faculty are currently included in the 2026–27 working roster. This roster is intentionally labelled as a working source and should be replaced with the authoritative 2026–27 HR/faculty roster when one is available.

## Observer group filter

A dashboard-wide **Observer group** control supports two views:

- **All leaders** — includes all observers.
- **Principals + APs** — excludes the four coordinator observers: Ralph Emmerink, Katriona Hoskins, Flavia Di Luccio and Samantha Rogers.

The control filters every KPI, chart, coverage calculation, pattern view and Observation Explorer result. The individual Observer dropdown is also restricted to the selected observer group.

With the 23 September 2026 data, the Principals + APs view contains **123 observations across 102 faculty**, compared with **203 observations across 106 faculty** for all leaders.

## Views

- **Snapshot** — evidence-strength KPIs, TLF profile, leadership inquiry prompts, and recent TLF movement.
- **TLF & Goals** — commendation/wondering profiles, lens summaries, division context, and a bridge from observational evidence to goal conversations.
- **Reach & Evidence** — roster coverage, faculty reach, cadence, division sampling, and observation timing.
- **Evidence Explorer** — searchable observation-level evidence with complete notes, feedback and faculty responses in the detail drawer.
- **Admin** — observer activity, data-health checks, and dataset context.

School years run from **August 1 through July 31**.

## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages.
