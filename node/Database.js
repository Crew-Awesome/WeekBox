const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const { DATA_PATH, TEMPLATE_DB } = require('./Constants.js');

let DATABASE = {};

function loadDB() {
    DATABASE = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'data.json'), 'utf-8'));
}
function saveDB() {
    fs.writeFileSync(path.join(DATA_PATH, 'data.json'), JSON.stringify(DATABASE, null, 2));
}

if (!fs.existsSync(path.join(DATA_PATH, 'data.json'))) {
    fs.writeFileSync(path.join(DATA_PATH, 'data.json'), JSON.stringify(TEMPLATE_DB, null, 2));
}

function setDB(newDB) {
    DATABASE = newDB;
    saveDB();
}

function getDB() {
    return DATABASE;
}

loadDB();

module.exports = {
    DATA_PATH,
    DATABASE,
    setDB,
    getDB
};