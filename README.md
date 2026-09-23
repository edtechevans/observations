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
- **TLF Patterns** — frequency/breadth profiles, lens summaries, division context, and drill-through into the evidence behind each pattern.
- **MTSS in Practice** — Tier 1 evidence signals for student experience, instructional conditions, common practices, Feedback → Action, the Notice → Identify → Connect → Respond → Monitor inquiry cycle, and comparable-period movement.
- **PLCs** — grade-level and subject-area PLC evidence using the 2026–27 staff Position data, including roster reach, TLF frequency/breadth, 28-day lens trends, commendation/wondering question focus, recurring comment language, and representative excerpts.
- **Reach & Evidence** — roster coverage, faculty reach, cadence, division sampling, and observation timing.
- **Evidence Explorer** — searchable observation-level evidence with meeting filters for evidence type, facet, division and period, plus a latest-one-per-faculty option and bookmarkable URL state.
- **Admin** — observer activity, observer × TLF calibration, observation-focus audit, data-health checks, and dataset context.

School years run from **August 1 through July 31**.

## P1 evidence model

The leadership views now separate **frequency** from **breadth** rather than treating raw facet mentions as the primary signal:

- **Frequency** — the percentage of selected observations in which a facet appears at least once. Duplicate use of the same commendation facet inside one observation does not increase frequency.
- **Breadth** — the percentage of represented faculty whose selected observation evidence contains that facet.
- **Evidence context** — observation count, faculty count, and observer count are surfaced alongside leadership signals instead of being combined into a performance or confidence score.

The **Celebrate · Explore · Act** prompts are deterministic and rule-based. Celebrate requires broad observation frequency, faculty breadth, and observer diversity. Explore prioritises adequately sampled divisional differences or comparable-period movement. Act prioritises evidence maturity such as faculty with only one observation.

Cadence is shown as **weekly evidence pace**, and lesson-position sampling is shown by division so leaders can see whether their evidence over-represents the beginning, middle, or end of lessons. TLF colours are reserved for Being, Connecting, and Doing; division and sampling comparisons use neutral colours.


## P2 calibration and meeting tools

The dashboard includes two additional non-evaluative calibration views in **Admin**:

- **Observer × TLF pattern** — a neutral heatmap showing the percentage of each observer's observations containing each commendation facet. Rows with fewer than 10 observations are marked as limited sample. The matrix ignores the individual Observer filter so observers remain comparable within the selected year, division, observer group, period, time and faculty context.
- **Observation-focus audit** — groups guiding questions after whitespace normalization and reports question prevalence by observation, the number of unique questions, concentration in the most-used question, and questions used only once or twice. Clicking a question opens the matching evidence in the Explorer.

The **Evidence Explorer** now supports meeting-oriented quick filters for evidence type, facet, division and period. Evidence type also controls whether the table foregrounds commendations, wonderings, or both. **One per faculty** retains only the latest matching observation for each faculty member after all other filters are applied. Key dashboard and Explorer filters are mirrored into the page URL so a leadership view can be bookmarked or shared without adding a backend service.


## MTSS in Practice

The MTSS view is designed as a **Tier 1 inquiry tool**, not a Tier 2 / Tier 3 classification system. It uses the current dashboard filters and written classroom-observation evidence to help leaders ask what the evidence suggests about universal core instruction before interpreting difficulty as a need for additional intervention.

The view follows the AISG inquiry structure:

**Notice → Identify → Connect → Respond → Monitor**

It separates two related lenses:

- **Student experience:** Access, Participation, Thinking, Engagement, Learning.
- **Tier 1 conditions:** Accessibility, Responsiveness, Differentiation, Clarity, Cognitive Demand.

Signals are generated through transparent keyword/phrase matching against written commendations or wonderings. An observation may match more than one signal. **Frequency** is the percentage of selected observations containing the signal; **breadth** is the percentage of represented faculty with at least one matching observation. The rule vocabulary is intentionally curated and conservative rather than using an AI API.

The view also surfaces selected Tier 1 practices (for example checks for understanding, modelling, multiple pathways, feedback-to-action, self-monitoring, peer explanation, flexible reteaching, success criteria, goal-setting and responsive adjustment), plus a classroom-level **Feedback → Action** sequence: Given → Understood → Acted upon → Revisited.

Movement uses equal evidence periods and suppresses interpretation when either comparison period contains fewer than 15 observations. Every MTSS signal can be opened in the Evidence Explorer to inspect the source observations behind it.


## PLC / department mapping

The **PLCs** view is grounded in the SY26–27 faculty/staff name list supplied for this project. PLC membership is derived from the Position(English) field rather than inferred from observation comments.

The current grouping is:

- Elementary grade-level PLCs: Pre-Kindergarten, Kindergarten, Grades 1–5.
- Elementary specialist/support PLCs: EAL, Arts, PE, Mandarin, and Student Support.
- Secondary PLCs: Arts & Design, Language Acquisition, Language & Literature, Individuals & Societies, Mathematics, Science, Health & PE, and Student Support.

Cross-appointed positions can belong to more than one PLC, so PLC totals should not be summed across the school. The current observation-exclusion decisions are also respected in the PLC roster: **Santisha Sonilal** and **Silky Vyas** are not included in PLC coverage denominators. The permanent substitute role is not assigned to a PLC because the Position field does not identify one.

The PLC roster is only applied to **2026–27**. The dashboard deliberately does not apply this roster retrospectively to 2025–26.

Open-comment analysis in the PLC view is deterministic: it surfaces repeated words/phrases and representative verbatim excerpts. It does not use an AI API or generate an interpretive narrative summary.


## GitHub Pages

The included workflow deploys the site from `main` using GitHub Pages.
