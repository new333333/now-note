const log = require('electron-log');
const { Index, Document, Worker } = require("flexsearch");
const cheerio = require('cheerio');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class SearchServiceFlexSearch {

	#flexSearchDocument

	constructor(directory) {
		this.directory = path.join(directory, "index");

		this.#flexSearchDocument = new Document({
			tokenize: "forward",
			document: {
				id: "id",
				tag: "type",
				index: ["type", "content", "trash"],
				store: ["type", "title", "path"]
			}
		});
	}

	async exists() {
		
		try {
			await fs.access(this.directory); //.then(function() {
			// log.info("Search index already exists.");
			// return that.#readIndex();
			return true;
		} catch(error) {
			// log.info("Search index doesn't exists. Reindex all notes and assets.");
			//return that.reindexAll();
			return false;
		};
		
	}

	async init() {
		return fs.mkdir(this.directory, { recursive: true });
	}

	async #readIndex() {
		log.info("Read index");

		let dirents = await fs.readdir(this.directory, { withFileTypes: true });
		for (let i = 0; i < dirents.length; i++) {
			let dirent = dirents[i];

			if (dirent.isFile()) {
				let fileContent = await fs.readFile(path.join(this.directory, dirent.name), "utf-8");
				this.#flexSearchDocument.import(dirent.name, fileContent);
			}	
		}

	}

	async saveIndex() {
		// log.info("Save index");

		let that = this;

		let countExportFiles = 0;
		return new Promise(function(resolveSaveIndex, rejectSaveIndex) {

			that.#flexSearchDocument.export(function(key, data) { 
				// log.info("Save index key", key);
				fs.writeFile(path.join(that.directory, key), data);
				countExportFiles++;

				if (countExportFiles == 12) {
					resolveSaveIndex();
				}
			});

			// log.info("Save index done");
			

		});

	}

	getIndex() {
		return this.#flexSearchDocument;
	}

	// TODO: (at modifyNote the same): history title, description are not indexed
	addNoteToIndex(noteModel, parents, trash = false) {
		log.debug("addNoteToIndex, noteModel, parents, trash", noteModel, parents, trash);

		let that = this;

		let path = "";
		if (parents) {
			log.debug("addNoteToIndex, parents", parents);
			parents.forEach(function(parentNote) {
				path = path + " / " + parentNote.title;
			});
		}
		path = path + " / " + noteModel.title;

		let descriptionClean = that.#cleanDescription(noteModel.description);	
		
		let doc = {
			id: noteModel.key,
			type: noteModel.type,
			title: noteModel.title,
			path: path,
			content: noteModel.title + " " + descriptionClean,
			trash: trash
		};
		log.debug("addNoteToIndex, flexSearchDocument", doc);
		this.#flexSearchDocument.add(doc);
	}

	modifyNoteIndex(note, parents, trash = false) {
		// log.debug("Modify index note, trash", note.key);

		let that = this;

		let path = "";
		if (parents) {
			parents.forEach(function(parentNote) {
				path = path + " / " + parentNote.title;
			});
		}
		path = path + " / " + note.title;
		
		let descriptionClean = that.#cleanDescription(note.description);
	
		this.#flexSearchDocument.update({
			id: note.key,
			type: "note",
			title: note.title,
			path: path,
			content: note.title + " " + descriptionClean,
			trash: trash
		});
		
	}

	#cleanDescription(description) {
		description = description || "";
		let $htmlCntainer = cheerio.load(description, null, false);
		let currentNoteLinks = [];
		let internalLinks = $htmlCntainer("[data-link-node]");
		internalLinks.each(function(index) {
			let nextLink = internalLinks.eq(index);
			nextLink.remove();
		});
		let descriptionCleaned = $htmlCntainer.html();
		return descriptionCleaned;
	}

}

module.exports = {
	SearchServiceFlexSearch: SearchServiceFlexSearch
}
