import log from 'electron-log';
import { Link, Note } from '../../DataModels';
import RepositorySQLite from '../RepositorySQLite';

export default async function getBacklinks(
  repository: RepositorySQLite,
  key: string
): Promise<Array<Note>> {
  log.debug(`RepositorySQLite.getBacklinks() key=${key}`);
  const links = await Link.findAll({
    where: {
      to: key,
    },
  });

  const backlinks: Array<Note> = [];

  for (let i = 0; i < links.length; i += 1) {
    log.debug(`RepositorySQLite.getBacklinks() links=${links[i]}`);
    // eslint-disable-next-line no-await-in-loop
    const note = await Note.findByPk(links[i].from, { raw: true });

    if (note !== null) {
      backlinks.push(note);
    }
  }

  log.debug(
    `RepositorySQLite.getBacklinks() key=${key} backlinks=${backlinks}`
  );

  return backlinks;
}
