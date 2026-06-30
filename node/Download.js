const { exec } = require("child_process");
const path = require("path");
function downloadFile(url, destination, progressCallback) {
    return new Promise((resolve, reject) => {
        const ariaPath = path.join(__dirname, "..", "tools", "aria2c.exe");
        const args = [
            "--summary-interval=1",
            "--console-log-level=warn",
            "--max-connection-per-server=16",
            `--dir="${path.dirname(destination)}"`,
            `--out="${path.basename(destination)}"`,
            `"${url}"`
        ].join(" ");
        const cmd = `"${ariaPath}" ${args}`;
        const aria = exec(cmd);

        aria.stdout.on("data", data => {
            const text = data.toString();
            const match = text.match(/\((\d+)%\)/);

            if (match && progressCallback) {
                progressCallback(Number(match[1]));
            }
        });

        aria.on("close", code => {
            if (code === 0) {
                progressCallback?.(100);
                resolve();
            } else {
                reject(new Error(`aria2c exited with code ${code}`));
            }
        });

        aria.on("error", reject);
    });
}

module.exports = { downloadFile };