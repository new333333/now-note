import { RepositorySQLite } from '../main/repository-SQLite';

test('RepositorySQLite created', () => {
  const sqlRepository = new RepositorySQLite(
    'SQLite Test repository',
    '',
    false,
    'autotester'
  );

  expect(sqlRepository).toBeNull();
});


