import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';
import SearchResultItem, { SearchResultItemProps } from './Youtube';
import {
  MESSAGE_HOVER_CHORD,
  MESSAGE_PAGE_DATA,
  Message,
} from '@root/src/shared/messages';
import ChordPlayer, { CHORDS_TO_PLAY, playChord } from './ChordPlayer';
import { processChords } from './chordProcessing';

const YOUTUBE_API_KEY = localStorage.getItem('YOUTUBE_API_KEY');

// const ChordSequence: React.FC<{ chords: string[] }> = ({ chords }) => (
//   <div>
//     {chords.map((chord, index) => (
//       <>
//         <div key={index} style={{ marginRight: 20, display: 'inline-block' }}>
//           {chord}
//         </div>
//       </>
//     ))}
//   </div>
// );

const SidePanel = () => {
  const [artist, setArtist] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [chordsBlock, setChordsBlock] = useState<string | null>('');
  const [youtubeVideo, setYoutubeVideo] = useState<string | null>(null);
  const [transposition, setTransposition] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[] | null>([]);
  const [chords, setChords] = useState<string[]>([]);
  const [savingResult, setSavingResult] = useState<string>('');
  const [processedChords, setProcessedChords] = useState<string[]>([]);
  const [hasModulation, setHasModulation] = useState<boolean>(false);
  const [playedChord, setPlayedChord] = useState<string>('');
  const [textAreaValue, setTextAreaValue] = useState('');

  useEffect(() => {
    if (chordsBlock) {
      const lines = chordsBlock
        .split(/\n/g)
        .map(line =>
          [...line.matchAll(/podbor__chord" data-chord="([^"]+)"/g)].map(
            match => match[1],
          ),
        )
        .filter(chords => chords.length > 0)
        .map(chords => chords.join(' '))
        .join('\n');
      setTextAreaValue(lines);
    }
  }, [chordsBlock]);

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  };

  useEffect(() => {
    const handleMessage = (request: Message, sender: chrome.runtime.MessageSender) => {
      if (request.action === MESSAGE_PAGE_DATA) {
        const { artist, song, chordsBlock, chords, transposition } = request.data;
        setChords(chords);
        setArtist(artist);
        setSong(song);
        setChordsBlock(chordsBlock);
        setUrl(sender.url);
        setTransposition(transposition);
        console.log('transposition', transposition);
      }
      if (request.action === MESSAGE_HOVER_CHORD) {
        const { chord } = request.data;
        playChord(chord, transposition, setPlayedChord);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [transposition]);

  useEffect(() => {
    setYoutubeVideo(null);
    if (!artist || !song) {
      return;
    }
    const query = `${artist} ${song}`;
    const search = async () => {
      // const response = await fetch(
      //   `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`,
      // );
      // const data = await response.json();
      // setSearchResults(data.items);
    };
    search();
  }, [artist, song]);

  useEffect(() => setProcessedChords(processChords(chords)), [chords]);

  useEffect(() => setHasModulation(false), [song]);

  useEffect(() => {
    const f = [
      ...new Set(chords.filter(chord => CHORDS_TO_PLAY.indexOf(chord) === -1)),
    ].map(chord => <span key={chord}>{chord}</span>);
  }, [chords]);

  return (
    <div style={{ width: '100vw' }}>
      <div>
        <ChordPlayer
          enabledChords={processedChords}
          transposition={transposition}
          setPlayedChord={setPlayedChord}
        />
      </div>
      <div>
        other chords:{' '}
        {[...new Set(chords.filter(chord => CHORDS_TO_PLAY.indexOf(chord) === -1))].map(
          chord => (
            <span key={chord} style={{ marginRight: '0.5em' }}>
              {chord}
            </span>
          ),
        )}
      </div>
      <div>transposition: {transposition}</div>
      <div>last played chord: {playedChord}</div>
      <div>
        <button onClick={() => setYoutubeVideo(null)}>Close</button>
      </div>
      <div>
        <a
          href={`https://www.youtube.com/results?search_query=${artist} ${song}`}
          target="_blank"
          rel="noreferrer">
          Search Youtube
        </a>
      </div>
      <div>
        {youtubeVideo ? (
          <div>
            <iframe
              title="youtube"
              id="youtube-player"
              width="300"
              height="200"
              src={`https://www.youtube.com/embed/${youtubeVideo}?rel=0`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          searchResults?.map((result, index) => (
            <button
              key={index}
              onClick={() => setYoutubeVideo(result.id.videoId)}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
              }}>
              <SearchResultItem result={result} />
            </button>
          ))
        )}
      </div>
      <div>
        <textarea
          value={textAreaValue}
          onChange={handleTextareaChange}
          rows={textAreaValue.split('\n').length || 1}
          style={{ width: '100%' }}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={hasModulation}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setHasModulation(event.target.checked)
            }
          />
          has modulation
        </label>
      </div>
      <div>
        <button
          onClick={async () => {
            try {
              await chordStorage.addChords(
                artist,
                song,
                url,
                textAreaValue.trim().split(/\s+/),
                transposition,
                hasModulation,
              );
              setSavingResult('saved');
              setTimeout(() => setSavingResult(''), 1000);
            } catch (e) {
              setSavingResult(`${e.name}: ${e.message}`);
              throw e;
            }
          }}>
          Save
        </button>{' '}
        {savingResult}
      </div>
      {/* <ChordSequence chords={chords} />
      <div style={{ margin: '20px 0' }}>
        Processing steps:
        <ul>
          {PROCESSING_STEPS.map(({ name }) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
      <ChordSequence chords={processedChords} /> */}
      <div>
        <h3>
          {artist} - {song}
        </h3>
        {url}
      </div>

      {/* <div style={{ marginTop: 30 }}>storage: {JSON.stringify(chordsDB)}</div> */}
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(SidePanel, <div> Loading ... </div>),
  <div> Error Occur </div>,
);
