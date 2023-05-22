import log from 'electron-log';
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

export default class RepositorySQLiteSetup {
  private umzug: Umzug<Sequelize> | null = null;

  private sequelize: Sequelize | null = null;

  private sequelizeStorage: SequelizeStorage | null = null;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    log.debug('RepositorySQLiteSetup.constructor() create SequelizeStorage');
    this.sequelizeStorage = new SequelizeStorage({ sequelize });
    log.debug('RepositorySQLiteSetup.constructor() repositoryPath:');
    this.umzug = new Umzug({
      migrations: {
        glob: ['migrations/*.ts', { cwd: __dirname }],
      },
      context: sequelize,
      storage: this.sequelizeStorage,
      logger: log,
    });
    log.debug('RepositorySQLiteSetup.constructor() Zmuzu created');
  }

  async existsSchemaMetaTable(): Promise<boolean> {
    log.debug('RepositorySQLiteSetup.existsSchemaMetaTable() start');
    log.debug(
      'RepositorySQLiteSetup.existsSchemaMetaTable() sequelize authorized'
    );
    const [tablesInfo] = await this.sequelize!.query(`PRAGMA table_list`);
    const notesTable = tablesInfo.find((table: any) => {
      return table.name === 'SequelizeMeta';
    });
    return notesTable !== undefined;
  }

  async existsNotesIndexTable(): Promise<boolean> {
    const [tablesInfo] = await this.sequelize!.query(`PRAGMA table_list`);
    const notesTable = tablesInfo.find((table: any) => {
      return table.name === 'Notes_index';
    });
    return notesTable !== undefined;
  }

  async up() {
    log.debug('RepositorySQLiteSetup.up() start');
    const existsSchemaMetaTable = await this.existsSchemaMetaTable();
    if (!existsSchemaMetaTable) {
      const existsNotesIndexTable = await this.existsNotesIndexTable();
      if (existsNotesIndexTable) {
        this.sequelizeStorage?.logMigration({ name: '00_initial.ts' });
        this.sequelizeStorage?.logMigration({ name: '01_initial.ts' });
      } else {
        this.sequelizeStorage?.logMigration({ name: '00_initial.ts' });
        const migrations = await this.umzug!.up();
        log.debug(
          'RepositorySQLiteSetup.setup() logged 00_initial.ts and up migrations',
          migrations
        );
      }
    } else {
      const migrations = await this.umzug!.up();
      log.debug(
        'RepositorySQLiteSetup.setup() clean up migrations:',
        migrations
      );
    }
    log.debug('RepositorySQLiteSetup.up() done');
  }
}
