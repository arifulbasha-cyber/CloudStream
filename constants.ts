import { FileSystemItem, FileType } from './types';
import React from 'react';

// --- APP CONFIGURATION ---
// You can hardcode your credentials here to skip the settings menu in the UI.
export const APP_CONFIG = {
    CLIENT_ID: '', // Paste your Google Client ID here (e.g., "123...apps.googleusercontent.com")
    API_KEY: '',   // Paste your Google API Key here (e.g., "AIza...")
};

export const MOCK_FILES: FileSystemItem[] = [
  // Root Folders
  { id: '1', parentId: null, name: 'My Recordings', mimeType: FileType.FOLDER, createdAt: '2023-10-01', size: '--' },
  { id: '2', parentId: null, name: 'Movies', mimeType: FileType.FOLDER, createdAt: '2023-09-15', size: '--' },
  { id: '3', parentId: null, name: 'Work Documents', mimeType: FileType.FOLDER, createdAt: '2023-11-20', size: '--' },

  // Inside My Recordings
  { 
    id: '11', 
    parentId: '1', 
    name: 'Big Buck Bunny', 
    mimeType: 'video/mp4', 
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/id/237/400/225',
    createdAt: '2023-10-02', 
    size: '150 MB',
    description: 'A large rabbit deals with three bullying rodents.'
  },
  { 
    id: '12', 
    parentId: '1', 
    name: 'Elephant Dream', 
    mimeType: 'video/mp4', 
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://picsum.photos/id/10/400/225',
    createdAt: '2023-10-05', 
    size: '120 MB',
    description: 'Two characters explore a strange mechanical machine world.'
  },

  // Inside Movies
  { 
    id: '21', 
    parentId: '2', 
    name: 'Sintel', 
    mimeType: 'video/mp4', 
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://picsum.photos/id/1025/400/225',
    createdAt: '2023-09-16', 
    size: '210 MB',
    description: 'A lonely young woman searches for a pet dragon she befriended.'
  },
  { 
    id: '22', 
    parentId: '2', 
    name: 'Tears of Steel', 
    mimeType: 'video/mp4', 
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://picsum.photos/id/1015/400/225',
    createdAt: '2023-09-18', 
    size: '300 MB',
    description: 'A group of warriors and scientists gather in a future Amsterdam to save the world from robots.'
  },

  // Inside Work Documents (Mixed content)
  { 
    id: '31', 
    parentId: '3', 
    name: 'Project Plan.txt', 
    mimeType: 'text/plain', 
    createdAt: '2023-11-21', 
    size: '12 KB',
    description: 'Text document outlining the Q4 strategy.'
  },
  { 
    id: '32', 
    parentId: '3', 
    name: 'Team Photo.jpg', 
    mimeType: 'image/jpeg', 
    url: 'https://picsum.photos/id/1005/600/400',
    thumbnail: 'https://picsum.photos/id/1005/200/200',
    createdAt: '2023-11-22', 
    size: '2.5 MB',
    description: 'Photo of the engineering team.'
  },
  {
      id: '33',
      parentId: '3',
      name: 'Forough',
      mimeType: 'video/mp4',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://picsum.photos/id/1018/400/225',
      createdAt: '2023-11-25',
      size: '15 MB',
      description: 'A promotional video for bigger blazes.'
  }
];

export const ICONS = {
  [FileType.FOLDER]: React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    className: "w-12 h-12 text-blue-400"
  }, React.createElement("path", {
    d: "M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z"
  })),
  [FileType.VIDEO]: React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    className: "w-12 h-12 text-red-500"
  }, React.createElement("path", {
    d: "M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z"
  })),
  [FileType.DOCUMENT]: React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    className: "w-12 h-12 text-slate-400"
  }, React.createElement("path", {
    fillRule: "evenodd",
    d: "M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z",
    clipRule: "evenodd"
  }), React.createElement("path", {
    d: "M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z"
  })),
  [FileType.IMAGE]: React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    className: "w-12 h-12 text-purple-400"
  }, React.createElement("path", {
    fillRule: "evenodd",
    d: "M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z",
    clipRule: "evenodd"
  }))
};