import { createStorage, StorageType } from '@src/shared/storages/base';

const storage = createStorage<{ [key: string]: number }>(
  'chord-storage-key',
  {},
  {
    storageType: StorageType.Local,
    liveUpdate: true,
  },
);

const chordStorage = {
  ...storage,
  addAuthor: async author => {
    await storage.set(authors => ({ ...authors, [author]: 42 }));
  },
};

export default chordStorage;
