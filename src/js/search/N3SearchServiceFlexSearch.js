const log = require('electron-log');
const N3SearchServiceAbstract = require('./N3SearchServiceAbstract');
const { Index, Document, Worker } = require("flexsearch");
const cheerio = require('cheerio');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class N3SearchServiceFlexSearch extends N3SearchServiceAbstract {

	#flexSearchDocument

	#searchIndexStoreFolderName

	constructor(userSettings, storeService) {
		super();

		this.storageDirectory = userSettings.store;
		this.storeService = storeService;

		this.#searchIndexStoreFolderName = "index";

		this.#flexSearchDocument = new Document({
			tokenize: "forward",
			document: {
				id: "id",
				tag: "type",
				index: ["type", "content", "trash"],
				store: ["type", "title", "path"]
			}
		});

		this.#init();

	}

	#init() {
		let that = this;

		let indexPath = path.join(that.storageDirectory, that.#searchIndexStoreFolderName);
		// log.info("Initialize search in ", indexPath);
		
		return fs.access(indexPath).then(function() {
			// log.info("Search index already exists.");
			return that.#readIndex();
		}).catch(function (err){
			// log.info("Search index doesn't exists. Reindex all notes and assets.");
			return that.reindexAll();
		});
		
	}

	reindexAll() {
		// log.info("Reindex all.");
		let that = this;
		let indexPath = path.join(that.storageDirectory, that.#searchIndexStoreFolderName);

		return fs.mkdir(indexPath, { recursive: true }).then(function() {
			let trash = false;
			return that.storeService.iterateNotes(function(note, parents) {
				that.addNoteToIndex(note, parents, trash);
			}, trash).then(function() {
				let trash = true;
				return that.storeService.iterateNotes(function(note, parents) {
					that.addNoteToIndex(note, parents, trash);
				}, trash).then(function() {
					return that.saveIndex();
				});
			});
		});
	}

	#readIndex() {
		// log.info("Read index");

		let that = this;
		let indexPath = path.join(that.storageDirectory, that.#searchIndexStoreFolderName);


		return new Promise(function(resolveReadIndex, rejectReadIndex) {
			fs.readdir(indexPath, { withFileTypes: true }).then(function(dirents) {

				(function loopFiles(i) {
		
					if (i >= dirents.length) {
						resolveReadIndex();
					} else {
						let dirent = dirents[i];

						if (dirent.isFile()) {
							fs.readFile(path.join(indexPath, dirent.name), "utf-8").then(function(fileContent) {
								// log.info("Read index load file", dirent.name);
								that.#flexSearchDocument.import(dirent.name, fileContent);
								loopFiles(i + 1);
								
							});
						} else {
							loopFiles(i + 1);
						}				
						
					}
				})(0);

				
			});
		});	
	}

	async saveIndex() {
		// log.info("Save index");

		let that = this;
		let indexPath = path.join(that.storageDirectory, that.#searchIndexStoreFolderName);

		let countExportFiles = 0;
		return new Promise(function(resolveSaveIndex, rejectSaveIndex) {

			that.#flexSearchDocument.export(function(key, data) { 
				// log.info("Save index key", key);
				fs.writeFile(path.join(indexPath, key), data);
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

	// TODO: (modifyNote too) history title, description are not indexed
	addNoteToIndex(note, parents, trash = false) {
		//log.debug("addNoteToIndex, note, parents, trash", note, parents, trash);

		let that = this;

		let path = "";
		if (parents) {
			parents.forEach(function(parentNote) {
				path = path + " / " + parentNote.title;
			});
		}
		path = path + " / " + note.title;

		let descriptionClean = that.#cleanDescription(note.description);	
		
		let doc = {
			id: note.key,
			type: "note",
			title: note.title,
			path: path,
			content: note.title + " " + descriptionClean,
			trash: trash
		};

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

module.exports = N3SearchServiceFlexSearch;
