const log = require('electron-log');
const fss = require('fs');
const fs = require('fs').promises;
const path = require('path');
const nnRepositoryFactory = require('./repository-factory');

class UserSettings {

    #settingsFileName = "userSettings.json";

    constructor(workingPath, userDataPath, userName) {
        this.workingPath = workingPath;
        this.userDataPath = userDataPath;
        // log..info("UserSettings.constructor userName", userName);
        this.userName = userName;
    }

    #getFilePath() {
        if (this.filePath) {
            return this.filePath;
        } else {

            if (fss.existsSync(path.join(this.workingPath, this.#settingsFileName))) {
                this.filePath = path.join(this.workingPath, this.#settingsFileName);
            } else {
                this.filePath = path.join(this.userDataPath, this.#settingsFileName);
            }


        }
        log.info("UserSettings. #getFilePath, this.filePath", this.filePath);
        return this.filePath;
    }

    async getRepositories() {
        if (!this.settings) {
            await this.#load();
        }
        return this.settings.repositories;
    }

    async connectDefaultRepository() {
        if (!this.settings) {
            await this.#load();
        }
        // log..info("UserSettings call RepositoryFactory this.userName", this.userName);
        let repositoryFactory = new nnRepositoryFactory.RepositoryFactory(this.settings.repositories, this.userName);
        return await repositoryFactory.connectDefaultRepository();
    }

    async connectRepository(repositoryFolder) {
        if (!this.settings) {
            try {
                await this.#load();
            } catch (error) {
            }
        }

        let repositoryByPath = this.settings.repositories.find(function(repository) {
            // log..info("connectRepository ", repositoryFolder, repository.path, repository.path == repositoryFolder);
            return repository.path == repositoryFolder;
        });

        this.settings.repositories.forEach(repository => {
            repository.default = repository.path == repositoryFolder;
        });
        this.save();

        let repositoryFactory = new nnRepositoryFactory.RepositoryFactory(this.settings.repositories, this.userName);
        return await repositoryFactory.connectRepository(repositoryByPath);
    }
 
    async #load() {
        try {
            this.settings = await fs.readFile(this.#getFilePath(), "utf-8");
            this.settings = JSON.parse(this.settings);
        } catch (error) {
            log.warn(error);
            this.settings = this.settings || {};
            this.settings.repositories = this.settings.repositories || [];
        }
    }

    async save() {
        await fs.writeFile(this.#getFilePath(), JSON.stringify(this.settings, null, 2));
    }

    async addRepository(name, repositoryFolder, type) {
        try {
            await this.#load();
        } catch (error) {
        }

        let repositoryByPath = this.settings.repositories.find(function(repository) {
            return repository.path == repositoryFolder;
        });

        if (!repositoryByPath) {
            this.settings.repositories.push({
                name: name,
                path: repositoryFolder,
                type: type,
                default: this.settings.repositories.length == 0,
            });
        } else {
            // log..info(`Repository ${repositoryFolder} already exists.`);
        }
    }

    async exists() {
        let exists = false;
        if (!this.settings) {
            try {
                await this.#load();
                exists = true;
            } catch (error) {
                // log..debug("Can be ignored", error);
            }
        }
        return exists;
    }

}

module.exports = {
    UserSettings : UserSettings,
}
