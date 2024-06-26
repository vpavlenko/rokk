import {
  MESSAGE_HOVER_CHORD,
  MESSAGE_PAGE_DATA,
  Message,
  PageData,
} from '@root/src/shared/messages';
import chordStorage from '@root/src/shared/storages/chordStorage';
import { useEffect } from 'react';
import { isPrimaryChord } from '../../sidepanel/ChordPlayer';

const hoverChord = (event: MouseEvent) => {
  if (!event.shiftKey) {
    chrome.runtime.sendMessage({
      action: MESSAGE_HOVER_CHORD,
      data: {
        chord: (event.target as HTMLDivElement).innerText,
      },
    });
  }
};

const attachHoverHandlers = () => {
  const elements = document.querySelectorAll('.podbor__chord');

  elements.forEach(element => {
    element.addEventListener('mouseenter', hoverChord);
  });
};

const highlightUnusualChords = () => {
  const elements = document.querySelectorAll('.podbor__chord');

  elements.forEach((element: HTMLDivElement) => {
    if (!isPrimaryChord(element.getAttribute('data-chord'))) {
      element.style.border = '1px solid red';
    }
  });
};

const getPageData = (): PageData => ({
  artist: (document.querySelector('span[itemprop="byArtist"]') as HTMLSpanElement)
    ?.innerText,
  song: (document.querySelector('span[itemprop="name"]') as HTMLSpanElement)?.innerText,
  chordsBlock: (document.querySelector('[itemprop="chordsBlock"]') as HTMLPreElement)
    ?.innerHTML,
  chords: Array.from(document.querySelectorAll('.podbor__chord')).map(el =>
    el.getAttribute('data-chord'),
  ),
  transposition: parseInt(document.getElementById('tone')?.innerText, 10) || 0,
});

const sendPageData = () =>
  chrome.runtime.sendMessage<Message>({
    action: MESSAGE_PAGE_DATA,
    data: getPageData(),
  });

const { artist, song } = getPageData();

const enhanceArtistPage = async () => {
  const artist = (
    document.querySelector('.artist-profile__info h1') as HTMLHeadingElement
  )?.innerText;
  if (!artist) return;
  const songs = await chordStorage.getArtist(artist);
  document.querySelectorAll('.g-link').forEach((a: HTMLLinkElement) => {
    if (songs[a.innerText.toLowerCase()]) {
      a.style.setProperty('background-color', '#dfd');
    }
  });
};

export default function App() {
  useEffect(() => {
    const fetchTransposition = async () => {
      if (!artist || !song) return;
      const savedTransposition = await chordStorage.getSavedTransposition(artist, song);
      if (savedTransposition !== 0) {
        (
          document.querySelector('#form_transpon input[name="tone"]') as HTMLInputElement
        ).value = (savedTransposition + 1).toString();
        (document.querySelector('button[value="-1"]') as HTMLButtonElement).click();
      }
    };

    const targetNode = document.querySelector('.b-podbor__text') as HTMLPreElement;
    if (targetNode) {
      const config = { childList: true, subtree: true, characterData: true };

      const handleTransposition = () => {
        attachHoverHandlers();
        highlightUnusualChords();
        sendPageData();
      };

      const observer = new MutationObserver(handleTransposition);
      observer.observe(targetNode, config);

      fetchTransposition();
      handleTransposition();
    }

    enhanceArtistPage();
  }, []);

  return <div className="rokk_content_view"></div>;
}
