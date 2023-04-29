
export class RepositoryImporter {

  constructor() {
  }


  async import__OLD(importFolder: string) {
    this.importFolder = importFolder;
    this.importMappingKeys = {};

    this.importTree().then(() => {
      this.#importFixLinks().then(() => {
      });
    });
  }




	importTree(key, dataOrTrashFolderName = this.#dataFolderName) {
		let that = this;
		return that.readNotesStore(key, dataOrTrashFolderName).then(function(children) {
			// log.info("importTree, key=, children=", key, children);

			return new Promise(function(resolve, reject) {

				(function loopChildren(i) {

					if (i >= children.length) {
						resolve(children);
					} else {

						that.importTree(children[i].key, dataOrTrashFolderName).then(function(notesChildren) {
							children[i].children = notesChildren;
							loopChildren(i + 1);
						}).catch(function(error) {
							// it's required!
							reject(error);
						});
					}
				})(0);
			});
		});
	}




	async importNotes(childrenKeys, notesFolderHandle, key) {
		let children = [];
		for (let i = 0; i < childrenKeys.length; i++) {

			let noteFolderHandle = path.join(notesFolderHandle, childrenKeys[i]);


			let note = await this.#readNote(noteFolderHandle);
			// log.info("importNotes, noteFolderHandle=, note=", noteFolderHandle, note);

			let resultNote = await this.addNote(key ? this.importMappingKeys[key] : "root_1", {
				title: note.title,
				done: note.data.done,
				priority: note.data.priority,
				type: note.data.type,
				description: note.data.description,
			}, "over");

			const createdAt = parseISO.default(note.data.creationDate);

			const newNote = await Note.findByPk(resultNote.key);

			newNote.changed('createdAt', true);
			newNote.set('createdAt', createdAt, {raw: true});
			await newNote.save({
					silent: true,
					fields: ['createdAt']
			});

			note.key = childrenKeys[i];

			this.importMappingKeys[childrenKeys[i]] = resultNote.key;
			// log.info("importNotes, resultNote=", resultNote);

			children.push(note);
		}

		return children;
	}

	readNotesStore(key, dataOrTrashFolderName = this.#dataFolderName) {
		// log.info("readNotesStore, key=", key);

		let that = this;
		return new Promise(function(resolve, reject) {
			// log.info("readNotesStore Promise");
			let notesFolder = new N3Directory.N3Directory(that.importFolder, [dataOrTrashFolderName, that.#notesFolderName]);
			// log.info("readNotesStore notesFolder=", notesFolder);

			notesFolder.getHandle(false).then(function(notesFolderHandle) {
				// log.info("readNotesStore, notesFolderHandle=", notesFolderHandle);
				that.#getNoteFolderHandle(notesFolderHandle, key).then(function(childrenContainerFolderHandle) {
					// log.info("readNotesStore, childrenContainerFolderHandle=", childrenContainerFolderHandle);
					that.#readNoteChildrenFile(childrenContainerFolderHandle).then(function(childrenKeys) {
						// log.info("readNotesStore, childrenKeys=", childrenKeys);

						that.importNotes(childrenKeys, notesFolderHandle, key).then(function(children) {
							resolve(children);
						});



					});
				});
			}).catch(function(error) {
				resolve([]);
			});

		});
	}

	#getNoteFolderHandle(notesFolderHandle, key) {
		return new Promise(function(resolveI, rejectI) {
			if (key) {
				let noteFolderHandler = path.join(notesFolderHandle, key);
				resolveI(noteFolderHandler);
			} else {
				resolveI(notesFolderHandle);
			}
		});
	}

	#readNoteChildrenFile(folderHandle) {
		let that = this;
		return new Promise(function(resolve, reject) {
			let trashChildrenFile = new N3File.N3File(folderHandle, [that.#noteChildrenFileName + ".json"]);
			trashChildrenFile.textOrFalse().then(function(childrenAsString) {
				childrenAsString = childrenAsString || "[]";
				let children = JSON.parse(childrenAsString);
				resolve(children);
			});

		});
	}


	#readNote(noteFolderHandle) {
		let that = this;
		return that.#readNoteMetaData(noteFolderHandle).then(function(metaData) {
			return that.#readNoteData(noteFolderHandle).then(function(data) {
				return that.#readNoteTitle(noteFolderHandle).then(function(title) {
					return that.#readNoteDesription(noteFolderHandle).then(function(description) {
						return that.#readNoteChildrenFile(noteFolderHandle).then(function(childrenChildrenKeys) {
							return that.#readNoteExpand(noteFolderHandle).then(function(expanded) {
								let note = {
									key: noteFolderHandle.name,
									lazy: true,
									expanded: expanded.expanded,
									title: title.title,
									data: data
								};
								note.data.description = description.description;
								note.data.creationDate = metaData.creationDate;


								if (childrenChildrenKeys.length == 0) {
									note.children = [];
								}
								return note;
							});
						});
					});
				});
			});
		});
	}


	async #importFixLinks() {
		let self = this;

		for (const [oldKey, newKey] of Object.entries(self.importMappingKeys)) {

			let withtags = false;
			let withchildren = false;
			let withDescription = true;
			let withParents = false;

			let note = await self.getNoteWith(newKey, withtags, withchildren, withDescription, withParents);

			let $html = cheerio.load(note.description || "", null, false);
			let linkSpan = $html("span");
			for (let i = 0; i < linkSpan.length; i++) {
				let nextLink = linkSpan.eq(i);
				if (nextLink.attr("data-nnlink-node")) {
					let oldLinkedNoteKey = nextLink.attr("data-nnlink-node");
					nextLink.attr("data-nnlink-node", self.importMappingKeys[oldLinkedNoteKey]);
				}
			}
			note.description = $html.html();

			let skipVersioning = true;
			await self.modifyNote(note, skipVersioning);
		}


	}



	#readNoteDesription(notesFolderHandle) {
		let that = this;
		let imgsFolder = path.join(that.importFolder, that.#imagesFolderName);
		return new Promise(function(resolve, reject) {

			let noteDescriptionFile = new N3File.N3File(notesFolderHandle, [that.#noteDescriptionFileName + ".json"]);
			noteDescriptionFile.textOrFalse().then(function(data) {
				data = data || "{}";
				data = JSON.parse(data);

				let $html = cheerio.load(data.description || "", null, false);

				/*
				Support old repository implementation.
				{
					"description": "<br><img src=\"\" width=\"1083\" height=\"423\" data-n3src=\"image_a6616736-5b65-483c-8487-605f48dde068.png\"><ul>\n<li><a id=\"key-val\" class=\"issue-link\" href=\"https://jira.rodias.de/browse/RODIAS-84\" rel=\"50237\" data-issue-key=\"RODIAS-84\">RODIAS-84 </a>IT-Security Response Team</li>\n</ul>",
					"timeStamp": "2022-10-25T07:25:46.686Z"
				}
				*/
				let imgs = $html("img");
				for (let i = 0; i < imgs.length; i++) {
					let nextImg = imgs.eq(i);
					if (nextImg.attr("data-n3src")) {

						let imgFileName = nextImg.attr("data-n3src");

						let assetSrc = path.join(imgsFolder, imgFileName);
						// log.debug("#readNoteDesription assetSrc=", assetSrc);

						var imgUrl = fs.readFileSync(assetSrc).toString('base64');
						nextImg.attr("src", "data:image/png;base64," + imgUrl);
						nextImg.removeAttr("data-n3src");
					}
				}

				/*
				{
					"description": "<p><span contenteditable=\"false\" data-link-node=\"b9474e60-25b2-4e87-b5fb-4c95ad6cb4e7\">[ <a href=\"#b9474e60-25b2-4e87-b5fb-4c95ad6cb4e7\" data-link-note=\"b9474e60-25b2-4e87-b5fb-4c95ad6cb4e7\">aaaa</a> ]</span></p>",
					"timeStamp": "2022-11-09T07:58:43.855Z"
				}
				*/

				let linkSpan = $html("span");
				for (let i = 0; i < linkSpan.length; i++) {
					let nextLink = linkSpan.eq(i);
					if (nextLink.attr("data-link-node")) {

						let linkedNoteKey = nextLink.attr("data-link-node");

						nextLink.attr("class", "nn-link");
						nextLink.attr("data-nnlink-node", linkedNoteKey);
						nextLink.removeAttr("data-link-node");
					}
				}

				/*

				<span class='nn-link' data-nnlink-node='" + key +"' contenteditable='false'>#" + path + "</span>

				*/

				data.description = $html.html();

				resolve(data);
			}).catch(function(err) {
				reject(err);
			});

		});
	}


	#readNoteMetaData(notesFolderHandle) {
		let that = this;
		return new Promise(function(resolve, reject) {

			let noteMetaDataFile = new N3File.N3File(notesFolderHandle, [that.#noteMetaDataFileName + ".json"]);
			noteMetaDataFile.textOrFalse().then(function(data) {
				data = data || "{}";
				data = JSON.parse(data);
				resolve(data);
			}).catch(function(err) {
				reject(err);
			});

		});

	}


	#readNoteData(noteFolderHandle) {
		let that = this;
		return new Promise(function(resolve, reject) {

			let noteDataFile = new N3File.N3File(noteFolderHandle, [that.#noteDataFileName + ".json"]);
			noteDataFile.textOrFalse().then(function(data) {
				data = data || "{}";
				data = JSON.parse(data);
				resolve(data);
			}).catch(function(err) {
				reject(err);
			});

		});
	}

	#readNoteTitle(noteFolderHandle) {
		let that = this;
		return new Promise(function(resolve, reject) {

			let noteTitleFile = new N3File.N3File(noteFolderHandle, [that.#noteTitleFileName + ".json"]);
			noteTitleFile.textOrFalse().then(function(data) {
				data = data || "{}";
				data = JSON.parse(data);
				resolve(data);
			}).catch(function(err) {
				reject(err);
			});

		});
	}


	#readNoteExpand(notesFolderHandle) {
		let that = this;
		return new Promise(function(resolve, reject) {

			let noteExpandedFile = new N3File.N3File(notesFolderHandle, [that.#noteExpandedFileName + ".json"]);
			noteExpandedFile.textOrFalse().then(function(data) {
				data = data || "{\"expanded\": false}";
				data = JSON.parse(data);
				resolve(data);
			}).catch(function(err) {
				reject(err);
			});

		});

	}
}
