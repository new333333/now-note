import log from 'electron-log';
import { Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

// load root nodes, if key undefined
// load children notes if key defined
export default async function getChildren(
  repository: RepositorySQLite,
  key: string | null | undefined,
  trash: boolean = false
): Promise<Array<Note>> {
  log.debug(`RepositorySQLite.getChildren() key=${key}, trash=${trash}`);
  const notes = await Note.findAll({
    where: {
      parent: key === undefined ? null : key,
      trash,
    },
    order: [['position', 'ASC']],
  });

  const resultNotes: Array<Note> = [];
  for (let i = 0; i < notes.length; i += 1) {
    const noteModel = notes[i];
    resultNotes.push(noteModel.dataValues);
  }
  return resultNotes;
}
