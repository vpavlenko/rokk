import { MESSAGE_SONG_OPENED, MESSAGE_TRANSPOSED } from '@root/src/shared/messages';
import chordStorage from '@root/src/shared/storages/chordStorage';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const targetNode = document.querySelector('.b-podbor__text') as HTMLPreElement;
    if (targetNode) {
      const config = { childList: true, subtree: true, characterData: true };

      const callback = () => {
        chrome.runtime.sendMessage({
          action: MESSAGE_TRANSPOSED,
          data: {
            chords: Array.from(document.querySelectorAll('.podbor__chord')).map(el => el.getAttribute('data-chord')),
          },
        });
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    console.log('content view loaded');
    console.log('podbor: ', document.querySelectorAll('.podbor__chord')[0]);
    // const chord = document.querySelectorAll('.podbor__chord')[0];
    // chord.innerHTML = 'PWN';
    // const transposeDown = document.querySelector('.btn[value="-1"]') as HTMLButtonElement;
    // setTimeout(() => transposeDown.click(), 2000);

    const artist = (document.querySelector('span[itemprop="byArtist"]') as HTMLSpanElement)?.innerText;
    const song = (document.querySelector('span[itemprop="name"]') as HTMLSpanElement)?.innerText;

    artist && chordStorage.addAuthor(artist);

    chrome.runtime.sendMessage({
      action: MESSAGE_SONG_OPENED,
      data: {
        artist,
        song,
        chords: Array.from(document.querySelectorAll('.podbor__chord')).map(el => el.getAttribute('data-chord')),
      },
    });
  }, []);

  return <div className="rokk_content_view">content view</div>;
}
