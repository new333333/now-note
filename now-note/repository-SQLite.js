const log = require('electron-log');
const path = require('path');
const { Sequelize, DataTypes, Op, QueryTypes} = require('sequelize');
const nnNote = require('./Note');
// const nnStructure = require('./Structure');
const nnTitle = require('./Title');
const nnDescription = require('./Description');
const nnTag = require('./Tag');
const nnLink = require('./Link');
const nnAsset = require('./Asset');
const search = require('./search-flexSearch');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class RepositorySQLite  {

	#assetsFolderName

	constructor(name, directory, isDefault, userName) {
		this.name = name;
		this.directory = directory;
		this.isDefault = isDefault;
		this.#assetsFolderName = "assets";
		this.userName = userName;
	};

	async open() {
		// local variable required by init
		let sequelize = new Sequelize({
			dialect: 'sqlite',
			storage: path.join(this.directory, "db.sqlite3")
		});
		this.sequelize = sequelize;

		try {
			await this.sequelize.authenticate();
			log.debug('Connection has been established successfully.');
		} catch (error) {
			log.error('Unable to connect to the database:', error);
		}

		nnNote.Note.init({
			key: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
			title: {
				type: DataTypes.STRING(1000),
				allowNull: true
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			descriptionAsText: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			parent: {
				type: DataTypes.UUID,
				allowNull: true
			},
			position: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: false
			},
			type: {
				type: DataTypes.STRING,
				allowNull: false
			},
			createdBy: {
				type: DataTypes.STRING,
				allowNull: false
			},
			done: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			priority: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: false
			},
			expanded: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			trash: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			}
		}, { sequelize });

		nnTitle.Title.init({
			key: {
				type: DataTypes.UUID,
				allowNull: false
			},
			title: {
				type: DataTypes.STRING(1000),
				allowNull: false
			}
		}, { sequelize });


		nnDescription.Description.init({
			key: {
				type: DataTypes.UUID,
				allowNull: false
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			descriptionAsText: {
				type: DataTypes.TEXT,
				allowNull: true
			},
		}, { sequelize });

		nnTag.Tag.init({
			key: {
				type: DataTypes.UUID,
				allowNull: false
			},
			tag: {
				type: DataTypes.STRING,
				allowNull: false
			}
		}, { sequelize });

		nnLink.Link.init({
			from: {
				type: DataTypes.UUID,
				allowNull: false
			},
			to: {
				type: DataTypes.UUID,
				allowNull: false
			},
			type: {
				type: DataTypes.STRING,
				allowNull: false
			}
		}, { sequelize });

		nnAsset.Asset.init({
			key: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true
			},
			type: {
				type: DataTypes.STRING,
				allowNull: true
			},
			name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			createdBy: {
				type: DataTypes.STRING,
				allowNull: false
			}
		}, { sequelize });


		// await this.#setupSQLite();
	}


	async #setupSQLite() {
		await this.sequelize.sync({ alter: true });
		let [results, metadata] = await this.sequelize.query(`CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, path, title, descriptionAsText, tags, type, done, priority, trash, prefix='1 2 3')`);
	}

	async search(searchText, limit, trash) {

		trash = trash || false;
		trash = trash ? 1 : 0;

		let results = await this.sequelize.query(
			`SELECT * FROM Notes_index 
			WHERE ${searchText ? "title MATCH :searchText or descriptionAsText MATCH :searchText and" : ""} Notes_index MATCH '"trash" : ${trash}' ORDER BY rank LIMIT :limit`, {
				replacements: {
					searchText: searchText || "*",
					limit: limit
				},
				raw: true,
				type: QueryTypes.SELECT
			}
		);

		// log.debug("search - searchText, limit, trash", searchText, limit, trash, results);


		return results;
	}

	async reindexAll() {
		let reindexTree = true;
		let path = "";
		let trash = false;
		await this.#modifyNoteIndex(null, reindexTree, path, trash);
		trash = true;
		await this.#modifyNoteIndex(null, reindexTree, path, trash);
	}

	async closeRepository() {
		await this.sequelize.close();
	}

	async getRepository() {
		return {
			name: this.name,
			directory: this.directory,
			isDefault: this.isDefault
		};
	}

	async addNote(parentNoteKey, note, hitMode, relativeToKey) {
		
		
		// log.debug("RepositorySQLite.addNote parentNoteKey, note, hitMode, relativeToKey", parentNoteKey, note, hitMode, relativeToKey);

		// set parent
		note.parent = parentNoteKey;
		if (parentNoteKey.startsWith("root_")) {
			note.parent = null;
		}

		// set position
		// TODO: other hitModes?
		if (hitMode == "firstChild") {
			const [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (note.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash", {
				replacements: {
					parent: note.parent,
					trash: false
				}
			});

			note.position = 0;
		}

		note.createdBy = note.createdBy || this.userName;
		note.expanded = note.expanded || false;
		let newNote = await nnNote.Note.create(note);

		let resultNote = await this.toData(newNote, false, false);



		/*
		TODO
			newNoteData.hasOwnProperty("links") ||
			newNoteData.hasOwnProperty("backlinks") 
		*/

		this.#addNoteIndex(newNote);
		
		return resultNote;
	}


	async #addNoteIndex(newNote) {
		let parents = await this.getParents(newNote.key);

		parents.pop();

		let $description = cheerio.load(newNote.description || "", null, false);
		
		let path = this.#notesArrayToPath(parents);
		const [results, metadata] = await this.sequelize.query("INSERT INTO Notes_index (key, path, title, descriptionAsText, type, done, priority, trash) VALUES (:key, :path, :title, :descriptionAsText, :type, :done, :priority, :trash)", {
			replacements: {
				key: newNote.key, 
				path: path || "", 
				title: newNote.title || "", 
				descriptionAsText: $description.text(),
				type: newNote.type,  
				done: newNote.done,  
				priority: newNote.priority,   
				trash: newNote.trash 
			}
		});

	}

	async #modifyNoteIndex(note, reindexTree, path, trash) {
		// TODO: update only required fields!!! not all at ones! 
		if (note) {
			let tags = await nnTag.Tag.findAll({
				where: {
					key: note.key
				}
			});

			var tagsAsString = tags.map(function(tag){
				return tag.tag;
			}).join(" ");

			let $description = cheerio.load(note.description || "", null, false);
			
			let replacements = {
				key: note.key, 
				title: note.title || "", 
				tags: tagsAsString,
				descriptionAsText: $description.text(),
				type: note.type,  
				done: note.done,  
				priority: note.priority,   
				trash: trash 
			};

			if (reindexTree) {
				replacements.path = path;
			}

			const [results, metadata] = await this.sequelize.query("UPDATE Notes_index set " + (reindexTree ? "path = :path, " : "") + " title = :title, descriptionAsText = :descriptionAsText, type = :type, done = :done, priority = :priority, trash = :trash, tags = :tags where key = :key", {
				replacements: replacements
			});
		}

		if (reindexTree) {
			path = path || "";

			if (note) {
				if (path.length > 0) {
					path += " / ";
				}
				path += note.title;
			}

			let children = await nnNote.Note.findAll({
				where: {
					parent: note ? note.key : null,
					trash: trash
				}
			});

			for (let i = 0; i < children.length; i++) {
				await this.#modifyNoteIndex(children[i], reindexTree, path, trash)
			}

		}

	}


	async #extractInlineImagesBeforeWrite(htmltext) {
		// log.debug("extractInlineImagesBeforeWrite htmltext", htmltext);

		if (!htmltext) {
			return htmltext;
		}
			
		let $description = cheerio.load(htmltext, null, false);
		let imgs = $description("img");

		for (let i = 0; i < imgs.length; i++) {
			let nextImg = imgs.eq(i);

			if (!nextImg.attr("src") || nextImg.attr("src").indexOf("data:image/") == -1) {
				if (nextImg.attr("data-n3asset-key")) {
					nextImg.attr("src", "");
				}
			} else {

				// save as asset data:image/png;base64,...
				let fileType = nextImg.attr("src").substring(5, 14); // image/png
				let fileName = "img.png";
				let filePathOrBase64 = nextImg.attr("src").substring(22);
				let fileTransferType = nextImg.attr("src").substring(15, 21); // base64
				let asset = await this.addAsset(fileType, fileName, filePathOrBase64, fileTransferType);
				// log.debug("write back img?", asset);
				nextImg.attr("src", "");
				nextImg.attr("data-n3asset-key", asset.key);
			}
		}

		return $description.html();
	}

	// return {src: fileSource, key: assetKey}
	async addAsset(fileType, fileName, filePathOrBase64, fileTransferType) {
		// log.debug("addAsset ", fileType, fileName, fileTransferType);

		let assetModel = await nnAsset.Asset.create({
			type: fileType,
			name: fileName,
			createdBy: this.userName
		});

		let assetFile = path.join(this.directory, this.#assetsFolderName, assetModel.key);
		await fs.mkdir(assetFile, { recursive: true });
		assetFile = path.join(assetFile, fileName);
		if (fileTransferType === "base64") {
			// log.debug("addAsset blob writeFile ", assetFile);
			await fs.writeFile(assetFile, Buffer.from(filePathOrBase64,"base64"));
			// log.debug("addAsset resolve1 ", assetFile, assetKey);
		} else {
			// log.debug("addAsset copyFile ", filePathOrBase64, assetFile);
			await fs.copyFile(filePathOrBase64, assetFile);
			// log.debug("addAsset resolve2 ");
		}
		return {
			src: assetFile, 
			key: assetModel.key
		};
	}


	#notesArrayToPath(notesArray) {

		// log.debug("#notesArrayToPath(notesArray)", notesArray);

		let path = "";
		let sep = "";
		if (notesArray) {
			notesArray.forEach(function(parentNote) {
				path = path + sep + parentNote.title;
				sep = " / ";
			});
		}
		return path;
	}

	async #setLinksBeforeWrite(key, description) {
		if (!description) {
			return description;
		}
			
		let $htmlCntainer = cheerio.load(description, null, false);
		let internalLinks = $htmlCntainer("[data-link-node]");
	
		// log.debug("#setLinksBeforeWrite internalLinks.length", internalLinks.length);

		let newLinks = [];

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-link-node");
				const linkToNote = await nnNote.Note.findByPk(linkToNoteKey);
				if (linkToNote) {

					if (!newLinks.includes(linkToNoteKey)) {
						newLinks.push(linkToNoteKey);
					}

					await nnLink.Link.findOrCreate({
						where: {
							from: key,
							to: linkToNoteKey,
							type: "link"
						}
					});

					await nnLink.Link.findOrCreate({
						where: {
							from: linkToNoteKey,
							to: key,
							type: "backlink"
						}
					});
				}

				// clean goto-links before write
				$linkToNote.html("");
			}
		};

		let allLinks = await nnLink.Link.findAll({
			where: {
				from: key,
				type: "link"
			}
		});

		for await (const link of allLinks) {
			const linkToNote = await nnNote.Note.findByPk(link.to);
			if (linkToNote) {
				if (!newLinks.includes(link.to)) {
					await link.destroy();
					await nnNote.Note.destroy({
						where: {
							from: link.to,
							to: key,
							type: "backlink"
						}
					});
				}
			} else {
				await link.destroy();
			}
		}

		return $htmlCntainer.html();
	}

	async modifyNote(note) {
		const modifyNote = await nnNote.Note.findByPk(note.key);
		if (modifyNote === null) {
			throw new nnNote.NoteNotFoundByKey(note.key);
		}


		let reindex = false;
		let reindexTree = false;
		if (note.hasOwnProperty("title")) {
			let oldTitle = await nnTitle.Title.create({
				key: modifyNote.key, 
				title: modifyNote.title
			});
			if (modifyNote.title != note.title) {
				reindexTree = true;
			}
			modifyNote.title = note.title;
			reindex = true;
		}
		if (note.hasOwnProperty("description")) {

			let html = note.description;
			html = await this.#setLinksBeforeWrite(note.key, html);
			html = await this.#setAttachmentsBeforeWrite(html);
			html = await this.#extractInlineImagesBeforeWrite(html);


			let oldDescription = await nnDescription.Description.create({
				key: modifyNote.key, 
				description: modifyNote.description,
				descriptionAsText: modifyNote.descriptionAsText,
			});
			modifyNote.description = html;

			let $description = cheerio.load(html || "", null, false);

			modifyNote.descriptionAsText = $description.text();
			reindex = true;
		}
		if (note.hasOwnProperty("type")) {
			modifyNote.type = note.type;
			reindex = true;
		}
		if (note.hasOwnProperty("done")) {
			modifyNote.done = note.done;
			reindex = true;
		}
		if (note.hasOwnProperty("priority")) {
			modifyNote.priority = note.priority;
			reindex = true;
		}
		if (note.hasOwnProperty("expanded")) {
			modifyNote.expanded = note.expanded;
		}
		

		modifyNote.save();

		if (reindex) {
			let trash = false;
			let parents = await this.getParents(modifyNote.key);
			parents.pop();
			this.#modifyNoteIndex(modifyNote, reindexTree, reindexTree ? this.#notesArrayToPath( parents ) : false, trash);
		}

		/*

		newNoteData.hasOwnProperty("links") ||
		newNoteData.hasOwnProperty("backlinks") 

		TODO_ sqlite??
		if (dataModified || titleModified || descriptionModified) {
			let trash = false; // modify in trash is not allowed
			let deep = titleModified;
			await this.#reindexNote(note, deep, trash);
		}
		*/		
		let resultNote = await this.toData(modifyNote, false, false);
		return resultNote;
	}

	async #setAttachmentsBeforeWrite(htmltext) {
		// log.debug("setAttachmentsBeforeWrite htmltext", htmltext);
		
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

	async addTag(key, tag) {

		const [newtag, created] = await nnTag.Tag.findOrCreate({
			where: {
				key: key,
				tag: tag
			}
		});

		let tags = await nnTag.Tag.findAll({
			where: {
				key: key
			}
		});

		let tagsObj = tags.map(function(currentTag) {
			return currentTag.tag;
		});

		return tagsObj;
	}

	async removeTag(key, tag) {
		await nnTag.Tag.destroy({
			where: {
				key: key,
				tag: tag
			}
		});

		let tags = await nnTag.Tag.findAll({
			where: {
				key: key
			}
		});

		let tagsObj = tags.map(function(currentTag) {
			return currentTag.tag;
		});

		return tagsObj;
	}


	// load root nodes, if key undefined
	// load children notes if key defined
	async getChildren(key, trash = false) {
		let notes = await nnNote.Note.findAll({
			where: {
				parent: !key ? null : key,
				trash: trash
			}
		});

		let resultNotes = [];

		for (let i = 0; i < notes.length; i++) {
			let resultNote = await this.toData(notes[i], false, true);
			resultNotes.push(resultNote);
		};

		return resultNotes;
	}


	// hitMode == "over" | "before" | "after"
	async moveNote(key, from, to, hitMode, relativTo) {
		// log.debug("moveNote(key, from, to, hitMode, relativTo)", key, from, to, hitMode, relativTo);

		if (!to) {
			to = null;
		}

		const modifyNote = await nnNote.Note.findByPk(key);
		if (modifyNote === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}

		// count parent and position
		if (hitMode === "over") {
			
			const [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
				replacements: {
					parent: modifyNote.parent,
					position: modifyNote.position,
					trash: false
				},
				type: QueryTypes.SELECT
			});

			modifyNote.parent = to;
			let max = await nnNote.Note.max("position", { 
				where:  {
					parent: to ? to : null,
					trash: false
				} 
			}); 

			modifyNote.position = max == null ? 0 : max + 1; 

		} else if (hitMode === "before") {
			const relativNote = await nnNote.Note.findByPk(relativTo);
			if (relativNote === null) {
				throw new nnNote.NoteNotFoundByKey(relativNote);
			}

			if (modifyNote.parent == relativNote.parent) {

				let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				await relativNote.reload();

				[results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
					replacements: {
						parent: relativNote.parent,
						position: relativNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				
				modifyNote.parent = relativNote.parent;
				modifyNote.position = relativNote.position;

			} else {

				let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				[results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
					replacements: {
						parent: relativNote.parent,
						position: relativNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				modifyNote.parent = relativNote.parent;
				modifyNote.position = relativNote.position;

			}
		} else if (hitMode === "after") {
			const relativNote = await nnNote.Note.findByPk(relativTo);
			if (relativNote === null) {
				throw new nnNote.NoteNotFoundByKey(relativNote);
			}

			if (modifyNote.parent == relativNote.parent) {

				let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				await relativNote.reload();

				[results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: relativNote.parent,
						position: relativNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				modifyNote.position = relativNote.position + 1;



			} else {

				let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				[results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: relativNote.parent,
						position: relativNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				modifyNote.parent = relativNote.parent;
				modifyNote.position = relativNote.position + 1;
			}


		}

		modifyNote.save();

/* TODO 
		let trash = false;
		let deep = true;
		await this.#reindexNote(note, deep, false);
		*/
	}

	async moveNoteToTrash(key, parent) {

		// TODO: find first link to note in tree - warnung geben
		
		if (!key) {
			return;
		}

		const modifyNote = await nnNote.Note.findByPk(key);
		if (modifyNote === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}

		let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
			replacements: {
				parent: modifyNote.parent,
				position: modifyNote.position,
				trash: false
			},
			type: QueryTypes.SELECT
		});

		modifyNote.parent = null;
		let max = await nnNote.Note.max("position", { 
			where:  {
				parent: null,
				trash: true
			} 
		}); 

		modifyNote.position = max == null ? 0 : max + 1; 
		modifyNote.trash = true;
		modifyNote.save();

		let trash = true;
		await this.#modifyTrashFlag(key, trash);
				

		let reindexTree = true;
		trash = true;
		let parents = await this.getParents(modifyNote.key);
		parents.pop();
		this.#modifyNoteIndex(modifyNote, reindexTree, this.#notesArrayToPath( parents ), trash);
	}

	async #modifyTrashFlag(key, trash) {
		await nnNote.Note.update(
			{
				trash: trash
			},
			{
				where: { 
					parent: key 
				} 
			}
		);

		let children = await nnNote.Note.findAll({
			where: {
				parent: key
			}
		});

		for (let i = 0; i < children.length; i++) {
			await this.#modifyTrashFlag(children[i].key, trash);
		}
	}


	async getNote(key) {
	//async getNoteStore(key, simple) {

		if (!key) {
			return;
		} else {

			const noteModel = await nnNote.Note.findByPk(key);
			if (noteModel === null) {
				throw new nnNote.NoteNotFoundByKey(key);
			}
			return await this.toData(noteModel, false, false);
		}
	}

	async isTrash(key) {
		const noteModel = await nnNote.Note.findByPk(key);
		if (noteModel === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}

		return noteModel.trash;
	}

	async getParents(key, parents) {
		// log.debug("getParentsStore key, parentsObj", key, parents);

		parents = parents || [];

		let noteModel = await nnNote.Note.findByPk(key, {
			raw: true,
		});

		if (noteModel === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}
		if (noteModel.parent == null) {
			parents.unshift(noteModel);
			// log.debug(">>>>>>>>>>>>>>>>> getParents, return 1 ", parents);
			return parents;
		} else {
			parents.unshift(noteModel);
			// log.debug(">>>>>>>>>>>>>>>>> getParents, return 2 ", parents);
			return await this.getParents(noteModel.parent, parents);
		}

	}

	async #setImagesPathAfterRead(html) {
		let $html = cheerio.load(html || "", null, false);
		let imgs = $html("img");

		for (let i = 0; i < imgs.length; i++) {
			let nextImg = imgs.eq(i);
			// log.debug("#setImagesPathAfterRead nextImg", nextImg.attr("data-n3asset-key"));
			if (nextImg.attr("data-n3asset-key")) {

				let assetKey = nextImg.attr("data-n3asset-key");
				let assetModel = await nnAsset.Asset.findByPk(assetKey);

				nextImg.attr("src", path.join(this.directory, this.#assetsFolderName, assetKey, assetModel.name));
			}
		}

		return $html.html();
	}

	
	async #setLinksAfterRead(htmlText) {

		let $htmlCntainer = cheerio.load(htmlText, null, false);
		let internalLinks = $htmlCntainer("[data-link-node]");

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-link-node");
				const note = await nnNote.Note.findByPk(linkToNoteKey);
				if (note) {
					let parents = await this.getParents(note.key);
					
					let path = "";
					let sep = "";
					if (parents) {
						parents.forEach(function(parentNote) {
							path = `${path}${sep}${parentNote.trash ? " in Trash: " : ""}<a href='#${parentNote.key}' data-goto-note='${parentNote.key}'>${parentNote.title}</a>`;
							sep = " / ";
						});
					}

					$linkToNote.html("[" + path + " ]");
				} else {
					$linkToNote.html("[ NODE " + linkToNoteKey + " NOT FOUND ]");
				}
			}
		}

		return $htmlCntainer.html();
	}

	
	async #setAttachmentsPathAfterRead(htmltext) {
		let $linksHiddenContainer = cheerio.load(htmltext || "", null, false);
		let links = $linksHiddenContainer("a[data-n3asset-key]");

		for (let i = 0; i < links.length; i++) {
			let nextLinks = links.eq(i);
			// log.debug("#setAttachmentsPathAfterRead nextLinks", nextLinks.attr("data-n3asset-key"));
			if (nextLinks.attr("data-n3asset-key")) {

				let assetKey = nextLinks.attr("data-n3asset-key");	

				let assetModel = await nnAsset.Asset.findByPk(assetKey);
				nextLinks.attr("href", path.join(this.directory, this.#assetsFolderName, assetKey, assetModel.name));
			}
		}

		return $linksHiddenContainer.html();
	}

	async toData(note, withtags, withchildren) {
		if (!note) {
			return;
		}

		let description = note.description;
		description = await this.#setImagesPathAfterRead(description);
		description = await this.#setAttachmentsPathAfterRead(description);
		description = await this.#setLinksAfterRead(description);

		let result =  {
			key: note.key,
			title: note.title,
			type: note.type,
			createdBy: note.createdBy,
			done: note.done,
			priority: note.priority,
			expanded: note.expanded,
			description: description
		};

		if (withchildren) {
			const countChildren = await nnNote.Note.count({
				where: {
					parent: note.key
				}
			});
			result.hasChildren = countChildren > 0;
		}
		
		if (withtags) {
			let tags = await nnTag.Tag.findAll({
				where: {
					key: note.key
				}
			});

			result.tags = tags.map(function(currentTag) {
				return currentTag.tag;
			});
		}
		// log.debug("**************** result", result);

		return result;
	}

	toString() {
		return `RepositorySQLite[name: "${ this.name }", directory: "${ this.directory }", isDefault: "${ this.isDefault }"]`;
	}

}

module.exports = {
	RepositorySQLite: RepositorySQLite
}