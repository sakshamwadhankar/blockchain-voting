/**
 * Download face-api.js model weights to frontend/public/models
 * Models: ssd_mobilenetv1, face_landmark_68, face_recognition
 * 
 * Usage: node frontend/scripts/download-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.resolve(__dirname, '..', 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODEL_FILES = [
    // SSD MobileNet V1 (face detection)
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    // Face Landmark 68 (facial landmarks)
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    // Face Recognition (face descriptors)
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
];

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(destPath);
                return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath);
                return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            fs.unlinkSync(destPath);
            reject(err);
        });
    });
}

async function main() {
    // Ensure models directory exists
    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
        console.log(`Created directory: ${MODELS_DIR}`);
    }

    console.log(`Downloading ${MODEL_FILES.length} model files...\n`);

    for (const file of MODEL_FILES) {
        const url = `${BASE_URL}/${file}`;
        const dest = path.join(MODELS_DIR, file);

        if (fs.existsSync(dest)) {
            console.log(`  ✓ ${file} (already exists)`);
            continue;
        }

        process.stdout.write(`  ↓ ${file}...`);
        try {
            await downloadFile(url, dest);
            console.log(' ✓');
        } catch (err) {
            console.log(` ✗ ${err.message}`);
        }
    }

    console.log('\nDone! Models saved to frontend/public/models/');
}

main();
