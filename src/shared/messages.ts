// TODO: type properly
// https://chat.openai.com/share/9b6bbf5a-639d-4bd3-8026-b5d604596888

export const MESSAGE_SONG_OPENED = 'songOpened';
export const MESSAGE_TRANSPOSED = 'transposed';
export const MESSAGE_HOVER_CHORD = 'hoverChord';

export type SongOpenedData = {
  artist: string;
  song: string;
  chords: string[];
};

export type TransposedData = { chords: string[]; transposition: number };

export type HoverChordData = { chord: string };
