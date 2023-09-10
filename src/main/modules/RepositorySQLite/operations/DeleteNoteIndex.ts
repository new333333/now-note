import log from 'electron-log';
import RepositorySQLite from '../RepositorySQLite';

export default async function deleteNoteIndex(
  repository: RepositorySQLite,
  key: string
) {
  if (key === null) {
    return;
  }

  await repository
    .getSequelize()!
    .query('DELETE FROM Notes_index where key = :key', {
      replacements: {
        key,
      },
    });
}
