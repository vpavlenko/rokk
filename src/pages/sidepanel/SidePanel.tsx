import React, { useEffect, useState } from 'react';
import '@pages/sidepanel/SidePanel.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';
import useStorage from '@root/src/shared/hooks/useStorage';
import SearchResultItem, { SearchResultItemProps } from './Youtube';
import { MESSAGE_SONG_OPENED, SongOpenedData } from '@root/src/shared/messages';
import ChordPlayer from './ChordPlayer';

const YOUTUBE_API_KEY = localStorage.getItem('YOUTUBE_API_KEY');

const SidePanel = () => {
  const [artist, setArtist] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [youtubeVideo, setYoutubeVideo] = useState<string | null>(null);
  const chords = useStorage(chordStorage);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[]>([]);
  const [chordsOnCurrentPage, setChordsOnCurrentPage] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = request => {
      if (request.action === MESSAGE_SONG_OPENED) {
        const { artist, song, chords } = request.data as SongOpenedData;
        setChordsOnCurrentPage(chords);
        setArtist(artist);
        setSong(song);
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

  return (
    <div style={{ width: '100vw' }}>
      <div>
        <ChordPlayer />
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
              src={`https://www.youtube.com/embed/${youtubeVideo}`}
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
        <h3>
          {artist} - {song}
        </h3>
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
      <div style={{ marginTop: 30 }}>storage: {JSON.stringify(chords)}</div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
