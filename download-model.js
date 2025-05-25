const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Base URL for the model files
const BASE_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/coco-ssd/lite_mobilenet_v2/1/';
const MODEL_DIR = path.join(__dirname, 'public', 'models', 'coco-ssd');

// Create the directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log(`Created directory: ${MODEL_DIR}`);
}

// Download a file from URL to destination
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}, status: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${dest}`);
        resolve();
      });
      
      file.on('error', err => {
        fs.unlink(dest, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', err => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Main download function
async function downloadModel() {
  try {
    // First download the model.json file
    const modelJsonPath = path.join(MODEL_DIR, 'model.json');
    await downloadFile(`${BASE_URL}model.json`, modelJsonPath);
    
    // Read the model.json to get the list of shard files
    const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    
    // Extract weight files from the model.json
    const weightFiles = modelJson.weightsManifest.flatMap(manifest => 
      manifest.paths.map(p => p)
    );
    
    // Download each weight file
    for (const weightFile of weightFiles) {
      const weightPath = path.join(MODEL_DIR, weightFile);
      await downloadFile(`${BASE_URL}${weightFile}`, weightPath);
    }
    
    console.log('Model download completed!');
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

// Start the download
downloadModel(); 