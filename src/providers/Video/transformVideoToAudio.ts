import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

import os from 'os';
import path from 'path';
import fs from 'fs';

export const transformVideoToAudio = async (videoBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  const videoBufferNode = Buffer.from(videoBuffer);
  const inputPath = path.join(os.tmpdir(), `temp-video-input.mp4`);
  const outputPath = path.join(os.tmpdir(), `temp-audio-output.mp3`);
  fs.writeFileSync(inputPath, videoBufferNode);

  return new Promise<ArrayBuffer>((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('An error occurred: ' + err.message);
        cleanupFiles(inputPath, outputPath);
        reject(err);
      })
      .on('end', () => {
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          const audioArrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
          cleanupFiles(inputPath, outputPath);
          resolve(audioArrayBuffer);
        } catch (error) {
          cleanupFiles(inputPath, outputPath);
          reject(new Error(`Failed to read the output audio file: ${error}`));
        }
      })
      .save(outputPath);
  });
};

function cleanupFiles(inputPath: string, outputPath: string) {
  try {
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error(`Failed to clean up temporary files: ${error}`);
  }
}