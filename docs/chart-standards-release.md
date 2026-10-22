# Chart standards release - 22 October 2026

This release changes chart calculations, presentation and interaction. It does not change any of the 841 observation records, 108 faculty goals, facet classifications, teacher responses or published access permissions.

## Percentage and count rules

- Growth Focus bars use the number selecting a facet/domain divided by the faculty with an imported goal in that division. The visual scale is 0-100%, with exact fractions beside rounded percentages.
- Elementary/Secondary comparison panels use the same category order and scale. Both divisions are explicitly identified; their goal denominators are the imported eligible faculty, not the full HR roster.
- The teacher-coverage stack has three mutually exclusive categories. Its denominator is the teachers who selected the facet, not the number of classroom visits. Commendation and wondering visit counts can overlap and must not be added.
- TLF profiles offer observation-record and observed-faculty denominators. Count/percentage changes both the displayed values and the numerical scale. Tables retain both fractions and shares.
- PLC full-roster reach is explicitly distinguished from the share of observed faculty. Cross-appointed members must not be summed across PLC rows.
- Whole percentages are rounded; rounded category percentages may total 99% or 101%. The exact fractions remain available.

## Time-series rules

- Lens trend panels share a 0-100% scale. Each window has exact dates and an observation count. Empty windows are gaps, not interpolated zeros.
- Weekly charts retain every Monday-based calendar week between the selected bounds, including weeks without recorded observations.
- Partial first/latest weeks are marked. No school-calendar information is inferred: a zero-record week is not a finding that school was open without visits.
- Previous-year comparisons join school-year week keys and the same weekdays. Week 1 is the Monday-based week containing 1 August. Different holiday calendars remain a limitation.
- Dates outside the previous year's available source range are labelled unavailable, not zero.

## Interpretation and accessibility

- PLC and observer heatmaps use one light-to-dark numerical scale, complete facet names, visible fractions and unshaded limited-evidence rows. Text colour is chosen from calculated contrast, rather than an arbitrary percentage threshold.
- Small-sample display thresholds are presentation cautions, not statistical confidence tests or evidence of observer agreement.
- MTSS charts describe keyword indicators in observation text, not the proportion of students experiencing an outcome. Feedback indicators are independent matches in the full narrative, not a tracked funnel.
- Movement tables show dates, sample sizes and descriptive percentage-point differences, not unsupported claims of improvement.
- Lesson-position sampling retains counts, shares and unrecorded positions. Equal thirds are not a target.
- Revised charts provide plain HTML data tables or are themselves labelled tables. Values do not depend on colour or hover. Scrollable tables support keyboard focus and mobile layouts retain the page width.
- Screenshot review led to additional first/last trend-label anchoring and clearer lens-card typography.

## Verification

The final application candidate passed the chart calculation suite, original-data validation, 33 chart/browser checks, 26 existing reflection/navigation checks and the compact mobile-layout regression with no uncaught application errors in those tested workflows.

Verified release run: https://github.com/edtechevans/observations/actions/runs/39718612489

The tests remain in `tests/chart-math.cjs`, `tests/charts-browser.py`, `tests/reflection-browser.py`, `tests/mobile-layout.py` and `tests/validate-data.py`. The chart workflow now has read-only permissions and runs for future chart-source changes or manual dispatch. Temporary release-transport files and deployment scripts were removed.

Automated checks and screenshot inspection are not a claim of completed human usability testing or full accessibility certification. Source records and public access remain unchanged.
