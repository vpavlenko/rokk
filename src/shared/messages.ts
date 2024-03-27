// TODO: type properly
// https://chat.openai.com/share/9b6bbf5a-639d-4bd3-8026-b5d604596888

export const MESSAGE_SONG_OPENED = 'songOpened';

export type SongOpenedData = {
  artist: string;
  song: string;
  chords: string[];
};
