const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');


function downloadFile(url, destination, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            var response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(destination);
            const total = Number(response.headers['content-length']) || 0;
            let received = 0;

            response.data.on('data', (chunk) => {
                received += chunk.length;
                if (total > 0) {
                    progressCallback((received / total) * 100);
                }
            });

            response.data.on('error', reject);
            writer.on('error', reject);
            writer.on('finish', resolve);

            response.data.pipe(writer);
        } catch (error) {
            reject({error: true, message: error.message});
        }
    });
}

module.exports = { downloadFile };