const tftp = require("tftp");
const fs = require("fs");
const path = require("path");

const TFTP_SERVER = "192.168.1.100"; // TFTP server
const LOCAL_DIR = path.join(__dirname, "..", "backend", "downloads");

if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

function fetchFile(filename) {
    return new Promise((resolve, reject) => {
        const client = tftp.createClient({ host: TFTP_SERVER });
        const localPath = path.join(LOCAL_DIR, filename);
        const fileStream = fs.createWriteStream(localPath);

        fileStream.on('error', reject);

        client.get(filename, fileStream, (err) => {
            if (err) reject(err);
            else resolve(localPath);
        });
    });
}

async function fetchMissingFiles(filenames) {
    const fetched = [];
    for (const file of filenames) {
        const localPath = path.join(LOCAL_DIR, file);
        if (!fs.existsSync(localPath)) {
            try {
                await fetchFile(file);
                fetched.push(file);
            } catch (err) {
                console.error(`Error fetching ${file}: ${err.message}`);
            }
        }
    }
    return fetched;
}

module.exports = { fetchFile, fetchMissingFiles, LOCAL_DIR };
