# Bowl App Development Plan (High-Level)

## 1) Product Direction

### Primary product goal

Build a polished, professional-feeling game app that is excellent for friend/family sessions first, while keeping a realistic path to a wider public launch later.

### Why this fits your context

- You already have TypeScript/web strengths.
- You prefer phone usage.
- You want pass-and-play first (not real-time networking complexity).
- You are building part-time with variable energy, so avoiding extra platform overhead is important.

## 2) Web vs Native Mobile Recommendation

## Recommendation: **Mobile-first Web App (PWA) first**, then optionally wrap/port to native.

### Rationale

1. **Fastest path to quality with your skill set**
   A Next.js + TypeScript stack lets you move confidently toward polished UX without relearning native stacks.

2. **Phone-first UX is still achievable**
   A mobile-first responsive UI plus PWA installability gives a "feels like an app" experience for friends/family.

3. **Lower maintenance as a side project**
   One codebase is more sustainable than separate iOS/Android native implementations when your time/energy is limited.

4. **Good portfolio story**
   A clean production web app with strong product thinking, polished interactions, and reliable game state is highly demonstrable.

5. **Future optionality**
   If traction appears, you can reuse most logic/UI patterns and either:
   - keep improving the PWA, or
   - package via Capacitor / move to React Native with shared domain logic.

### When native mobile would be better immediately

Start native first only if near-term App Store distribution, native APIs, or advanced offline/background needs are mandatory. Those are not hard requirements right now.

## 3) Product Principles (to keep scope sane)

1. **Game-night reliability > feature count**
2. **Single-session friction must be minimal**
3. **Clear turn-state visibility at all times**
4. **Everything optimized for one-handed, quick phone interactions**
5. **No account required for local pass-and-play MVP**

## 4) MVP Scope (Pass-and-Play First)

Grounded in the game rules source of truth:

- Team setup (2 teams, flexible player counts)
- Word entry (3-5 words per player, enforce THINGS/VERBS by guidance, not hard NLP blocking initially)
- 3 sections with distinct clue constraints:
  - Explain with words
  - One word only
  - Charades
- 60-second rounds
- Alternate rounds between teams while players self-manage who takes the phone
- Round termination rules and bowl progression
- Score tracking across all sections
- Tie-break bonus round flow
- Strong anti-error UX (undo, confirm, round-end clarity)

## 5) Suggested Architecture (high-level)

### Frontend

- Next.js App Router UI with mobile-first layout.
- State model centered on a deterministic game engine (pure TypeScript functions) + UI shell.

### Domain layer (most important)

Create a `game-engine` module that owns:

- game state shape
- legal actions/events
- transitions/reducers
- derived selectors (current team, section status, scores)

This makes future porting easier and keeps rules testable.

### Persistence

- MVP: local/session persistence (localStorage or indexed DB abstraction).
- Later: cloud save + share links if needed.

### Data/backend

- Keep backend minimal in MVP.
- Add backend only for post-MVP needs (accounts, persistent history, sharing, analytics).

## 6) UX Priorities (professional feel)

1. **Onboarding flow in < 2 minutes**
   Create game -> teams -> words -> start.

2. **Round screen clarity**
   - very large timer
   - current section/rule reminder
   - obvious actions: guessed / skip / end round
   - no app-managed clue-giver; players decide who is holding the phone

3. **Section transitions**
   Celebrate section completion, show section totals, and clearly explain next section rule.

4. **Error prevention**
   - confirmations for destructive actions
   - accidental tap protection for ending round
   - recoverability (undo last scored word)

5. **Micro-interactions**
   Subtle haptics/sound toggles (later), smooth animations, readable typography, high contrast.

## 7) Milestone Plan (part-time friendly)

## Milestone 0 — Foundation (1-2 weeks part-time)

- Define state machine and event model.
- Implement game engine skeleton with tests.
- Create screen map and wireframes (low fidelity).

**Exit criteria:** core game loop represented in tests and diagrams.

## Milestone 1 — Local Playable MVP (2-4 weeks part-time)

- Build setup + word entry + round/section flow + scoring.
- Mobile-first UI polishing pass.
- Add persistence for accidental refresh recovery.

**Exit criteria:** one full match can be played smoothly on a phone browser.

## Milestone 2 — Quality & Reliability (1-2 weeks)

- Edge-case handling and robust validation.
- Performance tuning (render minimization, animation smoothness).
- Add analytics events (privacy-safe) for play flow drop-offs.

**Exit criteria:** stable game-night ready version.

## Milestone 3 — Shareable Release (1-2 weeks)

- PWA installability + icons + manifest polishing.
- Landing/about/rules/help pages.
- Deployment + feedback loop from friends/family.

**Exit criteria:** public URL that feels production-grade and can be shared.

## 8) Backlog Structure (what to track in your board)

Use four lanes:

1. **Core Rules Engine**
2. **Gameplay UX**
3. **Quality/Testing**
4. **Launch/Polish**

Each ticket should include:

- user value
- acceptance criteria
- edge cases
- telemetry note (what you’d measure)

## 9) Testing Strategy

### Must-have automated tests

- Unit tests for rule transitions (section/round/score/turn logic).
- Property-style tests for invariants (no duplicate active words, score totals consistent, section progression valid).

### Must-have manual checks on phone

- portrait layout on small screens
- timer behavior under tab/background interruptions
- accidental tap scenarios
- full game run-through with 2 and 6+ players

## 10) Definition of Done (for each milestone)

- Works on mobile Chrome + Safari.
- No blocker bugs in complete match simulation.
- Clear recovery path from refresh/accidental navigation.
- Rules are understandable without external explanation.
- At least one real playtest session completed and notes captured.

## 11) Suggested "Now / Next / Later"

### Now

- Implement game state model + reducer/events.
- Create minimal mobile UI skeleton.
- Build playable pass-and-play flow.

### Next

- UX polish pass + persistence + stronger validations.
- PWA install flow and assets.

### Later

- Async multiplayer / remote rooms.
- Accounts + match history.
- Expansion packs / house rules / localization.

## 12) Guidance for better use of Codex (practical)

When asking for help, include:

1. Goal (e.g., "playable by 6 friends tonight" vs "portfolio-grade polish")
2. Constraints (time this week, target devices, stack limits)
3. Output style (roadmap, technical design, ticket list, implementation)
4. Level of detail (high-level vs task-by-task)
5. What to optimize (speed, quality, maintainability, UX)

Prompt template:

> "Based on `GAME_RULES.md`, produce a 2-week milestone with tickets for a Next.js mobile-first pass-and-play MVP. Include acceptance criteria and tests."
