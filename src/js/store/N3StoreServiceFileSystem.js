const log = require('electron-log');
const N3StoreServiceAbstract = require('./N3StoreServiceAbstract');
const N3SearchServiceFlexSearch = require('../search/N3SearchServiceFlexSearch');
const path = require('path');
const fs = require('fs').promises;
const constants = require('fs').constants;
const fsx = require('fs-extra');
const joda = require('@js-joda/core');
const cheerio = require('cheerio');
const crypto = require('crypto');
const NoteDataClass = require('./NoteDataClass');
const NoteClass = require('./NoteClass');
const RootNoteClass = require('./RootNoteClass');

class N3StoreServiceFileSystem extends N3StoreServiceAbstract {

	#STOREVERSION = 1;
	
	#configFileName

	#assetsFolderName
	#assetsMetaDataFileName
	
	#notesFolderName

	#noteTitleFileName
	#noteDescriptionFileName


	// TODO: remove
	#trashChildrenFileName
	#noteChildrenFileName

	constructor(userSettings) {
		super();

		this.searchService = new N3SearchServiceFlexSearch(userSettings, this);

		this.storageDirectory = userSettings.store;
		this.userName = userSettings.userName;
		
		this.#configFileName = "config";

		this.#assetsFolderName = "assets";
		this.#assetsMetaDataFileName = "metadata";

		this.#notesFolderName = "notes";

		this.#noteTitleFileName = "title";
		this.#noteDescriptionFileName = "description";


		// TODO: remove
		this.#trashChildrenFileName = "trash_children";
		this.#noteChildrenFileName= "children";
	};

	async closeStore() {
		return await this.searchService.saveIndex();
	}

	async getStoreConfig(appVersion) {
		
		let config = await this.#readStoreConfig();
		config.storeVersion = config.storeVersion || 0;
		config.storeVersion = config.storeVersion * 1;

		// log.debug("Storage config, #STOREVERSION", config, this.#STOREVERSION);

		let storeItActuell = config.storeVersion == this.#STOREVERSION;
		// log.debug("Ist storage version actuell?", storeItActuell);

		if (!storeItActuell) {
			await this.#migrateToCurrentStorageVersion(appVersion, config.version);
			config = await this.#readStoreConfig();
		}			
		return config;
	
	}

	async #readStoreConfig() {
		let configFile = path.join(this.storageDirectory, this.#configFileName + ".json");
		let config = {};

		try {
			config = await fs.readFile(configFile, "utf-8");
			config = JSON.parse(config || "{}");
		} catch (err) {
			// log.debug(err);
		};
		return config;
	}

	async #migrateToCurrentStorageVersion(appVersion, savedStoreVersion) {
		// log.debug("Migrate storage to current version.");
		if (!savedStoreVersion && this.#STOREVERSION == 1) {
			await this.#migratStore_from_v0_to_v1();
		}
		await this.#reindexAll();
		await this.#writeStoreConfig(appVersion);
	}
	
	async #writeStoreConfig(appVersion) {
		let configFile = path.join(this.storageDirectory, this.#configFileName + ".json");
		let config = {
			appVersion: appVersion,
			storeVersion: this.#STOREVERSION,
			createdOn: joda.Instant.now().toString(),
			createdBy: this.userName
		};
		// log.debug("Save store config to", configFile);
		await fs.writeFile(configFile, JSON.stringify(config, null, 2));
	}

	async #migratStore_from_v0_to_v1() {
		// backup all first!
		// log.debug("TODO: Backup befor migrating to store version 1");
		//try {
		//	fsx.copySync(path.join(this.storageDirectory), path.join(this.storageDirectory, "backup_before_migration_to_store_" +this.#STOREVERSION))
		//	console.log('success!')
		//  } catch (err) {
		//	console.error(err)
		//  }

		// migrate notes AND trash notes
		// log.debug("TODO: Migrate notes to store version 1");

		// migrate assets
		// log.debug("TODO: Migrate assets to store version 1");
		
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	

	#getNoteClassInstance(key, trash) {
		let noteClass;
		if (key && !key.startsWith("root_")) {
			noteClass = new NoteClass(this.#getNotesDirectoryPath(), {key: key});
		} else {
			noteClass = new RootNoteClass(this.storageDirectory, trash);
		}
		return noteClass;
	}

	async inTrashStore(note) {
		//let note = #getNoteClassInstance(note.key);
		//return note.inTrash();

		let parentsObj = await this.getParentsStore(note.key);
		return parentsObj.trash;
	}

	async #readNoteTitle(notesFolder) {
		let data = await fs.readFile(path.join(notesFolder, this.#noteTitleFileName + ".json"), "utf-8");
		data = data || "{}";
		data = JSON.parse(data);
		return data;
	}


	async #readNoteDescription(notesFolder) {
		let html = "";
		try {
			html = await fs.readFile(path.join(notesFolder, this.#noteDescriptionFileName + ".html"), "utf-8");
		} catch (err) {

		}
		html = await this.#setImagesPath(html);
		html = await this.#setAttachmentsPath(html);
		html = await this.#updateLinksAfterRead(html);
		
		return html;
	}

	

	async #writeNoteTitle(noteFolder, note) {
		if (!note || !note.hasOwnProperty("title")) {
			return false;
		} 
		let noteTitleFile = path.join(noteFolder, this.#noteTitleFileName + ".json");

		try {
			let text = await fs.readFile(noteTitleFile, "utf-8");
			let prevTitle = JSON.parse(text);
			let timeStampAsTime = joda.Instant.parse(prevTitle.timeStamp).epochSecond();
			let prevNoteTitleFile = path.join(noteFolder, this.#noteTitleFileName + "." + timeStampAsTime + ".json");
			await fs.writeFile(prevNoteTitleFile, JSON.stringify(prevTitle, null, 2));
			let title = {
				title: note.title,
				timeStamp: joda.Instant.now().toString()
			};
			await fs.writeFile(noteTitleFile, JSON.stringify(title, null, 2));
			return true;

		} catch (err) {
			// not yet exists, create title
			let title = {
				title: note.title,
				timeStamp: joda.Instant.now().toString()
			};
			
			await fs.writeFile(noteTitleFile, JSON.stringify(title, null, 2));
			return true;
		};

	}

	async #writeNoteData(noteFolder, note) {
		note.modifiedOn = joda.Instant.now().toString();
		note.modifiedBy = this.userName;

		let noteDataClass = new NoteDataClass(noteFolder);
		let anyModified = await noteDataClass.write(note);
		return anyModified;
	}

	async #writeNoteDescription(noteFolder, note) {
		if (!note || !note.hasOwnProperty("description")) {
			return false;
		} 

		let html = await this.#updateLinksBeforeWrite(note.key, note.description);
		html = await this.#fixAttachmentsBeforeWrite(html);
		html = await this.#fixImagesBeforeWrite(html);
	
		try {
			let prevDescription = await fs.readFile(path.join(noteFolder, this.#noteDescriptionFileName + ".json"), "utf-8");
			prevDescription = JSON.parse(prevDescription);
			let timeStampAsTime = joda.Instant.parse(prevDescription.timeStamp).epochSecond();

			await fs.rename(path.join(noteFolder, this.#noteDescriptionFileName + ".html"), path.join(noteFolder, this.#noteDescriptionFileName + "." + timeStampAsTime + ".html"));
			await fs.rename(path.join(noteFolder, this.#noteDescriptionFileName + ".json"), path.join(noteFolder, this.#noteDescriptionFileName + "." + timeStampAsTime + ".json"));

		} catch (err) {
			log.debug(err);
		}

		await fs.writeFile(path.join(noteFolder, this.#noteDescriptionFileName + ".html"), html||"");
		await fs.writeFile(path.join(noteFolder, this.#noteDescriptionFileName + ".json"), JSON.stringify({
			timeStamp: joda.Instant.now().toString()
		}, null, 2));

		return true;
	}


	async #updateLinksAfterRead(htmlText) {

		let $htmlCntainer = cheerio.load(htmlText, null, false);
		let internalLinks = $htmlCntainer("[data-link-node]");

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-link-node");
				
				let note = await this.getNoteStore(linkToNoteKey, true);
				if (note) {
					let parentsObj = await this.getParentsStore(note.key);
					
					let path = "";
					let sep = "";
					if (parentsObj.parents) {
						parentsObj.parents.forEach(function(parentNote) {
							path = `${path}${sep}<a href='#${parentNote.key}' data-goto-note='${parentNote.key}'>${parentNote.title}</a>`;
							sep = " / ";
						});
					}
					path = `${path}${sep}<a href='#${note.key}' data-goto-note='${note.key}'>${note.title}</a>`;

					$linkToNote.html("[ " + path + " ]");
				}
			}
		}

		return $htmlCntainer.html();
	}


	// Backlinks:
	//  - save backlinks in linked note
	//  - save link in linking note - only this way can be backlink removed in link is removed
	// links.json
	// {
	// 	links: ["4b434-", "789a1-"],
	//  backlinks: ["a1434-", "6909x-"]
	// }
	//  - when settings atctive note - check if linked notes exists and mark it
	async #updateLinksBeforeWrite(key, description) {
		if (!description) {
			return;
		}
			
		let $htmlCntainer = cheerio.load(description, null, false);
		let internalLinks = $htmlCntainer("[data-link-node]");
	
		// log.debug("#updateLinksBeforeWrite internalLinks.length", internalLinks.length);

		let newLinks = [];

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-link-node");
				
				let exists = await this.#exists(path.join(this.storageDirectory, this.#notesFolderName, linkToNoteKey));
				if (exists) {
					let noteClass = this.#getNoteClassInstance(linkToNoteKey);
					let noteData = await noteClass.getData();
					noteData.backlinks = noteData.backlinks || [];
					noteData.links = noteData.links || [];

					if (!newLinks.includes(linkToNoteKey)) {
						newLinks.push(linkToNoteKey);
					}
					if (!noteData.backlinks.includes(key)) {
						noteData.backlinks.push(key);
					}
					await this.#writeNoteData(path.join(this.storageDirectory, this.#notesFolderName, linkToNoteKey), noteData);
				}

				// removes goto-links before write
				$linkToNote.html("");
			}
		};

		let noteClass = this.#getNoteClassInstance(key);
		let noteData = await noteClass.getData();

		if (noteData) {
			noteData.backlinks = noteData.backlinks || [];
			noteData.links = noteData.links || [];

			for await (const altKey of noteData.links) {
				
				if (!newLinks.includes(altKey)) {
					let exists = await this.#exists(path.join(this.storageDirectory, this.#notesFolderName, altKey));
					// note removed, what to do? nothing....
					if (exists) {
						let noteClass = this.#getNoteClassInstance(altKey);
						let linkedNoteData = await noteClass.getData();
						linkedNoteData.backlinks = linkedNoteData.backlinks || [];
						linkedNoteData.links = linkedNoteData.links || [];

						var index = linkedNoteData.backlinks.indexOf(key);
						if (index !== -1) {
							linkedNoteData.backlinks.splice(index, 1);
						}
						await this.#writeNoteData(path.join(this.storageDirectory, this.#notesFolderName, altKey), linkedNoteData);
					}
				}
			};
			noteData.links = newLinks;
			await this.#writeNoteData(path.join(this.storageDirectory, this.#notesFolderName, key), noteData);
		}

		return $htmlCntainer.html();
	}

	
	async #exists(noteFolder) {
		try {
			await fs.access(noteFolder, constants.F_OK);
			return true;
		} catch (err) {
			return false;
		}
	}
	

	async #fixAttachmentsBeforeWrite(htmltext) {
		// log.debug("fixAttachmentsBeforeWrite htmltext", htmltext);
		
		if (!htmltext) {
			return;
		}
		
		let $description = cheerio.load(htmltext, null, false);
		let links = $description("a[data-n3asset-id]");

		for (let i = 0; i < links.length; i++) {
			let nextLink = links.eq(i);
			if (nextLink.attr("data-n3asset-id")) {
				nextLink.attr("href", "#");
			}
		}

		return  $description.html();		
	}

	async #fixImagesBeforeWrite(htmltext) {
		// log.debug("fixImagesBeforeWrite htmltext", htmltext);

		if (!htmltext) {
			return;
		}
			
		let $description = cheerio.load(htmltext, null, false);
		let imgs = $description("img");

		for (let i = 0; i < imgs.length; i++) {
			let nextImg = imgs.eq(i);

			if (!nextImg.attr("src") || nextImg.attr("src").indexOf("data:image/") == -1) {
				if (nextImg.attr("data-n3asset-id")) {
					nextImg.attr("src", "");
				}
			} else {

				// save as asset data:image/png;base64,...
				let asset = await this.addFile(nextImg.attr("src").substring(5, 14), "img.png", nextImg.attr("src").substring(22), nextImg.attr("src").substring(15, 21));
				// log.debug("write back img?", asset);
				nextImg.attr("src", "");
				nextImg.attr("data-n3asset-id", asset.id);
			}
		}

		return $description.html();
	}


	#getNotesDirectoryPath() {
		return path.join(this.storageDirectory, this.#notesFolderName);
	}
	
	async readNotesStore(key) {
		let noteClass = this.#getNoteClassInstance(key);
		let childrenKeys = await noteClass.getChildrenKeys();

		let children = [];
		for (let i = 0; i < childrenKeys.length; i++) {
			let note = this.#getNoteClassInstance(childrenKeys[i]);
			// let child = note.get();
			let child = await this.#readNote(path.join(this.storageDirectory, this.#notesFolderName, childrenKeys[i]));
			children.push(child);
		}
		return children;
	}

	async addNoteStore(parentNoteKey, note, hitMode, relativeToKey) {
		note.createdOn = joda.Instant.now().toString();
		note.createdBy = this.userName;

		let noteFolder = path.join(this.storageDirectory, this.#notesFolderName, note.key);
		
		let noteClass = this.#getNoteClassInstance(note.key);
		log.debug("1******** addNoteStore", note);

		await fs.mkdir(noteFolder, { recursive: true });
		log.debug("2******** addNoteStore", note);

		if (parentNoteKey.startsWith("root_")) {
			note.parent = "root";//TODO: static
		} else {
			note.parent = parentNoteKey;
		}
		log.debug("3******** addNoteStore", note);
		await this.#writeNoteData(noteFolder, note);
		log.debug("4******** addNoteStore", note);
		await this.#writeNoteTitle(noteFolder, note);
		log.debug("5******** addNoteStore", note);
		await this.#writeNoteDescription(noteFolder, note);
		log.debug("6******** addNoteStore", note);

		let parentNoteClass = this.#getNoteClassInstance(parentNoteKey);
		log.debug("7******** addNoteStore", parentNoteClass);
		await parentNoteClass.addChild(note.key, hitMode, relativeToKey);
		log.debug("8******** addNoteStore", note);

		note = await this.#readNote(noteFolder)
		log.debug("9******** addNoteStore", note);
		let parentsObj = await this.getParentsStore(note.key);
		log.debug("10******** addNoteStore", note);
		this.searchService.addNoteToIndex(note, parentsObj.parents);
		log.debug("11******** addNoteStore", note);
		return note;
	}

	async modifyNoteStore(note) {
		let noteFolder = path.join(this.storageDirectory, this.#notesFolderName, note.key);

		await fs.mkdir(noteFolder, { recursive: true });

		let dataModified = await this.#writeNoteData(noteFolder, note);
		let titleModified = await this.#writeNoteTitle(noteFolder, note);
		let descriptionModified = await this.#writeNoteDescription(noteFolder, note);

		note = await this.#readNote(noteFolder);	

		if (dataModified || titleModified || descriptionModified) {
			let trash = false; // modify in trash is not allowed
			let deep = titleModified;
			await this.#reindexNote(note, deep, trash);
		}

		return note;
	}

	async moveNoteStore(key, from, to, hitMode, relativTo) {
		let oldParentNoteClass = this.#getNoteClassInstance(from);
		await oldParentNoteClass.removeChild(key);

		let newParentNoteClass = this.#getNoteClassInstance(to);
		await newParentNoteClass.addChild(key, hitMode, relativTo);

		let childNoteClass = this.#getNoteClassInstance(key);
		await childNoteClass.setParent(to);

		let noteFolder = path.join(this.storageDirectory, this.#notesFolderName, key);
		let note = await this.#readNote(noteFolder);
		let trash = false;
		let deep = true;
		await this.#reindexNote(note, deep, false);
	}


//  TODO if note has backlinks: warning by delete (check all in tree ???) 
	async moveNoteToTrashStore(key, parent) {
		let oldParentNoteClass = this.#getNoteClassInstance(parent);
		await oldParentNoteClass.removeChild(key);


		// let to = "root_1";
		let hitMode = "over";
		let trash = true;
		let relativTo = undefined;

		let newParentNoteClass = new RootNoteClass(this.storageDirectory, true);
		await newParentNoteClass.addChild(key, hitMode, relativTo);

		let childNoteClass = this.#getNoteClassInstance(key);
		await childNoteClass.setParent(newParentNoteClass.getKey());

		let noteFolder = path.join(this.storageDirectory, this.#notesFolderName, key);
		let note = await this.#readNote(noteFolder);
		trash = true;
		let deep = true; // must update paths of children
		await this.#reindexNote(note, deep, trash);
	}

	// return fileSource, assetId
	writeAssetStore(fileType, fileName, filePathOrBase64, fileTransferType) {
		let that = this;
		return new Promise(function(resolve, reject) {
			// log.debug("writeAssetStore copyFile ", fileType, fileName);
			const assetId = crypto.randomUUID();
			// log.debug("writeAssetStore assetId ", assetId);
			let assetFolder = path.join(that.storageDirectory, that.#assetsFolderName, assetId);
			return fs.mkdir(assetFolder, { recursive: true }).then(function() {
				let assetMetaDataFile = path.join(assetFolder, that.#assetsMetaDataFileName + ".json");
				let assetMetaData = {
					type: fileType,
					name: fileName,
					createdOn: joda.Instant.now().toString(),
					createdBy: this.userName
				}
				return fs.writeFile(assetMetaDataFile, JSON.stringify(assetMetaData, null, 2)).then(function() {
					let assetFile = path.join(assetFolder, fileName);
					if (fileTransferType === "base64") {
						// log.debug("writeAssetStore blob writeFile ", assetFile);
						return fs.writeFile(assetFile, Buffer.from(filePathOrBase64,"base64")).then(function() {
							// log.debug("writeAssetStore resolve1 ", assetFile, assetId);
							resolve({src: assetFile, id: assetId});
						});
					} else {
						// log.debug("writeAssetStore copyFile ", filePathOrBase64, assetFile);
						return fs.copyFile(filePathOrBase64, assetFile).then(function() {
							// log.debug("writeAssetStore resolve2 ");
							resolve({src: assetFile, id: assetId});
						});
					}
					
				});
			});
		});
	}


	
	#setAttachmentsPath(htmltext) {

		var that = this;
		return new Promise(function(resolve) {
		
			let $linksHiddenContainer = cheerio.load(htmltext || "", null, false);
			let links = $linksHiddenContainer("a[data-n3asset-id]");

			(function loopLinks(i) {
		
				if (i >= links.length) {
					let html = $linksHiddenContainer.html();
					resolve(html);
				} else {
					let nextLinks = links.eq(i);
					// log.debug("#setAttachmentsPath nextLinks", nextLinks.attr("data-n3asset-id"));
					if (!nextLinks.attr("data-n3asset-id")) {
						loopLinks(i + 1);
					} else {

						let assetId = nextLinks.attr("data-n3asset-id");	
						// log.debug("#setAttachmentsPath nextLinks assetId", assetId);	
						let assetMetaDataFile = path.join(that.storageDirectory, that.#assetsFolderName, assetId, that.#assetsMetaDataFileName + ".json");
						fs.readFile(assetMetaDataFile, "utf-8").then(function(text) {
							text = text || "{}";
							let metaData = JSON.parse(text);	
							// log.debug("#setAttachmentsPath nextLinks metaData", metaData);				
							nextLinks.attr("href", path.join(that.storageDirectory, that.#assetsFolderName, assetId, metaData.name));
						}).finally(function() {
							loopLinks(i + 1);
						});
					}
				}
			})(0);
		});

	}

	// return Primise with HTML with loaded images
	#setImagesPath(htmltext) {

		var that = this;
		return new Promise(function(resolve) {
		
			let $imagesHiddenContainer = cheerio.load(htmltext || "", null, false);
			let imgs = $imagesHiddenContainer("img");

			(function loopImages(i) {
		
				if (i >= imgs.length) {
					let html = $imagesHiddenContainer.html();
					resolve(html);
				} else {
					let nextImg = imgs.eq(i);
					// log.debug("#setImagesPath nextImg", nextImg.attr("data-n3asset-id"));
					if (!nextImg.attr("data-n3asset-id")) {
						loopImages(i + 1);
					} else {

						let assetId = nextImg.attr("data-n3asset-id");	
						// log.debug("#setImagesPath nextImg assetId", assetId);	
						let assetMetaDataFile = path.join(that.storageDirectory, that.#assetsFolderName, assetId, that.#assetsMetaDataFileName + ".json");
						fs.readFile(assetMetaDataFile, "utf-8").then(function(text) {
							text = text || "{}";
							let metaData = JSON.parse(text);	
							// log.debug("#setImagesPath nextImg metaData", metaData);				
							nextImg.attr("src", path.join(that.storageDirectory, that.#assetsFolderName, assetId, metaData.name));
						}).finally(function() {
							loopImages(i + 1);
						});
					}
				}
			})(0);
		});

	}

	async #readNote(noteFolder, simple) {

		let note = {};

		let key = path.basename(noteFolder);
		let title = {};
		try {
			title = await this.#readNoteTitle(noteFolder);
			if (simple) {
				note = {
					key: key,
					title: title.title
				};
				return note;
			}
		} catch (error) {
			log.warn(error);	
		}

		let noteClass = this.#getNoteClassInstance(key);
		let data = {};
		try {
			data = await noteClass.getData();
		} catch (error) {
			log.warn(error);	
		}

		let description;
		try {
			description = await this.#readNoteDescription(noteFolder);
		} catch (error) {
			log.warn(error);	
		}

		note = Object.assign({}, {
			key: key,
			expanded: data.expanded,
			title: title.title,
			description: description,
			createdOn: data.createdOn
		}, data);

		return note;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	searchStore(searchText, limit, trash) {
		let searchOptions = {
			index: "content", 
			enrich: true
		};
		if (limit !== undefined) {
			searchOptions.limit = limit;
		}
		return this.searchService.getIndex().search(searchText, searchOptions);
	}

	getIndexedDocumentsStore(count) {

		let searchResults = [];

		let allDocs = Object.entries(this.searchService.getIndex().store);
		if (count !== undefined) {
			if (allDocs.length < count) {
				count = allDocs.length;
			}
		} else {
			count = allDocs.length;
		}

		for (let i = 0; i < count; i++) {
			searchResults.push({
				id: allDocs[i][0],
				doc: allDocs[i][1]
			});
		}
		
		return searchResults;
	}

	#reindexAll() {
		return this.searchService.reindexAll();
	}

	#reindexNote(note, deep, trash) {
		let that = this;
		return that.getParentsStore(note.key).then(function(parentsObj) {

			if (deep) {

				return that.iterateNotesStore(function(nextNote, nextNoteParents) {
					that.searchService.modifyNoteIndex(nextNote, nextNoteParents, trash);
				}, trash, note.key, parentsObj.parents);

			} else {
				that.searchService.modifyNoteIndex(note, parentsObj.parents, trash);
			}
		}).catch(function(err) {
			log.error(err);
		});

	}

	// returns only: key, title and trash
	getParentsStore(key, parentsObj) {

		// log.debug("getParentsStore key, parentsObj", key, parentsObj);

		let that = this;

		parentsObj = parentsObj || {
			parents: [],
			trash: undefined
		};


		return new Promise(function(resolve) {
			// log.debug("getParentsStore call getParentKey, key", key);
			return that.#getParentKey(key).then(function(parentKey) {
				// log.debug("getParentsStore getParentKey parentKey", parentKey);
				if (!parentKey || parentKey == "root" || parentKey == "trash") {
					// log.debug("getParentsStore resolve parents", parentsObj);
					parentsObj.trash = parentKey == "root_trash";
					return resolve(parentsObj);
				} else {
					// log.debug("getParentsStore call getNoteStore parentKey", parentKey);
					return that.getNoteStore(parentKey, true).then(function(parentNote) {
						// log.debug("getParentsStore getNoteStore parentNote", parentNote);
						parentsObj.parents.unshift(parentNote);
						// log.debug("getParentsStore call getParentsStore parentKey, parents", parentKey, parentsObj);
						return that.getParentsStore(parentKey, parentsObj).then(function() {
							// log.debug("getParentsStore resolve 2 parents", parentsObj);
							return resolve(parentsObj);
						});
					});
				}
			});
		});


	}

	
	async #getParentKey(key) {
		if (!key) {
			return;
		} else {
			let noteData = {};
			try {
				let noteClass = this.#getNoteClassInstance(key);
				let noteData = await noteClass.getData();
				return noteData.parent;
			} catch (error) {
				log.warn(error);	
				return;
			}
		}
	}

	async getNoteStore(key, simple) {
		// log.debug("getNoteStore", key);

		if (!key) {
			return;
		} else {

			try {
				let note = await this.#readNote(path.join(this.storageDirectory, this.#notesFolderName, key), simple);
				// log.debug("getNoteStore(key)", key, note);
				return note;
			} catch (err) {
				log.error(err);
				return;
			};
		}
	}

	iterateNotesStore(callback, trash, key, parents) {
		// log.debug("iterateNotesStore(trash, key)", trash, key);
		let that = this;
		parents = parents || [];

		return that.getNoteStore(key).then(function(currentNote) {
			// log.debug("iterateNotesStore currentNote for key", currentNote, key);
			if (currentNote) {
				// log.debug("iterateNotesStore callback currentNote", callback);
				callback(currentNote, parents);
			}

			let noteClass = that.#getNoteClassInstance(key, trash);
			noteClass.getChildrenKeys().then(function(children) {
			// return fs.readFile(childrenFile, "utf-8").then(function(children) {

				let childrenIterator = new Promise(function(resolve, reject) {
					(function loopChildren(i) {
	
						if (i >= children.length) {
							// log.debug("iterateNotesStore childrenIterator last child - resolve");
							resolve();
						} else {
							let childNoteKey = children[i];
							that.getNoteStore(childNoteKey).then(function(childNote) {
										
								let childParents = JSON.parse(JSON.stringify(parents));

								if (currentNote) {
									childParents.push(currentNote);
								}
								callback(childNote, childParents);

								that.iterateNotesStore(callback, trash, childNoteKey, childParents).then(function() {
									// log.debug("iterateNotesStore iterateNotesStore ready");
									loopChildren(i + 1);

								});
							});
						}
					})(0);
				});
				return childrenIterator.then(function() {
					// log.debug("iterateNotesStore - childrenIterator ready");
					return Promise.resolve();
				});
			}).catch(function(err) {
				log.error(err);
				return Promise.resolve();
			});
		});

	}



}

module.exports = N3StoreServiceFileSystem;