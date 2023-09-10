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
    this.umzug = new Umzug({
      migrations: {
        glob: ['migrations/*.ts', { cwd: __dirname }],
      },
      context: sequelize,
      storage: this.sequelizeStorage,
      logger: log,
    });
    log.debug('RepositorySQLiteSetup.constructor() Umzug created');
  }

  async existsSchemaMetaTable(): Promise<boolean> {
    log.debug('RepositorySQLiteSetup.existsSchemaMetaTable() start');
    const [tablesInfo] = await this.sequelize!.query(`PRAGMA table_list`);
    const SequelizeMetaTable = tablesInfo.find((table: any) => {
      return table.name === 'SequelizeMeta';
    });
    return SequelizeMetaTable !== undefined;
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
    log.debug(
      'RepositorySQLiteSetup.up() existsSchemaMetaTable=',
      existsSchemaMetaTable
    );
    if (!existsSchemaMetaTable) {
      const existsNotesIndexTable = await this.existsNotesIndexTable();
      log.debug(
        'RepositorySQLiteSetup.up() existsNotesIndexTable=',
        existsNotesIndexTable
      );
      if (existsNotesIndexTable) {
        this.sequelizeStorage?.logMigration({ name: '00_initial.ts' });
        this.sequelizeStorage?.logMigration({ name: '01_initial.ts' });
      } else {
        // was: this.sequelizeStorage?.logMigration({ name: '00_initial.ts' }); but why?
        const migrations = await this.umzug!.up();
        log.debug(
          'RepositorySQLiteSetup.setup() new repository -> up migrations',
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
