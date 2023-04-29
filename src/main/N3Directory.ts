const path = require('path');
const log = require('electron-log');
const fs = require('fs').promises;

export default class N3Directory {

	constructor(directoryHandle, dirs) {
		this.dirs = dirs || [];
		this.directoryHandle = directoryHandle;
	};

	getHandle(create) {
		// log.info("N3Directory.getHandle 1 dirHandle=, dirs=", this.directoryHandle, this.dirs);


		let that = this;
		return new Promise(function(resolve, reject) {
			// log.info("N3Directory.getHandle 2 dirHandle=, dirs=", that.directoryHandle, that.dirs);


			let result = path.join(that.directoryHandle);
			that.dirs.forEach(function(el) {
				result = path.join(result, el)
			});
			// log.info("N3Directory.getHandle 2 result=", result);

			resolve(result);
			/*
			(function loopDirs(i, dirHandle) {

				// log.info("N3Directory.getHandle 3 dirHandle=, dirs=, i=", that.directoryHandle, that.dirs, i);

				if (i >= that.dirs.length) {
					// log.info("N3Directory.getHandle 4 dirHandle=, dirs=, i=", that.directoryHandle, that.dirs, i);
					resolve(dirHandle);
				} else {



					dirHandle.getDirectoryHandle(that.dirs[i], { create: create }).then(function(dirHandle) {
						loopDirs(i + 1, dirHandle);
					}).catch(function(error) {
						// it's required!
						reject(error);
					});

				}
			})(0, that.directoryHandle);
			*/
		});
	}

	forEach(callback) {
		let that = this;
		return new Promise(function(resolve, reject) {
			return that.getHandle(false).then(function(folderHadle) {
				let folderIterator = folderHadle.values();
				let p = new Promise(function(resolvep, rejectp) {
					(function loopEntries() {
						folderIterator.next().then(function(element) {
							let done = element.done;
							if (done) {
								resolvep();
							} else {
								callback(element.value).then(function() {
									loopEntries();
								});
							}
						});
					})();

				});
				p.then(function() {
					resolve();
				});
			});
		});
	}

	#copyFolderTo(dirHandle, targetFolderHandle) {
		// dirHandle
		// 		kind: "directory"
		// 		name: "7248cee1-958e-4d4f-b680-ee3085dffa0d"
		let that = this;
		return new Promise(function(resolve, reject) {

			targetFolderHandle.getDirectoryHandle(dirHandle.name, { create: true }).then(function(createdCopyOfFolderHandle) {

				let asyncIt = dirHandle.values();
				let p = new Promise(function(resolvep, rejectp) {
					(function loopEntries() {
						asyncIt.next().then(function(element) {
							// kind: "file"
							// name: "data.json"

							// kind: "directory"
							// name: "tasks"

							let done = element.done;

							if (done) {

								resolvep();

							} else {

								let kind = element.value.kind;
								let name = element.value.name;

								if (kind == "directory") {

									dirHandle.getDirectoryHandle(name, { create: false }).then(function(nextFolderHandle) {
										that.#copyFolderTo(nextFolderHandle, createdCopyOfFolderHandle).then(function() {
											loopEntries();
										});
									});

								} else {
									dirHandle.getFileHandle(name, { create: false }).then(function(fileHandle) {
										fileHandle.getFile().then(function(file) {
											file.text().then(function(fileContent) {
												createdCopyOfFolderHandle.getFileHandle(name, { create: true }).then(function(targetFileHandle) {
													targetFileHandle.createWritable().then(function(writable) {
														writable.write(fileContent).then(function() {
															writable.close().then(function() {
																loopEntries();
															});
														});
													});
												});
											});
										});
									});

								}
							}
						});

					})();

				});
				p.then(function() {
					resolve();
				});
			});
		});

	}


	copyTo(targetDirectory) {
		let that = this;
		return new Promise(function(resolve, reject) {

			that.getHandle(false).then(function(dirHandle) {
				targetDirectory.getHandle(true).then(function(targetDirHandle) {
					that.#copyFolderTo(dirHandle, targetDirHandle).then(function() {
						resolve();
					}).catch(function(err) {
						reject(err);
					});
				}).catch(function(err) {
					reject(err);
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}
}
