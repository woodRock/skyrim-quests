export interface Perk {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

export interface Constellation {
  name: string;
  skillKey: string;
  description: string;
  perks: Perk[];
  lines: [number, number][];
  spectralPaths: string[];
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'RESTORATION',
    skillKey: 'RESTORATION',
    description: 'The art of mending the spirit through rest and healing.',
    spectralPaths: [
      "M 100,400 L 150,350 L 200,250 L 280,220 L 350,150 L 420,200 L 380,350 Z",
      "M 150,350 Q 50,350 50,300 Q 50,250 150,250",
      "M 280,220 Q 300,300 380,350",
      "M 350,150 Q 400,100 450,150 Q 480,200 420,200"
    ],
    perks: [
      { id: 'rest_1', name: 'Consistent Bedtime', x: 100, y: 400, description: 'Going to bed at the same time for 3 days.' },
      { id: 'rest_2', name: 'Digital Detox', x: 150, y: 350, description: 'No screens 1 hour before sleep.' },
      { id: 'rest_3', name: 'Deep REM', x: 200, y: 250, description: 'Achieving a high-quality sleep score.' },
      { id: 'rest_4', name: 'Self-Compassion', x: 280, y: 220, description: 'Forgiving yourself for a low-energy day.' },
      { id: 'rest_5', name: 'Boundary Setter', x: 350, y: 150, description: 'Saying no to protect your energy.' },
      { id: 'rest_6', name: 'Restorative Silence', x: 420, y: 200, description: 'Spending 10 minutes in complete stillness.' },
      { id: 'rest_7', name: 'Waking Grace', x: 380, y: 350, description: 'Waking up without hitting the snooze button.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
  },
  {
    name: 'ENCHANTING',
    skillKey: 'ENCHANTING',
    description: 'The mastery of focus, productivity, and professional growth.',
    spectralPaths: [
      "M 100,450 L 250,400 L 400,450",
      "M 250,400 L 250,50",
      "M 50,300 Q 250,200 450,300",
      "M 200,50 L 250,0 L 300,50"
    ],
    perks: [
      { id: 'ench_1', name: 'Flow State', x: 250, y: 400, description: 'Achieving 90 minutes of deep, uninterrupted work.' },
      { id: 'ench_2', name: 'Corpus Shield', x: 100, y: 450, description: 'Leaving work on time to protect your personal life.' },
      { id: 'ench_3', name: 'Soul Gem Focus', x: 400, y: 450, description: 'Completing the most difficult task on your list first.' },
      { id: 'ench_4', name: 'Arcane Network', x: 250, y: 250, description: 'A successful professional connection or meeting.' },
      { id: 'ench_5', name: 'Master Scribe', x: 250, y: 50, description: 'Finishing a major project or significant deadline.' },
    ],
    lines: [[0, 1], [0, 2], [0, 3], [3, 4]]
  },
  {
    name: 'SMITHING',
    skillKey: 'SMITHING',
    description: 'The art of maintenance, hygiene, and caring for your physical vessel.',
    // ARIES
    spectralPaths: [
      "M 100,200 L 250,150 L 400,250 L 450,400", // Main Aries line
      "M 250,150 Q 200,50 150,150", // Left horn
      "M 250,150 Q 300,50 350,150"  // Right horn
    ],
    perks: [
      { id: 'smith_1', name: 'Basic Maintenance', x: 100, y: 200, description: 'Consistent daily hygiene (teeth, face, etc).' },
      { id: 'smith_2', name: 'Polished Plate', x: 250, y: 150, description: 'Taking a refreshing shower or bath to clear the mind.' },
      { id: 'smith_3', name: 'Clean Weave', x: 400, y: 250, description: 'Wearing fresh clothes and managing laundry.' },
      { id: 'smith_4', name: 'Gilded Soul', x: 450, y: 400, description: 'A full self-care or skincare routine.' },
      { id: 'smith_5', name: 'External Sanctuary', x: 350, y: 150, description: 'Tidying your immediate living space.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4]]
  },
  {
    name: 'SPEECH',
    skillKey: 'SPEECH',
    description: 'Your influence on the realm through truth and connection.',
    spectralPaths: [
      "M 150,100 L 120,300 L 150,450",
      "M 350,100 L 380,300 L 350,450",
      "M 120,300 L 250,250 L 380,300",
      "M 130,100 A 20,20 0 1,1 170,100 M 330,100 A 20,20 0 1,1 370,100"
    ],
    perks: [
      { id: 'speech_1', name: 'Inner Dialogue', x: 150, y: 100, description: 'Replacing one negative thought with a neutral one.' },
      { id: 'speech_2', name: 'Active Listening', x: 350, y: 100, description: 'Truly hearing a friend without planning a response.' },
      { id: 'speech_3', name: 'Vulnerability', x: 120, y: 300, description: 'Sharing a difficult feeling with someone you trust.' },
      { id: 'speech_4', name: 'Truth-Teller', x: 250, y: 250, description: 'Expressing a need clearly and without apology.' },
      { id: 'speech_5', name: 'The Scribe', x: 150, y: 450, description: 'Maintaining a 3-day journaling streak.' },
      { id: 'speech_6', name: 'Conflict Resolver', x: 350, y: 450, description: 'Addressing a tension before it becomes a dragon.' },
    ],
    lines: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]]
  },
  {
    name: 'ALCHEMY',
    skillKey: 'ALCHEMY',
    description: 'The science of nourishing the body and mind.',
    spectralPaths: [
      "M 100,150 L 180,350 L 250,200 L 320,350 L 400,150",
      "M 50,400 H 450 M 100,400 V 450 M 400,400 V 450",
      "M 250,200 Q 250,100 250,50"
    ],
    perks: [
      { id: 'alch_1', name: 'Hydration Potion', x: 100, y: 150, description: 'Drinking 2L of water in a single day.' },
      { id: 'alch_2', name: 'Nutrient Gatherer', x: 180, y: 350, description: 'Eating three balanced meals.' },
      { id: 'alch_3', name: 'Sobriety Scroll', x: 250, y: 200, description: 'Avoiding a toxic substance for a day.' },
      { id: 'alch_4', name: 'Focus Flux', x: 320, y: 350, description: 'Reducing caffeine to improve mental stability.' },
      { id: 'alch_5', name: 'Master Alchemist', x: 400, y: 150, description: 'Cooking a meal from scratch with love.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    name: 'TWO-HANDED',
    skillKey: 'TWO-HANDED',
    description: 'Mastery of physical power, strength training, and high-intensity effort.',
    spectralPaths: [
      "M 100,100 L 150,120 L 200,150 L 250,250 L 220,350 L 200,450 L 250,500 L 350,480",
      "M 150,120 L 100,180 M 150,120 L 180,80",
      "M 250,250 Q 300,250 350,200"
    ],
    perks: [
      { id: 'twoh_1', name: 'Barbarian Pulse', x: 100, y: 100, description: 'Completing a high-intensity workout.' },
      { id: 'twoh_2', name: 'Crushing Grip', x: 150, y: 120, description: 'Focusing on grip and functional strength.' },
      { id: 'twoh_3', name: 'Iron Hide', x: 200, y: 150, description: 'Pushing through the last set when it gets tough.' },
      { id: 'twoh_4', name: 'Greatsword Stride', x: 250, y: 250, description: 'A long-duration hike or heavy-load carry.' },
      { id: 'twoh_5', name: 'Champion Force', x: 220, y: 350, description: 'Setting a new personal record in weightlifting.' },
      { id: 'twoh_6', name: 'Stamina Surge', x: 200, y: 450, description: 'Maintaining high intensity for over 30 minutes.' },
      { id: 'twoh_7', name: 'Devastating Blow', x: 350, y: 480, description: 'Completing a full-body training session.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]
  },
  {
    name: 'ONE-HANDED',
    skillKey: 'ONE-HANDED',
    description: 'Physical prowess and daily movement.',
    spectralPaths: [
      "M 100,350 Q 150,300 200,250 L 300,200 L 350,100 L 450,150 L 400,400 H 150 Z",
      "M 300,200 Q 350,250 400,400",
      "M 300,200 Q 250,100 350,100"
    ],
    perks: [
      { id: 'one_1', name: 'Swift Strike', x: 400, y: 400, description: 'Taking a 20-minute brisk walk.' },
      { id: 'one_2', name: 'Dual Flurry', x: 100, y: 350, description: 'Completing morning and evening stretches.' },
      { id: 'one_3', name: 'Reflexes', x: 300, y: 200, description: 'Choosing active movement over sitting.' },
      { id: 'one_4', name: 'Bonebreaker', x: 200, y: 250, description: 'Bodyweight exercises (pushups, squats).' },
      { id: 'one_5', name: 'Savage Strike', x: 350, y: 100, description: 'A short, intense burst of movement.' },
      { id: 'one_6', name: 'Paralyzing Strike', x: 450, y: 150, description: 'Focusing on mobility and joint health.' },
    ],
    lines: [[1, 3], [3, 2], [2, 4], [4, 5], [2, 0]]
  },
  {
    name: 'ALTERATION',
    skillKey: 'ALTERATION',
    description: 'Changing your reality through mindfulness and meditation.',
    spectralPaths: [
      "M 250,100 L 400,300 M 250,100 L 100,300",
      "M 250,100 V 450 M 200,450 H 300",
      "M 100,300 Q 100,400 150,400 H 50 Q 100,400 100,300",
      "M 400,300 Q 400,400 450,400 H 350 Q 400,400 400,300"
    ],
    perks: [
      { id: 'alt_1', name: 'Mind Shield', x: 250, y: 100, description: 'Protecting your peace from negative news/media.' },
      { id: 'alt_2', name: 'Stability', x: 400, y: 300, description: 'Finding balance in a stressful situation.' },
      { id: 'alt_3', name: 'Equilibrium', x: 100, y: 300, description: 'Matching your effort to your current energy.' },
      { id: 'alt_4', name: 'Magic Resistance', x: 250, y: 450, description: 'Letting difficult emotions pass through without sticking.' },
    ],
    lines: [[0, 1], [0, 2], [0, 3]]
  }
];
