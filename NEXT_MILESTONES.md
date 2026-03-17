# Next Milestones

## Milestone 2: Quality And Reliability

Focus on reliability, recovery, and test coverage. Do not prioritize UI polish or analytics.

### Goals

- Make timer behavior robust across tab backgrounding and resuming.
- Strengthen persistence and restore behavior for in-progress games.
- Expand automated coverage for engine invariants and edge cases.
- Run manual phone checks for gameplay reliability.

### Implementation targets

- Verify round timer remains correct after tab switch, screen lock, or app backgrounding.
- Preserve and restore in-progress game state cleanly from local storage.
- Validate sudden-death behavior across repeated tied cycles.
- Validate undo behavior in more edge cases.
- Validate all round-end paths:
  - timer end
  - manual end
  - all words cleared
- Validate word-entry recovery and player-by-player progression.
- Prevent accidental destructive actions and confirm recovery paths still work.

### Testing targets

- Add engine tests for:
  - sudden-death repeated tie cycles
  - undo edge cases
  - score consistency
  - valid bowl progression
- Add restore/reload tests where practical.
- Manual checks on phone:
  - portrait layout on small screens
  - timer after background/resume
  - accidental tap scenarios
  - full game with 2 players
  - full game with 6+ players

## Milestone 3: Shareable Release

Focus on release-readiness and basic public-facing app structure.

### Goals

- Make the app installable as a PWA without introducing unstable offline behavior.
- Add missing rules/help content.
- Prepare the app for sharing with friends/family via a production URL.

### Implementation targets

- Add a rules page.
- Add a lightweight help/how-to-play page.
- Replace the current placeholder landing page with a proper shareable home page.
- Add `manifest.webmanifest` with:
  - app name
  - short name
  - start URL
  - display mode
  - theme color
  - background color
- Add app icons and touch icons.
- Add mobile/PWA metadata needed for installability.

### PWA guidance

- Keep PWA work conservative.
- Prioritize installability first.
- Do not add aggressive offline caching unless explicitly needed.
- Avoid service-worker complexity unless there is a clear offline requirement.

### Out of scope for now

- Analytics
- Accounts
- Multiplayer
- Match history
- Heavy UI/animation polish
