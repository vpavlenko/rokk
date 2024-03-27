import * as Tone from 'tone';
import GuitarAcousticMp3 from 'tonejs-instrument-guitar-acoustic-mp3';
import guitarChords from './guitarChords';

function parseChordSymbol(chordSymbol: string): [string, string] {
  const root = chordSymbol[0]; // Assuming single-letter root notes for simplicity
  let quality = chordSymbol.substring(1);

  if (quality === 'm') {
    quality = 'minor';
  } else if (quality === '7') {
    quality = '7';
  } else if (quality === '') {
    quality = 'major';
  }
  // Extend this logic to handle other chord types like 'm7', 'maj7', 'dim', etc.

  return [root, quality];
}

function applyTransposition(root: string, transposition: number): string {
  const rootIndex = guitarChords.keys.indexOf(root);

  if (rootIndex === -1) {
    throw new Error('Root note not found in KEYS array');
  }

  return guitarChords.keys[(rootIndex + 12 - transposition) % 12];
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

const playChord = (chordSymbol, transposition) => {
  const midiPitches = getChordMidiPitches(chordSymbol, transposition);
  if (midiPitches && instrument) {
    // Clear the previous timeout to prevent it from stopping the current notes
    if (releaseTimeoutId) {
      clearTimeout(releaseTimeoutId);
    }

    // Preemptively mute all currently playing notes
    currentlyPlayingFrequencies.forEach(frequency => {
      instrument.triggerRelease(frequency);
    });

    const startTime = Tone.now();
    const strumDuration = 0.01;
    const frequencies = midiPitches.map(pitch => Tone.Midi(pitch).toFrequency());

    // Update the currently playing notes
    currentlyPlayingFrequencies = frequencies;

    // Triggering the attack of each note in sequence for the strumming effect
    frequencies.forEach((frequency, index) => {
      instrument.triggerAttack(frequency, startTime + index * strumDuration);
    });

    // Schedule all notes to be stopped after the chordDuration, and clear the currently playing notes
    releaseTimeoutId = setTimeout(() => {
      frequencies.forEach(frequency => {
        instrument.triggerRelease(frequency);
      });
      // Clear the currently playing notes after they are all released
      currentlyPlayingFrequencies = [];
      releaseTimeoutId = null; // Reset the timeout ID
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

const CHORDS_TO_PLAY = ['Am', 'E', 'E7', 'Dm', 'F', 'G', 'C', 'A7', 'B7', 'D', 'Gm'];

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
