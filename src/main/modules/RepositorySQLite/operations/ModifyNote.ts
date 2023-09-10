import log from 'electron-log';
import { NoteDTO } from 'types';
import {
  Description,
  Note,
  NoteNotFoundByKeyError,
  Title,
} from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function modifyNote(
  repository: RepositorySQLite,
  note: NoteDTO,
  skipVersioning: boolean = false
): Promise<NoteDTO | undefined> {
  log.debug('RepositorySQLite.modifyNote() note:', note);
  const noteToModify = await Note.findByPk(note.key);
  if (noteToModify === null) {
    throw new NoteNotFoundByKeyError(note.key);
  }

  const prevTitle = noteToModify.title;
  const prevTitlePath = noteToModify.titlePath;

  if (note.title !== undefined) {
    if (!skipVersioning) {
      await Title.create({
        key: noteToModify.key,
        title: noteToModify.title,
      });
    }
    noteToModify.title = note.title;
  }
  if (note.description !== undefined) {
    let html: string = note.description;
    html = await repository.prepareDescriptionToSave(note.key, html);

    if (!skipVersioning) {
      await Description.create({
        key: noteToModify.key,
        description:
          noteToModify.description !== null ? noteToModify.description : '',
      });
    }
    noteToModify.description = html;
  }
  if (note.type !== undefined) {
    noteToModify.type = note.type;
  }
  if (note.done !== undefined) {
    noteToModify.done = note.done;
  }
  if (note.priority !== undefined) {
    noteToModify.priority = note.priority;
  }
  if (note.expanded !== undefined) {
    noteToModify.expanded = note.expanded;
  }

  await noteToModify.save();
  await repository.addNoteIndex(noteToModify);

  if (prevTitle !== noteToModify.title) {
    const newTitlePath = `${noteToModify.titlePath.substring(
      0,
      noteToModify.titlePath
        .substring(0, noteToModify.titlePath.length - 2)
        .lastIndexOf('/') + 1
    )}${noteToModify.title}/$`;

    log.debug(
      `RepositorySQLite.modifyNote() prevTitlePath=${prevTitlePath}, newTitlePath=${newTitlePath}, noteToModify.keyPath=${noteToModify.keyPath}`
    );
    await repository.updateNoteTitlePath(
      prevTitlePath,
      newTitlePath,
      noteToModify.keyPath
    );
  }

  return repository.noteToNoteDTO(noteToModify, false, true);
}
