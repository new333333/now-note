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

class RepositorySQLite  {

	constructor(name, directory, isDefault, searchService) {
		this.name = name;
		this.directory = directory;
		this.isDefault = isDefault;
		this.searchService = searchService;
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
			}
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

		// await this.sequelize.sync({ alter: true });
	}

	async closeRepository() {
		if (this.searchService) {
			await this.searchService.saveIndex();
		}
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
		// const [results, metadata] = await this.sequelize.query("CREATE VIRTUAL TABLE email USING fts5(sender, title, body)");
		
		
		log.debug("RepositorySQLite.addNote parentNoteKey, note, hitMode, relativeToKey", parentNoteKey, note, hitMode, relativeToKey);

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
				},
				type: QueryTypes.SELECT
			});

			note.position = 0;
		}

		let newNote = await nnNote.Note.create(note);

		let resultNote = await this.toData(newNote, false, false);



		/*

		newNoteData.hasOwnProperty("links") ||
		newNoteData.hasOwnProperty("backlinks") 

		this.searchService.addNoteToIndex(note, parentsObj.parents);
		*/

		return resultNote;
	}

	async modifyNote(note) {
		const modifyNote = await nnNote.Note.findByPk(note.key);
		if (modifyNote === null) {
			throw new nnNote.NoteNotFoundByKey(note.key);
		}

		if (note.hasOwnProperty("title")) {
			let oldTitle = await nnTitle.Title.create({
				key: note.key, 
				title: note.title
			});
			modifyNote.title = note.title;
		}
		if (note.hasOwnProperty("description")) {
			let oldDescription = await nnDescription.Description.create({
				key: note.key, 
				description: note.description
			});
			modifyNote.description = note.description;
		}
		if (note.hasOwnProperty("type")) {
			modifyNote.type = note.type;
		}
		if (note.hasOwnProperty("done")) {
			modifyNote.done = note.done;
		}
		if (note.hasOwnProperty("priority")) {
			modifyNote.priority = note.priority;
		}
		if (note.hasOwnProperty("expanded")) {
			modifyNote.expanded = note.expanded;
		}
		

		modifyNote.save();

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
	async getChildren(key) {
		let notes = await nnNote.Note.findAll({
			where: {
				parent: !key ? null : key,
				trash: false
			}
		});

		let that = this;
		let resultNotes = [];

		for (let i = 0; i < notes.length; i++) {
			let resultNote = await that.toData(notes[i], false, true);
			resultNotes.push(resultNote);
		};

		return resultNotes;
	}


	// hitMode == "over" | "before" | "after"
	async moveNote(key, from, to, hitMode, relativTo) {
		log.debug("moveNote(key, from, to, hitMode, relativTo)", key, from, to, hitMode, relativTo);

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
			return toData(noteModel, false, false);
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
		// log.debug("getParentsStore key, parentsObj", key, parentsObj);

		parents = parents || [];

		let noteModel = await nnNote.Note.findByPk(key);
		if (noteModel === null) {
			throw new nnNote.NoteNotFoundByKey(key);
		}
		if (noteModel.parent == null) {
			parents.unshift(noteModel);
			return parents;
		} else {
			parents.unshift(noteModel);
			return await getParents(noteModel.parent, parents);
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
		log.debug("**************** result", result);

		return result;
	}

	toString() {
		return `RepositorySQLite[name: "${ this.name }", directory: "${ this.directory }", isDefault: "${ this.isDefault }"]`;
	}

}

module.exports = {
	RepositorySQLite: RepositorySQLite
}