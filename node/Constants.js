const AVAILABLE_ENGINES = ['codename'];
const DATA_PATH = require('path').join(require('electron').app.getPath('documents'), 'weekbox_data');
const TEMPLATE_DB = {
    importedEngines: [],
    config: {}
};

if (!require('fs').existsSync(DATA_PATH)) {
    require('fs').mkdirSync(DATA_PATH, { recursive: true });
}

module.exports = {
    AVAILABLE_ENGINES,
    DATA_PATH,
    TEMPLATE_DB
};