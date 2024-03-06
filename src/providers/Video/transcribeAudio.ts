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
  const MAX_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB in bytes
  let transcription = '';

  try {
    const chunks = await splitAudioBuffer(audioBuffer, MAX_CHUNK_SIZE);

    for (let chunk of chunks) {
      const audioFilePath = await convertChunkToAudioData(chunk);
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
      });
      
      transcription += response.text;
      await fs.promises.unlink(audioFilePath).catch(console.error);
    }
  } catch (error) {
    console.error("Error during transcription process:", error);
    throw error; // Rethrow the error after logging it
  }

  return transcription.trim();
};

async function splitAudioBuffer(buffer: ArrayBuffer, maxChunkSize: number): Promise<ArrayBuffer[]> {
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
  let tempFilePath = '';
  try {
    const buffer = Buffer.from(chunk);
    tempFilePath = path.join(os.tmpdir(), `temp-audio.mp3`);
    const writable = fs.createWriteStream(tempFilePath);
    const readable = new Readable({
      read() {
        this.push(buffer);
        this.push(null); // EOF
      }
    });

    await new Promise((resolve, reject) => {
      ffmpeg(readable)
        .inputFormat('mp3')
        .toFormat('mp3')
        .on('error', reject)
        .on('end', resolve)
        .pipe(writable);
    });

    return tempFilePath;
  } catch (error) {
    console.error("Error in convertChunkToAudioData:", error);
    throw error;
  }
}
