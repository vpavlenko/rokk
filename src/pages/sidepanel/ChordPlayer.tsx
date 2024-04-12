import * as Tone from 'tone';
import GuitarAcousticMp3 from 'tonejs-instrument-guitar-acoustic-mp3';
import guitarChords from './guitarChords';
import { parseChord } from './parseChord';

const KEYS = guitarChords.keys;

const QUALITY_TO_PRINT = {
  major: '',
  minor: 'm',
};

function parseChordForPlayer(chordSymbol: string): [string, string] {
  const { root, bass, triadQuality, properties } = parseChord(chordSymbol);
  // {"root":7,"bass":2,"triadQuality":"major","properties":["7"]}

  let quality: string = triadQuality;
  if (triadQuality === 'major' && properties.includes('7')) {
    quality = '7';
  } else if (triadQuality === 'dim') {
    if (properties.includes('7')) {
      quality = 'm7b5';
    } else if (properties.includes('dim7')) {
      quality = 'dim7';
    } else {
      quality = 'dim';
    }
  }

  return [KEYS[root], quality];
}

function applyTransposition(root: string, transposition: number): string {
  const rootIndex = KEYS.indexOf(root);

  if (rootIndex === -1) {
    throw new Error('Root note not found in KEYS array');
  }

  return KEYS[(rootIndex + 12 - transposition) % 12];
}

export const normalizeChord = (chordSymbol: string): string => {
  const [root, suffix] = parseChordForPlayer(chordSymbol);
  return `${root}${QUALITY_TO_PRINT[suffix] ?? suffix}`;
};

function getChordMidiPitches(
  chordSymbol: string,
  transposition: number,
): [number[], string] | undefined {
  // Split the chord symbol into its components (e.g., 'Am' -> ['A', 'minor'])
  // eslint-disable-next-line prefer-const
  let [root, suffix] = parseChordForPlayer(chordSymbol);
  root = applyTransposition(root, transposition);

  // Find the chord variations for the given root and suffix
  const variations = guitarChords.chords[root.replace('#', 'sharp')]?.find(
    variant => variant.suffix === suffix,
  );

  // Return the MIDI pitches for the first variation found, for simplicity
  return [variations?.positions[0]?.midi, normalizeChord(chordSymbol)];
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

export const playChord = (chordSymbol, transposition, setPlayedChord) => {
  const [midiPitches, chordPlayed] = getChordMidiPitches(chordSymbol, transposition);
  if (midiPitches && instrument) {
    setPlayedChord(chordPlayed);
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

const PlayableChord: React.FC<{
  chord: string;
  isEnabled: boolean;
  transposition: number;
  setPlayedChord: (string) => void;
}> = ({ chord, isEnabled, transposition, setPlayedChord }) => (
  <button
    style={{ backgroundColor: isEnabled ? '#dfd' : '#999' }}
    onClick={() => playChord(chord, transposition, setPlayedChord)}>
    {chord}
  </button>
);

export const CHORDS_TO_PLAY = [
  'Am',
  'E',
  'E7',
  'Dm',
  'F',
  'G',
  'C',
  'Em',
  'A7',
  'B7',
  'D',
  'Gm',
];

const ChordPlayer: React.FC<{
  enabledChords: string[];
  transposition: number;
  setPlayedChord: (string) => void;
}> = ({ enabledChords, transposition, setPlayedChord }) => (
  <div>
    {CHORDS_TO_PLAY.map((chord, index) => (
      <PlayableChord
        key={index}
        chord={chord}
        isEnabled={enabledChords.indexOf(chord) !== -1}
        transposition={transposition}
        setPlayedChord={setPlayedChord}
      />
    ))}
  </div>
);

export const isPrimaryChord = (chord: string) =>
  CHORDS_TO_PLAY.includes(normalizeChord(chord));

export default ChordPlayer;
