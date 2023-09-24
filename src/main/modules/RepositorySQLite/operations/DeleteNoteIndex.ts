import log from 'electron-log';
import { RepositoryIntern } from 'main/modules/DataModels';

export default async function deleteNoteIndex(
  repository: RepositoryIntern,
  key: string
): Promise<void> {
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
