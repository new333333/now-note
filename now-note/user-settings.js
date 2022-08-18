const log = require('electron-log');
const fs = require('fs').promises;
const path = require('path');
const nnRepositoryFactory = require('./repository-factory');

class UserSettings {

    #fileName = "userSettings.json";

    constructor(userDataPath) {
        this.userDataPath  = userDataPath;
    }

    #getFilePath() {
        return path.join(this.userDataPath, this.#fileName);
    }

    async connectDefaultRepository() {
        if (!this.settings) {
            await this.#load();
        }

        let repositoryFactory = new nnRepositoryFactory.RepositoryFactory(this.settings.repositories);
        return await repositoryFactory.connectDefaultRepository();
    }

    async #load() {
        try {
            this.settings = await fs.readFile(this.#getFilePath(), "utf-8");
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new UserSettingsNoFoundError(error);
            } else {
                throw new UserSettingsUnknownError(error);
            }
        }
        this.settings = JSON.parse(this.settings);
    }

    async save() {
        await fs.writeFile(this.#getFilePath(), JSON.stringify(this.settings, null, 2));
    }

    setUserName(userName) {
        this.settings = this.settings || {};
        this.settings.userName = userName;
    }

    getUserName() {
        if (this.settings) {
            return this.settings.userName;
        }
        return undefined;
    }

    addRepository(name, path, type, isDefault) {
        this.settings = this.settings || {};
        this.settings.repositories = this.settings.repositories || [];
        this.settings.repositories.push({
            name: name,
			path: path,
			type: type,
			default: isDefault
        });
    }

    async exists() {
        let exists = false;
        if (!this.settings) {
            try {
                await this.#load();
                exists = true;
            } catch (error) {
                log.debug("Can be ignored", error);
            }
        }
        return exists;
    }

}

class UserSettingsUnknownError extends Error {

    constructor(error) {
        super("Unknown error: " + error.message);
        this.error = error;
        this.name = 'UserSettingsUnknownError';
    }

}

class UserSettingsNoFoundError extends Error {

    constructor(error) {
        super(`User setting doesn't exists ("${error}".`);
        this.error = error;
        this.name = 'UserSettingsNoFoundError';
    }

}

module.exports = {
    UserSettings : UserSettings,
    UserSettingsNoFoundError : UserSettingsNoFoundError,
    UserSettingsUnknownError: UserSettingsUnknownError
}
