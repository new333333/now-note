import RepositorySQLite from '../RepositorySQLite';

export default async function close(repository: RepositorySQLite) {
  if (repository.getSequelize() !== undefined) {
    repository.getSequelize()?.close();
  }
}
