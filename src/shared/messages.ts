// TODO: type properly
// https://chat.openai.com/share/9b6bbf5a-639d-4bd3-8026-b5d604596888

export const MESSAGE_PAGE_DATA = 'pageData';
export const MESSAGE_HOVER_CHORD = 'hoverChord';

export type PageData = {
  artist: string;
  song: string;
  chordsBlock: string;
  chords: string[];
  transposition: number;
};

export type HoverChordData = { chord: string };

export type Message =
  | { action: typeof MESSAGE_PAGE_DATA; data: PageData }
  | { action: typeof MESSAGE_HOVER_CHORD; data: HoverChordData };
