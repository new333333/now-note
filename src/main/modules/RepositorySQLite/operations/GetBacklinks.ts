import log from 'electron-log';
import { NoteDTO, Repository } from 'types';
import { LinkModel, NoteModel } from '../../DataModels';

export default async function getBacklinks(
  repository: Repository,
  key: string
): Promise<Array<NoteDTO>> {
  log.debug(`RepositorySQLite.getBacklinks() key=${key}`);
  const links = await LinkModel.findAll({
    where: {
      to: key,
    },
  });

  const backlinks: Array<NoteDTO> = [];

  for (let i = 0; i < links.length; i += 1) {
    log.debug(`RepositorySQLite.getBacklinks() links=${links[i]}`);
    // eslint-disable-next-line no-await-in-loop
    const note: NoteModel | null = await NoteModel.findByPk(links[i].from);

    if (note !== null) {
      backlinks.push(note.toDTO());
    }
  }

  log.debug(
    `RepositorySQLite.getBacklinks() key=${key} backlinks=${backlinks}`
  );

  return backlinks;
}
