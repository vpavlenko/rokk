import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type ArtistSongChords = {
  [artist: string]: {
    [song: string]: { url: string; chords: string[]; transposition: number };
  };
};

type ChordStorage = BaseStorage<ArtistSongChords> & {
  addChords: (artist: string, song: string, url: string, chords: string[], transposition: number) => Promise<void>;
};

const storage = createStorage<ArtistSongChords>(
  'chord-storage-key',
  {},
  {
    storageType: StorageType.Local,
    liveUpdate: true,
  },
);

const chordStorage: ChordStorage = {
  ...storage,
  addChords: async (artist: string, song: string, url: string, chords: string[], transposition: number) => {
    artist = artist.toLowerCase();
    song = song.toLowerCase();

    const artists: ArtistSongChords = (await storage.get()) || {};

    if (!artists[artist]) {
      artists[artist] = {};
    }

    artists[artist][song] = { url, chords, transposition };

    return storage.set(artists);
  },
};

export default chordStorage;
