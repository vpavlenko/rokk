import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type SongList = {
  [song: string]: { url: string; chords: string[]; transposition: number; hasModulation: boolean };
};

type ArtistSongChords = {
  [artist: string]: SongList;
};

type ChordStorage = BaseStorage<ArtistSongChords> & {
  addChords: (
    artist: string,
    song: string,
    url: string,
    chords: string[],
    transposition: number,
    hasModulation: boolean,
  ) => Promise<void>;
  getSavedTransposition: (artist: string, song: string) => Promise<number>;
  getArtist: (artist: string) => Promise<SongList>;
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
  addChords: async (artist, song, url, chords, transposition, hasModulation) => {
    artist = artist.toLowerCase();
    song = song.toLowerCase();

    const artists: ArtistSongChords = (await storage.get()) || {};

    if (!artists[artist]) {
      artists[artist] = {};
    }

    artists[artist][song] = { url, chords, transposition, hasModulation };

    return storage.set(artists);
  },
  getSavedTransposition: async (artist, song) => {
    artist = artist.toLowerCase();
    song = song.toLowerCase();

    const artists: ArtistSongChords = (await storage.get()) || {};

    return artists[artist]?.[song]?.transposition ?? 0;
  },
  getArtist: async artist => {
    artist = artist.toLowerCase();

    const artists: ArtistSongChords = (await storage.get()) || {};

    return artists[artist];
  },
};

export default chordStorage;
