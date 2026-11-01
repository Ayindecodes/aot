import { Buffer } from "node:buffer";

const API = "https://api.github.com";
const BRANCH = "main";
export const CATALOG_PATH = "src/data/catalog.json";

export interface GitHubEnv {
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_AUTHOR_NAME?: string;
  GITHUB_AUTHOR_EMAIL?: string;
}

export type FileChange =
  | { path: string; base64: string }
  | { path: string; text: string }
  | { path: string; remove: true };

export class StaleCatalogError extends Error {}

async function request<T>(env: GitHubEnv, path: string, init: RequestInit = {}): Promise<T> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new Error("GitHub isn't configured");
  const response = await fetch(`${API}/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "aot-admin",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub ${path} returned ${response.status}: ${await response.text()}`);
  return (await response.json()) as T;
}

export async function readCatalog(env: GitHubEnv) {
  const file = await request<{ sha: string; content: string }>(
    env,
    `/contents/${CATALOG_PATH}?ref=${BRANCH}`,
  );
  const catalog = JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) as {
    products: unknown[];
  };
  return { sha: file.sha, products: catalog.products };
}

// One commit for the whole change, so a product and its photos always arrive together.
export async function commitChanges(
  env: GitHubEnv,
  message: string,
  changes: FileChange[],
  expectedCatalogSha: string,
): Promise<void> {
  const current = await readCatalog(env);
  if (current.sha !== expectedCatalogSha) throw new StaleCatalogError();

  const ref = await request<{ object: { sha: string } }>(env, `/git/ref/heads/${BRANCH}`);
  const parent = await request<{ tree: { sha: string } }>(env, `/git/commits/${ref.object.sha}`);

  const tree = await Promise.all(
    changes.map(async (change) => {
      const base = { path: change.path, mode: "100644", type: "blob" };
      if ("remove" in change) return { ...base, sha: null };
      const blob = await request<{ sha: string }>(env, "/git/blobs", {
        method: "POST",
        body: JSON.stringify(
          "base64" in change
            ? { content: change.base64, encoding: "base64" }
            : { content: change.text, encoding: "utf-8" },
        ),
      });
      return { ...base, sha: blob.sha };
    }),
  );

  const newTree = await request<{ sha: string }>(env, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  });
  const author = {
    name: env.GITHUB_AUTHOR_NAME ?? "AOT.ng admin",
    email: env.GITHUB_AUTHOR_EMAIL ?? "admin@aotwears.store",
  };
  const commit = await request<{ sha: string }>(env, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [ref.object.sha],
      author,
      committer: author,
    }),
  });
  await request(env, `/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
}
