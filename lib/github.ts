import { Octokit } from "@octokit/rest";
import { readFile } from "fs/promises";
import path from "path";

export type GithubTarget = {
  owner: string;
  repo: string;
  branch: string;
  pathPrefix: string;
};

export function githubConfigured(target: Partial<GithubTarget>): boolean {
  return !!process.env.GITHUB_TOKEN && !!target.owner && !!target.repo;
}

/**
 * Commit a locally-stored image (public URL path like "/uploads/submissions/x.png")
 * to the configured GitHub repo. Returns the commit sha + html url.
 */
export async function commitAssetToGithub(params: {
  target: GithubTarget;
  localPublicPath: string; // e.g. "/uploads/submissions/uuid.png"
  destFileName: string; // e.g. "warp-drive-tier3-novapilot.png"
  commitMessage: string;
}): Promise<{ sha: string; url: string; committedPath: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set in the environment.");
  const { owner, repo, branch, pathPrefix } = params.target;
  if (!owner || !repo) throw new Error("GitHub owner/repo not configured in Admin settings.");

  const octokit = new Octokit({ auth: token });

  // Read the local file and base64-encode it.
  const absolute = path.join(process.cwd(), "public", params.localPublicPath.replace(/^\/+/, ""));
  const buffer = await readFile(absolute);
  const contentB64 = buffer.toString("base64");

  const prefix = (pathPrefix || "").replace(/^\/+|\/+$/g, "");
  const repoPath = prefix ? `${prefix}/${params.destFileName}` : params.destFileName;

  // If the file already exists we must pass its sha to update it.
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: repoPath, ref: branch || undefined });
    if (!Array.isArray(data) && "sha" in data) existingSha = data.sha;
  } catch {
    // 404 → new file, nothing to do.
  }

  const res = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: repoPath,
    message: params.commitMessage,
    content: contentB64,
    branch: branch || undefined,
    sha: existingSha,
  });

  return {
    sha: res.data.commit.sha ?? "",
    url: res.data.content?.html_url ?? "",
    committedPath: repoPath,
  };
}

/** Lightweight check that the token can see the repo (used by the admin "test" button). */
export async function verifyGithubAccess(target: Pick<GithubTarget, "owner" | "repo">): Promise<{ ok: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ok: false, message: "GITHUB_TOKEN not set in environment." };
  if (!target.owner || !target.repo) return { ok: false, message: "Owner and repo are required." };
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.repos.get({ owner: target.owner, repo: target.repo });
    const perms = data.permissions;
    if (perms && !perms.push) {
      return { ok: false, message: `Token can read ${data.full_name} but lacks write (push) access.` };
    }
    return { ok: true, message: `Connected to ${data.full_name} (write access OK).` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, message: `Could not access repo: ${msg}` };
  }
}
