export interface SeafileDirEntry {
  id: string;
  type: "file" | "dir";
  name: string;
  size?: number;
}
export interface SeafileConfig {
  serverUrl: string;
  repoId: string;
  token: string;
}
export async function getSeafileToken(
  serverUrl: string,
  username: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${serverUrl}/api2/auth-token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`Seafile auth failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    token: string;
  };
  return data.token;
}
export async function listDir(
  config: SeafileConfig,
  dirPath: string,
): Promise<SeafileDirEntry[]> {
  const url = `${config.serverUrl}/api2/repos/${config.repoId}/dir/?p=${encodeURIComponent(dirPath)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${config.token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Seafile list dir failed for ${dirPath}: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as SeafileDirEntry[];
}
export async function downloadFile(
  config: SeafileConfig,
  filePath: string,
): Promise<Buffer> {
  const linkUrl = `${config.serverUrl}/api2/repos/${config.repoId}/file/?p=${encodeURIComponent(filePath)}`;
  const linkRes = await fetch(linkUrl, {
    headers: { Authorization: `Token ${config.token}` },
  });
  if (!linkRes.ok) {
    throw new Error(
      `Seafile get download link failed for ${filePath}: ${linkRes.status} ${await linkRes.text()}`,
    );
  }
  const downloadUrl = (await linkRes.json()) as string;
  const fileRes = await fetch(downloadUrl);
  if (!fileRes.ok) {
    throw new Error(
      `Seafile file download failed for ${filePath}: ${fileRes.status}`,
    );
  }
  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
export async function findFilesRecursive(
  config: SeafileConfig,
  dirPath: string,
  extensions: string[],
): Promise<string[]> {
  const entries = await listDir(config, dirPath);
  const results: string[] = [];
  for (const entry of entries) {
    const entryPath = `${dirPath.replace(/\/$/, "")}/${entry.name}`;
    if (entry.type === "dir") {
      results.push(
        ...(await findFilesRecursive(config, entryPath, extensions)),
      );
    } else if (
      extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))
    ) {
      results.push(entryPath);
    }
  }
  return results;
}
