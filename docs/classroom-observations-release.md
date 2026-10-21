# Classroom Observations and reflection workflow release

Released 22 October 2026. Source goal and observation records are unchanged.

## Navigation

The primary classroom-analysis tab is now **Classroom Observations**, retaining TLF Patterns, MTSS in Practice and Reach & Evidence as its existing subviews.

## Comparable faculty populations

Growth Focus defaults to **Faculty who selected this facet**. Observation records are matched to those teachers by normalized email, then filtered using the main observation period, observer, division and classroom filters. **All faculty in this view** is available as an explicitly different comparison population.

Three mutually exclusive coverage groups describe the teachers who selected the facet: chosen facet recorded; observed without that facet recorded; and no observations in the selected evidence view. They describe the evidence collected, not teacher performance or goal attainment.

## Teacher reflection timeline

Opening a faculty record shows the complete goal, facet and domain followed by dated school-year observations in chronological order. Each observation keeps its original feedback and complete recorded teacher response together. Users can switch between all observations and those linked to the chosen facet. The timeline states that it uses the teacher's school-year observations rather than silently inheriting the dashboard's observer/period filter.

Observed teachers without imported goals can still open their observation timeline. Missing goals, missing responses, empty observation periods and failed source loads have distinct messages; source errors do not become zero counts or stale totals.

## Dates and return navigation

The context bar shows the exact observation date range and separates the latest observation date from the goals-import date. The last-30/60-day settings are labelled as the latest period of **available evidence**, not necessarily a period ending today.

**Copy this view** preserves the facet, comparison population, division, period and detailed analysis state. Browser Back and Forward restore the investigation, including teacher/observation drill-downs, filter-panel state and scroll position. A selectable-link fallback is provided when clipboard permissions are unavailable.

## Verification

The application release passed 26 automated Chromium workflow checks with no uncaught application errors, including identity matching, coverage categories, complete response text, timeline ordering, cohort drill-downs, Back restoration, fresh-page shared links, unavailable sources, keyboard controls and mobile overflow. The test report is attached to GitHub Actions run 39694217583. A further compact-mobile-header regression was added after screenshot review.

`tests/reflection-browser.py`, `tests/mobile-layout.py` and `tests/validate-data.py` remain in the repository. `docs/usability-review.md` contains the representative leader tasks for subsequent human review. Automated browser checks are not a claim of completed human usability testing or full accessibility certification.

All 108 imported faculty goals and the existing observation dataset remain public, as requested. No new access restriction or source-data editing was introduced.
