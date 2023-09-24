import log from 'electron-log';
import { NoteModel } from '../../DataModels';

export default async function getChildrenCount(
  key: string | undefined,
  trash: boolean
) {
  const childrenCount: number = await NoteModel.count({
    where: {
      parent: key,
      trash,
    },
  });
  return childrenCount;
}
