# Observation data refresh - 22 October 2026

Append-only update from `Observation_final(Sheet1) (11).csv`, scoped to 16-22 October 2026 inclusive.

## Added records

| Observation date | New observations |
| --- | ---: |
| 19 October 2026 | 2 |
| 20 October 2026 | 2 |
| 21 October 2026 | 8 |
| Total | 12 |

Three additions are Elementary observations and nine are Secondary observations. The four observations dated 16 October were already present. The supplied export contains no observations dated 22 October.

## Current published observation totals

- 2026-27: **306 observations**, comprising **138 Elementary** and **168 Secondary** observations, representing **109 faculty**.
- All school years: **841 observations**.
- Latest observation: **21 October 2026**.

## Preservation and validation

All 829 previously published records are byte-identical to their prior versions. No existing observation, curated facet mapping, guiding question, narrative or teacher response was overwritten. All 108 faculty goals and goal summaries remain unchanged. Standing observation-population exclusions remain in force, and three unmatched records before the requested date window were not imported.

The public CSV's inline validation totals and cache revision were updated together. Duplicate IDs and PowerApps identifiers, date boundaries, original-data and payload checksums, goal-to-observation matching and source-row counts were verified.

The full dashboard browser regression and mobile layout checks passed in [the import workflow](https://github.com/edtechevans/observations/actions/runs/39696182656) before the new records were committed.

The machine-readable audit is `data/refresh-20261022.json`. Its SHA-256 for the updated observation CSV is `ee892516de8634296a7dc5a8232841729dbbb034be9793d1bea32ce6690fd0f8`.

This note supersedes earlier observation-count snapshots in the README; it does not change any application features, access controls or faculty goals.
