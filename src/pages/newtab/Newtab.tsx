import React, { useMemo } from 'react';
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

const cleanupChords = (chords: string[]): string[] =>
  chords.map(chord => normalizeChord(chord));

const Newtab = () => {
  const chords = useStorage(chordStorage);
  const chordsWithStats = useMemo(() => {
    return Object.fromEntries(
      Object.entries(chords).map(([artist, songs]) => [
        artist,
        Object.fromEntries(
          Object.entries(songs).map(
            ([song, { url, chords, transposition, hasModulation }]) => [
              song,
              {
                url,
                chords,
                cleanedChords: cleanupChords(chords),
                transposition,
                hasModulation,
              },
            ],
          ),
        ),
      ]),
    );
  }, [chords]);

  return (
    <div>
      {Object.entries(chordsWithStats).map(([artist, songs]) => (
        <div key={artist}>
          <h3>{artist}</h3>
          {Object.entries(songs).map(
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
