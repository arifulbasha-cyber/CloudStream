import React, { useState, useEffect, useMemo } from 'react';
import { ICONS, APP_CONFIG } from './constants';
import { FileSystemItem, FileType, User, WatchHistoryItem, getFileType, DriveConfig, StorageQuota } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import VideoPlayer from './components/VideoPlayer';
import { performSmartSearch } from './services/geminiService';
import { initGapi, initGis, requestAccessToken, listFiles, listSharedFiles, getUserInfo, getStorageQuota, formatBytes } from './services/driveService';

// --- Components ---

const SettingsModal: React.FC<{ 
    onClose: () => void, 
    onSave: (config: DriveConfig) => void,
    initialConfig: DriveConfig | null 
}> = ({ onClose, onSave, initialConfig }) => {
    const [clientId, setClientId] = useState(initialConfig?.clientId || '');
    const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId && apiKey) onSave({ clientId, apiKey });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#37474F] rounded-lg p-6 shadow-2xl relative text-slate-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Client ID</label>
                        <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-4 py-2 rounded bg-[#263238] border border-slate-600 text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                        <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-4 py-2 rounded bg-[#263238] border border-slate-600 text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-lg">Save</button>
                </form>
            </div>
        </div>
    );
}

const LoginScreen: React.FC<{ 
    onLogin: () => void, 
    isLoading: boolean, 
    onOpenSettings: () => void,
    isConfigured: boolean
}> = ({ onLogin, isLoading, onOpenSettings, isConfigured }) => {
  return (
    <div className="min-h-screen bg-[#263238] flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
         <span className="text-4xl font-bold text-white">CX</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">CloudStream Explorer</h1>
      <p className="text-slate-400 mb-8">Secure Drive Access</p>
      
      <button
        onClick={isConfigured ? onLogin : onOpenSettings}
        disabled={isLoading}
        className="w-full max-w-xs py-3 bg-white text-slate-900 font-bold rounded shadow-lg flex items-center justify-center space-x-3 active:scale-95 transition-transform"
      >
        {isLoading ? <span>Connecting...</span> : isConfigured ? <span>Sign in with Google</span> : <span>Setup API Keys</span>}
      </button>
      
      {!isConfigured && (
         <button onClick={onOpenSettings} className="mt-4 text-slate-500 text-sm hover:text-white">Configure Manually</button>
      )}
    </div>
  );
}

// --- Main App ---

const App: React.FC = () => {
  const [config, setConfig] = useState<DriveConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isDriveReady, setIsDriveReady] = useState(false);

  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderNameMap, setFolderNameMap] = useState<Record<string, string>>({'root': 'Main Storage'});
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);

  // View: files = Local, history = Analyze, favorites = Network
  const [currentView, setCurrentView] = useState<'files' | 'history' | 'favorites'>('files');
  const [playingFile, setPlayingFile] = useState<FileSystemItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);

  // --- Init Logic (Same as before) ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('watchHistory');
    if (savedHistory) try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    
    const savedConfig = localStorage.getItem('driveConfig');
    let effectiveConfig = APP_CONFIG.CLIENT_ID ? { clientId: APP_CONFIG.CLIENT_ID, apiKey: APP_CONFIG.API_KEY } : (savedConfig ? JSON.parse(savedConfig) : null);

    if (effectiveConfig) {
        setConfig(effectiveConfig);
        const savedToken = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        const savedExpiry = localStorage.getItem('tokenExpiry');
        if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry) && savedUser) {
            setAccessToken(savedToken);
            setUser(JSON.parse(savedUser));
            initServices(effectiveConfig).then(() => setIsDriveReady(true));
        } else {
            initServices(effectiveConfig);
            localStorage.removeItem('accessToken');
        }
    }
  }, []);

  const initServices = async (cfg: DriveConfig) => {
      await initGapi(cfg.apiKey);
      initGis(cfg.clientId, async (res) => {
          if (res?.access_token) {
              setAccessToken(res.access_token);
              localStorage.setItem('accessToken', res.access_token);
              localStorage.setItem('tokenExpiry', (Date.now() + (res.expires_in || 3590) * 1000).toString());
              const u = await getUserInfo(res.access_token);
              const newUser = { name: u?.name || 'User', email: u?.email || '', picture: u?.picture };
              setUser(newUser);
              localStorage.setItem('user', JSON.stringify(newUser));
              setIsDriveReady(true);
          }
      });
  };

  const handleLogin = () => {
      if (!config) setShowSettings(true);
      else requestAccessToken();
  };

  // Fetch logic
  useEffect(() => {
      if (accessToken && isDriveReady) {
          if (currentView === 'files') {
            loadFiles(currentFolderId);
            loadStorageQuota();
          } else if (currentView === 'favorites') {
              // 'favorites' maps to Network/Shared in our CX theme
              loadSharedFiles();
          }
      }
  }, [accessToken, currentFolderId, currentView, isDriveReady]);

  const loadStorageQuota = async () => {
      const quota = await getStorageQuota();
      if (quota) setStorageQuota(quota);
  }

  const loadFiles = async (folderId: string) => {
      setIsLoadingFiles(true);
      try {
          const driveFiles = await listFiles(folderId);
          setFiles(driveFiles);
      } catch (e) { console.error(e); } 
      finally { setIsLoadingFiles(false); }
  };

  const loadSharedFiles = async () => {
      setIsLoadingFiles(true);
      try {
          const shared = await listSharedFiles();
          setFiles(shared);
      } catch (e) { console.error(e); }
      finally { setIsLoadingFiles(false); }
  };

  const handleUpdateHistory = (fileId: string, progress: number, duration: number) => {
    const fileMeta = files.find(f => f.id === fileId) || playingFile;
    setHistory(prev => {
        const idx = prev.findIndex(h => h.fileId === fileId);
        const newItem: WatchHistoryItem = { 
            fileId, progress, duration, timestamp: Date.now(),
            name: fileMeta?.name || prev[idx]?.name || 'Unknown',
            thumbnail: fileMeta?.thumbnail || prev[idx]?.thumbnail,
            mimeType: fileMeta?.mimeType || prev[idx]?.mimeType,
            size: fileMeta?.size || prev[idx]?.size
        };
        const newHistory = idx >= 0 ? [...prev] : [newItem, ...prev];
        if (idx >= 0) newHistory[idx] = newItem;
        localStorage.setItem('watchHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const handleFileClick = (file: FileSystemItem) => {
    // Resolve Shortcut Logic
    const isShortcut = file.mimeType === 'application/vnd.google-apps.shortcut';
    // If shortcut, use the target info, otherwise use file info
    const effectiveId = (isShortcut && file.shortcutDetails) ? file.shortcutDetails.targetId : file.id;
    const effectiveMimeType = (isShortcut && file.shortcutDetails) ? file.shortcutDetails.targetMimeType : file.mimeType;
    
    const type = getFileType(effectiveMimeType);

    if (type === FileType.FOLDER) {
        // Navigate to the folder (whether it's direct or a shortcut target)
        setFolderNameMap(prev => ({...prev, [effectiveId]: file.name}));
        setCurrentFolderId(effectiveId);
        setSearchQuery('');
        setSearchResults(null);
    } else if (type === FileType.VIDEO) {
        // Check if on Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        if (isAndroid) {
            // FORCE EXTERNAL PLAYER on Android
            if (!accessToken) return;
            const videoSrc = `https://www.googleapis.com/drive/v3/files/${effectiveId}?alt=media&access_token=${accessToken}&acknowledgeAbuse=true`;
            // Explicitly requesting a view intent that most players (like MX) intercept
            const intentUrl = `intent:${videoSrc}#Intent;type=${effectiveMimeType};S.title=${encodeURIComponent(file.name)};end`;
            
            // Mark as watched (timestamp update) even though we can't track progress externally
            handleUpdateHistory(effectiveId, 0, 0);
            
            // Launch Intent
            window.location.href = intentUrl;
        } else {
            // Desktop fallback: Play internal
            // Construct a playable file object using the resolved target ID/MimeType
            const playableFile: FileSystemItem = isShortcut ? {
                ...file,
                id: effectiveId,
                mimeType: effectiveMimeType
            } : file;
            setPlayingFile(playableFile);
        }
    }
  };

  const handleSmartSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
          const response = await window.gapi.client.drive.files.list({
              q: `name contains '${searchQuery}' and trashed = false`,
              fields: 'files(id, name, mimeType, size, createdTime, thumbnailLink, parents, shortcutDetails)',
              supportsAllDrives: true, includeItemsFromAllDrives: true
          });
          const searchFiles = response.result.files.map((f: any) => ({
                id: f.id, 
                parentId: f.parents?.[0]||null, 
                name: f.name, 
                mimeType: f.mimeType, 
                thumbnail: f.thumbnailLink, 
                size: f.size,
                shortcutDetails: f.shortcutDetails
          }));
          setFiles(searchFiles);
          if (config?.apiKey) {
            const ids = await performSmartSearch(searchQuery, searchFiles, config.apiKey);
            setSearchResults(ids.length > 0 ? ids : null);
          }
      } catch (e) { console.error(e); } 
      finally { setIsSearching(false); }
  };

  const displayItems = useMemo(() => {
    if (currentView === 'history') {
        return history.sort((a,b) => b.timestamp - a.timestamp).map(h => ({
            id: h.fileId, parentId: null, name: h.name||'Video', mimeType: h.mimeType||'video/mp4', thumbnail: h.thumbnail, size: h.size, description: 'Watched'
        } as FileSystemItem));
    }
    return searchResults ? files.filter(f => searchResults.includes(f.id)) : files;
  }, [files, searchResults, currentView, history]);

  // Storage Bar Calculation for CX Dashboard
  const storageStats = useMemo(() => {
    if (!storageQuota) return { percent: 0, used: '0 GB', total: '15 GB' };
    const limit = parseInt(storageQuota.limit || '0');
    const usage = parseInt(storageQuota.usage || '0');
    return {
        percent: limit > 0 ? Math.min(Math.round((usage/limit)*100), 100) : 0,
        used: formatBytes(usage, 1),
        total: formatBytes(limit, 1)
    };
  }, [storageQuota]);

  if (!user || !accessToken) return <LoginScreen onLogin={handleLogin} isLoading={false} onOpenSettings={() => setShowSettings(true)} isConfigured={!!config} />;

  return (
    <div className="flex h-screen bg-[#263238] text-slate-200 overflow-hidden font-sans">
        <Sidebar user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={() => { setUser(null); setAccessToken(null); localStorage.removeItem('accessToken'); }} />
        
        <main className="flex-1 flex flex-col h-full w-full bg-[#263238] relative">
            {/* CX Style Header */}
            <header className="h-14 flex items-center justify-between px-4 bg-[#263238] border-b border-slate-700/50 shadow-sm z-20">
                <div className="flex items-center space-x-3">
                    {currentFolderId !== 'root' && currentView === 'files' ? (
                        <button onClick={() => { setCurrentFolderId('root'); setFiles([]); listFiles('root'); }} className="text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    ) : (
                         <div className="md:hidden w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white">CX</div>
                    )}
                    <h1 className="text-lg font-medium text-white truncate">
                        {currentView === 'history' ? 'Analyze (History)' : 
                         currentView === 'favorites' ? 'Network (Shared)' : 
                         folderNameMap[currentFolderId]}
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Search Icon */}
                    <div className="relative">
                        <input 
                            type="text" 
                            className={`bg-transparent border-b border-transparent focus:border-blue-400 text-white w-24 focus:w-40 transition-all outline-none text-sm placeholder-transparent focus:placeholder-slate-500`} 
                            placeholder="Search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSmartSearch()}
                        />
                        <button onClick={handleSmartSearch} className="absolute right-0 top-0 text-white">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </div>
                    <button onClick={() => loadFiles(currentFolderId)} className="text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </header>

            {/* CX Dashboard Area (Only on Root/Local view) */}
            {currentView === 'files' && currentFolderId === 'root' && (
                <div className="bg-[#37474F] p-4 mx-2 mt-2 rounded-lg shadow-md mb-2">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-xl font-bold text-white">{storageStats.percent}%</span>
                            <span className="text-xs text-slate-400 ml-2">{storageStats.used} / {storageStats.total}</span>
                        </div>
                        <span className="text-xs text-slate-400">Main Storage</span>
                    </div>
                    {/* CX Signature Multi-color Bar */}
                    <div className="h-3 w-full bg-[#263238] rounded-full overflow-hidden flex">
                        <div style={{ width: `${storageStats.percent * 0.5}%` }} className="h-full bg-yellow-500"></div> {/* Images */}
                        <div style={{ width: `${storageStats.percent * 0.3}%` }} className="h-full bg-blue-500"></div>   {/* Videos */}
                        <div style={{ width: `${storageStats.percent * 0.1}%` }} className="h-full bg-green-500"></div>  {/* Audio */}
                        <div style={{ width: `${storageStats.percent * 0.1}%` }} className="h-full bg-red-500"></div>    {/* Other */}
                    </div>
                    <div className="flex mt-2 space-x-4 text-[10px] text-slate-400">
                         <span className="flex items-center"><div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>Images</span>
                         <span className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>Videos</span>
                         <span className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>Audio</span>
                    </div>
                </div>
            )}

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto p-2 pb-20">
                {isLoadingFiles ? (
                    <div className="flex justify-center mt-10"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-4">
                        {displayItems.map((file) => {
                            // Resolve type for display (is it a folder shortcut?)
                            const isShortcut = file.mimeType === 'application/vnd.google-apps.shortcut';
                            const effectiveMimeType = (isShortcut && file.shortcutDetails) ? file.shortcutDetails.targetMimeType : file.mimeType;
                            const type = getFileType(effectiveMimeType);

                            // CX Style: Folders are big icons, Files are cards
                            return (
                                <div key={file.id} onClick={() => handleFileClick(file)} className="flex flex-col items-center text-center group cursor-pointer">
                                    <div className="relative mb-1">
                                        {file.thumbnail ? (
                                             <div className="w-14 h-14 md:w-20 md:h-20 rounded overflow-hidden border border-slate-600 bg-black">
                                                 <img src={file.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                             </div>
                                        ) : (
                                            // Render correct icon from constants
                                            ICONS[type] || ICONS[FileType.DOCUMENT]
                                        )}
                                        {/* Play Overlay for Videos */}
                                        {type === FileType.VIDEO && file.thumbnail && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                        )}
                                        {/* Shortcut Overlay Icon */}
                                        {isShortcut && (
                                            <div className="absolute bottom-0 left-0 bg-white/80 rounded-tr p-0.5">
                                                 <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] md:text-xs text-slate-300 line-clamp-2 px-1 leading-tight break-all w-full">
                                        {file.name}
                                    </span>
                                    {type === FileType.VIDEO && currentView === 'history' && (
                                        <span className="text-[9px] text-blue-400 mt-0.5">History</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <MobileNav currentView={currentView} onChangeView={(v) => { setCurrentView(v); if(v==='files') setCurrentFolderId('root'); }} />
        </main>

        {playingFile && accessToken && (
            <VideoPlayer
                file={playingFile}
                accessToken={accessToken}
                initialProgress={history.find(h => h.fileId === playingFile.id)?.progress || 0}
                onClose={() => setPlayingFile(null)}
                onUpdateHistory={handleUpdateHistory}
            />
        )}
    </div>
  );
};

export default App;