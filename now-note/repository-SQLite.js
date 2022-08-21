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

		// TODO trash = true;


/*
		log.info("Reindex all. TODO");

		await this.searchService.init();


		let that = this;

		let trash = false;
		await this.iterateNotes(function(noteModel, parents, trash) {
			that.searchService.addNoteToIndex(noteModel, parents, trash);
		}, trash);
		
		trash = true;
		await this.iterateNotes(function(noteModel, parents, trash) {
			that.searchService.addNoteToIndex(noteModel, parents, trash);
		}, trash);

		return await this.searchService.saveIndex();
		*/
	}

	async iterateNotes(callback, trash, noteModel, parents) {
		// log.debug("iterateNotesStore(trash, key)", trash, key);

		parents = parents || [];

		// log.debug("iterateNotesStore noteModel for key", noteModel, key);
		// log.debug("iterateNotesStore callback noteModel", callback);
		if (noteModel) {
			callback(noteModel, parents, trash);
		}

		let children = await nnNote.Note.findAll({
			where: {
				parent: noteModel ? noteModel.key : null,
				trash: trash
			}
		});

		for (let i = 0; i < children.length; i++) {
			let childParents = JSON.parse(JSON.stringify(parents));
			if (noteModel) {
				childParents.push(noteModel);
			}
			callback(children[i], childParents, trash);

			await this.iterateNotes(callback, trash, children[i], childParents);
		}

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

/*
  title: '14.08.2022 22:47',
  type: 'note',
  priority: 0,
  done: false,
  expanded: false,
  createdBy: 'pnowi'
  */




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
		
		let path = this.#notesArrayToPath(parents);
		const [results, metadata] = await this.sequelize.query("INSERT INTO Notes_index (key, path, title, descriptionAsText, type, done, priority, trash) VALUES (:key, :path, :title, :descriptionAsText, :type, :done, :priority, :trash)", {
			replacements: {
				key: newNote.key, 
				path: path || "", 
				title: newNote.title || "", 
				descriptionAsText: newNote.descriptionAsText || "",
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
			
			let replacements = {
				key: note.key, 
				title: note.title || "", 
				tags: tagsAsString,
				descriptionAsText: note.descriptionAsText || "",
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
				if (nextImg.attr("data-n3asset-id")) {
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
				nextImg.attr("data-n3asset-id", asset.id);
			}
		}

		return $description.html();
	}

	// return {src: fileSource, id: assetId}
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
			// log.debug("addAsset resolve1 ", assetFile, assetId);
		} else {
			// log.debug("addAsset copyFile ", filePathOrBase64, assetFile);
			await fs.copyFile(filePathOrBase64, assetFile);
			// log.debug("addAsset resolve2 ");
		}
		return {
			src: assetFile, 
			id: assetModel.key
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
			// html = await this.#updateLinksBeforeWrite(note.key, note.description);
			// html = await this.#fixAttachmentsBeforeWrite(html);
			html = await this.#extractInlineImagesBeforeWrite(html);


			let oldDescription = await nnDescription.Description.create({
				key: modifyNote.key, 
				description: modifyNote.description,
				descriptionAsText: modifyNote.descriptionAsText,
			});
			modifyNote.description = html;
			modifyNote.descriptionAsText = note.descriptionAsText;
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

		
		/* TODO
		let note = await this.#readNote(noteFolder);
		trash = true;
		let deep = true; // must update paths of children
		await this.#reindexNote(note, deep, trash);
		*/
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

	async inTrashStore(key) {
		const noteModel = await nnNote.Note.findByPk(key);
		if (noteModel === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}

		if (noteModel.parent == null && noteModel.trash) {
			return true;
		}

		let parents = await this.getParents(note.key);
		if (!parents || parents.length == 0) {
			return false;
		}

		return parents[0].trash;
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

	async toData(note, withtags, withchildren) {
		if (!note) {
			return;
		}

		let result =  {
			key: note.key,
			title: note.title,
			type: note.type,
			createdBy: note.createdBy,
			done: note.done,
			priority: note.priority,
			expanded: note.expanded,
			description: note.description
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