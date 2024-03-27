import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';
import useStorage from '@root/src/shared/hooks/useStorage';
import SearchResultItem, { SearchResultItemProps } from './Youtube';
import { MESSAGE_HOVER_CHORD, MESSAGE_PAGE_DATA, Message } from '@root/src/shared/messages';
import ChordPlayer, { playChord } from './ChordPlayer';
import { PROCESSING_STEPS, processChords } from './chordProcessing';

const YOUTUBE_API_KEY = localStorage.getItem('YOUTUBE_API_KEY');

const ChordSequence: React.FC<{ chords: string[] }> = ({ chords }) => (
  <div>
    {chords.map((chord, index) => (
      <>
        <div key={index} style={{ marginRight: 20, display: 'inline-block' }}>
          {chord}
        </div>
      </>
    ))}
  </div>
);

const SidePanel = () => {
  const [artist, setArtist] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [chordsBlock, setChordsBlock] = useState<string>('');
  const [youtubeVideo, setYoutubeVideo] = useState<string | null>(null);
  const [transposition, setTransposition] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[]>([]);
  const [chordsOnCurrentPage, setChordsOnCurrentPage] = useState<string[]>([]);
  const [processedChords, setProcessedChords] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (request: Message, sender: chrome.runtime.MessageSender) => {
      if (request.action === MESSAGE_PAGE_DATA) {
        const { artist, song, chordsBlock, chords } = request.data;
        setChordsOnCurrentPage(chords);
        setArtist(artist);
        setSong(song);
        setChordsBlock(chordsBlock);
        setUrl(sender.url);
        setTransposition(transposition);
      }
      if (request.action === MESSAGE_HOVER_CHORD) {
        const { chord } = request.data;
        playChord(chord, transposition);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [transposition]);

  useEffect(() => {
    if (!artist || !song) {
      return;
    }
    const query = `${artist} ${song}`;
    const search = async () => {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`,
      );
      const data = await response.json();
      setSearchResults(data.items);
    };
    search();
  }, [artist, song]);

  useEffect(() => setProcessedChords(processChords(chordsOnCurrentPage)), [chordsOnCurrentPage]);

  return (
    <div style={{ width: '100vw' }}>
      <div>
        <ChordPlayer enabledChords={processedChords} transposition={transposition} />
      </div>
      <div>transposition: {transposition}</div>
      <div>
        <button onClick={() => setYoutubeVideo(null)}>Close</button>
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
          searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => setYoutubeVideo(result.id.videoId)}
              style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
              <SearchResultItem result={result} />
            </button>
          ))
        )}
      </div>
      <div>
        innerHTML:{' '}
        <ul>
          {chordsBlock
            .split(/\n/g)
            .map(line => [...line.matchAll(/data-chord="([^"]+)"/g)].map(match => match[1]))
            .filter(chords => chords.length > 0)
            .map((chords, index) => (
              <li key={index}>{chords.join(' ')}</li>
            ))}
        </ul>
      </div>
      <div>
        <button onClick={() => chordStorage.addChords(artist, song, url, chordsOnCurrentPage)}>Save</button>
      </div>
      <ChordSequence chords={chordsOnCurrentPage} />
      <div style={{ margin: '20px 0' }}>
        Processing steps:
        <ul>
          {PROCESSING_STEPS.map(({ name }) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
      <ChordSequence chords={processedChords} />
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

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
