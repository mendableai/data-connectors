import { Nango } from "@nangohq/node";
import path from "node:path";
import { Octokit } from "octokit";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";
import { DataProvider } from "../DataProvider";
import { Document } from "../../entities/Document";
import { NangoAuthorizationOptions } from "../GoogleDrive";
import { IntegrationWithCreds } from "@nangohq/node/dist/types";
import pdf from "pdf-parse";

const DOC_EXTENSIONS = [".md", ".txt", ".rst", ".mdx"];

/**
 * Determines if a file is a document or not
 * @param path Path to file
 */
function isDoc(path: string): boolean {
  return DOC_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export type GitHubInputOptions = {
  /**
   * The owner of the repository. For example, for "mendableai/data-connectors", this would be "mendableai".
   */
  owner: string;

  /**
   * The name of the repository. For example, for "mendableai/data-connectors", this would be "data-connectors".
   */
  repo: string;

  /**
   * The branch to retrieve files from. Defaults to the default branch of the repository.
   */
  branch?: string;

  /**
   * Document only mode. If true, only documents (.md, .txt, .rst, .mdx) will be retrieved.
   *
   * @default false
   */
  docOnly?: boolean;

  /**
   * If specified, only the files in this directory (and subdirectories) will be retrieved.
   */
  path?: string;
};

export type GitHubAuthorizationOptions = {
  /**
   * GitHub authentication strategy. [Read more here.](https://github.com/octokit/authentication-strategies.js/)
   */
  authStrategy?: any;

  /**
   * GitHub authentication parameters. [Read more here.](https://github.com/octokit/authentication-strategies.js/)
   */
  auth?: any;
};

export interface GitHubOptions
  extends GitHubInputOptions,
    GitHubAuthorizationOptions,
    NangoAuthorizationOptions {}

/**
 * The GitHub Data Provider retrieves files from a public GitHub repository.
 */
export class GitHubDataProvider implements DataProvider<GitHubOptions> {
  private octokit: Octokit = new Octokit({});

  private owner: string;
  private repo: string;
  private branch?: string;
  private docOnly: boolean;
  private path?: string;

  /**
   * Due to agressive rate limiting, it is strongly recommended to authorize the GitHub Data Provider.
   */
  async authorize(options: GitHubAuthorizationOptions): Promise<void> {
    this.octokit = new Octokit({
      authStrategy: options.authStrategy,
      auth: options.auth,
    });

    await this.octokit.auth();
  }

  /**
   * Due to agressive rate limiting, it is strongly recommended to authorize the GitHub Data Provider.
   */
  async authorizeNango(options: NangoAuthorizationOptions): Promise<void> {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error("Nango secret key is required");
    }
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    const integration = (
      await nango.getIntegration(
        options.nango_integration_id ?? "github",
        true // get credentials
      )
    ).config as IntegrationWithCreds;

    const connection = await nango.getConnection(
      options.nango_integration_id ?? "github",
      options.nango_connection_id
    );

    await this.authorize({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientId: integration.client_id,
        clientSecret: integration.client_secret,
        clientType: "oauth-app",
        token: connection.credentials.raw.access_token,
        scopes: integration.scopes,
      },
    });
  }

  async getDocuments(): Promise<Document[]> {
    let branchName = this.branch;

    if (this.branch === undefined) {
      const repo = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      // Not all GitHub repositories have branches.
      if (repo.data.default_branch === undefined) {
        throw Error(
          "Could not determine the default branch of the repository. Please specify a branch with the `branch` option."
        );
      }

      branchName = repo.data.default_branch;
    }

    const branch = await this.octokit.rest.repos.getBranch({
      owner: this.owner,
      repo: this.repo,
      branch: branchName,
    });

    const tree = await this.octokit.rest.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: branch.data.commit.sha,
      recursive: "true",
    });

    let files = tree.data.tree.filter((item) => item.type == "blob");

    if (this.path !== undefined) {
      files = files.filter((file) => {
        // Check if this.path contains file.path
        const relative = path.relative(this.path, file.path);
        return (
          relative && !relative.startsWith("..") && !path.isAbsolute(relative)
        );
      });
    }

    if (this.docOnly) {
      files = files.filter((file) =>
        DOC_EXTENSIONS.some((ext) => file.path.endsWith(ext))
      );
    }

    const blobs = await Promise.all(
      files.map(async (file) => {
        const blob = await this.octokit.rest.git.getBlob({
          owner: this.owner,
          repo: this.repo,
          file_sha: file.sha,
        });

        // Determine if the file is an image based on its path
        const isImage = /\.(jpg|jpeg|png|gif|bmp|svg|tiff|webp)$/i.test(file.path);
        const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(file.path);
        const isAudio = /\.(mp3|wav|flac|ogg|wma)$/i.test(file.path);
        const isPdf = /\.(pdf)$/i.test(file.path);
        let decodedContent;
        if (isPdf) {
          const buffer = Buffer.from(blob.data.content, "base64");
          const data = await pdf(buffer);
          decodedContent = data.text;
        } else {
          // Decode the content blob as it is encoded, unless it's an image, video or audio
          decodedContent = (isImage || isVideo || isAudio) ? blob.data.content : Buffer.from(
            blob.data.content,
            "base64"
          ).toString("utf8");
        }
        return {
          file,
          blob: {
            ...blob.data,
            content: decodedContent,
          },
        };
      }));

    return blobs.map(({ file, blob }) => ({
      id: blob.sha,
      content: blob.content,
      metadata: {
        // Construct pretty source URL.
        sourceURL: `https://github.com/${encodeURIComponent(
          this.owner
        )}/${encodeURIComponent(this.repo)}/blob/${encodeURIComponent(
          branchName
        )}/${file.path
          .split("/") // Don't escape slashes, they're a part of the path.
          .map((part) => encodeURIComponent(part))
          .join("/")}`,

        githubOwner: this.owner,
        githubRepo: this.repo,
        githubBranch: branchName,
        filePath: file.path,
      },
      provider: "github",
      type: this.docOnly
        ? "document" // don't run iterating computation if we only retrieved documents anyways
        : isDoc(file.path)
        ? "document"
        : "code",
    }));
  }

  setOptions(options: GitHubOptions): void {
    if (options.owner === undefined || options.repo === null) {
      throw new Error("options.owner is required");
    }

    if (options.repo === undefined || options.repo === null) {
      throw new Error("options.repo is required");
    }

    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch ?? undefined; // normalize non-specified value to always be undefined
    this.docOnly = options.docOnly ?? false;
    this.path = options.path ?? undefined; // normalize non-specified value to always be undefined
  }
}
