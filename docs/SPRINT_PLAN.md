# Bowl Delivery Plan: Milestones and Sprints

This sprint plan breaks `DEVELOPMENT_PLAN.md` into smaller, execution-ready steps.

---

## Planning assumptions

- Part-time cadence (variable weekly availability).
- Mobile-first web app (PWA path), pass-and-play first.
- Priority is polished UX/performance and game-night reliability.

---

## Release map (high-level)

- **Milestone 0**: Foundation and architecture.
- **Milestone 1**: Playable local pass-and-play MVP.
- **Milestone 2**: Reliability and polish.
- **Milestone 3**: Shareable public release.

Each milestone is split into smaller sprints with explicit outcomes.

---

## Milestone 0 — Foundation

### Sprint 0.1 — Product + Rules Modeling

**Goal:** Convert game rules into deterministic system behavior.

**Status:** ✅ Completed in `docs/SPRINT_0_1_RULES_MODEL.md`.

**Tasks**

- Translate `GAME_RULES.md` into explicit domain entities:
  - Team, Player, Word, Bowl, Section, Round, Turn, Score.
- Define valid game states and transitions.
- Define edge-case decisions (skip behavior, tie-break handling, accidental exits).
- Write a state-transition diagram in docs.

**Deliverables**

- Rules interpretation spec (single markdown doc).
- State machine diagram.
- Glossary for shared terms.

**Definition of done**

- Any teammate can explain full game flow from docs only.
- No rule ambiguity remains for implementation-critical flows.

---

### Sprint 0.2 — Game Engine Skeleton

**Goal:** Implement testable game logic independent of UI.

**Status:** ✅ Completed. Engine invariants, selectors, and baseline transition flow are implemented in `lib/game-engine/`.

**Tasks**

- Create `game-engine` module (pure TS):
  - `GameState` types.
  - `GameEvent`/`Action` union.
  - reducer/transition function.
- Add selectors (current team/player, section progress, scores).
- Add invariant checks to reject impossible transitions.

**Deliverables**

- Engine folder structure and baseline API.
- Minimal fixtures for sample games.

**Definition of done**

- Game can be advanced from setup → section end through code-only events.
- Engine has no React/UI dependencies.

---

### Sprint 0.3 — Test Harness + UI Skeleton

**Goal:** Ensure confidence early and create navigation scaffold.

**Status:** ✅ Completed. Added executable engine tests and clickable mobile-first route placeholders for the full flow.

**Tasks**

- Add unit tests for core transitions.
- Add invariant/property-style tests.
- Build app route skeleton screens:
  - Home
  - Game setup
  - Word entry
  - Round screen
  - Round summary
  - Game summary

**Deliverables**

- Test suite for rules engine foundations.
- Clickable mobile-first route skeleton.

**Definition of done**

- Core engine tests pass.
- User can click through full app flow placeholders.

---

## Milestone 1 — Local Playable MVP

### Sprint 1.1 — Setup and Team Management

**Goal:** Create game session with teams and players quickly.

**Tasks**

- Build setup form with validation:
  - Team names.
  - Players per team.
  - Basic constraints from rules.
- Add session creation action in engine/UI bridge.
- Add UX helpers:
  - Add/remove player.
  - Auto-balance helper suggestion.

**Deliverables**

- Functional setup flow into word entry.

**Definition of done**

- New session can be created in < 2 minutes on phone.

---

### Sprint 1.2 — Word Entry and Validation UX

**Goal:** Make input of 3–5 words per player smooth and error-resistant.

**Tasks**

- Build per-player word entry steps.
- Validate count rules and one-word restrictions.
- Add quality-of-life features:
  - Bulk paste with parsing (optional stretch).
  - Duplicate warning.
  - Clear progress indicator.

**Deliverables**

- Reliable word collection flow producing bowl payload.

**Definition of done**

- All players can submit valid words with clear progress and no confusion.

---

### Sprint 1.3 — Core Round Loop (Section 1)

**Goal:** Deliver one complete playable section end-to-end.

**Tasks**

- Round screen with:
  - 60s timer.
  - Current clueing player/team.
  - Word display.
  - Actions: guessed / skip / foul / end.
- Implement turn switching and bowl progression.
- Round end summary with scored words.

**Deliverables**

- Fully playable Section 1.

**Definition of done**

- Teams can complete Section 1 with accurate scoring.

---

### Sprint 1.4 — Sections 2 & 3 + Full Match

**Goal:** Complete full game loop for all sections.

**Tasks**

- Add section rule banners/reminders.
- Reuse bowl words across sections according to rules.
- Complete section transitions and game-end winner logic.
- Add tie-break flow.

**Deliverables**

- Full match playable from setup to winner.

**Definition of done**

- Entire game can be completed without manual intervention or rule breaks.

---

### Sprint 1.5 — Local Persistence + Recovery

**Goal:** Prevent game loss during real sessions.

**Tasks**

- Persist active session locally.
- Restore state on refresh/reopen.
- Add recover/reset controls.
- Add safe guards for accidental navigation.

**Deliverables**

- Session restore and reset experience.

**Definition of done**

- Refreshing mid-game does not lose match progress.

---

## Milestone 2 — Reliability & Polish

### Sprint 2.1 — Edge Cases and Stability Hardening

**Goal:** Eliminate game-night breaking issues.

**Tasks**

- Cover edge cases:
  - Min/max players.
  - Empty/invalid words.
  - Last-word timing boundary.
  - Tie scenarios.
- Improve reducer error handling and telemetry hooks.
- Add stronger input normalization.

**Deliverables**

- Hardened logic and validation paths.

**Definition of done**

- No blocker defects in repeated full-match simulation.

---

### Sprint 2.2 — UX Polish Pass

**Goal:** Raise perceived quality to “professional.”

**Tasks**

- Improve typography, spacing, and hierarchy for small screens.
- Add subtle transitions/animations.
- Improve tap target sizes and interaction feedback.
- Refine error, confirmation, and undo patterns.

**Deliverables**

- Polished mobile gameplay UX.

**Definition of done**

- User test feedback reports UI as clear, pleasant, and low-friction.

---

### Sprint 2.3 — Performance and Device QA

**Goal:** Keep experience smooth on real phones.

**Tasks**

- Optimize render hotspots and avoid unnecessary re-renders.
- Validate timer accuracy across tab/background interruptions.
- Run manual QA matrix:
  - iOS Safari
  - Android Chrome
  - small viewport stress tests

**Deliverables**

- Device QA checklist with pass/fail notes.

**Definition of done**

- Smooth interaction and reliable timing on target devices.

---

## Milestone 3 — Shareable Release

### Sprint 3.1 — PWA and Branding

**Goal:** Make app installable and launch-ready.

**Tasks**

- Add/verify manifest, icons, metadata.
- Add install prompts/education UX.
- Polish landing page and game intro.

**Deliverables**

- Installable PWA with coherent branding.

**Definition of done**

- Users can install and launch from home screen.

---

### Sprint 3.2 — Docs, Help, and Rules Surface

**Goal:** Make app self-explanatory for new players.

**Tasks**

- Add in-app quick rules and section reminders.
- Add help/troubleshooting page.
- Add release notes/changelog entry.

**Deliverables**

- User-facing docs screens in app.

**Definition of done**

- New users can run a game without external explanation.

---

### Sprint 3.3 — Launch + Feedback Loop

**Goal:** Publish and improve with real usage.

**Tasks**

- Deploy stable release.
- Create lightweight feedback channel (form or issue template).
- Run 2–3 friend/family playtest sessions and collect insights.
- Prioritize post-launch fixes/enhancements.

**Deliverables**

- Public release and first feedback-based iteration backlog.

**Definition of done**

- Live shareable version with actionable user feedback captured.

---

## Cross-sprint backlog template (use for every ticket)

For each issue/task, capture:

1. **User value** (why this matters in game-night context)
2. **Acceptance criteria** (clear pass/fail)
3. **Edge cases** (what can go wrong)
4. **Telemetry/observation** (how you’ll validate impact)
5. **Estimate** (S/M/L + confidence)

---

## Suggested cadence (low-energy friendly)

- Work in **1-week micro-sprints**.
- Keep active WIP to **max 2 tasks**.
- Always pair one “logic” task with one “UX” task to maintain momentum.
- End each week with one playable increment, even if small.

---

## First 2-week starter package

### Week 1

- Sprint 0.1 + start 0.2
- Output: state model + initial reducer + first tests

### Week 2

- Finish 0.2 + 0.3
- Output: tested engine skeleton + clickable app flow

If completed, you are ready to start Sprint 1.1 immediately.
