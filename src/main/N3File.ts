const path = require('path');
const N3Directory = require('./N3Directory');
const log = require('electron-log');
const fs = require('fs').promises;

export default class N3File {

	constructor(directoryHandle, path) {
		this.directoryHandle = directoryHandle;
		this.path = path;
		this.fileName = path.pop();
	};

	getHandle(create) {
		if (this.fileHandle) {
			return Promise().resolve(this.fileHandle);
		}

		let that = this;

		let n3Directory = new N3Directory.N3Directory(this.directoryHandle, this.path);
		return n3Directory.getHandle(create).then(function(dirHandle) {

			// log.info("N3File.getHandle dirHandle=", dirHandle);
			let result = path.join(dirHandle, that.fileName);
			// log.info("N3File.getHandle result=", result);
			return result;

			// return dirHandle.getFileHandle(that.fileName, { create: create });
		}).then(function(fileHandle) {
			that.fileHandle = fileHandle;
			return fileHandle;
		});
	}

	exists() {
		let n3Directory = new N3Directory.N3Directory(this.directoryHandle, this.path);
		return n3Directory.getHandle(false).then(function(dirHandle) {
			return dirHandle.getFileHandle(that.fileName, { create: false });
		}).then(function(fileHandle) {
			return true;
		}).catch(function(error) {
			return false;
		});
	}

	text() {
		// log.info("N3File.text this.directoryHandle=, this.path=, this.fileName=", this.directoryHandle, this.path, this.fileName);

		return this.getHandle(false).then(function(fileHandle) {
			// log.info("N3File.text fileHandle=", fileHandle);

			return fs.readFile(fileHandle, "utf-8").then(function(fileContent) {
				// log.info("N3File.text fileContent=", fileContent);

				return fileContent;
			});

			// return fileHandle.getFile();
		});
	}

	textOrFalse() {
		// log.info("N3File.textOrFalse this.directoryHandle=, this.path=, this.fileName=", this.directoryHandle, this.path, this.fileName);

		return this.text().then(function(text) {
			// log.info("N3File.textOrFalse text=", text);
			return text;
		}).catch(function(error) {
			// log.info("N3File.textOrFalse error", error);
			return false;
		});
	}

	write(content) {
		return this.getHandle(true).then(function(fileHandle) {
			return fileHandle.createWritable();
		}).then(function(writable) {
			return writable.write(content).then(function() {
				return writable.close();
			});

		});
	}

	copyTo(targetFolderHandle) {
		return this.getHandle(true).then(function(fileHandle) {
			return fileHandle.getFile().then(function(file) {
				return file.text().then(function(fileContent) {
					return targetFolderHandle.getFileHandle(file.name, { create: true }).then(function(targetFileHandle) {
						return targetFileHandle.createWritable().then(function(writable) {
							return writable.write(fileContent).then(function() {
								return writable.close().then(function() {
									return true;
								});
							});
						});
					});
				});
			});
		});
	}

}
