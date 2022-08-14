const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const joda = require('@js-joda/core');
var _ = require('lodash');

class NoteDataClass {

	#noteDataFileName

	constructor(directory) {
		this.directory = directory;
		this.#noteDataFileName = "data";
	};

	async getChildrenKeys() {
		let noteData = await this.read();
		return noteData.children || [];
	}

	async setParent(key) {
		if (!key) {
			return;
		}
		let parent = key;
		if (parent.startsWith("root_")) {
			parent = "root";
		}
		await this.write({parent: parent});
	}

	async removeChild(childKey) {
		if (!childKey) {
			return;
		}

		let noteData = await this.read();
		noteData.children = noteData.children || [];

		if (!noteData.children.includes(childKey)) {
			return noteData.children;
		} else {
			let childIndex = noteData.children.findIndex(function(key) {
				return key === childKey
			});
			if (childIndex > -1) {
				noteData.children.splice(childIndex, 1);
			}
			await this.write(noteData);
			return noteData.children;
		}
	}

	async addChild(childKey, hitMode, relativTo) {
		if (!childKey) {
			return;
		}

		let noteData = await this.read();
		noteData.children = noteData.children || [];
		let childIndex = noteData.children.findIndex(function(key) {
			return key === childKey
		});
		if (childIndex > -1) {
			noteData.children.splice(childIndex, 1);
		}
			
		if (hitMode === "over") {
			noteData.children.push(childKey);
		} else if (hitMode === "before") {
			let relativToIndex = noteData.children.findIndex(function(key) {
				return key === relativTo
			});
			relativToIndex = relativToIndex > -1 ? relativToIndex : 0;
			noteData.children.splice(relativToIndex, 0, childKey);

		} else if (hitMode === "after") {
			let relativToIndex = noteData.children.findIndex(function(key) {
				return key === relativTo
			});
			relativToIndex = relativToIndex > -1 ? relativToIndex + 1 : noteData.children.length;
			noteData.children.splice(relativToIndex, 0, childKey);
		}
					
		await this.write(noteData);
		return noteData.children;
	}

	#getFilePath() {
		return path.join(this.directory, this.#noteDataFileName + ".json");
	}

	async read() {
		let noteData = {};
		try {
			noteData = await fs.readFile(this.#getFilePath(), "utf-8");
			noteData = JSON.parse(noteData || "{}");
		} catch (error) {
			log.error(error);
		}
		return noteData;
	}

	async write(newNoteData) {
		if (!newNoteData || 
				!(
					newNoteData.hasOwnProperty("createdOn") || 
					newNoteData.hasOwnProperty("createdBy") || 
					newNoteData.hasOwnProperty("modifiedOn") || 
					newNoteData.hasOwnProperty("modifiedBy") || 

					newNoteData.hasOwnProperty("parent") || 
					newNoteData.hasOwnProperty("children") || 

					newNoteData.hasOwnProperty("done") || 
					newNoteData.hasOwnProperty("priority") ||
					newNoteData.hasOwnProperty("type") || 
					newNoteData.hasOwnProperty("tags") || 
					newNoteData.hasOwnProperty("expanded") ||
					newNoteData.hasOwnProperty("links") ||
					newNoteData.hasOwnProperty("backlinks") 
				)
			) {
			return false;
		}

		let oldNoteData = await this.read();
		let mergedNoteData = Object.assign({}, oldNoteData, newNoteData);

		let anyModified = ! _.isEqual(oldNoteData, mergedNoteData);

		if (!anyModified) {
			return anyModified;
		}

		delete mergedNoteData.key;
		delete mergedNoteData.title;
		delete mergedNoteData.description;

		await fs.writeFile(this.#getFilePath(), JSON.stringify(mergedNoteData, null, 2));

		return true;
	}

}

module.exports = NoteDataClass;