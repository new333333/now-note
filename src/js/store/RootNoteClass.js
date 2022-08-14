const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const joda = require('@js-joda/core');
var _ = require('lodash');

class RootNoteClass {

	#rootFileName
	#trashFileName

	constructor(directory, trash) {
		this.directory = directory;

		this.trash = trash;

		this.#rootFileName = "root";
		this.#trashFileName = "trash";
	};

	#getFilePath() {
		return path.join(this.directory, (this.trash ? this.#trashFileName : this.#rootFileName) + ".json");
	}

	getKey() {
		return this.trash ? this.#trashFileName : this.#rootFileName;
	}

	async getChildrenKeys() {
		let childrenKeys = [];
		try {
			childrenKeys = await fs.readFile(this.#getFilePath(), "utf-8");
			childrenKeys = childrenKeys || "[]";
			childrenKeys = JSON.parse(childrenKeys);
		} catch (error) {
			log.warn(error);
		}
		return childrenKeys;
	}

	async setChildrenKeys(childrenKeys) {
		await fs.writeFile(this.#getFilePath(), JSON.stringify(childrenKeys, null, 2));
	}

	async removeChild(childKey) {
		if (!childKey) {
			return;
		}

		let childrenKeys = await this.getChildrenKeys();
		childrenKeys = childrenKeys || [];

		if (!childrenKeys.includes(childKey)) {
			return childrenKeys;
		} else {
			let childIndex = childrenKeys.findIndex(function(key) {
				return key === childKey
			});
			if (childIndex > -1) {
				childrenKeys.splice(childIndex, 1);
			}
			await this.setChildrenKeys(childrenKeys);
			return childrenKeys;
		}
	}

	async addChild(childKey, hitMode, relativTo) {
		if (!childKey) {
			return;
		}
		let childrenKeys = await this.getChildrenKeys();
		let childIndex = childrenKeys.findIndex(function(key) {
			return key === childKey;
		});
		if (childIndex > -1) {
			childrenKeys.splice(childIndex, 1);
		}
			
		if (hitMode === "over") {
			childrenKeys.push(childKey);
		} else if (hitMode === "before") {
			let relativToIndex = childrenKeys.findIndex(function(key) {
				return key === relativTo
			});
			relativToIndex = relativToIndex > -1 ? relativToIndex : 0;
			childrenKeys.splice(relativToIndex, 0, childKey);

		} else if (hitMode === "after") {
			let relativToIndex = childrenKeys.findIndex(function(key) {
				return key === relativTo
			});
			relativToIndex = relativToIndex > -1 ? relativToIndex + 1 : childrenKeys.length;
			childrenKeys.splice(relativToIndex, 0, childKey);
		}
					
		await this.setChildrenKeys(childrenKeys);

		return childrenKeys;
	}

}

module.exports = RootNoteClass;