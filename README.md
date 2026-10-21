# AISG Growth & Reflection Dashboard

AISG Teacher Growth & Reflection dashboard combining classroom observation evidence with faculty-selected professional growth priorities.

## Inquiry-led UX refresh — 22 October 2026

The interface groups nine legacy analysis tabs into **five primary routes**, while retaining all existing detailed evidence: **Overview**, **Growth Focus**, **Classroom Evidence** (TLF Patterns, MTSS in Practice, Reach & Evidence), **Faculty & PLCs** (Faculty Overview, PLCs), and **Explore Evidence**. Admin is an independent gear control. Existing bookmarked `?tab=` URLs and legacy route IDs remain valid.

- **Compact, labelled context controls:** School year and division apply to goal cohorts; observer, period, lesson position and faculty controls apply to observation evidence. Elementary/Secondary can be changed directly from the context bar; **Edit filters** expands advanced settings when needed.
- **Question-led Overview:** Three live cards ask what faculty intend to develop, what is being observed, and where these two datasets warrant closer inquiry. The original observation analysis is retained behind an expandable detailed view rather than deleted.
- **Find faculty:** The primary navigation includes a searchable faculty roster. Selecting a matched teacher opens a consistent **Growth Record** side drawer; observed faculty without a matched goal open the Faculty Overview.
- **Faculty interaction:** Clicking a matched name anywhere in dashboard evidence opens the same drawer with full domain, chosen TLF facet, complete goal, observation excerpts and a link to Evidence Explorer. Hover and keyboard focus show abbreviated previews; complete statements remain available on click.
- **Intention ↔ evidence:** Growth Focus / TLF Facets now pairs **year-long facet selections** with separately calculated **filtered observation mentions**. Compare all six facets, including facets selected by no teachers; drill through to the chosen faculty or the underlying tagged observations. Do not interpret these figures as goal-attainment ratings.
- **Scope honesty:** Older year-to-date observation coverage indicators are explicitly labelled unfiltered; the new paired comparison obeys evidence-period and observer filters. Goals do **not** change when only observer or period changes.
- **Usability and accessibility:** Noto Sans fallback stack, improved contrast and body-text sizing, keyboard focus states, touch-friendly buttons, reduced-motion support and compact responsive navigation.

The redesign is provided by `ux-refresh.css` and `ux-refresh.js`, layered onto the existing dashboard without rewriting the analytical functions or changing source observation/goal data.

**Data protection:** This continues to be a **public** GitHub Pages deployment. Faculty goals and individual observation narratives are publicly readable as previously requested. AISG-authenticated, server-enforced authorization would be needed before any private faculty-facing launch.

## Growth Focus — Public faculty-goals release (updated 22 October 2026)

- **Overview:** A concise landing experience linking teachers' growth intentions, classroom evidence and reflection.
- **Growth Focus:** Interactive views for selected **TLF Facets**, **Growth & Reflection Domains/competencies**, and **Goals**.
- **Hover facet/domain/lens/competency:** Reveal the list of observed faculty who chose it; hover an individual in the list to preview their actual statement, or click to open their growth record.
- **Hover faculty names anywhere in dashboard views:** Show their chosen facet, complete domain and unabridged goal statement. Includes Evidence Explorer and Faculty Overview names when the person has a matched current-year goal; supports focus/keyboard and touch.
- **Goal records:** The readable `data/faculty-goals.json` now contains **108 observed faculty (54 Elementary and 54 Secondary)**. Elementary goals were cross-referenced by AISG email address against the 2026–27 classroom observations using the October 22 individual goals workbook. All 54 observed Elementary faculty matched. The original 54 Secondary goals were preserved. Leadership and non-observed records are excluded.
- **Filters:** Whole-school, Elementary and Secondary Growth Focus views calculate goals, facets, domains, competencies, and lens summaries from their matching division. Selecting Elementary now displays 54 eligible faculty goals, not an empty state.
- **Access:** The requested deployment is **public**. There is no password, authentication or faculty-specific access control. The complete identifiable goals and observation narratives are therefore accessible to any visitor to the public site or repository.

**Privacy reminder:** Before using this dashboard for private individual faculty access, move both `data/faculty-goals.json` and `data/observations-full.csv` behind AISG-authenticated, server-enforced authorization. Browser-only filtering is not access control.

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

The published complete CSV includes observations through **16 October 2026**. Its current source contains **829 observations** across the two school years. Data is served as UTF-8. The snapshot statistics below reflect this current file.

Current totals:

- **829** observations overall
- **2025–26:** 535 observations, 106 faculty after name normalization, 484 responses
- **2026–27:** 294 observations, 109 faculty observed
- **2026–27 division:** 135 Elementary observations, 159 Secondary observations
- **2026–27 time of class:** see the live dashboard for the latest sampling distribution

Five source-name aliases sharing the same faculty email are normalized to a single display name in dashboard calculations: Cat/Cathryn Mund, Eric/Eric R. Little, Gaby Montejano/Gaby Montejano Gauna, Jackie/Jacqueline Cloete, and Michael/Mike Morrison.

## 2026–27 coverage

The dashboard now includes a **working faculty-roster coverage view**. It starts with all faculty appearing in the current 2026–27 observation data and adds unmatched teachers from the latest accessible AISG teacher-upload roster. This produces a working faculty roster for evidence and coverage analysis; it should not be treated as the authoritative HR roster.

The working roster should be replaced with the authoritative 2026–27 HR/faculty roster when one is available.

## Observer group filter

A dashboard-wide **Observer group** control supports two views:

- **All leaders** — includes all observers.
- **Principals + APs** — excludes the four coordinator observers: Ralph Emmerink, Katriona Hoskins, Flavia Di Luccio and Samantha Rogers.

The control filters every KPI, chart, coverage calculation, pattern view and Observation Explorer result. The individual Observer dropdown is also restricted to the selected observer group.

Counts in each observer-group view are calculated from the current observation file; use the live dashboard for current totals.

## Views

- **Overview** — growth intentions and evidence-strength KPIs, TLF profile, leadership inquiry prompts, and recent TLF movement.
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
