import { MESSAGE_HOVER_CHORD, MESSAGE_PAGE_DATA, Message } from '@root/src/shared/messages';
import { useEffect } from 'react';

const attachHoverHandlers = () => {
  const elements = document.querySelectorAll('.podbor__chord');

  const handleMouseEnter = (event: MouseEvent) => {
    if (!event.shiftKey) {
      chrome.runtime.sendMessage({
        action: MESSAGE_HOVER_CHORD,
        data: {
          chord: (event.target as HTMLDivElement).innerText,
        },
      });
    }
  };

  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter);
  });
};

const sendPageData = () =>
  chrome.runtime.sendMessage<Message>({
    action: MESSAGE_PAGE_DATA,
    data: {
      artist: (document.querySelector('span[itemprop="byArtist"]') as HTMLSpanElement)?.innerText,
      song: (document.querySelector('span[itemprop="name"]') as HTMLSpanElement)?.innerText,
      chordsBlock: (document.querySelector('[itemprop="chordsBlock"]') as HTMLPreElement)?.innerHTML,
      chords: Array.from(document.querySelectorAll('.podbor__chord')).map(el => el.getAttribute('data-chord')),
      transposition: parseInt(document.getElementById('tone').innerText, 10) || 0,
    },
  });

export default function App() {
  useEffect(() => attachHoverHandlers(), []);

  useEffect(() => {
    const targetNode = document.querySelector('.b-podbor__text') as HTMLPreElement;
    if (targetNode) {
      const config = { childList: true, subtree: true, characterData: true };

      const callback = () => {
        sendPageData();
        attachHoverHandlers();
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    sendPageData();
  }, []);

  return <div className="rokk_content_view">content view</div>;
}
