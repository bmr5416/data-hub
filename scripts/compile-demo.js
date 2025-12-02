/**
 * Demo Video Compilation Script
 *
 * Takes the raw continuous recording and processes it:
 * - Adds title overlay
 * - Adds background music (if available)
 * - Outputs to web-optimized MP4 and WebM
 * - Extracts poster frame
 *
 * Usage: npm run video:compile
 *
 * Prerequisites:
 *   1. ffmpeg installed: `brew install ffmpeg`
 *   2. Raw video exists: client/public/assets/demo/raw-demo.webm
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Input/output paths
  inputFile: path.resolve(__dirname, '../client/public/assets/demo/raw-demo.webm'),
  outputDir: path.resolve(__dirname, '../client/public/assets/demo'),
  audioFile: path.resolve(__dirname, '../client/public/assets/demo/audio/background.mp3'),

  // Output filenames
  outputMp4: 'data-hub-demo.mp4',
  outputWebm: 'data-hub-demo.webm',
  posterFile: 'demo-poster.jpg',

  // Video settings
  resolution: { width: 1280, height: 720 },
  framerate: 30,

  // Audio settings
  audioFadeIn: 2, // seconds
  audioFadeOut: 3, // seconds

  // Poster frame extraction (timestamp in the dashboard section)
  posterTimestamp: '00:01:30',

  // Title overlay (optional - can be added in post)
  titleOverlay: {
    enabled: false, // Set to true to add title overlay
    text: 'Data Hub',
    fontSize: 24,
    fontColor: 'gold',
    x: 40,
    y: 40,
    duration: 5, // seconds
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if ffmpeg is installed
 */
function checkFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get duration of a video file in seconds
 */
function getVideoDuration(filePath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf8' }
    );
    return parseFloat(output.trim());
  } catch (error) {
    console.error(`Failed to get duration for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Format time in seconds to HH:MM:SS.mmm
 */
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;
}

/**
 * Run ffmpeg command
 */
function runFfmpeg(args, description) {
  console.log(`  Running: ${description}`);
  try {
    execSync(`ffmpeg ${args.join(' ')}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error(`  Failed: ${error.message}`);
    return false;
  }
}

// =============================================================================
// Compilation Steps
// =============================================================================

/**
 * Step 1: Validate input file
 */
function validateInput() {
  console.log('\n1. Validating input...');

  if (!fs.existsSync(CONFIG.inputFile)) {
    console.error(`  Input file not found: ${CONFIG.inputFile}`);
    console.error('  Run `npm run video:record` first to create the raw recording.');
    return null;
  }

  const duration = getVideoDuration(CONFIG.inputFile);
  const sizeMB = (fs.statSync(CONFIG.inputFile).size / (1024 * 1024)).toFixed(2);

  console.log(`  Input: ${path.basename(CONFIG.inputFile)}`);
  console.log(`  Duration: ${formatTime(duration)} (${duration.toFixed(1)}s)`);
  console.log(`  Size: ${sizeMB} MB`);

  return { duration, sizeMB };
}

/**
 * Step 2: Encode to MP4 (web-optimized)
 */
function encodeMp4() {
  console.log('\n2. Encoding MP4 (web-optimized)...');

  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputMp4);
  const args = [
    '-y',
    '-i', `"${CONFIG.inputFile}"`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '22',
    '-movflags', '+faststart',
    '-r', CONFIG.framerate.toString(),
    `"${outputPath}"`,
  ];

  if (runFfmpeg(args, 'MP4 encoding')) {
    const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  Output: ${CONFIG.outputMp4} (${sizeMB} MB)`);
    return outputPath;
  }
  return null;
}

/**
 * Step 3: Add background music (if available)
 */
function addBackgroundMusic(inputFile) {
  console.log('\n3. Adding background music...');

  if (!fs.existsSync(CONFIG.audioFile)) {
    console.log(`  No background music found at: ${CONFIG.audioFile}`);
    console.log('  Skipping audio mixing...');
    return inputFile;
  }

  const duration = getVideoDuration(inputFile);
  const outputPath = path.join(CONFIG.outputDir, 'temp_with_audio.mp4');

  // Audio filter: fade in at start, fade out before end
  const audioFadeOutStart = Math.max(0, duration - CONFIG.audioFadeOut);
  const audioFilter = `afade=t=in:d=${CONFIG.audioFadeIn},afade=t=out:st=${audioFadeOutStart}:d=${CONFIG.audioFadeOut}`;

  const args = [
    '-y',
    '-i', `"${inputFile}"`,
    '-i', `"${CONFIG.audioFile}"`,
    '-filter_complex', `"[1:a]${audioFilter}[audio]"`,
    '-map', '0:v',
    '-map', '[audio]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    `"${outputPath}"`,
  ];

  if (runFfmpeg(args, 'Audio mixing')) {
    // Replace original with audio version
    fs.unlinkSync(inputFile);
    fs.renameSync(outputPath, inputFile);
    console.log('  Background music added');
    return inputFile;
  }
  return inputFile;
}

/**
 * Step 4: Encode WebM version
 */
function encodeWebm() {
  console.log('\n4. Encoding WebM (VP9)...');

  const inputPath = path.join(CONFIG.outputDir, CONFIG.outputMp4);
  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputWebm);

  const args = [
    '-y',
    '-i', `"${inputPath}"`,
    '-c:v', 'libvpx-vp9',
    '-crf', '30',
    '-b:v', '0',
    '-c:a', 'libopus',
    '-b:a', '128k',
    `"${outputPath}"`,
  ];

  if (runFfmpeg(args, 'WebM encoding')) {
    const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  Output: ${CONFIG.outputWebm} (${sizeMB} MB)`);
    return outputPath;
  }
  return null;
}

/**
 * Step 5: Extract poster frame
 */
function extractPoster() {
  console.log('\n5. Extracting poster frame...');

  const inputPath = path.join(CONFIG.outputDir, CONFIG.outputMp4);
  const outputPath = path.join(CONFIG.outputDir, CONFIG.posterFile);

  const args = [
    '-y',
    '-i', `"${inputPath}"`,
    '-ss', CONFIG.posterTimestamp,
    '-vframes', '1',
    '-q:v', '2',
    `"${outputPath}"`,
  ];

  if (runFfmpeg(args, 'Poster extraction')) {
    const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`  Output: ${CONFIG.posterFile} (${sizeKB} KB)`);
    return outputPath;
  }
  return null;
}

/**
 * Clean up temporary files
 */
function cleanup() {
  console.log('\n6. Cleaning up...');

  const tempFiles = ['temp_with_audio.mp4'];

  for (const file of tempFiles) {
    const filepath = path.join(CONFIG.outputDir, file);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        console.log(`  Removed: ${file}`);
      } catch (err) {
        console.warn(`  Warning: Could not remove ${file}: ${err.message}`);
      }
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Data Hub Demo Video Compilation');
  console.log('='.repeat(60));

  // Check prerequisites
  if (!checkFfmpeg()) {
    console.error('\nError: ffmpeg is not installed.');
    console.error('Install with: brew install ffmpeg');
    process.exit(1);
  }
  console.log('\nffmpeg found');

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  try {
    // Step 1: Validate input
    const inputInfo = validateInput();
    if (!inputInfo) {
      process.exit(1);
    }

    // Step 2: Encode MP4
    const mp4Path = encodeMp4();
    if (!mp4Path) {
      throw new Error('MP4 encoding failed');
    }

    // Step 3: Add background music (optional)
    addBackgroundMusic(mp4Path);

    // Step 4: Encode WebM
    encodeWebm();

    // Step 5: Extract poster
    extractPoster();

    // Step 6: Cleanup
    cleanup();

    // Final report
    const finalDuration = getVideoDuration(path.join(CONFIG.outputDir, CONFIG.outputMp4));
    const mp4Size = (fs.statSync(path.join(CONFIG.outputDir, CONFIG.outputMp4)).size / (1024 * 1024)).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('Compilation Complete!');
    console.log('='.repeat(60));
    console.log(`\nFinal video: ${CONFIG.outputMp4}`);
    console.log(`Duration: ${formatTime(finalDuration)}`);
    console.log(`File size: ${mp4Size} MB`);
    console.log('\nOutput files:');
    console.log(`  ${path.join(CONFIG.outputDir, CONFIG.outputMp4)}`);
    console.log(`  ${path.join(CONFIG.outputDir, CONFIG.outputWebm)}`);
    console.log(`  ${path.join(CONFIG.outputDir, CONFIG.posterFile)}`);

    if (!fs.existsSync(CONFIG.audioFile)) {
      console.log(`\nNote: No background music was added.`);
      console.log(`To add music, place an MP3 file at:`);
      console.log(`  ${CONFIG.audioFile}`);
      console.log(`Then re-run: npm run video:compile`);
    }

    console.log(`\nThe video is ready to use on the landing page!`);

  } catch (error) {
    console.error('\nCompilation failed:', error.message);
    cleanup();
    process.exit(1);
  }
}

main();
