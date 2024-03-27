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

function getChordMidiPitches(chordSymbol: string): number[] | undefined {
  // Split the chord symbol into its components (e.g., 'Am' -> ['A', 'minor'])
  const [root, suffix] = parseChordSymbol(chordSymbol);

  // Find the chord variations for the given root and suffix
  const variations = guitarChords.chords[root]?.find(variant => variant.suffix === suffix);

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

const playChord = chordSymbol => {
  const midiPitches = getChordMidiPitches(chordSymbol);
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

export const PlayableChord: React.FC<{ chord: string }> = ({ chord }) => (
  <button onClick={() => playChord(chord)}>{chord}</button>
);

const CHORDS_TO_PLAY = ['Am', 'Am7', 'Dm', 'F', 'G', 'C', 'A7', 'Gm', 'B7', 'D', 'E7'];

const ChordPlayer: React.FC = () => (
  <div>
    {CHORDS_TO_PLAY.map((chord, index) => (
      <PlayableChord key={index} chord={chord} />
    ))}
  </div>
);

export default ChordPlayer;
