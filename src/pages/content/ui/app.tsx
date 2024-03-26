import chordStorage from '@root/src/shared/storages/chordStorage';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('content view loaded');
    console.log('podbor: ', document.querySelectorAll('.podbor__chord')[0]);
    // const chord = document.querySelectorAll('.podbor__chord')[0];
    // chord.innerHTML = 'PWN';
    // const transposeDown = document.querySelector('.btn[value="-1"]') as HTMLButtonElement;
    // setTimeout(() => transposeDown.click(), 2000);

    const artist = document.querySelector('span[itemprop="byArtist"]') as HTMLSpanElement;

    artist && chordStorage.addAuthor(artist.innerText);

    chrome.runtime.sendMessage({
      action: 'chordsOnCurrentPage',
      data: Array.from(document.querySelectorAll('.podbor__chord')).map(el => el.getAttribute('data-chord')),
    });
  }, []);

  return <div className="rokk_content_view">content view</div>;
}
