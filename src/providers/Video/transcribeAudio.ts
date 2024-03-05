import { OpenAI } from "openai";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
import { Readable } from 'stream';
import fs from 'fs';
import os from 'os';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (audioBuffer: ArrayBuffer): Promise<string> => {
  const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB in bytes
  let transcription = '';

  const chunks = splitAudioBuffer(audioBuffer, MAX_CHUNK_SIZE);

  for (let chunk of chunks) {
    const audioFilePath = await convertChunkToAudioData(chunk);
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
    });
    
    transcription += response.text;
  }

  return transcription.trim();
};

function splitAudioBuffer(buffer: ArrayBuffer, maxChunkSize: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    const end = Math.min(buffer.byteLength, offset + maxChunkSize);
    const chunk = buffer.slice(offset, end);
    chunks.push(chunk);
    offset += maxChunkSize;
  }

  return chunks;
}

async function convertChunkToAudioData(chunk: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(chunk);
    const tempFilePath = path.join(os.tmpdir(), `temp-audio.flac`);
    const writable = fs.createWriteStream(tempFilePath);
    const readable = new Readable();

    readable._read = () => {}; // No-op
    readable.push(buffer);
    readable.push(null); // EOF

    ffmpeg(readable)
      .inputFormat('mp3')
      .toFormat('flac')
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        console.log('File has been converted successfully');
        resolve(tempFilePath); // Resolve with the file path instead of the data
      })
      .pipe(writable);
  });
}