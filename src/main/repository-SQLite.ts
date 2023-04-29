import sqlite3 from 'sqlite3';
import log from 'electron-log';
import path from 'path';
import { Sequelize, DataTypes, Op, QueryTypes } from 'sequelize';
import cheerio from 'cheerio';
import fs from 'fs';
import Title from './title';
import { Note, NoteNotFoundByKey } from './note';
import Repository from './repository';
import Description from './description';
import Tag from './tag';
import Link from './link';
import Asset from './asset';

export const SQLITE3_TYPE = 'sqlite3';

export interface RepositorySettings {
  filter: {
    onlyNotes: boolean;
    onlyTasks: boolean;
    onlyDone: boolean;
    onlyNotDone: boolean;
  };

  state: {
    details: {
      key: string;
    };
    list: {
      key: string;
    };
  };

  filterOnlyNotes: boolean;
  filterOnlyTasks: boolean;
  filterOnlyDone: boolean;
  filterOnlyNotDone: boolean;
}

export class RepositorySQLite implements Repository {
  name: string;

  directory: string;

  defaultRepository: boolean;

  userName: string;

  sequelize: Sequelize | null = null;

  ASSET_FOLDER_NAME: string = 'assets';

  SETTINGS_FILE_NAME: string = 'now-note-repository-settings.json';

  constructor(
    name: string,
    directory: string,
    defaultRepository: boolean,
    userName: string
  ) {
    this.name = name;
    this.directory = directory;
    this.defaultRepository = defaultRepository;
    this.userName = userName;
  }

  getName(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  getType(): typeof SQLITE3_TYPE {
    return SQLITE3_TYPE;
  }

  isDefault(): boolean {
    return this.defaultRepository;
  }

  getDirectory(): string {
    return this.directory;
  }

  async setRepositorySettings(newSettings: RepositorySettings) {
    let settings = await this.getRepositorySettings();

    settings = { ...settings, ...newSettings };

    delete settings.filterOnlyNotes;
    delete settings.filterOnlyNotes;
    delete settings.filterOnlyTasks;
    delete settings.filterOnlyDone;
    delete settings.filterOnlyNotDone;

    const settingsFilePath = path.join(this.directory, this.SETTINGS_FILE_NAME);
    await fs.promises.writeFile(
      settingsFilePath,
      JSON.stringify(settings, null, 2)
    );
  }

  async getRepositorySettings() {
		let settingsText = "{}";
		let settingsFilePath = path.join(this.directory, this.SETTINGS_FILE_NAME);
		// log.info("getRepositorySettings settingsFilePath=", settingsFilePath);
        try {
            settingsText = await fs.promises.readFile(settingsFilePath, "utf-8");
        } catch (error) {
            // log.warn("Cannot load repository settings from " + settingsFilePath);
        }
        let settings = JSON.parse(settingsText);
		// log.info("getRepositorySettings settings=", settings);
		return settings;
  }


	async open() {
		// local variable required by init
		let sequelize: Sequelize = new Sequelize({
			logging: false,
			dialect: 'sqlite',
      dialectModule: sqlite3,
			storage: path.join(this.directory, "db.sqlite3")
		});
		this.sequelize = sequelize;

		try {
			await this.sequelize!.authenticate();
			// log.debug('Connection has been established successfully.');
		} catch (error) {
			log.error('Unable to connect to the database:', error);
		}

		Note.init({
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
			},
			restoreParentKey: {
				type: DataTypes.UUID,
				allowNull: true,
				unique: false
			},
			linkToKey: {
				type: DataTypes.UUID,
				allowNull: true,
				unique: false
			},
		}, {
			sequelize,
			indexes: [
				{
					unique: false,
					fields: ['parent']
				}
			]
		});

		Title.init({
			key: {
				type: DataTypes.UUID,
				allowNull: false
			},
			title: {
				type: DataTypes.STRING(1000),
				allowNull: false
			}
		}, { sequelize });


		Description.init({
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

		Tag.init({
			key: {
				type: DataTypes.UUID,
				allowNull: false
			},
			tag: {
				type: DataTypes.STRING,
				allowNull: false
			}
		}, { sequelize });

		Link.init({
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
				allowNull: true
			}
		}, { sequelize });

		Asset.init({
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


  async sequelizeSync() {
    await this.sequelize!.query(`DROP TABLE IF EXISTS Notes_backup`);
    await this.sequelize!.query(`DROP TABLE IF EXISTS Titles_backup`);
    await this.sequelize!.query(`DROP TABLE IF EXISTS Descriptions_backup`);
    await this.sequelize!.query(`DROP TABLE IF EXISTS Tags_backup`);
    await this.sequelize!.query(`DROP TABLE IF EXISTS Links_backup`);
    await this.sequelize!.query(`DROP TABLE IF EXISTS Assets_backup`);
    await this.sequelize!.sync({ alter: true });
  }

  async setupSQLite_Links_type() {
    log.info('setupSQLite Link.type column');
    const [results, metadata] = await this.sequelize!.query(
      `PRAGMA table_info(Links)`
    );
    const linkTypeColumn = results.find(
      (column: any) => column.name === 'type'
    );

    if (!linkTypeColumn) {
      const queryInterface = this.sequelize!.getQueryInterface();
      const transaction = await this.sequelize!.transaction();
      try {
        log.info('setupSQLite add Link.type column');
        await queryInterface.addColumn(
          'Links',
          'type',
          {
            type: DataTypes.STRING,
            allowNull: true,
          },
          { transaction }
        );

        await transaction.commit();
      } catch (err) {
        log.error(err);
        await transaction.rollback();
      }
    }
  }

  async setupSQLite_Notes_linkToKey() {
    log.info('setupSQLite Notes.linkToKey column');
    const [results, metadata] = await this.sequelize!.query(
      `PRAGMA table_info(Notes)`
    );
    log.info('setupSQLite_Notes_linkToKey results', results);
    const linkToKeyKeyColumn = results.find(
      (column: any) => column.name === 'linkToKey'
    );
    log.info('setupSQLite_Notes_linkToKey linkToKeyKeyColumn', linkToKeyKeyColumn);
    if (!linkToKeyKeyColumn) {
      const queryInterface = this.sequelize!.getQueryInterface();
      const transaction = await this.sequelize!.transaction();
      try {
        log.info('setupSQLite_Notes_linkToKey add Notes.linkToKey column');
        await queryInterface.addColumn(
          'Notes',
          'linkToKey',
          {
            type: DataTypes.UUID,
            allowNull: true,
            unique: false,
          },
          { transaction }
        );
        await transaction.commit();
      } catch (err) {
        log.error(err);
        await transaction.rollback();
      }
    }
  }

  async setupSQLite_Index_notes_parent() {
    log.info('setupSQLite check index');
    const [results, metadata] = await this.sequelize!.query(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='notes_parent'`
    );
    if (results.length === 0) {
      await this.sequelizeSync();
    }
  }

  async setupSQLite_Notes() {
    log.info('setupSQLite Notes');
    const [results, metadata] = await this.sequelize!.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='Notes'`
    );
    if (results.length === 0) {
      await this.sequelizeSync();
    }
  }

  async setupSQLite_Notes_index() {
    log.info('setupSQLite Notes_index');
    const [results, metadata] = await this.sequelize!.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='Notes_index'`
    );
    if (results.length === 0) {
   	  await this.sequelize!.query(
        `CREATE VIRTUAL TABLE Notes_index USING FTS5(key UNINDEXED, path, parents, title, descriptionAsText, tags, type, done, priority, trash, prefix='1 2 3')`
      );
    }
  }

  async setupSQLite_Notes_restoreParentKey() {
    const [results, metadata] = await this.sequelize!.query(
      `PRAGMA table_info(Notes)`
    );
    const restoreParentKeyColumn = results.find(
      (column: any) => column.name === 'restoreParentKey'
    );

    if (!restoreParentKeyColumn) {
      const queryInterface = this.sequelize!.getQueryInterface();
      const transaction = await this.sequelize!.transaction();
      try {
        await queryInterface.addColumn(
          'Notes',
          'restoreParentKey',
          {
            type: DataTypes.UUID,
            allowNull: true,
            unique: false,
          },
          { transaction }
        );
        await transaction.commit();
      } catch (err) {
        log.error(err);
        await transaction.rollback();
      }
    }
  }

  async #setupSQLite() {
    await this.setupSQLite_Links_type();
    await this.setupSQLite_Notes_linkToKey();
    await this.setupSQLite_Index_notes_parent();
    await this.setupSQLite_Notes();
    await this.setupSQLite_Notes_index();
    await this.setupSQLite_Notes_restoreParentKey();
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: any
  ) {
    let searchResult = {};

    const trashQuery: number = trash ? 1 : 0;
    options = options || {};


		let select = `SELECT * FROM Notes_index `;
		let selectCount = `SELECT count(*) FROM Notes_index `;
		let where = ` WHERE
				${searchText ? "(title MATCH :searchText or descriptionAsText MATCH :searchText or path MATCH :searchText) and" : ""}
				${options.parentNotesKey && options.parentNotesKey.length > 0 ? " (" + options.parentNotesKey.map((key: any, index: number) => " parents like '%," + key + ",%' " + (index < options.parentNotesKey.length - 1 ? " or " : " ")).join(" ") + ") and" : ""}
				${options.types ? "  type in (" + options.types.join(", ") + ") and" : ""}
				${options.dones ? "  done in (" + options.dones.join(", ") + ") and" : ""}
				trash=${trashQuery}
			${options.sortBy ? " ORDER BY " + options.sortBy : " ORDER BY rank"}
			`;

		let limitWhere = " ";
		if (limit > -1) {
			limitWhere = " LIMIT :limit OFFSET :offset ";
		}



		let selectResults = await this.sequelize!.query(
			select + where + limitWhere, {
				replacements: {
					searchText: (searchText + "*") || "*",
					limit: limit,
					offset: options.offset || 0,
				},
				raw: true,
				type: QueryTypes.SELECT
			}
		);

		let countResults: any = await this.sequelize!.query(
			selectCount + where, {
				replacements: {
					searchText: (searchText + "*") || "*",
				},
				raw: true,
				type: QueryTypes.SELECT
			}
		);


		searchResult = {
			offset: options.offset || 0,
			limit: limit,
			results: selectResults,
			maxResults: countResults[0]['count(*)'],
		};

		return searchResult;
	}

	async reindexAll() {
		let reindexTree = true;
		let path = "";
		let onlyPath = false;
		let pathKeys = "";
		await this.#modifyNoteIndex(null, reindexTree, path, pathKeys, onlyPath);
	}

	async closeRepository() {
		await this.sequelize!.close();
	}

	async getRepository() {
		return {
			name: this.name,
			directory: this.directory,
			isDefault: this.defaultRepository
		};
	}

	async addNote(parentNoteKey: any, note: any, hitMode: any, relativeToKey: any) {


		// log.debug("RepositorySQLite.addNote parentNoteKey, note, hitMode, relativeToKey", parentNoteKey, note, hitMode, relativeToKey);

		// set parent
		note.parent = parentNoteKey;
		if (parentNoteKey.startsWith("root_")) {
			note.parent = null;
		}

		// set position
		if (hitMode == "firstChild") {
			const [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (note.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash", {
				replacements: {
					parent: note.parent,
					trash: false
				}
			});

			note.position = 0;
		} else if (hitMode == "over") {

			let max = await Note.max("position", {
				where:  {
					parent: parentNoteKey
				}
			});

			// log.info("addNote parentNoteKey=, title=, max=", parentNoteKey, note.title, max);
			note.position = max == null ? 0 : max + 1;

		} else if (hitMode == "after") {

			const relativNote = await Note.findByPk(relativeToKey);
			if (relativNote === null) {
				throw new NoteNotFoundByKey(relativNote);
			}

			let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
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

			const relativNote = await Note.findByPk(relativeToKey);
			if (relativNote === null) {
				throw new NoteNotFoundByKey(relativNote);
			}

			let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
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
			note.description = html;
		}

		let newNote = await Note.create(note);

		if (newNote.hasOwnProperty("description")) {
			let html = newNote.description;
			html = await this.#setLinksBeforeWrite(newNote.key, html);
			newNote.description = html;
		}
		await newNote.save();

		let resultNote = await this.toData(newNote, false, false, true);

		await this.#addNoteIndex(newNote);

		if (newNote.linkToKey) {
			await Link.create({
				from: newNote.key,
				to: newNote.linkToKey,
				type: "note"
			});

		}

		return resultNote;
	}


	async #addNoteIndex(newNote) {
		let parents = await this.getParents(newNote.key);

		parents.pop();

		let $description = cheerio.load(newNote.description || "", null, false);

		let path = this.#notesArrayToPath(parents);
		let parentsKeys = this.#notesArrayToKeys(parents);
		const [results, metadata] = await this.sequelize!.query("INSERT INTO Notes_index (key, path, parents, title, descriptionAsText, type, done, priority, trash) VALUES (:key, :path, :parents, :title, :descriptionAsText, :type, :done, :priority, :trash)", {
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
				let tags = await Tag.findAll({
					where: {
						key: note.key
					}
				});

				var tagsAsString = tags.map(function(tag){
					return Tag;
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

				const [results, metadata] = await this.sequelize!.query("UPDATE Notes_index set " + (reindexTree ? "path = :path, parents = :parents, " : "") + " title = :title, descriptionAsText = :descriptionAsText, type = :type, done = :done, priority = :priority, trash = :trash, tags = :tags where key = :key", {
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

				const [results, metadata] = await this.sequelize!.query("UPDATE Notes_index set " + (reindexTree ? "path = :path, parents = :parents, " : "") + " title = :title where key = :key", {
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

			let children = await Note.findAll({
				where: {
					parent: note ? note.key : null
				}
			});

			for (let i = 0; i < children.length; i++) {
				await this.#modifyNoteIndex(children[i], reindexTree, path, pathKeys, onlyPath)
			}

		}

	}


	async getAssetFileReadStream(assetKey) {
		const assetModel = await Asset.findByPk(assetKey);
		const assetSrc = path.join(this.directory, this.ASSET_FOLDER_NAME, assetKey, assetModel.name);
		const assetFileReadableStream = fs.createReadStream(assetSrc);
		return assetFileReadableStream;
	}

	async copyAssetFileToFolder(assetKey, targetFolder) {
		const assetModel = await Asset.findByPk(assetKey);
		const assetSrc = path.join(this.directory, this.ASSET_FOLDER_NAME, assetKey, assetModel.name);
		await fs.promises.copyFile(assetSrc, targetFolder);
	}

	async getAssetFileName(assetKey) {
		const assetModel = await Asset.findByPk(assetKey);
		return assetModel.name;
	}

	async getAssetFilePath(assetKey) {
		const assetModel = await Asset.findByPk(assetKey);
		const assetPath = path.join(this.directory, this.ASSET_FOLDER_NAME, assetKey, assetModel.name);
		return assetPath;
	}

	async #setInlineImagesBeforeWrite(htmltext) {
		// log.debug("setInlineImagesBeforeWrite htmltext", htmltext);

		try {
			if (!htmltext) {
				return htmltext;
			}

			let $description = cheerio.load(htmltext, null, false);
			let imgs = $description("img");

			for (let i = 0; i < imgs.length; i++) {
				let nextImg = imgs.eq(i);

				// log.debug("setInlineImagesBeforeWrite nextImg", nextImg);
				// log.debug("setInlineImagesBeforeWrite nextImg.attr(src)", nextImg.attr("src"));

				// log.debug("setInlineImagesBeforeWrite indexOf", nextImg.attr("src").indexOf("file://"));
				// log.debug("setInlineImagesBeforeWrite if", (nextImg.attr("src") && nextImg.attr("src").indexOf("file://") == 0));

				let imgSrc = nextImg.attr("src");
				// log.debug("setInlineImagesBeforeWrite imgSrc", imgSrc);

				if (imgSrc) {
					// log.debug("setInlineImagesBeforeWrite has imgSrc", imgSrc);

					if (nextImg.attr("data-n3asset-key")) {
						// support old repository implementations
						// log.debug("setInlineImagesBeforeWrite has old n3asset-key");
						let assetKey = nextImg.attr("data-n3asset-key");

						nextImg.removeAttr("data-n3asset-key");
						nextImg.attr("src", "nn-asset:" + assetKey);
					} else if (imgSrc.indexOf("data:image/") == 0) {
						// log.debug("setInlineImagesBeforeWrite is data:image");

						// save as asset data:image/png;base64,...
						let fileType = imgSrc.substring(5, 14); // image/png
						let fileName = "img.png";
						let filePathOrBase64 = imgSrc.substring(22);
						let fileTransferType = imgSrc.substring(15, 21); // base64
						let asset = await this.addAsset(fileType, fileName, filePathOrBase64, fileTransferType);
						// log.debug("write back img?", asset);
						nextImg.attr("src", "nn-asset:" + asset.key);

					} else if (imgSrc.indexOf("file:///") == 0) {
						// copy/paste e.g. from outlook
						log.debug("setInlineImagesBeforeWrite is file:///");

						let filePath = imgSrc.substring("file:///".length);
						// log.debug("setInlineImagesBeforeWrite filePath", filePath);

						let asset = await this.addAsset(null, path.basename(filePath), filePath, "path");

						nextImg.attr("src", "nn-asset:" + asset.key);
					} else if (imgSrc.indexOf("file://") == 0) {
						// copy/paste e.g. from outlook
						log.debug("setInlineImagesBeforeWrite is file://");

						let filePath = imgSrc.substring("file://".length);
						// log.debug("setInlineImagesBeforeWrite filePath", filePath);

						let asset = await this.addAsset(null, path.basename(filePath), filePath, "path");

						nextImg.attr("src", "nn-asset:" + asset.key);
					}

				}
			}

			return $description.html();
		} catch (e) {
			log.error(e);
			return htmltext;
		}
	}

	// return {src: fileSource, key: assetKey}
	async addAsset(fileType, fileName, filePathOrBase64, fileTransferType) {
		// log.debug("addAsset ", fileType, fileName, fileTransferType);

		let assetModel = await Asset.create({
			type: fileType,
			name: fileName,
			createdBy: this.userName
		});

		let assetFile = path.join(this.directory, this.ASSET_FOLDER_NAME, assetModel.key);
		await fs.promises.mkdir(assetFile, { recursive: true });
		assetFile = path.join(assetFile, fileName);
		if (fileTransferType === "base64") {
			// log.debug("addAsset blob writeFile ", assetFile);
			await fs.promises.writeFile(assetFile, Buffer.from(filePathOrBase64,"base64"));
			// log.debug("addAsset resolve1 ", assetFile, assetKey);
		} else {
			// log.debug("addAsset copyFile ", filePathOrBase64, assetFile);
			await fs.promises.copyFile(filePathOrBase64, assetFile);
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
		let internalLinks = $htmlCntainer("[data-nnlink-node]");

		// log.debug("#setLinksBeforeWrite internalLinks.length", internalLinks.length);

		let newLinks = [];

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-nnlink-node")) {
				let linkToNoteKey = $linkToNote.attr("data-nnlink-node");
				const linkToNote = await Note.findByPk(linkToNoteKey);
				if (linkToNote) {

					if (!newLinks.includes(linkToNoteKey)) {
						newLinks.push(linkToNoteKey);
					}

					await Link.findOrCreate({
						where: {
							from: key,
							to: linkToNoteKey,
							type: {
								[Op.or]: {
									[Op.lt]: "link",
									[Op.eq]: null,
								},
							},
						}, defaults: {
							from: key,
							to: linkToNoteKey,
							type: "link",
						}
					});

				}

				// clean goto-links before write
				$linkToNote.html("");
			}
		};

		let allLinks = await Link.findAll({
			where: {
				from: key,
				type: {
					[Op.or]: {
						[Op.lt]: "link",
						[Op.eq]: null,
					},
				},
			}
		});
		// log.debug("#setLinksBeforeWrite newLinks", newLinks);
		for await (const link of allLinks) {

			// log.debug("#setLinksBeforeWrite link", link);

			const linkToNote = await Note.findByPk(link.to);
			if (linkToNote) {
				if (!newLinks.includes(link.to)) {
					// log.debug("#setLinksBeforeWrite 2 link.destroy", link);
					await link.destroy();
				}
			} else {
				// log.debug("#setLinksBeforeWrite link.destroy", link);
				await link.destroy();
			}
		}

		return $htmlCntainer.html();
	}

	async modifyNote(note, skipVersioning) {
		const modifyNote = await Note.findByPk(note.key);
		if (modifyNote === null) {
			throw new NoteNotFoundByKey(note.key);
		}


		let reindex = false;
		let reindexTree = false;
		if (note.hasOwnProperty("title")) {
			if (!skipVersioning) {
				let oldTitle = await Title.create({
					key: modifyNote.key,
					title: modifyNote.title
				});
			}
			if (modifyNote.title != note.title) {
				reindexTree = true;
			}
			modifyNote.title = note.title;
		}
		if (note.hasOwnProperty("description")) {

			let html = note.description;
			html = await this.#setLinksBeforeWrite(note.key, html);
			html = await this.#setInlineImagesBeforeWrite(html);

			if (!skipVersioning) {
				let oldDescription = await Description.create({
					key: modifyNote.key,
					description: modifyNote.description,
					descriptionAsText: modifyNote.descriptionAsText,
				});
			}
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


		await modifyNote.save();

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

		const [newtag, created] = await Tag.findOrCreate({
			where: {
				key: key,
				tag: tag
			}
		});

		let tags = await Tag.findAll({
			where: {
				key: key
			}
		});

		let tagsObj = tags.map(function(currentTag) {
			return currentTag;
		});

		return tagsObj;
	}

	async removeTag(key, tag) {
		await Tag.destroy({
			where: {
				key: key,
				tag: tag
			}
		});

		let tags = await Tag.findAll({
			where: {
				key: key
			}
		});

		let tagsObj = tags.map(function(currentTag) {
			return currentTag;
		});

		return tagsObj;
	}

	async findTag(tag) {
		let tags = await Tag.findAll({
			where: {
				tag: {
				  [Op.like]: [tag + "%"]
				}
			},
			group: ["tag"]
		});

		let tagsObj = tags.map(function(currentTag) {
			return currentTag;
		});

		return tagsObj;
	}

	// load root nodes, if key undefined
	// load children notes if key defined
	async getChildren(key, trash = false) {
		// log.info("getChildren, key, trash", key, trash);
		let notes = await Note.findAll({
			where: {
				parent: !key ? null : key,
				trash: trash
			},
			order: [
				["position", "ASC"]
			],
		});

		let withtags = false;
		let withchildren = true;
		let withDescription = false;
		let withParents = false;

		let resultNotes = [];
		for (let i = 0; i < notes.length; i++) {
			let noteModel = notes[i];

			if (noteModel.type == "link") {
				let linkedNoteModel = await this.getNoteWith(noteModel.linkToKey, withtags, false, withDescription, withParents);
				noteModel.linkedNote = await this.toData(linkedNoteModel, withtags, false, withDescription, withParents);
			}
			let resultNote = await this.toData(noteModel, withtags, withchildren, withDescription, withParents);
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

		const modifyNote = await Note.findByPk(key);
		if (modifyNote === null) {
			throw new NoteNotFoundByKey(key);
		}

		// count parent and position
		if (hitMode === "over") {

			const [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
				replacements: {
					parent: modifyNote.parent,
					position: modifyNote.position,
					trash: false
				},
				type: QueryTypes.SELECT
			});

			modifyNote.parent = to;
			let max = await Note.max("position", {
				where:  {
					parent: to ? to : null,
					trash: false
				}
			});

			modifyNote.position = max == null ? 0 : max + 1;

		} else if (hitMode === "before") {
			const relativNote = await Note.findByPk(relativTo);
			if (relativNote === null) {
				throw new NoteNotFoundByKey(relativNote);
			}

			if (modifyNote.parent == relativNote.parent) {

				let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				await relativNote.reload();

				[results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
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

				let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				[results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position >= :position", {
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
			const relativNote = await Note.findByPk(relativTo);
			if (relativNote === null) {
				throw new NoteNotFoundByKey(relativNote);
			}

			if (modifyNote.parent == relativNote.parent) {

				let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				await relativNote.reload();

				[results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: relativNote.parent,
						position: relativNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				modifyNote.position = relativNote.position + 1;



			} else {

				let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
					replacements: {
						parent: modifyNote.parent,
						position: modifyNote.position,
						trash: false
					},
					type: QueryTypes.SELECT
				});

				[results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position + 1 where " + (relativNote.parent == null ? "parent is NULL " : "parent = :parent") + " and trash = :trash and position > :position", {
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

	async moveNoteToTrash(key) {
		// log.info("moveNoteToTrash, key=", key);
		if (!key) {
			return;
		}

		const modifyNote = await Note.findByPk(key);
		if (modifyNote === null) {
			throw new NoteNotFoundByKey(key);
		}

		let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
			replacements: {
				parent: modifyNote.parent,
				position: modifyNote.position,
				trash: false
			},
			type: QueryTypes.SELECT
		});

		let max = await Note.max("position", {
			where:  {
				parent: null,
				trash: true
			}
		});

		modifyNote.restoreParentKey = modifyNote.parent;
		modifyNote.parent = null;
		modifyNote.position = max == null ? 0 : max + 1;
		modifyNote.trash = true;
		modifyNote.save();

		let trash = true;
		await this.#modifyTrashFlag(key, trash);


		let reindexTree = true;
		let onlyPath = false;
		let parents = await this.getParents(modifyNote.key);
		parents.pop();
		await this.#modifyNoteIndex(modifyNote, reindexTree, this.#notesArrayToPath(parents), this.#notesArrayToKeys(parents), onlyPath);
	}

	async restore(key) {
		// log.info("restore, key=", key);
		if (!key) {
			return;
		}

		const modifyNote = await Note.findByPk(key);
		if (modifyNote === null) {
			throw new NoteNotFoundByKey(key);
		}
		// log.info("restore, modifyNote=", modifyNote);
		let parentKey = modifyNote.parent;
		// log.info("restore, parentKey=", parentKey);

		let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (modifyNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
			replacements: {
				parent: modifyNote.parent,
				position: modifyNote.position,
				trash: true
			},
			type: QueryTypes.SELECT
		});
		let max = await Note.max("position", {
			where:  {
				parent: modifyNote.parent,
				trash: false
			}
		});
		modifyNote.position = max == null ? 0 : max + 1;

		modifyNote.parent = modifyNote.restoreParentKey;
		modifyNote.restoreParentKey = null;
		modifyNote.trash = false;
		modifyNote.save();

		let trash = false;
		await this.#modifyTrashFlag(key, trash);


		let reindexTree = true;
		let onlyPath = false;
		let parents = await this.getParents(modifyNote.key);
		parents.pop();
		await this.#modifyNoteIndex(modifyNote, reindexTree, this.#notesArrayToPath(parents), this.#notesArrayToKeys(parents), onlyPath);
	}

	async deletePermanently(key, skipUpdatePosition) {
		// log.info("deletePermanently, key=", key);

		if (!key) {
			return;
		}

		const deleteNote = await Note.findByPk(key);
		if (deleteNote === null) {
			throw new NoteNotFoundByKey(key);
		}

		let children = await Note.findAll({
			where: {
				parent: key,
				trash: true
			}
		});

		for (let i = 0; i < children.length; i++) {
			await this.deletePermanently(children[i].key, true);
		}

		if (!skipUpdatePosition) {
			let [results, metadata] = await this.sequelize!.query("UPDATE Notes SET position = position - 1 where " + (deleteNote.parent == null ? "parent is NULL" : "parent = :parent") + " and trash = :trash and position > :position", {
				replacements: {
					parent: deleteNote.parent,
					position: deleteNote.position,
					trash: true
				},
				type: QueryTypes.SELECT
			});
		}

		const [results, metadata] = await this.sequelize!.query("DELETE FROM Notes_index where key = :key and trash = :trash", {
			replacements: {
				key: key,
				trash: true
			},
		});

		await Description.destroy({
			where: {
				key: key,
			},
		});

		await Link.destroy({
			where: {
				from: key,
				type: {
					[Op.or]: {
						[Op.lt]: "link",
						[Op.eq]: null,
					},
				},
			},
		});

		await Tag.destroy({
			where: {
				key: key,
			},
		});

		await Title.destroy({
			where: {
				key: key,
			},
		});

		deleteNote.destroy();
	}

	async #modifyTrashFlag(key, trash) {
		// log.info("#modifyTrashFlag, key=", key);

		await Note.update(
			{
				trash: trash
			},
			{
				where: {
					parent: key
				}
			}
		);

		let children = await Note.findAll({
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

		return await this.getNoteWith(key, withtags, withchildren, withDescription, withParents);

	}

	async getNoteWith(key, withtags, withchildren, withDescription, withParents) {
		if (!key) {
			return;
		} else {

			const noteModel = await Note.findByPk(key);
			if (noteModel === null) {
				return undefined;
			}


			if (noteModel.type == "link") {
				let linkedNoteModel = await this.getNoteWith(noteModel.linkToKey, withtags, false, withDescription, withParents);
				noteModel.linkedNote = await this.toData(linkedNoteModel, withtags, false, withDescription, withParents);
			}


			return await this.toData(noteModel, withtags, withchildren, withDescription, withParents);
		}
	}

	async isTrash(key) {
		const noteModel = await Note.findByPk(key);
		if (noteModel === null) {
			throw new NoteNotFoundByKey(key);
		}

		return noteModel.trash;
	}

	async getBacklinks(key) {
		let links = await Link.findAll({
			where: {
				to: key,
			}
		});

		let backlinks = [];

		for (let i = 0; i < links.length; i++) {
			let node = await this.getNoteWith(links[i].from, false, false, false, true);

			if (node.parents.length > 0) {
				if (node.parents[node.parents.length - 1].type == "link") {
					let linkedNoteModel = await this.getNoteWith(node.parents[node.parents.length - 1].linkToKey, false, false, false, false);
					node.parents[node.parents.length - 1].linkedNote = await this.toData(linkedNoteModel, false, false, false, false);
				}
			}

			backlinks.push({
				type: links[i].type,
				note: node
			});
		}

		return backlinks;
	}

	async getParents(key, parents) {
		// log.debug("getParentsStore key, parentsObj", key, parents);

		parents = parents || [];

		let noteModel = await Note.findByPk(key, {
			raw: true,
		});

		// log.debug("getParentsStore noteModel", noteModel);

		if (noteModel === null) {
			throw new NoteNotFoundByKey(key);
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
		// support old repository implementations
		let $html = cheerio.load(html || "", null, false);
		let imgs = $html("img");

		for (let i = 0; i < imgs.length; i++) {
			let nextImg = imgs.eq(i);
			if (nextImg.attr("data-n3asset-key")) {
				let assetKey = nextImg.attr("data-n3asset-key");
				nextImg.attr("src", "nn-asset:" + assetKey);
				nextImg.removeAttr("data-n3asset-key");
			}
		}

		return $html.html();
	}


	async #setLinksAfterRead(htmlText) {

		let $htmlCntainer = cheerio.load(htmlText, null, false);
		let internalLinks = $htmlCntainer("[data-nnlink-node]");

		for (let i = 0; i < internalLinks.length; i++) {
			let $linkToNote = internalLinks.eq(i);
			if ($linkToNote.attr("data-nnlink-node")) {
				let linkToNoteKey = $linkToNote.attr("data-nnlink-node");
				const note = await Note.findByPk(linkToNoteKey);
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
		// support old repository implementation
		let $linksHiddenContainer = cheerio.load(htmltext || "", null, false);
		let links = $linksHiddenContainer("a[data-n3asset-key]");

		for (let i = 0; i < links.length; i++) {
			let nextLinks = links.eq(i);
			// log.debug("#setAttachmentsPathAfterRead nextLinks", nextLinks.attr("data-n3asset-key"));
			if (nextLinks.attr("data-n3asset-key")) {

				let assetKey = nextLinks.attr("data-n3asset-key");

				nextLinks.attr("href", "nn-asset:" + assetKey);
				nextLinks.removeAttr("data-n3asset-key");
			}
		}

		return $linksHiddenContainer.html();
	}

	async addFile(parentKey, filepath, hitMode, relativeToKey) {
		// log.debug("addFolder path", filepath);

		if (!path) {
			return;
		}

		let resultNote = undefined;

		let stats = await fs.promises.stat(filepath);
		// log.debug("addFolder stats", stats);
		if (stats.isDirectory()) {

			// log.debug("addFolder filepath isDirectory");

			resultNote = await this.addNote(parentKey, {
				title: path.basename(filepath),
				type: "note"
			}, hitMode, relativeToKey);

			let files = await fs.promises.readdir(filepath, { withFileTypes: true });

			for (let i = 0; i < files.length; i++) {
				await this.addFile(resultNote.key, path.join(filepath, files[i].name), "over", resultNote.key);
			}

		} else if (stats.isFile()) {
			// log.debug("addFolder path isFile");

			let asset = await this.addAsset(null, path.basename(filepath), filepath, "path");

			resultNote = await this.addNote(parentKey, {
				title: path.basename(filepath),
				type: "note",
				description: "<a href='nn-asset:" + asset.key + "' download>" + path.basename(filepath) + "</a>"
			}, hitMode, relativeToKey);


		}

		return resultNote;

	}


	async getPriorityStat() {
		let max = await Note.max('priority', {where : {trash: false }});
		let min = await Note.min('priority', {where : {trash: false }});




		let results = await this.sequelize!.query(`SELECT AVG(priority) as average FROM notes`, { type: QueryTypes.SELECT });
		let average = Math.round(results[0]['average']);


		results = await this.sequelize!.query(`SELECT AVG(priority) as mediana FROM (SELECT priority FROM notes ORDER BY priority LIMIT 2 OFFSET (SELECT (COUNT(*) - 1) / 2 FROM notes))`, { type: QueryTypes.SELECT });
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
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
			done: note.done,
			priority: note.priority,
			expanded: note.expanded,
			trash: note.trash,
			linkToKey: note.linkToKey,
			linkedNote: note.linkedNote,
		};

		if (withDescription) {
			let description = note.description;
			description = await this.#setInlineImagesPathAfterRead(description);
			description = await this.#setAttachmentsPathAfterRead(description);
			description = await this.#setLinksAfterRead(description);

			result.description = description;
		}

		if (withchildren) {
			const countChildren = await Note.count({
				where: {
					parent: note.key
				}
			});
			result.hasChildren = countChildren > 0;
		}

		if (withtags) {
			let tags = await Tag.findAll({
				where: {
					key: note.key
				}
			});

			result.tags = tags.map(function(currentTag) {
				return currentTag;
			});
		}
		if (withParents) {
			let parents = await this.getParents(note.key);
			result.parents = parents;
		}

		return result;
	}

	toString() {
		return `RepositorySQLite[name: "${ this.name }", directory: "${ this.directory }", defaultRepository: "${ this.defaultRepository }"]`;
	}

}

