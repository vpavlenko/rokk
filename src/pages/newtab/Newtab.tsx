import React, { useMemo, useState } from 'react';
import '@pages/newtab/Newtab.css';
import '@pages/newtab/Newtab.scss';
import useStorage from '@src/shared/hooks/useStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';
import { normalizeChord } from '../sidepanel/ChordPlayer';
import { MESSAGE_HOVER_CHORD } from '@root/src/shared/messages';

// how to make stats:
// 1. clean up chords
// 2. make stats

// copied to not to have React Event vs native Event type mismatch
const hoverChord = (event: React.MouseEvent) => {
  if (!event.shiftKey) {
    chrome.runtime.sendMessage({
      action: MESSAGE_HOVER_CHORD,
      data: {
        chord: (event.target as HTMLDivElement).innerText,
      },
    });
  }
};

type Counter = { [key: string]: number };

const cleanupChords = (chords: string[]): string[] =>
  chords.map(chord => normalizeChord(chord));

const Newtab = () => {
  const [showEverySong, setShowEverySong] = useState<boolean>(true);
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowEverySong(event.target.checked);
  };

  const chords = useStorage(chordStorage);
  const chordsWithStats = useMemo(() => {
    return Object.fromEntries(
      Object.entries(chords).map(([artist, songs]) => {
        const chordCounts: Counter = {};

        const songsWithStats = Object.fromEntries(
          Object.entries(songs).map(
            ([song, { url, chords, transposition, hasModulation }]) => {
              const cleanedChords = cleanupChords(chords);

              new Set(cleanedChords).forEach(chord => {
                chordCounts[chord] = (chordCounts[chord] || 0) + 1;
              });

              return [
                song,
                {
                  url,
                  chords,
                  cleanedChords,
                  transposition,
                  hasModulation,
                },
              ];
            },
          ),
        );

        return [
          artist,
          {
            songs: songsWithStats,
            chordCounts,
          },
        ];
      }),
    );
  }, [chords]);

  return (
    <div>
      <div>
        <label>
          Show Every Song
          <input
            type="checkbox"
            checked={showEverySong}
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      {Object.entries(chordsWithStats).map(([artist, { songs, chordCounts }]) => (
        <div key={artist}>
          <h3>{artist}</h3>
          <div style={{ marginBottom: 10 }}>
            {Object.entries(chordCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([chord, count]) => (
                <span key={chord}>
                  {chord}: {count}{' '}
                  {`(${((count / Object.keys(songs).length) * 100).toFixed(0)}%)`}
                  &nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              ))}
          </div>
          {showEverySong &&
            Object.entries(songs).map(
              ([song, { url, chords, cleanedChords, transposition, hasModulation }]) => (
                <div key={song} style={{ marginBottom: 10 }}>
                  <a href={url}>{song}</a>: ({transposition}
                  {hasModulation && ', +mod'})
                  <div>
                    <b>source_: </b>
                    {chords.map(chord => (
                      <>
                        <span>{chord}</span>&nbsp;
                      </>
                    ))}
                  </div>
                  <div>
                    <b>cleaned:</b>{' '}
                    {cleanedChords.map(chord => (
                      <>
                        <span style={{ cursor: 'pointer' }} onMouseEnter={hoverChord}>
                          {chord}
                        </span>
                        &nbsp;
                      </>
                    ))}
                  </div>
                </div>
              ),
            )}
        </div>
      ))}
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Newtab, <div> Loading ... </div>),
  <div> Error Occur </div>,
);
