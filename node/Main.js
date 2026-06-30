const { app, BrowserWindow, dialog } = require('electron')
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { progressBar } = require('./ProgressBar.js');
const Download = require('./Download.js');
const zl = require('zip-lib');
const createDesktopShortcut = require('create-desktop-shortcuts');
const { DATA_PATH } = require('./Constants.js');
const axios = require('axios'); 
const { setDB, getDB } = require('./Database.js');

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('weekbox', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('weekbox')
}

async function main() {
    // if downloadin mod
    var uri = process.argv.find(arg => arg.startsWith('weekbox:'))?.split('weekbox:')[1].split(',');
    if (uri && uri[0] === 'download') {
        var modURL = uri[1];
        var modModel = uri[2];
        var modID = uri[3];

        var profile = await axios.get(`https://gamebanana.com/apiv12/${modModel}/${modID}/ProfilePage`).catch(e => {
            dialog.showMessageBoxSync({
                title: 'Download failed',
                message: `Failed to fetch mod profile: ${e.message}`,
                buttons: ['OK']
            });
            app.quit();
            return;
        });

        var modName = profile._sName;

        var progress = progressBar("dl.svg");

        var dlPath = path.join(DATA_PATH, '_tempMod.zip');
        var download = await Download.downloadFile(modURL, dlPath, (progressValue) => {
            progress.updateProgress(progressValue);
        }).catch(e => {
            return {error: true, message: e.message};
        });
        try {
            if (download.error) {
                progress.window.setClosable(true);
                progress.window.close();
                dialog.showMessageBoxSync({
                    title: 'Download failed',
                    message: `Failed to download mod: ${download.message}`,
                    buttons: ['OK']
                });
                app.quit();
                return;
            }
        }
        catch (e) {}

        var modSeed = await require('./ModDB.js').installMod(dlPath, 'codename').catch(e => {
            return {error: true, message: e.message};
        });
        try {
            if (modSeed.error) {
                progress.window.setClosable(true);
                progress.window.close();
                dialog.showMessageBoxSync({
                    title: 'Installation failed',
                    message: `Failed to install mod: ${modSeed.message}`,
                    buttons: ['OK']
                });
                app.quit();
                return;
            }
        }
        catch (e) {}

        progress.window.setClosable(true);
        progress.window.close();
        fs.unlinkSync(dlPath);

        dialog.showMessageBoxSync({
            title: 'Installation complete',
            message: 'Mod "' + modName + '" has been installed successfully.',
            buttons: ['OK']
        });

        app.quit();

        return;
    }

    // if launching engine
    if (uri && uri[0] === 'engine') {
        var engineUID = uri[1];
        execSync('"' + path.join(DATA_PATH, engineUID, 'CodenameEngine.exe') + '"', { stdio: 'ignore', cwd: path.join(DATA_PATH, engineUID) });
        app.quit();
        return;
    }

    // download sequence
    if (getDB().importedEngines.length === 0) {
        var response = dialog.showMessageBoxSync({
            title: 'Codename missing',
            message: 'Codename Engine has not been installed yet. Install it now?', 
            buttons: ['Yes', 'No'],
            defaultId: 0
        });

        if (response === 0) {
            var progress = progressBar("dl.svg");
            var engineUID = Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
            var dlPath = path.join(DATA_PATH, '_tempEngine.zip');
            var download = await Download.downloadFile('https://nightly.link/CodenameCrew/CodenameEngine/workflows/windows/main/Codename%20Engine.zip', dlPath, (progressValue) => {
                progress.updateProgress(progressValue);
            }).catch(e => {
                return {error: true, message: e.message};
            });
            try {
                if (download.error) {
                    progress.window.setClosable(true);
                    progress.window.close();
                    dialog.showMessageBoxSync({
                        title: 'Download failed',
                        message: `Failed to download Codename Engine: ${download.message}`,
                        buttons: ['OK']
                    });
                    app.quit();
                    return;
                }
            }
            catch (e) {}
            
            await zl.extract(dlPath, path.join(DATA_PATH, engineUID));

            progress.window.setClosable(true);
            progress.window.close();

            fs.unlinkSync(dlPath);

            dialog.showMessageBoxSync({
                title: 'Download complete',
                message: 'Codename Engine has been downloaded successfully.',
                buttons: ['OK']
            });

            let shortcut = createDesktopShortcut({
                windows: { 
                    filePath: 'weekbox:engine,' + engineUID,
                    name: 'Codename Engine (WeekBox)',
                    arguments: process.argv.slice(1).map(x => "\""+x+"\"").join(' ') + ' --engine ' + engineUID,
                    icon: path.join(DATA_PATH, engineUID, 'icon.ico')
                }
            });

            if (!shortcut) {
                dialog.showMessageBoxSync({
                    title: 'Shortcut creation failed',
                    message: 'Failed to create a desktop shortcut for Codename Engine.',
                    buttons: ['OK']
                });
            }

            var db = getDB();
            db.importedEngines.push(engineUID);
            setDB(db);
        } else {
            app.quit();
        }
    }
    else {
        dialog.showMessageBoxSync({
            title: 'WeekBox has been configured',
            message: 'WeekBox is configured. You can now use your shortcut directly to launch FNF.',
            buttons: ['OK']
        });

        app.quit();

        return;
    }
}

app.whenReady().then(() => {
  main();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})