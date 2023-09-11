import log from 'electron-log';
import { Note } from '../../DataModels';

export default async function getChildrenCount(
  key: string | undefined,
  trash: boolean
) {
  const childrenCount: number = await Note.count({
    where: {
      parent: key,
      trash,
    },
  });
  return childrenCount;
}
