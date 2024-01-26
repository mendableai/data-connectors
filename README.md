<div align="center">
  <img alt="mendable" height="150px" src="https://github.com/mendableai/data-connectors/blob/main/assets/mendable-logo.png">
</div>

# LLM Ready Data Connectors

This repository contains a collection of data connectors built by Mendable AI. These connectors are designed to output data in a specific format suitable for LLMs.

## Key Features
- 🛠️ Easy Integration: Quick setup for immediate use
- 🎯 LLM Specific: Unified formats for LLM compatibility
- 🔗 Diverse Sources: Unified access to various data sources
- 🏷️ Strong Typing: Improves developer experience
- 🔄 Continuous Updates: Regularly updated with new connectors
- 🤝 Community Support: Active community for troubleshooting and support
- 🚀 High Performance: Optimized for speed and efficiency
- 🛡️ Secure: Built with security in mind
- 💯 Open Source: Community-driven development



## Available Connectors

The following connectors are currently available:

✅ Text
✅ Web Scraper (single urls, sitemap)
✅ Zendesk
🔄 Google Drive (In progress)
🔄 Confluence (In progress)

We are working hard on transitioning all of our connectors to this repository. If you need a connector that is not available here, please open an issue or submit a PR.


## Usage

To use these connectors, you need to create a data connector with the provider of your choice. Here is an example:

```typescript
import { createDataConnector } from "@mendable/data-connectors-private";

const webDataConnector = createDataConnector({
  provider: "web-scraper",
});

webDataConnector.setOptions({
  urls: ["https://docs.mendable.ai"],
  mode:"single_urls",
})

webDataConnector.getDocuments().then((docs) =>{
  console.log(docs.length)
  console.log(docs[0].content)
})

```

