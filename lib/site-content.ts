export const siteNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/rules', label: 'Rules' },
  { href: '/how-to-play', label: 'How to play' },
  { href: '/game/setup', label: 'Start game' },
] as const;

export const quickStats = [
  {
    label: 'Players',
    value: '2+',
    description: 'Split the room into two teams with roughly balanced players.',
  },
  {
    label: 'Sections',
    value: '3',
    description: 'Explain, one-word clues, then charades with the same bowl.',
  },
  {
    label: 'Phones',
    value: '1',
    description: 'Pass a single device while the app tracks the active round.',
  },
] as const;

export const roundModes = [
  {
    label: 'Section 1',
    title: 'Explain with words',
    description:
      'Describe the word using other words only. No acting, no sounds, and no using the word itself.',
  },
  {
    label: 'Section 2',
    title: 'One word only',
    description:
      'You get exactly one spoken word as a clue. Repeats and other languages still do not count.',
  },
  {
    label: 'Section 3',
    title: 'Charades',
    description:
      'Use body language and gestures only. No speaking or sounds while the team guesses.',
  },
  {
    label: 'Tie breaker',
    title: 'Sudden death',
    description:
      'If total score is tied after three sections, teams alternate one sound-only round each until a full cycle breaks the tie.',
  },
] as const;

export const preGameChecklist = [
  'Play with at least 2 people and split everyone into two teams.',
  'Each player contributes 3 to 5 words before the match begins.',
  'Words must be things or verbs, not multi-word phrases.',
  'The app tracks setup, word entry, bowl order, timer, score, and turn order.',
] as const;

export const scoringRules = [
  'Each correctly guessed word is worth 1 point.',
  'Teams alternate 60-second rounds until the bowl is empty.',
  'When the bowl empties, section totals are locked and the same word set returns for the next section.',
  'Highest total score after section three wins the match.',
  'If the full match stays tied, repeated sudden-death cycles decide the winner.',
] as const;

export const importantRules = [
  'If someone makes filler noises or breaks the clue restriction, players should end the round immediately.',
  'Skipped words go back into the bowl right away and re-enter in a shuffled position.',
  'The bowl order reshuffles between rounds.',
  'Apostrophes still count as one word, but hyphenated terms and multi-word phrases do not.',
  'There is no dedicated foul button. The app relies on the same End round control for social rule enforcement.',
] as const;

export const howToPlaySteps = [
  {
    title: 'Create two teams',
    description:
      'Add team names, enter players, and choose a word count in setup before anyone starts guessing.',
  },
  {
    title: 'Enter words privately',
    description:
      'Each player submits their own words. If the page reloads, the app restores who was entering words next on the same device.',
  },
  {
    title: 'Start the first round',
    description:
      'The active team picks a clue-giver, taps Start round, and works through as many words as possible in 60 seconds.',
  },
  {
    title: 'Pass the phone',
    description:
      'When the round ends, hand the device to the other team. The bowl and score already reflect what just happened.',
  },
  {
    title: 'Empty the bowl for each section',
    description:
      'Keep alternating until no words remain. The section advances only after the entire bowl is cleared.',
  },
  {
    title: 'Finish the match',
    description:
      'Play through explain, one-word, and charades. If totals are tied at the end, move into sudden death until one full cycle creates a leader.',
  },
] as const;

export const helpTopics = [
  {
    title: 'What if the browser reloads?',
    description:
      'Setup progress, word entry progress, and an in-progress game restore from local storage on the same device.',
  },
  {
    title: 'What happens to skipped words?',
    description:
      'Skipped words go back into the bowl immediately and are shuffled so they do not stay at the front of the queue.',
  },
  {
    title: 'How do we handle fouls or accidental clues?',
    description:
      'Players handle that socially. Use End round to stop the timer and pass play to the other team.',
  },
  {
    title: 'How should we install the app?',
    description:
      'Open the browser menu and choose Install app or Add to Home Screen. Bowl supports installability without pretending to be fully offline-first.',
  },
] as const;
