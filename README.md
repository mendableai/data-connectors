<div align="center">
  <img alt="mendable" height="150px" src="https://github.com/mendableai/data-connectors/blob/main/assets/mendable-logo.png">
</div>

# LLM Ready Data Connectors

This repository contains a collection of data connectors built by [Mendable AI](https://mendable.ai/?ref=data-connectors). These connectors are designed to output data in a specific format suitable for LLMs vectorization. 


## Key Features
- 🛠️ Easy Integration: Quick setup for immediate use
- 🎯 LLM Specific: Unified formats for LLM compatibility
- 🔒 [Nango](https://nango.dev) Authorization: You can use your [Nango](https://nango.dev) account to authorize the connectors
- 🔗 Diverse Sources: Unified access to various data sources
- 🏷️ Strong Typing: Improves developer experience
- 🔄 Continuous Updates: Regularly updated with new connectors
- 🤝 Community Support: Active community for troubleshooting and support
- 🚀 High Performance: Optimized for speed and efficiency
- 🛡️ Secure: Built with security in mind
- 💯 Open Source: Community-driven development



## Available Connectors

The following connectors are currently available:
- ✅ Text
- ✅ Files (.md, .txt, .pdf, .csv)
- ✅ Web Scraper (single urls, sitemap)
- ✅ Zendesk
- ✅ GitHub (Private and Public repos)
- 🔄 Google Drive (In progress)
- 🔄 Confluence (In progress)

We are working hard on transitioning all of our connectors to this repository. If you need a connector that is not available here, please open an issue or submit a PR.

## Installation

To install the connectors, run the following command:

```bash
npm install @mendable/data-connectors
```

## Usage

To use these connectors, you need to create a data connector with the provider of your choice. Here is an example:

```typescript
import { createDataConnector } from "@mendable/data-connectors";

const webDataConnector = createDataConnector({
  provider: "web-scraper",
});

webDataConnector.setOptions({
  urls: ["https://docs.mendable.ai"],
  mode:"single_urls",
})

const documents = await webDataConnector.getDocuments();
```

## Authorization

For data connectors that require some sort of authorization such as Google Drive one of the following methods can be used:

```typescript
import { createDataConnector } from "@mendable/data-connectors";

const googleDriveDataConnector = createDataConnector({
  provider: "google-drive",
});

// You can use normal google authorization, with OAuth access token or...
await googleDriveDataConnector.authorize({
  access_token: "<>",
})

// You can use Nango authorization, which is a lot easier and will handle all the Auth part for you
await googleDriveDataConnector.authorizeNango({
  nango_connection_id: "YOUR NANGO CONNECTION ID"
})

const documents = await googleDriveDataConnector.getDocuments();
```


Here is the .env.example file for the connectors. You can copy this file and rename it to .env and fill in the values.
You only need to fill these values for the ones you plan on using.

```env
NANGO_SECRET_KEY=<> // This is the secret key for your Nango account


GOOGLE_DRIVE_CLIENT_ID=<>
GOOGLE_DRIVE_CLIENT_SECRET=<>
GOOGLE_DRIVE_REDIRECT_URI=<>

SCRAPING_BEE_API_KEY=<>
NANGO_CONNECTION_ID_TEST=<>
```

### Output Format

The output of the data connectors is a Document object. The structure of the Document object is as follows:

```typescript
export class Document {
    content: string; // The content of the document
    provider: string; // The provider of the document
    id?: string; // The unique identifier of the document
    createdAt?: Date; // The date when the document was created
    updatedAt?: Date; // The date when the document was last updated
    type?: string; // The type of the document
    metadata: {
        sourceURL?: string, // The source URL of the document, optional but should almost always contain.
        [key: string]: any; // Any additional metadata associated with the document
    }
}
```

### Contributors

Big thanks to all our contributors:
@nickscamara, @rafasideguide, @eciarla, @mogery
