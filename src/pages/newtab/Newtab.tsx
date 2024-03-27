import React from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/newtab/Newtab.css';
import '@pages/newtab/Newtab.scss';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import chordStorage from '@root/src/shared/storages/chordStorage';

const Newtab = () => {
  // const theme = useStorage(exampleThemeStorage);
  const chords = useStorage(chordStorage);

  return <div className="App">{JSON.stringify(chords)}</div>;
};

export default withErrorBoundary(withSuspense(Newtab, <div> Loading ... </div>), <div> Error Occur </div>);
