import log from 'electron-log';
import { QueryTypes } from 'sequelize';
import { HitMode, NoteDTO } from 'types';
import {
  LinkModel,
  NoteModel,
  NoteNotFoundByKeyError,
  RepositoryIntern,
} from '../../DataModels';
import { setKeyAndTitlePath } from '../RepositorySQLiteUtils';
import getChildrenCount from './GetChildrenCount';

export default async function addNote(
  repository: RepositoryIntern,
  parentNoteKey: string,
  note: NoteDTO,
  hitMode: HitMode,
  relativeToKey?: string
): Promise<NoteDTO | undefined> {
  let parent: string | null = parentNoteKey.startsWith('root_')
    ? null
    : parentNoteKey;
  let { position } = note;

  if (hitMode === 'firstChild') {
    await repository
      .getSequelize()!
      .query(
        `UPDATE Notes SET position = position + 1 where ${
          parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash`,
        {
          replacements: {
            parent,
            trash: false,
          },
        }
      );

    position = 0;
  } else if (hitMode === 'over') {
    const max: number = await NoteModel.max('position', {
      where: {
        parent: parentNoteKey,
      },
    });

    position = max == null ? 0 : max + 1;
  } else if (hitMode === 'after') {
    const relativNote: NoteModel | null = await NoteModel.findByPk(
      relativeToKey
    );
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(relativeToKey);
    }

    await repository
      .getSequelize()!
      .query(
        `UPDATE Notes SET position = position + 1 where ${
          relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash and position > :position`,
        {
          replacements: {
            parent: relativNote.parent,
            position: relativNote.position,
            trash: false,
          },
          type: QueryTypes.SELECT,
        }
      );

    parent = relativNote.parent;
    position = relativNote.position + 1;
  } else if (hitMode === 'before') {
    const relativNote: NoteModel | null = await NoteModel.findByPk(
      relativeToKey
    );
    if (relativNote === null) {
      throw new NoteNotFoundByKeyError(relativeToKey);
    }

    await repository
      .getSequelize()!
      .query(
        `UPDATE Notes SET position = position + 1 where ${
          relativNote.parent == null ? 'parent is NULL ' : 'parent = :parent'
        } and trash = :trash and position >= :position`,
        {
          replacements: {
            parent: relativNote.parent,
            position: relativNote.position,
            trash: false,
          },
          type: QueryTypes.SELECT,
        }
      );

    parent = relativNote.parent;
    position = relativNote.position;
  }
  log.debug(`RepositorySQLite.addNote() parent=${parent}`);
  log.debug(`RepositorySQLite.addNote() position=${position}`);

  const createdBy: string = note.createdBy || repository.getUserName();
  const expanded: boolean = note.expanded || false;
  const done: boolean = note.done || false;

  // create Note because need key
  const newNote = NoteModel.build({
    title: note.title || '',
    parent,
    position: position || 0,
    type: note.type || 'note',
    createdBy,
    done,
    priority: note.priority || 0,
    expanded,
    trash: false,
    linkToKey: note.linkToKey,
    keyPath: '',
    titlePath: '',
    tags: '',
    childrenCount: 0,
  });

  await setKeyAndTitlePath(newNote);
  log.debug(
    `RepositorySQLite.addNote() newNote.keyPath=${newNote.keyPath}, newNote.titlePath=${newNote.titlePath}`
  );

  const description = await repository.prepareDescriptionToSave(
    newNote.key,
    note.description || ''
  );

  newNote.description = description;
  newNote.childrenCount = 0;

  await newNote.save();

  if (newNote.linkToKey) {
    await LinkModel.create({
      from: newNote.key,
      to: newNote.linkToKey,
      type: 'note',
    });
  }

  await repository.addNoteIndex(newNote);

  if (parent !== null) {
    const parentNote = await NoteModel.findByPk(parent);
    if (parentNote !== null) {
      parentNote.childrenCount = await getChildrenCount(
        parentNote.key,
        parentNote.trash
      );
      parentNote.save();
    }
  }

  return newNote.toDTO();
}
