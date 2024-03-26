import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import * as Tone from 'tone';
import GuitarAcousticMp3 from 'tonejs-instrument-guitar-acoustic-mp3';

const SidePanel = () => {
  const [instrument, setInstrument] = useState(null);

  useEffect(() => {
    const guitar = new GuitarAcousticMp3({
      onload: async () => {
        await Tone.start();
        guitar.toDestination();
        setInstrument(guitar); // Instrument is ready
      },
    });

    // Cleanup function to stop and dispose the instrument when the component unmounts
    return () => {
      if (instrument) {
        instrument.dispose();
      }
    };
  }, []);

  const playAmChord = () => {
    if (instrument) {
      const notes = ['A2', 'E3', 'A3', 'C4', 'E4']; // Notes of the Am chord in a common voicing
      const startTime = Tone.now();
      const strumDuration = 0.03; // Duration between each note in the strum
      const chordDuration = 1; // Time in seconds to let the chord ring

      // Triggering the attack of each note in sequence for the strumming effect
      notes.forEach((note, index) => {
        instrument.triggerAttack(note, startTime + index * strumDuration);
      });

      // Schedule all notes to be stopped after the chordDuration
      setTimeout(() => {
        notes.forEach(note => {
          instrument.triggerRelease(note);
        });
      }, chordDuration * 1000); // Convert seconds to milliseconds
    } else {
      console.log('Instrument not ready');
    }
  };

  return (
    <div>
      {/* UI elements like buttons can go here. Use event handlers to trigger instrument actions. */}
      <button onClick={playAmChord}>Play Am</button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
