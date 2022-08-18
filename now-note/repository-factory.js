const log = require('electron-log');
const nnRepositorySQLite = require('./repository-SQLite');

/*
    Repository:
    {
        "name": "new333333",
        "path": "E:\\Projekte\\now-note\\sqlite\\repo1.db",
        "type": "sqlite3",
        "default": true
	}

*/

let SQLITE3_TYPE = "sqlite3";


class RepositoryFactory {

    #allowedTypes;

    constructor(repositories) {
		this.repositories = repositories;

        this.#allowedTypes = [SQLITE3_TYPE];
    }

    async connectDefaultRepository() {
        if (!this.repositories) {
            throw new Error("No repositories defined.");
        }

        let defaultRepository = this.repositories.find((element) => element.default);
        if (!defaultRepository) {
            throw new Error("No default repository found.");
        }

        return this.connectRepository(defaultRepository);
    }

    async connectRepository(repository) {
        if (this.isSqlite3Type(repository)) {
            let sqlRepository = new nnRepositorySQLite.RepositorySQLite(repository.name, repository.path, repository.default);
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

module.exports = {
    RepositoryFactory : RepositoryFactory,
    SQLITE3_TYPE: SQLITE3_TYPE
}
