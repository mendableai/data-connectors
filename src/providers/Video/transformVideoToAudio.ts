import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

import os from 'os';
import path from 'path';

export const transformVideoToAudio = async (videoBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  try {
    const videoBufferNode = Buffer.from(videoBuffer);
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const inputPath = path.join(os.tmpdir(), `temp-video-input.mp4`);
      const outputPath = path.join(os.tmpdir(), `temp-audio-output.flac`);
      require('fs').writeFileSync(inputPath, videoBufferNode);

      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('error', (err) => {
          console.error('An error occurred: ' + err.message);
          reject(err);
        })
        .on('end', () => {
          const audioBuffer = require('fs').readFileSync(outputPath);
          const audioArrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);

          require('fs').unlinkSync(inputPath);
          require('fs').unlinkSync(outputPath);

          resolve(audioArrayBuffer);
        })
        .save(outputPath);
    });
  } catch (error) {
    throw new Error(`Failed to transform video to audio: ${error}`);
  }
}
