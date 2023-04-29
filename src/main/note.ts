const { Model } = require('sequelize');

export class Note extends Model {}

export class NoteNotFoundByKey extends Error {

    constructor(key) {
        super(`Note not found by: ${key}"`);
        this.key = key;
    }

}
