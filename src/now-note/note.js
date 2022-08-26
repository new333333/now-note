const { Model } = require('sequelize');

// store tree in SQL methods: https://www.databasestar.com/hierarchical-data-sql/#c2

class Note extends Model {

}

class NoteNotFoundByKey extends Error {

    constructor(key) {
        super(`Note not found by: ${key}"`);
        this.key = key;
    }

}

module.exports = {
    Note : Note,
    NoteNotFoundByKey: NoteNotFoundByKey
}
