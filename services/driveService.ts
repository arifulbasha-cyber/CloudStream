import { FileSystemItem } from "../types";

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGapi = async (apiKey: string) => {
  // Load the gapi client script
  await new Promise<void>((resolve, reject) => {
    if (typeof window.gapi === 'undefined') {
        reject(new Error("Google API script not loaded"));
        return;
    }
    window.gapi.load('client', { callback: resolve, onerror: reject });
  });

  // Initialize the client
  // CRITICAL: plugin_name is required when using gapi.client with the new Google Identity Services
  // to avoid "Error 400: invalid_request" regarding OAuth 2.0 policy compliance.
  try {
    await window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC],
        plugin_name: "CloudStream" // Required for new GIS compatibility
    });
  } catch (error) {
    console.warn("Standard init failed, attempting fallback loading...", error);
    // Fallback: Init with just key and plugin_name, then load discovery manually
    // This helps if the automatic discovery loading fails due to network strictness
    await window.gapi.client.init({
        apiKey: apiKey,
        plugin_name: "CloudStream"
    });
    await window.gapi.client.load(DISCOVERY_DOC);
  }

  gapiInited = true;
};

export const initGis = (clientId: string, onTokenResponse: (token: any) => void) => {
  if (typeof window.google === 'undefined' || !window.google.accounts) {
      console.error("Google Identity Services script not loaded");
      return;
  }
  
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (tokenResponse: any) => {
      onTokenResponse(tokenResponse);
    },
  });
  gisInited = true;
};

export const requestAccessToken = () => {
  if (!tokenClient) throw new Error("GIS not initialized");
  tokenClient.requestAccessToken({ prompt: 'consent' });
};

// Helper function to wait for GAPI init
const waitForGapi = async (retries = 5, delay = 500): Promise<void> => {
    if (gapiInited && window.gapi?.client?.drive) return;
    if (retries === 0) throw new Error("GAPI unavailable");
    
    await new Promise(r => setTimeout(r, delay));
    return waitForGapi(retries - 1, delay);
};

export const listFiles = async (folderId: string = 'root'): Promise<FileSystemItem[]> => {
  try {
    // Wait for GAPI to be ready if it's currently initializing
    await waitForGapi();
    
    const response = await window.gapi.client.drive.files.list({
      pageSize: 50,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, parents)',
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'folder, name'
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
    }));
  } catch (err) {
    console.error("Error listing files", err);
    throw err;
  }
};

export const getUserInfo = async (accessToken: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("Error fetching user info", e);
        return null;
    }
}

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
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
    google: any;
  }
}