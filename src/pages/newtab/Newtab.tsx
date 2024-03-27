import React from 'react';
import '@pages/newtab/Newtab.css';
import '@pages/newtab/Newtab.scss';
import useStorage from '@src/shared/hooks/useStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';

const Newtab = () => {
  const chords = useStorage(chordStorage);

  return (
    <div>
      {Object.entries(chords).map(([artist, songs]) => (
        <div key={artist}>
          <h3>{artist}</h3>
          {Object.entries(songs).map(([song, { url, chords, transposition, hasModulation }]) => (
            <div key={song}>
              <a href={url}>{song}</a>: ({transposition}
              {hasModulation && ', +mod'}) {chords.join(' ')}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default withErrorBoundary(withSuspense(Newtab, <div> Loading ... </div>), <div> Error Occur </div>);
