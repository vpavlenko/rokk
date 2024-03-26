/* eslint-disable no-debugger */
import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import * as Tone from 'tone';
import GuitarAcousticMp3 from 'tonejs-instrument-guitar-acoustic-mp3';
import guitarChords from './guitarChords';
import chordStorage from '@root/src/shared/storages/chordStorage';
import useStorage from '@root/src/shared/hooks/useStorage';
import SearchResultItem, { SearchResultItemProps } from './Youtube';

const YOUTUBE_API_KEY = localStorage.getItem('YOUTUBE_API_KEY');

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

const SidePanel = () => {
  const [instrument, setInstrument] = useState(null);
  const [youtubeVideo, setYoutubeVideo] = useState<string | null>(null);
  const chords = useStorage(chordStorage);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[]>([]);
  const [chordsOnCurrentPage, setChordsOnCurrentPage] = useState<string[]>([]);

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

  useEffect(() => {
    // Function to handle incoming messages
    const handleMessage = (request, sender, sendResponse) => {
      if (request.action === 'chordsOnCurrentPage') {
        // Update state with the extracted data
        setChordsOnCurrentPage(request.data);
      }
    };

    // Add message listener when the component mounts
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup: remove the listener when the component unmounts
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []); // Empty dependency array means this effect runs once on mount

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

  const query = 'король и шут кукла колдуна';

  useEffect(() => {
    const search = async () => {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`,
      );
      const data = await response.json();
      setSearchResults(data.items);
    };
    search();
  }, []);

  return (
    <div style={{ width: '100vw' }}>
      <div>
        {/* UI elements like buttons can go here. Use event handlers to trigger instrument actions. */}
        <button onClick={() => playChord('Am')}>Am</button>
        <button onClick={() => playChord('Dm')}>Dm</button>
        <button onClick={() => playChord('F')}>F</button>
        <button onClick={() => playChord('G')}>G</button>
        <button onClick={() => playChord('C')}>C</button>
        <button onClick={() => playChord('A7')}>A7</button>
        <button onClick={() => playChord('Gm')}>Gm</button>
        <button onClick={() => playChord('B7')}>B7</button>
        <button onClick={() => playChord('D')}>D</button>
        <button onClick={() => playChord('E7')}>E7</button>
      </div>
      <div>
        {youtubeVideo ? (
          <div>
            <div>{youtubeVideo}</div>
            <iframe
              title="youtube"
              id="youtube-player"
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${youtubeVideo}`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>
          </div>
        ) : (
          searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                debugger;
                setYoutubeVideo(result.id.videoId);
              }}
              style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
              <SearchResultItem result={result} />
            </button>
          ))
        )}
      </div>
      <div>
        {chordsOnCurrentPage.map((chord, index) => (
          <>
            <div key={index} style={{ marginRight: 20, display: 'inline-block' }}>
              {chord}
            </div>
          </>
        ))}
      </div>
      <div>{JSON.stringify(chords)}</div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
