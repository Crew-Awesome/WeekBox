const { BrowserWindow } = require('electron');
const path = require('path');

function progressBar(img) {
    const progressWindow = new BrowserWindow({
        width: 500,
        height: 200,
        closable: false,
        resizable: false,
        fullscreenable: false,
        movable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    }); 

    progressWindow.setMenuBarVisibility(false);
    progressWindow.loadURL(`file://${path.join(__dirname, '../web/progress.html')}?img=${img}`);

    // bottom-right corner
    const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    progressWindow.setBounds({
        x: width - 500,
        y: height - 200,
        width: 500,
        height: 200
    });

    return {
        updateProgress: (progress) => {
            progressWindow.webContents.executeJavaScript(`window.progress(${progress})`);
        },
        window: progressWindow
    }
}

module.exports = {
    progressBar
};