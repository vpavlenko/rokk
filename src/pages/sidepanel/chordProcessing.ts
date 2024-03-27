const removeAlterations = (chords: string[]) => chords.map(chord => chord.replace('m7', 'm').replace('5', ''));

const removeRepetitions = (chords: string[]) => {
  if (!chords || chords.length === 0) {
    return [];
  }

  const uniqueChords = [chords[0]];

  for (let i = 1; i < chords.length; i++) {
    if (chords[i] !== chords[i - 1]) {
      uniqueChords.push(chords[i]);
    }
  }

  return uniqueChords;
};

export const PROCESSING_STEPS = [
  { name: 'removeAlterations', method: removeAlterations },
  { name: 'removeRepetitions', method: removeRepetitions },
];

export const processChords = (chords: string[]) => PROCESSING_STEPS.reduce((acc, step) => step.method(acc), chords);
