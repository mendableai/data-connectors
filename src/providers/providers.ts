import {
  ConfluenceAuthorizeOptions,
  ConfluenceDataProvider,
  ConfluenceInputOptions,
  NangoConfluenceAuthorizationOptions,
} from "./Confluence";
import { DataProvider } from "./DataProvider";
import {
  GoogleDriveDataProvider,
  GoogleDriveInputOptions,
} from "./GoogleDrive/index";
import { TextDataProvider, TextInputOptions } from "./Text";
import { WebScraperDataProvider, WebScraperOptions } from "./WebScraper/index";
import { YoutubeAuthorizeOptions, YoutubeDataProvider, YoutubeInputOptions } from "./Youtube";
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
  youtube: new YoutubeDataProvider(),
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
    AuthorizeOptions: ConfluenceAuthorizeOptions;
    NangoAuthorizeOptions: NangoConfluenceAuthorizationOptions;
  };
  youtube: {
    DataProvider: YoutubeDataProvider;
    Options: YoutubeInputOptions;
    AuthorizeOptions: YoutubeAuthorizeOptions;
    NangoAuthorizeOptions: NangoConfluenceAuthorizationOptions;
  };
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
