import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { google } from "googleapis";
import { Nango } from "@nangohq/node";
import dotenv from "dotenv";
dotenv.config();

type Mode = 'video-urls' | 'channel';

export type YoutubeAuthorizeOptions = {
  access_token: string;
}

export type YoutubeInputOptions = {
  urls: string[];
  mode: Mode;
}

export interface NangoAuthorizationOptions {
  nango_connection_id: string;
  nango_integration_id?: string;
}

export interface YoutubeOptions
  extends YoutubeInputOptions,
    YoutubeAuthorizeOptions,
    NangoAuthorizationOptions {}

export class YoutubeDataProvider implements DataProvider<YoutubeOptions> {
  // private oauth2Client: OAuth2Client;
  // private refresh_token: string = "";
  private youtube = null;
  private using_nango: boolean = false;
  private nango_integration_id: string = "youtube";
  private nango_connection_id: string = "";
  private nango: Nango;
  private access_token: string = "";
  private urls: string[] = [];
  private mode: Mode = null;

  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error("Nango secret key is required");
    }
    this.nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });
  }

  async authorize({
    access_token,
  }: {
    access_token: string;
  }): Promise<void> {
    if (!access_token) {
      throw new Error("Google youtube access_token is required");
    }

    const CLIENT_ID = process.env.GOOGLE_YOUTUBE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_YOUTUBE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_YOUTUBE_REDIRECT_URI;

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !access_token) {
      throw new Error("Google youtube credentials not set");
    }

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token,
    });

    this.youtube = google.youtube({ version: "v3", auth: oauth2Client })
  }

  async authorizeNango(
    authorizeOptions: NangoAuthorizationOptions
  ): Promise<void> {
    const connection = await this.nango.getConnection(
      authorizeOptions.nango_integration_id || this.nango_integration_id,
      authorizeOptions.nango_connection_id
    );

    this.nango_connection_id = authorizeOptions.nango_connection_id;
    this.access_token = connection.credentials.raw.access_token;
    this.using_nango = true;

    this.authorize({ access_token: this.access_token });
  }

  async getDocuments(): Promise<Document[] | any[]> {
    try {
        let resultFiles: Document[] = [];
        const transcripts = await (this.mode === 'video-urls'
            ? this.getTranscriptsForVideos(this.urls, this.youtube)
            : this.getTranscriptsForChannel(this.urls, this.youtube));

        resultFiles = transcripts.map((transcript, i) => ({
            content: transcript,
            provider: 'youtube',
            metadata: { sourceUrl: this.urls[i] },
        }));
        return resultFiles
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      throw error;
    }
  }

  async getTranscriptsForVideos(urls, youtube) {
    const videoIds = urls.map(this.extractVideoId);
    const videoData = await this.getVideoDetails(videoIds, youtube);
    const transcripts = await Promise.all(
      videoData.map(video => this.getTranscriptForVideo(video, youtube))
    );
  
    return transcripts;
  }
  
  async getTranscriptsForChannel(channelUrl, youtube) {
    const channelId = this.extractChannelId(channelUrl);
    const playlistId = await this.getUploadsPlaylistId(channelId, youtube);
    const playlistItems = await this.getPlaylistItems(playlistId, youtube);
  
    const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
    const transcripts = await this.getTranscriptsForVideos(videoIds, youtube);
  
    return transcripts;
  }
  
  async getVideoDetails(videoIds, youtube) {
    const response = await youtube.videos.list({
      id: videoIds.join(','),
      part: 'snippet,contentDetails',
    });
  
    return response.data.items;
  }
  
  async getTranscriptForVideo(video, youtube) {
    try {
      const response = await youtube.captions.list({
        videoId: video.id,
        part: 'snippet',
      });
      const captions = response.data.items;
      const transcript = captions.find(caption => caption.snippet.language === 'en')?.snippet.transcript;
  console.log(captions)
      return transcript;
    } catch (error) {
      console.error('Error fetching transcript for video:', video.id, error);
      return null; // Or handle the error differently
    }
  }
  
  extractVideoId(url) {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    return videoId;
  }
  
  extractChannelId(url) {
    //need clairy on this -> extract from any url or just from channel url
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;

    if (path.startsWith('/channel/')) {
        return path.slice(9); // remove '/channel/'
    } else if (path.startsWith('/c/')) {
        return path.slice(2); // remove '/c/'
    }
    return null;
  }
  
  async getUploadsPlaylistId(channelId, youtube) {
    const response = await youtube.channels.list({
      id: channelId,
      part: 'contentDetails',
    });
  
    return response.data.items[0].contentDetails.relatedPlaylists.uploads;
  }
  
  async getPlaylistItems(playlistId, youtube) {
    const response = await youtube.playlistItems.list({
      playlistId,
      part: 'snippet',
      maxResults: 50, // Adjust as needed
    });
  
    return response.data.items;
  }


  setOptions(options: YoutubeInputOptions): void {
    if (!options.urls || !options.mode) {
      throw new Error("Mode or Urls are missing");
    }
    this.urls = options.urls;
    this.mode = options.mode
  }

}