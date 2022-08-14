const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const joda = require('@js-joda/core');
var _ = require('lodash');
var NoteDataClass = require('./NoteDataClass');

class NoteClass {

	constructor(directory, note) {
		this.noteDirectoryPath = path.join(directory, note.key);
		this.note = note;
	};

	async getData() {
		let noteDataClass = new NoteDataClass(this.noteDirectoryPath);
		let note = await noteDataClass.read();
		return note;
	}

	async getChildrenKeys() {
		let noteDataClass = new NoteDataClass(this.noteDirectoryPath);
		return await noteDataClass.getChildrenKeys();
	}

	async addChild(childKey, hitMode, relativTo) {
		let noteDataClass = new NoteDataClass(this.noteDirectoryPath);
		return await noteDataClass.addChild(childKey, hitMode, relativTo);
	}

	async removeChild(childKey) {
		let noteDataClass = new NoteDataClass(this.noteDirectoryPath);
		return await noteDataClass.removeChild(childKey);
	}

	async setParent(key) {
		let noteDataClass = new NoteDataClass(this.noteDirectoryPath);
		return await noteDataClass.setParent(key);
	}

}

module.exports = NoteClass;