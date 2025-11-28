import { FileSystemItem, StorageQuota } from "../types";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let gapiInited = false;

// Initialize GoogleAuth Plugin (Native)
export const initNativeAuth = (clientId?: string) => {
    if (clientId) {
        GoogleAuth.initialize({
            clientId: clientId,
            scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
            grantOfflineAccess: true,
        });
    } else {
        GoogleAuth.initialize();
    }
};

export const initGapi = async (apiKey: string) => {
  await new Promise<void>((resolve, reject) => {
    if (typeof window.gapi === 'undefined') {
        reject(new Error("Google API script not loaded"));
        return;
    }
    window.gapi.load('client', { callback: resolve, onerror: reject });
  });

  try {
    await window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC],
        plugin_name: "CloudStream"
    });
  } catch (error) {
    console.warn("Standard init failed, attempting fallback loading...", error);
    await window.gapi.client.init({
        apiKey: apiKey,
        plugin_name: "CloudStream"
    });
    await window.gapi.client.load(DISCOVERY_DOC);
  }

  gapiInited = true;
};

// Replaces the old web-based requestAccessToken
export const nativeSignIn = async () => {
    try {
        const user = await GoogleAuth.signIn();
        return user;
    } catch (error) {
        console.error("Native Sign In Error", error);
        throw error;
    }
};

export const nativeSignOut = async () => {
    await GoogleAuth.signOut();
};

// Explicitly set the token for GAPI client
export const setGapiToken = (token: string) => {
    if (typeof window.gapi !== 'undefined' && window.gapi.client) {
        window.gapi.client.setToken({ access_token: token });
    }
};

// Helper function to wait for GAPI init
const waitForGapi = async (retries = 20, delay = 200): Promise<void> => {
    if (gapiInited && window.gapi?.client?.drive) return;
    if (retries === 0) throw new Error("GAPI unavailable");
    
    await new Promise(r => setTimeout(r, delay));
    return waitForGapi(retries - 1, delay);
};

export const listFiles = async (folderId: string = 'root'): Promise<FileSystemItem[]> => {
  try {
    await waitForGapi();
    
    const response = await window.gapi.client.drive.files.list({
      pageSize: 50,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, parents, shortcutDetails, webContentLink)',
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'folder, name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.result.files || [];
    
    return files.map((f: any) => ({
      id: f.id,
      parentId: f.parents ? f.parents[0] : null,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: f.thumbnailLink,
      size: f.size ? formatBytes(parseInt(f.size)) : undefined,
      createdAt: f.createdTime,
      shortcutDetails: f.shortcutDetails,
      url: f.webContentLink
    }));
  } catch (err) {
    console.error("Error listing files", err);
    throw err;
  }
};

export const listSharedFiles = async (): Promise<FileSystemItem[]> => {
    try {
        await waitForGapi();
        const response = await window.gapi.client.drive.files.list({
            pageSize: 50,
            fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, parents, shortcutDetails, webContentLink)',
            q: `sharedWithMe = true and trashed = false`,
            orderBy: 'sharedWithMeTime desc',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = response.result.files || [];
        return files.map((f: any) => ({
            id: f.id,
            parentId: null,
            name: f.name,
            mimeType: f.mimeType,
            thumbnail: f.thumbnailLink,
            size: f.size ? formatBytes(parseInt(f.size)) : undefined,
            createdAt: f.createdTime,
            shortcutDetails: f.shortcutDetails,
            url: f.webContentLink
        }));
    } catch (err) {
        console.error("Error listing shared files", err);
        throw err;
    }
};

export const getStorageQuota = async (): Promise<StorageQuota | null> => {
    try {
        await waitForGapi();
        const response = await window.gapi.client.drive.about.get({
            fields: 'storageQuota'
        });
        return response.result.storageQuota;
    } catch (e) {
        console.error("Error fetching storage quota", e);
        return null;
    }
};

// No longer needed for Native Auth as user info comes back with login
export const getUserInfo = async (accessToken: string) => {
    return null; 
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

declare global {
  interface Window {
    gapi: any;
  }
}
