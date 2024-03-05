import {
  ConfluenceAuthorizationOptions,
  ConfluenceDataProvider,
  ConfluenceInputOptions,
} from "./Confluence";
import { DataProvider } from "./DataProvider";
import { FileDataProvider, FileInputOptions } from "./File";
import {
  GitHubAuthorizationOptions,
  GitHubDataProvider,
  GitHubInputOptions,
  GitHubOptions,
} from "./GitHub";
import {
  GoogleDriveDataProvider,
  GoogleDriveInputOptions,
  NangoAuthorizationOptions,
} from "./GoogleDrive/index";
import {
  JiraAuthorizationOptions,
  JiraDataProvider,
  JiraInputOptions,
} from "./Jira";
import {
  NotionAuthorizationOptions,
  NotionDataProvider,
  NotionInputOptions,
} from "./Notion";
import { SalesforceDataProvider, SalesforceInputOptions } from "./Salesforce";
import { TextDataProvider, TextInputOptions } from "./Text";
import { VideoFileDataProvider, VideoFileInputOptions } from "./Video";
import { WebScraperDataProvider, WebScraperOptions } from "./WebScraper/index";
import { YouTubeDataProvider, YouTubeInputOptions } from "./YouTube";
import { ZendeskDataProvider, ZendeskInputOptions } from "./Zendesk";

type Provider = {
  [key: string]: DataProvider<any>;
};

export const providers: Provider = {
  "google-drive": new GoogleDriveDataProvider(),
  "web-scraper": new WebScraperDataProvider(),
  zendesk: new ZendeskDataProvider(),
  text: new TextDataProvider(),
  confluence: new ConfluenceDataProvider(),
  github: new GitHubDataProvider(),
  file: new FileDataProvider(),
  youtube: new YouTubeDataProvider(),
  notion: new NotionDataProvider(),
  jira: new JiraDataProvider(),
  salesforce: new SalesforceDataProvider(),
  video: new VideoFileDataProvider(),
};

// Define a single source of truth for all providers and their associated types
type ProviderConfig = {
  "web-scraper": {
    DataProvider: WebScraperDataProvider;
    Options: WebScraperOptions;
    AuthorizeOptions: WebScraperOptions;
    NangoAuthorizeOptions: any;
  };
  "google-drive": {
    DataProvider: GoogleDriveDataProvider;
    Options: GoogleDriveInputOptions;
    AuthorizeOptions: GoogleDriveInputOptions;
    NangoAuthorizeOptions: any;
  };
  zendesk: {
    DataProvider: ZendeskDataProvider;
    Options: ZendeskInputOptions;
    AuthorizeOptions: ZendeskInputOptions;
    NangoAuthorizeOptions: any;
  };
  text: {
    DataProvider: TextDataProvider;
    Options: TextInputOptions;
    AuthorizeOptions: TextInputOptions;
    NangoAuthorizeOptions: any;
  };
  confluence: {
    DataProvider: ConfluenceDataProvider;
    Options: ConfluenceInputOptions;
    AuthorizeOptions: ConfluenceAuthorizationOptions;
    NangoAuthorizeOptions: NangoAuthorizationOptions;
  };
  github: {
    DataProvider: GitHubDataProvider;
    Options: GitHubInputOptions;
    AuthorizeOptions: GitHubAuthorizationOptions;
    NangoAuthorizeOptions: NangoAuthorizationOptions;
  };
  file: {
    DataProvider: FileDataProvider;
    Options: FileInputOptions;
    AuthorizeOptions: FileInputOptions;
    NangoAuthorizeOptions: any;
  };
  youtube: {
    DataProvider: YouTubeDataProvider;
    Options: YouTubeInputOptions;
    AuthorizeOptions: YouTubeInputOptions;
    NangoAuthorizeOptions: any;
  };
  notion: {
    DataProvider: NotionDataProvider;
    Options: NotionInputOptions;
    AuthorizeOptions: NotionAuthorizationOptions;
    NangoAuthorizeOptions: NangoAuthorizationOptions;
  };
  jira: {
    DataProvider: JiraDataProvider;
    Options: JiraInputOptions;
    AuthorizeOptions: JiraAuthorizationOptions;
    NangoAuthorizeOptions: NangoAuthorizationOptions;
  };
  salesforce: {
    DataProvider: SalesforceDataProvider;
    Options: SalesforceInputOptions;
    AuthorizeOptions: JiraAuthorizationOptions;
    NangoAuthorizeOptions: NangoAuthorizationOptions;
  };
  video: {
    DataProvider: VideoFileDataProvider;
    Options: VideoFileInputOptions;
    AuthorizeOptions: VideoFileInputOptions;
    NangoAuthorizeOptions: any;
  }
  // Add other providers here...
};

// Derive the specific mappings from the single source of truth
export type ProviderMap = {
  [K in keyof ProviderConfig]: ProviderConfig[K]["DataProvider"];
};
export type ProviderOptionsMap = {
  [K in keyof ProviderConfig]: ProviderConfig[K]["Options"];
};
export type AuthorizeOptionsMap = {
  [K in keyof ProviderConfig]: ProviderConfig[K]["AuthorizeOptions"];
};
export type NangoAuthorizeOptionsMap = {
  [K in keyof ProviderConfig]: ProviderConfig[K]["NangoAuthorizeOptions"];
};
