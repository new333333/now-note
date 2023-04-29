import log from 'electron-log';
import { SQLITE3_TYPE, RepositorySQLite } from './repository-SQLite';

/*
    Repository:
    {
        "name": "new333333",
        "path": "E:\\Projekte\\now-note\\sqlite\\repo1.db",
        "type": "sqlite3",
        "default": true
	}

*/


export default class RepositoryFactory {

    #allowedTypes;

    constructor(repositories, userName) {
		  this.repositories = repositories;
      this.userName = userName;

      this.#allowedTypes = [SQLITE3_TYPE];
    }

    async connectDefaultRepository() {
        if (!this.repositories) {
            return undefined;
        }

        // log.info("connectDefaultRepository, this.repositories=", this.repositories);

        let defaultRepository = this.repositories.find(function(element) {
            // log.info("connectDefaultRepository, element=, default=", element, element.default === true);
            if (element.default) {
                return element;
            }
        });

        if (!defaultRepository && this.repositories && this.repositories.length > 0) {
            defaultRepository = this.repositories[0];
        }

        // log.info("connectDefaultRepository, defaultRepository=, nicht gefunden?=", defaultRepository, !defaultRepository );

        if (!defaultRepository) {
            return undefined;
        }

        return this.connectRepository(defaultRepository);
    }

    async connectRepository(repository) {
      // log.debug("RepositorySQLite", RepositorySQLite);

        if (this.isSqlite3Type(repository)) {
            let sqlRepository = new RepositorySQLite(repository.name, repository.path, repository.default, this.userName);
            await sqlRepository.open();
            return sqlRepository;
        } else {
            throw Error(`"${ this.getType(repository) }" is unknown repository type. Known are: ${ this.getAllowedTypes() }`);
        }
    }

    isSqlite3Type(repository) {
        return this.getType(repository) === SQLITE3_TYPE;
    }

    getType(repository) {
        return repository.type;
    }

    getAllowedTypes() {
        return this.#allowedTypes;
    }

}

