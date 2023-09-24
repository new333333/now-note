import { RepositoryIntern } from '../../DataModels';

export default async function close(
  repository: RepositoryIntern
): Promise<void> {
  if (repository.getSequelize() !== undefined) {
    repository.getSequelize()?.close();
  }
}
