# Sprint 0.1 Completion: Product + Rules Modeling

This document completes Sprint 0.1 from `docs/SPRINT_PLAN.md`.

## Status

- Sprint: **0.1 — Product + Rules Modeling**
- Outcome: **Completed**
- Scope covered:
  - Rules interpretation spec
  - Domain glossary
  - Explicit game state model
  - State transition diagram
  - Edge-case policy decisions
  - Rule clarifications incorporated from implementation kickoff

---

## 1) Rules Interpretation Spec (from `GAME_RULES.md`)

### 1.1 Core match setup

- The game has exactly **2 teams**.
- Player count must be at least 2 overall.
- Team sizes should be roughly balanced (soft rule).
- Each player submits **3 to 5 words**.
- Words are intended to be **things or verbs** (guideline-first validation for MVP).

### 1.2 Match structure

- A match has **3 sections**:
  1. Explain with words
  2. One word only
  3. Charades
- Each section is composed of alternating **1-minute rounds** between teams.
- During a round, the active clue-giver tries to get teammates to guess words.
- On correct guess, the next word is drawn from the bowl.
- Section ends when bowl has no remaining words.
- The same bowl word set is reused across sections.

### 1.3 Scoring and win condition

- **1 point** per correctly guessed word.
- Track both section score and total score.
- Match winner is decided by **total points across all 3 sections**.
- If total points are tied, use sudden-death rounds until one team wins a full alternation cycle.

### 1.4 Rule constraints by section (for UI reminders and social enforcement)

- Section 1: verbal explanation allowed, no acting/sounds/pointing.
- Section 2: clue must be exactly one word.
- Section 3: no speech or sounds; gestures/body language only.

### 1.5 Round-ending events

A round can end by:

1. Timer reaches 0.
2. Player taps explicit “end round”.
3. Foul event (socially enforced by players, then manual round end/pass).

On round end, control passes to opposite team.

---

## 2) Domain Glossary

- **Match**: full game from setup through winner.
- **Section**: one of the 3 rule modes.
- **Round**: one team’s 60-second turn window.
- **Turn**: the currently active clue-giver within a round.
- **Bowl**: pool of words available in current section.
- **Word state**: queued, active, guessed, skipped.
- **Foul**: rule violation handled by players; app only needs round-end action.
- **Foul flag**: simple boolean marker (`true/false`) indicating a round ended due to a foul.
- **Typed foul reasons**: detailed categories like `spoke_two_words`, `filler_sound`, `illegal_gesture`. **Not required for MVP**.

---

## 3) Proposed Game State Model (implementation-facing)

```ts
export type SectionId = 1 | 2 | 3;

export type MatchPhase =
  | 'setup'
  | 'word_entry'
  | 'ready'
  | 'round_active'
  | 'round_summary'
  | 'section_transition'
  | 'match_complete';

export interface Team {
  id: string;
  name: string;
  totalScore: number;
}
```

(Full skeleton types are implemented in `lib/game-engine/types.ts`.)

---

## 4) State Transition Diagram

```mermaid
stateDiagram-v2
  [*] --> Setup
  Setup --> WordEntry: SESSION_CREATED
  WordEntry --> Ready: WORD_ENTRY_COMPLETED
  Ready --> RoundActive: ROUND_STARTED

  RoundActive --> RoundSummary: ROUND_ENDED(timer|manual|foul)
  RoundSummary --> SectionTransition: BOWL_EMPTY
  RoundSummary --> RoundActive: NEXT_ROUND

  SectionTransition --> Ready: NEXT_SECTION_PREPARED
  SectionTransition --> MatchComplete: MATCH_WINNER_DETERMINED

  MatchComplete --> [*]
```

---

## 5) Edge-case Policy Decisions (Sprint 0.1, finalized)

1. **Skip handling**
   - Skipped word re-enters **immediately**.
   - It is shuffled into remaining pool.
   - Guarantee at least one different word before it appears again.

2. **Order randomization**
   - Bowl order is reshuffled between rounds.

3. **Last-word + timer boundary**
   - If “guessed” action is registered before timer end event, count it.
   - If timer event is processed first, word does not count.

4. **Team balancing**
   - Imbalance warning is non-blocking.
   - Hard block only on invalid minimum requirements.

5. **Word validation strictness**
   - Apostrophe words count as one token (`don't`).
   - Hyphenated words count as two tokens (`ice-cream` invalid).
   - Multi-word phrases invalid.
   - “Thing/verb” remains guidance-level in MVP.

6. **Foul behavior**
   - No dedicated “typed foul reason” UX required.
   - Players enforce verbally; app only needs manual round end/pass.

---

## 6) Sprint 0.1 Definition of Done Check

- [x] Rules translated into concrete domain entities.
- [x] Valid game states and transitions documented.
- [x] Edge-case policy decisions documented.
- [x] State-transition diagram added.
- [x] Glossary added.
- [x] Rule clarifications from implementation kickoff captured.

**Sprint 0.1 exit criteria satisfied. Ready to execute Sprint 0.2.**
