const log = require('electron-log');

class N3StoreServiceAbstract {

	
	constructor() {
		if (new.target === N3StoreServiceAbstract) {
			throw new TypeError("Cannot construct N3StoreServiceAbstract instances directly");
		}
				
		// TODO: complete list of required methods
		/*if (typeof this.addNote !== "function") {
			throw new TypeError("Must override method addNote");
		}*/

	};


	async close() {
		return await this.closeStore();
	}

	async getStoreConfig() {
		return await this.getStoreConfig();
	}

	async getParents(key) {
		return await this.getParentsStore(key);
	}
	
	// load root nodes, if key undefined
	// load children notes if key defined
	async loadNotes(key) {
		let notes = await this.readNotesStore(key);
		console.log("loadNotes for key", key, notes);
		return notes;
	}
	
	async addNote(parentNoteKey, note, hitMode, relativeToKey) {	
		return await this.addNoteStore(parentNoteKey, note, hitMode, relativeToKey);
	}

	async inTrash(note) {
		return await this.inTrashStore(note);
	}

	async getNote(key) {
		return await this.getNoteStore(key);
	}

	async modifyNote(note) {
		return await this.modifyNoteStore(note);
	}

	async moveNote(key, from, to, hitMode, relativTo) {
		return await this.moveNoteStore(key, from, to, hitMode, relativTo);
	}
		
	async moveNoteToTrash(key, parent) {
		return await this.moveNoteToTrashStore(key, parent);
	}

	async addFile(fileType, fileName, filePathOrBase64, fileTransferType) {
		return await this.writeAssetStore(fileType, fileName, filePathOrBase64, fileTransferType);
	}

	////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////

	async search(searchText, limit, trash) {
		return await this.searchStore(searchText, limit, trash);
	}

	async getIndexedDocuments(count) {
		return await this.getIndexedDocumentsStore(count);
	}

	async iterateNotes(callback, trash) {
		return await this.iterateNotesStore(callback, trash);
	}
	
}

module.exports = N3StoreServiceAbstract;