import log from 'electron-log';
import { NoteDTO } from 'types';
import {
  DescriptionModel,
  NoteModel,
  NoteNotFoundByKeyError,
  RepositoryIntern,
  TitleModel,
} from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';

const modifyNotenLog = log.scope('RepositorySQLite.modifyNote');

export default async function modifyNote(
  repository: RepositoryIntern,
  note: NoteDTO,
  skipVersioning: boolean = false
): Promise<NoteDTO | undefined> {
  modifyNotenLog.debug(`start note=${note}`);
  if (note.key === null || note.key === undefined) {
    return undefined;
  }
  const noteToModify = await NoteModel.findByPk(note.key);
  if (noteToModify === null) {
    throw new NoteNotFoundByKeyError(note.key);
  }

  const prevTitle = noteToModify.title;
  const prevTitlePath = noteToModify.titlePath;

  if (note.title !== undefined) {
    if (!skipVersioning) {
      await TitleModel.create({
        key: noteToModify.key,
        title: noteToModify.title,
      });
    }
    noteToModify.title = note.title || '';
  }
  if (note.description !== undefined) {
    let html: string | null = note.description;
    html = await repository.prepareDescriptionToSave(note.key, html || '');

    if (!skipVersioning) {
      await DescriptionModel.create({
        key: noteToModify.key,
        description:
          noteToModify.description !== null ? noteToModify.description : '',
      });
    }
    noteToModify.description = html;
  }
  if (note.type !== undefined && note.type !== null) {
    noteToModify.type = note.type;
  }
  if (note.done !== undefined && note.done !== null) {
    noteToModify.done = note.done;
  }
  if (note.priority !== undefined && note.priority !== null) {
    noteToModify.priority = note.priority;
  }
  if (note.expanded !== undefined && note.expanded !== null) {
    noteToModify.expanded = note.expanded;
  }
  if (prevTitle !== noteToModify.title) {
    await setKeyAndTitlePath(noteToModify);
  }
  await noteToModify.save();
  await repository.addNoteIndex(noteToModify);

  if (prevTitle !== noteToModify.title) {
    log.debug(
      `RepositorySQLite.modifyNote() prevTitlePath=${prevTitlePath}, noteToModify.titlePath=${noteToModify.titlePath}, noteToModify.keyPath=${noteToModify.keyPath}`
    );
    await repository.updateNoteTitlePath(
      prevTitlePath,
      noteToModify.titlePath,
      noteToModify.keyPath
    );
  }
  modifyNotenLog.debug(`ready`);
  return noteToModify.toDTO();
}
