const log = require('electron-log');
const path = require('path');
const { Sequelize, DataTypes, Op, QueryTypes} = require('sequelize');
const nnNote = require('./Note');
const nnTitle = require('./Title');
const nnDescription = require('./Description');
const nnTag = require('./Tag');
const nnLink = require('./Link');
const nnAsset = require('./Asset');
const cheerio = require('cheerio');
const { result } = require('lodash');
const fs = require('fs').promises;
const fsSync = require('fs');


class RepositorySQLite  {

	#assetsFolderName

	constructor(name, directory, isDefault, userName) {
		this.name = name;
		this.directory = directory;
		this.isDefault = isDefault;
		this.#assetsFolderName = "assets";
		log.info("RepositorySQLite.constructor userName", userName);
		this.userName = userName;
	};

	async open() {
		// local variable required by init
		let sequelize = new Sequelize({
			logging: false, // Disables logging
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

		await this.#setupSQLite();
	}


	async #setupSQLite() {
		let [results, metadata] = await this.sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='Notes'`);
		if (results.length == 0) {
			await this.sequelize.sync({ alter: true });
			let [results, metadata] = await this.sequelize.query(`CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, path, parents, title, descriptionAsText, tags, type, done, priority, trash, prefix='1 2 3')`);
		}
	}

	async tempMigrateOldStorage() {
		log.info("tempMigrateOldStorage start");

		let folderPath = "e:\\Projekte\\now-note-migrate-repositries\\2022-11-06";



		

		log.info("tempMigrateOldStorage end");
	}

	async getNoteIndex(key) {
		let sql = `SELECT * FROM Notes_index WHERE key = :key LIMIT 1`;

		let results = await this.sequelize.query(sql, {
			replacements: {
				key: key,
			},
			raw: true,
			type: QueryTypes.SELECT
		});

		return results;
	}

	async search(searchText, limit, trash, options) {

		trash = trash || false;
		trash = trash ? 1 : 0;
		options = options || {};

		// console.log("search - options", options);

		let sql = `SELECT * FROM Notes_index 
			WHERE 
				${searchText ? "title MATCH :searchText or descriptionAsText MATCH :searchText and" : ""} 
				${options.parentNotesKey && options.parentNotesKey.length > 0 ? " (" + options.parentNotesKey.map((key, index) => " parents like '%," + key + ",%' " + (index < options.parentNotesKey.length - 1 ? " or " : " ")).join(" ") + ") and" : ""}
				${options.types ? "  type in (" + options.types.join(", ") + ") and" : ""}
				${options.dones ? "  done in (" + options.dones.join(", ") + ") and" : ""}
				trash=${trash} 
			${options.sortBy ? " ORDER BY " + options.sortBy : " ORDER BY rank"}
			`;

		if (limit > -1) {
			sql += " LIMIT :limit";
		}

		// console.log("search - sql", sql);

		let results = await this.sequelize.query(
			sql, {
				replacements: {
					searchText: (searchText + "*") || "*",
					limit: limit
				},
				raw: true,
				type: QueryTypes.SELECT
			}
		);

		return results;
	}

	async reindexAll() {
		let reindexTree = true;
		let path = "";
		let onlyPath = false;
		let pathKeys = "";
		await this.#modifyNoteIndex(null, reindexTree, path, pathKeys, onlyPath);
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
		if (hitMode == "firstChild") {
			const [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (note.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash", {
				replacements: {
					parent: note.parent,
					trash: false
				}
			});

			note.position = 0;
		} else if (hitMode == "over") {

			let max = await nnNote.Note.max("position", { 
				where:  {
					parent: parentNoteKey
				} 
			}); 

			note.position = max == null ? 0 : max + 1;

		} else if (hitMode == "after") {

			const relativNote = await nnNote.Note.findByPk(relativeToKey);
			if (relativNote === null) {
				throw new nnNote.NoteNotFoundByKey(relativNote);
			}

			let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
				replacements: {
					parent: relativNote.parent,
					position: relativNote.position,
					trash: false
				},
				type: QueryTypes.SELECT
			});

			note.parent = relativNote.parent;
			note.position = relativNote.position + 1;

		} else if (hitMode === "before") {

			const relativNote = await nnNote.Note.findByPk(relativeToKey);
			if (relativNote === null) {
				throw new nnNote.NoteNotFoundByKey(relativNote);
			}

			let [results, metadata] = await this.sequelize.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
				replacements: {
					parent: relativNote.parent,
					position: relativNote.position,
					trash: false
				},
				type: QueryTypes.SELECT
			});

			note.parent = relativNote.parent;
			note.position = relativNote.position;

		}

		note.createdBy = note.createdBy || this.userName;
		note.expanded = note.expanded || false;
		note.done = note.done || false;

		if (note.hasOwnProperty("description")) {
			let html = note.description;
			html = await this.#setInlineImagesBeforeWrite(html);
			html = await this.#setAttachmentsPathBeforeWrite(html);
			note.description = html;
		}

		let newNote = await nnNote.Note.create(note);

		if (newNote.hasOwnProperty("description")) {
			let html = newNote.description;
			html = await this.#setLinksBeforeWrite(newNote.key, html);
			newNote.description = html;
		}
		newNote.save();

		let resultNote = await this.toData(newNote, false, false, true);

		this.#addNoteIndex(newNote);
		
		return resultNote;
	}


	async #addNoteIndex(newNote) {
		let parents = await this.getParents(newNote.key);

		parents.pop();

		let $description = cheerio.load(newNote.description || "", null, false);
		
		let path = this.#notesArrayToPath(parents);
		let parentsKeys = this.#notesArrayToKeys(parents);
		const [results, metadata] = await this.sequelize.query("INSERT INTO Notes_index (key, path, parents, title, descriptionAsText, type, done, priority, trash) VALUES (:key, :path, :parents, :title, :descriptionAsText, :type, :done, :priority, :trash)", {
			replacements: {
				key: newNote.key, 
				path: path || "", 
				parents: parentsKeys || "",
				title: newNote.title || "", 
				descriptionAsText: $description.text(),
				type: newNote.type,  
				done: newNote.done,  
				priority: newNote.priority,   
				trash: newNote.trash 
			}
		});

	}

	async #modifyNoteIndex(note, reindexTree, path, pathKeys, onlyPath) {
		if (note) {
			if (!onlyPath) {
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
					trash: note.trash 
				};

				if (reindexTree) {
					replacements.path = path;
					replacements.parents = pathKeys;
				}

				const [results, metadata] = await this.sequelize.query("UPDATE Notes_index set " + (reindexTree ? "path = :path, parents = :parents, " : "") + " title = :title, descriptionAsText = :descriptionAsText, type = :type, done = :done, priority = :priority, trash = :trash, tags = :tags where key = :key", {
					replacements: replacements
				});

			} else {
				
				let replacements = {
					key: note.key, 
					title: note.title || "", 
				};

				if (reindexTree) {
					replacements.path = path;
					replacements.parents = pathKeys;
				}

				const [results, metadata] = await this.sequelize.query("UPDATE Notes_index set " + (reindexTree ? "path = :path, parents = :parents, " : "") + " title = :title where key = :key", {
					replacements: replacements
				});

			}
		}

		if (reindexTree) {
			path = path || "";

			if (note) {
				if (path.length > 0) {
					path += " / ";
				}
				path += note.title;

				if (pathKeys.length == 0) {
					pathKeys = ",";
				}
				pathKeys += note.key + ","
			}

			let children = await nnNote.Note.findAll({
				where: {
					parent: note ? note.key : null
				}
			});

			for (let i = 0; i < children.length; i++) {
				await this.#modifyNoteIndex(children[i], reindexTree, path, pathKeys, onlyPath)
			}

		}

	}


	async #setInlineImagesBeforeWrite(htmltext) {
		// log.debug("setInlineImagesBeforeWrite htmltext", htmltext);

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

				if (nextImg.attr("data-n3asset-key")) {
					nextImg.attr("src", "");
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

	#notesArrayToKeys(notesArray) {

		let keys = notesArray && notesArray.length > 0 ? "," : "";
		if (notesArray) {
			notesArray.forEach(function(note) {
				keys = keys + note.key + ",";
			});
		}
		return keys;
	}

	async #setLinksBeforeWrite(key, description) {
		description = description || "";
			
		let $htmlCntainer = cheerio.load(description, null, false);
		let internalLinks = $htmlCntainer("[data-n3link-node]");
	
		log.debug("#setLinksBeforeWrite internalLinks.length", internalLinks.length);

		let newLinks = [];

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-n3link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-n3link-node");
				const linkToNote = await nnNote.Note.findByPk(linkToNoteKey);
				if (linkToNote) {

					if (!newLinks.includes(linkToNoteKey)) {
						newLinks.push(linkToNoteKey);
					}

					await nnLink.Link.findOrCreate({
						where: {
							from: key,
							to: linkToNoteKey
						}
					});
					
				}

				// clean goto-links before write
				$linkToNote.html("");
			}
		};

		let allLinks = await nnLink.Link.findAll({
			where: {
				from: key
			}
		});
		log.debug("#setLinksBeforeWrite newLinks", newLinks);
		for await (const link of allLinks) {

			log.debug("#setLinksBeforeWrite link", link);

			const linkToNote = await nnNote.Note.findByPk(link.to);
			if (linkToNote) {
				if (!newLinks.includes(link.to)) {
					log.debug("#setLinksBeforeWrite 2 link.destroy", link);
					await link.destroy();
				}
			} else {
				log.debug("#setLinksBeforeWrite link.destroy", link);
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
		}
		if (note.hasOwnProperty("description")) {

			let html = note.description;
			html = await this.#setLinksBeforeWrite(note.key, html);
			html = await this.#setInlineImagesBeforeWrite(html);
			html = await this.#setAttachmentsPathBeforeWrite(html);


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

		if (reindex || reindexTree) {
			let parents = await this.getParents(modifyNote.key);
			parents.pop();
			let onlyPath = reindexTree && !reindex;
			await this.#modifyNoteIndex(modifyNote, reindexTree, reindexTree ? this.#notesArrayToPath( parents ) : false, reindexTree ? this.#notesArrayToKeys( parents ) : false, onlyPath);
		}

		let resultNote = await this.toData(modifyNote, false, false, true);
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

	async findTag(tag) {
		let tags = await nnTag.Tag.findAll({
			where: {
				tag: {
				  [Op.like]: [tag + "%"]
				}
			},
			group: ["tag"]
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
			},
			order: [
				["position", "ASC"]
			],
		});

		let resultNotes = [];

		for (let i = 0; i < notes.length; i++) {
			let resultNote = await this.toData(notes[i], false, true, false);
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

		let reindexTree = true;
		let onlyPath = true;
		let parents = await this.getParents(modifyNote.key);
		parents.pop();
		await this.#modifyNoteIndex(modifyNote, reindexTree, this.#notesArrayToPath(parents), this.#notesArrayToKeys(parents), onlyPath);
	}

	// links/backlinks are not checked
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

		let trash = true;
		await this.#modifyTrashFlag(key, trash);
				

		let reindexTree = true;
		let onlyPath = true;
		let parents = await this.getParents(modifyNote.key);
		parents.pop();
		await this.#modifyNoteIndex(modifyNote, reindexTree, this.#notesArrayToPath(parents), this.#notesArrayToKeys(parents), onlyPath);
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
		let withtags = true;
		let withchildren = false;
		let withDescription = true;
		let withParents = false;

		// console.log("getNote key withDescription", key, withDescription);
		return await this.getNoteWith(key, withtags, withchildren, withDescription, withParents);

	}

	async getNoteWith(key, withtags, withchildren, withDescription, withParents) {
		if (!key) {
			return;
		} else {

			const noteModel = await nnNote.Note.findByPk(key);
			if (noteModel === null) {
				throw new nnNote.NoteNotFoundByKey(key);
			}
			// console.log("getNote2 key withDescription", key, withDescription);
			return await this.toData(noteModel, withtags, withchildren, withDescription, withParents);
		}
	}

	async isTrash(key) {
		const noteModel = await nnNote.Note.findByPk(key);
		if (noteModel === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}

		return noteModel.trash;
	}

	async getBacklinks(key) {
		let links = await nnLink.Link.findAll({
			where: {
				to: key,
			}
		});

		let backlinks = [];

		for (let i = 0; i < links.length; i++) {
			let node = await this.getNoteWith(links[i].from, false, false, false, true);
			backlinks.push(node);
		}

		return backlinks;
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

	async #setInlineImagesPathAfterRead(html) {
		let $html = cheerio.load(html || "", null, false);
		let imgs = $html("img");

		for (let i = 0; i < imgs.length; i++) {
			let nextImg = imgs.eq(i);
			if (nextImg.attr("data-n3asset-key")) {

				let assetKey = nextImg.attr("data-n3asset-key");
				let assetModel = await nnAsset.Asset.findByPk(assetKey);

				let assetSrc = path.join(this.directory, this.#assetsFolderName, assetKey, assetModel.name);
				log.debug("#setInlineImagesPathAfterRead nextImg", assetKey, assetModel, assetSrc);
				
				var imgUrl = fsSync.readFileSync(assetSrc).toString('base64');
				nextImg.attr("src", "data:image/png;base64," + imgUrl);
			}
		}

		return $html.html();
	}

	
	async #setLinksAfterRead(htmlText) {

		let $htmlCntainer = cheerio.load(htmlText, null, false);
		let internalLinks = $htmlCntainer("[data-n3link-node]");

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-n3link-node")) {
				let linkToNoteKey = $linkToNote.attr("data-n3link-node");
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

					$linkToNote.html("<span class='nn-link'>#" + path + "</span>");
				} else {
					$linkToNote.html("<span class='nn-link nn-link-to-missing-note'>#NODE " + linkToNoteKey + " NOT FOUND</span>");
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

	async #setAttachmentsPathBeforeWrite(htmltext) {
		let $linksHiddenContainer = cheerio.load(htmltext || "", null, false);
		let links = $linksHiddenContainer("a[data-n3asset-key]");

		for (let i = 0; i < links.length; i++) {
			let nextLinks = links.eq(i);
			// log.debug("#setAttachmentsPathAfterRead nextLinks", nextLinks.attr("data-n3asset-key"));
			if (nextLinks.attr("data-n3asset-key")) {
				nextLinks.attr("href", "#");
			}
		}

		return $linksHiddenContainer.html();
	}

	async addFile(parentKey, filepath, hitMode, relativeToKey) {
		log.debug("addFolder path", filepath);

		if (!path) {
			return;
		}

		let resultNote = undefined;
		
		let stats = await fs.stat(filepath);
		log.debug("addFolder stats", stats);
		if (stats.isDirectory()) {

			log.debug("addFolder filepath isDirectory");
			
			resultNote = await this.addNote(parentKey, {
				title: path.basename(filepath),
				type: "note"
			}, hitMode, relativeToKey);

			let files = await fs.readdir(filepath, { withFileTypes: true });

			for (let i = 0; i < files.length; i++) {
				await this.addFile(resultNote.key, path.join(filepath, files[i].name), "over", resultNote.key);
			}

		} else if (stats.isFile()) {
			log.debug("addFolder path isFile");

			let asset = await this.addAsset(null, path.basename(filepath), filepath, "path");

			resultNote = await this.addNote(parentKey, {
				title: path.basename(filepath),
				type: "note",
				description: "<a href='" + asset.src + "' data-n3asset-key='" + asset.key + "' download>" + path.basename(filepath) + "</a>"
			}, hitMode, relativeToKey);

		
		}

		return resultNote;

	}


	async getPriorityStat() {
		let max = await nnNote.Note.max('priority', {where : {trash: false }});
		let min = await nnNote.Note.min('priority', {where : {trash: false }});


		

		let results = await this.sequelize.query(`SELECT AVG(priority) as average FROM notes`, { type: QueryTypes.SELECT });
		let average = Math.round(results[0]['average']);
		
		
		results = await this.sequelize.query(`SELECT AVG(priority) as mediana FROM (SELECT priority FROM notes ORDER BY priority LIMIT 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM notes))`, { type: QueryTypes.SELECT });
		let mediana = Math.round(results[0]['mediana']);
		
		return {
			minimum: min,
			average: average,
			mediana: mediana,
			maximum: max
		}
	}



	async toData(note, withtags, withchildren, withDescription, withParents) {
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
			trash: note.trash,
		};

		// console.log("toData withDescription, note", withDescription, note);
		if (withDescription) {
			let description = note.description;
			description = await this.#setInlineImagesPathAfterRead(description);
			description = await this.#setAttachmentsPathAfterRead(description);
			description = await this.#setLinksAfterRead(description);

			result.description = description;
		}
		// console.log("toData result", result);

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
		if (withParents) {
			let parents = await this.getParents(note.key);
			result.parents = parents;
		}

		return result;
	}

	toString() {
		return `RepositorySQLite[name: "${ this.name }", directory: "${ this.directory }", isDefault: "${ this.isDefault }"]`;
	}

}

module.exports = {
	RepositorySQLite: RepositorySQLite
}