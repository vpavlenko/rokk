import * as Tone from 'tone';
import GuitarAcousticMp3 from 'tonejs-instrument-guitar-acoustic-mp3';
import guitarChords from './guitarChords';

const KEYS = guitarChords.keys;

function parseChordSymbol(chordSymbol: string): [string, string] {
  const enharmonics = {
    Db: 'C#',
    'D#': 'Eb',
    Gb: 'F#',
    'G#': 'Ab',
    'A#': 'Bb',
  };

  let chord = chordSymbol;
  if (enharmonics[chord.substring(0, 2)]) {
    chord = `${enharmonics[chord.substring(0, 2)]}${chord.substring(2)}`;
  }

  const root = KEYS.indexOf(chord.substring(0, 2)) !== -1 ? chord.substring(0, 2) : chord[0];

  if (!KEYS.includes(root)) {
    throw new Error(`Invalid root note: ${root}`);
  }

  let quality = chordSymbol.substring(root.length);

  switch (quality) {
    case 'm':
      quality = 'minor';
      break;
    case 'maj':
      quality = 'maj7';
      break;
    case '':
      quality = 'major';
      break;
  }

  quality = quality.replace('-', 'b');

  return [root, quality];
}

function applyTransposition(root: string, transposition: number): string {
  const rootIndex = KEYS.indexOf(root);

  if (rootIndex === -1) {
    throw new Error('Root note not found in KEYS array');
  }

  return KEYS[(rootIndex + 12 - transposition) % 12];
}

function getChordMidiPitches(chordSymbol: string, transposition: number): number[] | undefined {
  // Split the chord symbol into its components (e.g., 'Am' -> ['A', 'minor'])
  // eslint-disable-next-line prefer-const
  let [root, suffix] = parseChordSymbol(chordSymbol);
  root = applyTransposition(root, transposition);

  // Find the chord variations for the given root and suffix
  const variations = guitarChords.chords[root.replace('#', 'sharp')]?.find(variant => variant.suffix === suffix);

  // Return the MIDI pitches for the first variation found, for simplicity
  return variations?.positions[0]?.midi;
}

let currentlyPlayingFrequencies: number[] = [];
let releaseTimeoutId: NodeJS.Timeout | null = null; // Track the active timeout ID

let instrument = null;

const guitar = new GuitarAcousticMp3({
  onload: async () => {
    await Tone.start();
    guitar.toDestination();
    instrument = guitar;
  },
});

export const playChord = (chordSymbol, transposition) => {
  const midiPitches = getChordMidiPitches(chordSymbol, transposition);
  if (midiPitches && instrument) {
    if (releaseTimeoutId) {
      clearTimeout(releaseTimeoutId);
    }

    currentlyPlayingFrequencies.forEach(frequency => {
      instrument.triggerRelease(frequency);
    });

    const startTime = Tone.now();
    const strumDuration = 0.01;
    const frequencies = midiPitches.map(pitch => Tone.Midi(pitch).toFrequency());

    currentlyPlayingFrequencies = frequencies;

    frequencies.forEach((frequency, index) => {
      instrument.triggerAttack(frequency, startTime + index * strumDuration);
    });

    releaseTimeoutId = setTimeout(() => {
      frequencies.forEach(frequency => {
        instrument.triggerRelease(frequency);
      });
      currentlyPlayingFrequencies = [];
      releaseTimeoutId = null;
    }, 1000);
  }
};

export const PlayableChord: React.FC<{ chord: string; isEnabled: boolean; transposition: number }> = ({
  chord,
  isEnabled,
  transposition,
}) => (
  <button style={{ backgroundColor: isEnabled ? '#dfd' : '#999' }} onClick={() => playChord(chord, transposition)}>
    {chord}
  </button>
);

export const CHORDS_TO_PLAY = ['Am', 'E', 'E7', 'Dm', 'F', 'G', 'C', 'Em', 'A7', 'B7', 'D', 'Gm'];

const ChordPlayer: React.FC<{ enabledChords: string[]; transposition: number }> = ({
  enabledChords,
  transposition,
}) => (
  <div>
    {CHORDS_TO_PLAY.map((chord, index) => (
      <PlayableChord
        key={index}
        chord={chord}
        isEnabled={enabledChords.indexOf(chord) !== -1}
        transposition={transposition}
      />
    ))}
  </div>
);

export default ChordPlayer;
