# Bowl Delivery Plan: Milestones and Sprints

This sprint plan breaks `DEVELOPMENT_PLAN.md` into smaller, execution-ready steps.

---

## Planning assumptions

- Part-time cadence with variable weekly availability.
- Mobile-first web app (PWA path), pass-and-play first.
- Priority is polished UX, performance, and game-night reliability.

---

## Release map (high-level)

- Milestone 0: Foundation and architecture.
- Milestone 1: Playable local pass-and-play MVP.
- Milestone 2: Reliability and polish.
- Milestone 3: Shareable public release.

Each milestone is split into smaller sprints with explicit outcomes.

---

## Milestone 0 - Foundation

### Sprint 0.1 - Product + Rules Modeling

Goal: convert game rules into deterministic system behavior.

Status: completed in `docs/SPRINT_0_1_RULES_MODEL.md`.

Tasks

- Translate `GAME_RULES.md` into explicit domain entities:
  - Team
  - Player
  - Word
  - Bowl
  - Section
  - Round
  - Score
- Define valid game states and transitions.
- Define edge-case decisions (skip behavior, tie-break handling, accidental exits).
- Write a state-transition diagram in docs.

Deliverables

- Rules interpretation spec.
- State machine diagram.
- Glossary for shared terms.

Definition of done

- Any teammate can explain the full game flow from docs only.
- No rule ambiguity remains for implementation-critical flows.

---

### Sprint 0.2 - Game Engine Skeleton

Goal: implement testable game logic independent of UI.

Status: completed. Engine invariants, selectors, and baseline transition flow are implemented in `lib/game-engine/`.

Tasks

- Create `game-engine` module (pure TS):
  - `GameState` types
  - `GameEvent`/`Action` union
  - reducer/transition function
- Add selectors for current team, section progress, and scores.
- Add invariant checks to reject impossible transitions.

Deliverables

- Engine folder structure and baseline API.
- Minimal fixtures for sample games.

Definition of done

- Game can be advanced from setup to section end through code-only events.
- Engine has no React/UI dependencies.

---

### Sprint 0.3 - Test Harness + UI Skeleton

Goal: ensure confidence early and create navigation scaffold.

Status: completed. Added executable engine tests and clickable mobile-first route placeholders for the full flow.

Tasks

- Add unit tests for core transitions.
- Add invariant and property-style tests.
- Build app route skeleton screens:
  - Home
  - Game setup
  - Word entry
  - Round screen
  - Game summary

Deliverables

- Test suite for rules engine foundations.
- Clickable mobile-first route skeleton.

Definition of done

- Core engine tests pass.
- User can click through the app flow placeholders.

---

## Milestone 1 - Local Playable MVP

### Sprint 1.1 - Setup and Team Management

Goal: create a game session with teams and players quickly.

Status: completed. Setup form now validates teams and players, supports add/remove player controls, provides balance suggestions, and passes session draft data into word entry.

Tasks

- Build setup form with validation:
  - team names
  - players per team
  - basic constraints from rules
- Add session creation action in the engine/UI bridge.
- Add UX helpers:
  - add/remove player
  - auto-balance helper suggestion

Deliverables

- Functional setup flow into word entry.

Definition of done

- New session can be created in under two minutes on phone.

---

### Sprint 1.2 - Word Entry and Validation UX

Goal: make input of `3-5` words per player smooth and error-resistant.

Tasks

- Build per-player word entry steps.
- Validate count rules and one-word restrictions.
- Add quality-of-life features:
  - bulk paste with parsing (optional stretch)
  - duplicate warning
  - clear progress indicator

Deliverables

- Reliable word collection flow producing the bowl payload.

Definition of done

- All players can submit valid words with clear progress and no confusion.

---

### Sprint 1.3 - Core Round Loop (Section 1)

Goal: deliver one complete playable section end-to-end.

Tasks

- Round screen with:
  - `60s` timer
  - current active team
  - word display
  - actions: guessed / skip / end
- Keep player assignment social:
  - the app does not rotate or assign the clue-giver
  - players decide who takes the phone each round
- Implement team switching and bowl progression.
- Show section totals in the section transition state instead of a standalone round-summary screen.

Deliverables

- Fully playable Section 1.

Definition of done

- Teams can complete Section 1 with accurate scoring.

---

### Sprint 1.4 - Sections 2 & 3 + Full Match

Goal: complete the full game loop for all sections.

Tasks

- Add section rule banners and reminders.
- Reuse bowl words across sections according to rules.
- Complete section transitions and game-end winner logic.
- Add tie-break flow.

Deliverables

- Full match playable from setup to winner.

Definition of done

- Entire game can be completed without manual intervention or rule breaks.

---

### Sprint 1.5 - Local Persistence + Recovery

Goal: prevent game loss during real sessions.

Tasks

- Persist the active session locally.
- Restore state on refresh and reopen.
- Add recover and reset controls.
- Add safeguards for accidental navigation.

Deliverables

- Session restore and reset experience.

Definition of done

- Refreshing mid-game does not lose match progress.

---

## Milestone 2 - Reliability & Polish

### Sprint 2.1 - Edge Cases and Stability Hardening

Goal: eliminate game-night breaking issues.

Tasks

- Cover edge cases:
  - min/max players
  - empty/invalid words
  - last-word timing boundary
  - tie scenarios
- Improve reducer error handling and telemetry hooks.
- Add stronger input normalization.

Deliverables

- Hardened logic and validation paths.

Definition of done

- No blocker defects in repeated full-match simulation.

---

### Sprint 2.2 - UX Polish Pass

Goal: raise perceived quality to a professional level.

Tasks

- Improve typography, spacing, and hierarchy for small screens.
- Add subtle transitions and animations.
- Improve tap target sizes and interaction feedback.
- Refine error, confirmation, and undo patterns.

Deliverables

- Polished mobile gameplay UX.

Definition of done

- User test feedback reports the UI as clear, pleasant, and low-friction.

---

### Sprint 2.3 - Performance and Device QA

Goal: keep the experience smooth on real phones.

Tasks

- Optimize render hotspots and avoid unnecessary re-renders.
- Validate timer accuracy across tab/background interruptions.
- Run a manual QA matrix:
  - iOS Safari
  - Android Chrome
  - small viewport stress tests

Deliverables

- Device QA checklist with pass/fail notes.

Definition of done

- Smooth interaction and reliable timing on target devices.

---

## Milestone 3 - Shareable Release

### Sprint 3.1 - PWA and Branding

Goal: make the app installable and launch-ready.

Tasks

- Add and verify manifest, icons, and metadata.
- Add install prompts and education UX.
- Polish the landing page and game intro.

Deliverables

- Installable PWA with coherent branding.

Definition of done

- Users can install and launch from the home screen.

---

### Sprint 3.2 - Docs, Help, and Rules Surface

Goal: make the app self-explanatory for new players.

Tasks

- Add in-app quick rules and section reminders.
- Add help and troubleshooting page.
- Add release notes or changelog entry.

Deliverables

- User-facing docs screens in app.

Definition of done

- New users can run a game without external explanation.

---

### Sprint 3.3 - Launch + Feedback Loop

Goal: publish and improve with real usage.

Tasks

- Deploy a stable release.
- Create a lightweight feedback channel (form or issue template).
- Run `2-3` friend/family playtest sessions and collect insights.
- Prioritize post-launch fixes and enhancements.

Deliverables

- Public release and first feedback-based iteration backlog.

Definition of done

- Live shareable version with actionable user feedback captured.

---

## Cross-sprint backlog template

For each issue or task, capture:

1. User value
2. Acceptance criteria
3. Edge cases
4. Telemetry or observation
5. Estimate (`S/M/L` plus confidence)

---

## Suggested cadence

- Work in one-week micro-sprints.
- Keep active WIP to a maximum of two tasks.
- Always pair one logic task with one UX task to maintain momentum.
- End each week with one playable increment, even if small.

---

## First 2-week starter package

### Week 1

- Sprint `0.1` plus start `0.2`
- Output: state model, initial reducer, first tests

### Week 2

- Finish `0.2` plus `0.3`
- Output: tested engine skeleton and clickable app flow

If completed, the project is ready to start Sprint `1.1` immediately.
