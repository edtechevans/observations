# AISG Growth & Reflection Dashboard

Responsive observation dashboard for AISG classroom observation data.

## Privacy

This repository is public and intentionally contains **no identifiable source observation data**. The built-in demo is reconstructed from aggregate counts only.

To work with the full dataset, open the site and choose **Load private CSV**. The CSV is parsed in the browser and stored only in that browser using IndexedDB. The app does not upload the CSV to GitHub or another server.

## Views

- **Overview** — KPIs, monthly cadence, division and time-of-class distribution, TLF facet profile, and evidence patterns.
- **TLF facets** — commendation/wondering profiles, lens summaries, and Elementary vs Secondary comparison.
- **Coverage & cadence** — observations per faculty, observer activity, time of class, and data-health checks.
- **Observation explorer** — searchable observation-level evidence with a detail drawer.

School years run from **August 1 through July 31**.

## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages. If the first run says Pages is not enabled, open **Settings → Pages → Build and deployment** and select **GitHub Actions**, then rerun the workflow.
