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

The production data file is `data/observations-full.csv`. The dashboard loads that source by default. The compact structural dataset embedded in `index.html` is retained only as a fallback if the complete CSV cannot be fetched.

## Data verification

The published CSV was copied directly from the supplied source file and verified byte-for-byte at the text level after decoding. It contains the same source content used for the dashboard.

Current totals:

- **732** observations overall
- **2025–26:** 538 observations, 108 faculty after name normalization, 487 responses
- **2026–27:** 194 observations, 106 faculty observed, 181 responses
- **2026–27 division:** 89 Elementary observations, 105 Secondary observations
- **2026–27 time of class:** 59 Beginning, 100 Middle, 35 End

Five source-name aliases sharing the same faculty email are normalized to a single display name in dashboard calculations: Cat/Cathryn Mund, Eric/Eric R. Little, Gaby Montejano/Gaby Montejano Gauna, Jackie/Jacqueline Cloete, and Michael/Mike Morrison.

## 2026–27 coverage

The dashboard now includes a **working faculty-roster coverage view**. It starts with all faculty appearing in the current 2026–27 observation data and adds unmatched teachers from the latest accessible AISG teacher-upload roster. This produces a working roster of **112 faculty**, with **106 currently reached** in the observation data.

The six roster names not yet matched to a 2026–27 observation are shown directly in the Coverage & Cadence view. This roster is intentionally labelled as a working source and should be replaced with the authoritative 2026–27 HR/faculty roster when one is available.

## Views

- **Overview** — KPIs, roster reach, monthly cadence, division and time-of-class distribution, TLF facet profile, and evidence patterns.
- **TLF facets** — commendation/wondering profiles, lens summaries, and Elementary vs Secondary comparison.
- **Coverage & cadence** — roster coverage, faculty not yet observed, observations per faculty, observer activity, timing, and data-health checks.
- **Observation explorer** — searchable observation-level evidence with complete notes, feedback and faculty responses in the detail drawer.

School years run from **August 1 through July 31**.

## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages.
