import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';
import useStorage from '@root/src/shared/hooks/useStorage';
import SearchResultItem, { SearchResultItemProps } from './Youtube';
import { MESSAGE_SONG_OPENED, MESSAGE_TRANSPOSED, SongOpenedData, TransposedData } from '@root/src/shared/messages';
import ChordPlayer from './ChordPlayer';
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
  const [youtubeVideo, setYoutubeVideo] = useState<string | null>(null);
  const chordsDB = useStorage(chordStorage);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[]>([]);
  const [chordsOnCurrentPage, setChordsOnCurrentPage] = useState<string[]>([]);
  const [processedChords, setProcessedChords] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (request, sender: chrome.runtime.MessageSender) => {
      if (request.action === MESSAGE_SONG_OPENED) {
        const { artist, song, chords } = request.data as SongOpenedData;
        setChordsOnCurrentPage(chords);
        setArtist(artist);
        setSong(song);
        setUrl(sender.url);
      }
      if (request.action === MESSAGE_TRANSPOSED) {
        const { chords } = request.data as TransposedData;
        setChordsOnCurrentPage(chords);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

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
        <ChordPlayer enabledChords={processedChords} />
      </div>
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

      <div style={{ marginTop: 30 }}>storage: {JSON.stringify(chordsDB)}</div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
