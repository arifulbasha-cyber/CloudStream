import React, { useState, useEffect, useMemo } from 'react';
import { ICONS, APP_CONFIG } from './constants';
import { FileSystemItem, FileType, User, WatchHistoryItem, getFileType, DriveConfig } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import VideoPlayer from './components/VideoPlayer';
import { performSmartSearch } from './services/geminiService';
import { initGapi, initGis, requestAccessToken, listFiles, getUserInfo } from './services/driveService';

// --- Components ---

const SettingsModal: React.FC<{ 
    onClose: () => void, 
    onSave: (config: DriveConfig) => void,
    initialConfig: DriveConfig | null 
}> = ({ onClose, onSave, initialConfig }) => {
    const [clientId, setClientId] = useState(initialConfig?.clientId || '');
    const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
    const [originUrl, setOriginUrl] = useState('');

    useEffect(() => {
        setOriginUrl(window.location.origin);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId && apiKey) {
            onSave({ clientId, apiKey });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span>Developer Settings</span>
                </h2>

                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-6">
                    <p className="text-[11px] text-blue-200 font-medium mb-1">Authorized Origin</p>
                    <p className="text-[10px] text-slate-400">
                        Ensure this URL is added to <b>Authorized JavaScript origins</b> in Google Cloud Console:
                    </p>
                    <code className="block mt-1 bg-black/30 p-1.5 rounded text-blue-300 text-[10px] break-all select-all">
                        {originUrl}
                    </code>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Google Client ID</label>
                        <input
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="...apps.googleusercontent.com"
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Google API Key</label>
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
                        Save Configuration
                    </button>
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-blue-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-9 h-9 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 7.5 7.5 0 0 0-5.483-12.842V-2.333a4.5 4.5 0 0 0-2.25 8.358Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V21m-4.72-14.25V21m9.44-14.25V21" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400">Access your personal cloud stream.</p>
        </div>
        
        {/* Login Actions */}
        <div className="space-y-4">
             <button
                onClick={isConfigured ? onLogin : onOpenSettings}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-white/5 transform hover:-translate-y-0.5 active:translate-y-0"
            >
                {isLoading ? (
                    <span className="animate-pulse">Connecting...</span>
                ) : isConfigured ? (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Sign in with Google</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-900">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.107-1.204l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <span>Configure App</span>
                    </>
                )}
            </button>
            
            {!isConfigured && (
                <p className="text-xs text-center text-yellow-500/80 mt-2">
                    App credentials are missing. Click to configure.
                </p>
            )}
        </div>

        {/* Footer Settings Link */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
             <span>Secure Google Drive Access</span>
             <button onClick={onOpenSettings} className="hover:text-blue-400 flex items-center space-x-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                 <span>Developer Settings</span>
             </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // Config State
  const [config, setConfig] = useState<DriveConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Drive Data State
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderNameMap, setFolderNameMap] = useState<Record<string, string>>({'root': 'My Drive'});
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // View State
  const [currentView, setCurrentView] = useState<'files' | 'history' | 'favorites'>('files');
  const [playingFile, setPlayingFile] = useState<FileSystemItem | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[] | null>(null); // IDs of filtered files

  // Initialization Logic
  useEffect(() => {
    // 1. Load History
    const savedHistory = localStorage.getItem('watchHistory');
    if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    
    // 2. Load Config (Code Constants OR LocalStorage)
    const savedConfig = localStorage.getItem('driveConfig');
    
    // Priority: Hardcoded config > LocalStorage > Null
    let effectiveConfig: DriveConfig | null = null;
    
    if (APP_CONFIG.CLIENT_ID && APP_CONFIG.API_KEY) {
        effectiveConfig = {
            clientId: APP_CONFIG.CLIENT_ID,
            apiKey: APP_CONFIG.API_KEY
        };
    } else if (savedConfig) {
        try {
            effectiveConfig = JSON.parse(savedConfig);
        } catch(e) { console.error(e); }
    }

    if (effectiveConfig) {
        setConfig(effectiveConfig);
        initServices(effectiveConfig);
    }
  }, []);

  const handleConfigSave = async (newConfig: DriveConfig) => {
    setConfig(newConfig);
    localStorage.setItem('driveConfig', JSON.stringify(newConfig));
    await initServices(newConfig);
    setShowSettings(false);
  };

  const initServices = async (cfg: DriveConfig) => {
      try {
          await initGapi(cfg.apiKey);
          initGis(cfg.clientId, async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                  setAccessToken(tokenResponse.access_token);
                  const userInfo = await getUserInfo(tokenResponse.access_token);
                  setUser({
                      name: userInfo.name,
                      email: userInfo.email,
                      picture: userInfo.picture
                  });
              }
              setIsAuthLoading(false);
          });
      } catch (err) {
          console.error("Failed to init Google Services", err);
          // Do not reset config immediately on network error, allow user to retry login
      }
  };

  // Fetch files when folder or auth changes
  useEffect(() => {
      if (accessToken && currentFolderId && !isSearching) {
          loadFiles(currentFolderId);
      }
  }, [accessToken, currentFolderId, isSearching]);

  const loadFiles = async (folderId: string) => {
      setIsLoadingFiles(true);
      try {
          const driveFiles = await listFiles(folderId);
          setFiles(driveFiles);
      } catch (error) {
          console.error("Failed to load files", error);
      } finally {
          setIsLoadingFiles(false);
      }
  };

  const handleLogin = () => {
    if (!config) {
        setShowSettings(true);
        return;
    }
    setIsAuthLoading(true);
    requestAccessToken();
  };

  const handleLogout = () => {
      setUser(null);
      setAccessToken(null);
      setFiles([]);
      setCurrentFolderId('root');
      const token = window.gapi?.client?.getToken();
      if (token) {
          window.google?.accounts?.oauth2?.revoke(token.access_token, () => {
            console.log('Revoked');
          });
          window.gapi?.client?.setToken('');
      }
  };

  const handleUpdateHistory = (fileId: string, progress: number, duration: number) => {
    setHistory(prev => {
        const existingIndex = prev.findIndex(h => h.fileId === fileId);
        const newItem = { fileId, progress, duration, timestamp: Date.now() };
        let newHistory;
        
        if (existingIndex >= 0) {
            newHistory = [...prev];
            newHistory[existingIndex] = newItem;
        } else {
            newHistory = [newItem, ...prev];
        }
        
        localStorage.setItem('watchHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const handleFileClick = (file: FileSystemItem) => {
    const type = getFileType(file.mimeType);
    if (type === FileType.FOLDER) {
        setFolderNameMap(prev => ({...prev, [file.id]: file.name}));
        setCurrentFolderId(file.id);
        setSearchQuery('');
        setSearchResults(null);
    } else if (type === FileType.VIDEO) {
        setPlayingFile(file);
    }
  };

  const handleSmartSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      
      try {
          const response = await window.gapi.client.drive.files.list({
              q: `name contains '${searchQuery}' and trashed = false`,
              fields: 'files(id, name, mimeType, size, createdTime, thumbnailLink, parents)'
          });
          
          const searchFiles = response.result.files.map((f: any) => ({
                id: f.id,
                parentId: f.parents ? f.parents[0] : null,
                name: f.name,
                mimeType: f.mimeType,
                thumbnail: f.thumbnailLink,
                size: f.size,
                createdAt: f.createdTime,
          }));

          setFiles(searchFiles);
          
          // Use mock results if Gemini key is not present, otherwise use real service
          const geminiFilteredIds = await performSmartSearch(searchQuery, searchFiles);
          
          if (geminiFilteredIds.length > 0) {
              setSearchResults(geminiFilteredIds);
          } else {
              setSearchResults(null); // Fallback to showing all Drive text matches
          }

      } catch (e) {
          console.error("Search failed", e);
      } finally {
          setIsSearching(false);
      }
  };

  const filteredFiles = useMemo(() => {
    if (searchResults !== null) {
        return files.filter(f => searchResults.includes(f.id));
    }
    if (currentView === 'history') {
        // Naive history implementation: Show files in current list that are in history
        // Real app would fetch file metadata for history IDs specifically
        const historyIds = new Set(history.map(h => h.fileId));
        return files.filter(f => historyIds.has(f.id));
    }
    return files;
  }, [files, searchResults, currentView, history]);

  const breadcrumbs = useMemo(() => {
      if (currentFolderId === 'root') return [];
      return [{ id: currentFolderId, name: folderNameMap[currentFolderId] || 'Folder' }];
  }, [currentFolderId, folderNameMap]);

  // --- RENDER ---

  if (!user || !accessToken) {
    return (
        <>
            <LoginScreen 
                onLogin={handleLogin} 
                isLoading={isAuthLoading} 
                onOpenSettings={() => setShowSettings(true)}
                isConfigured={!!config}
            />
            {showSettings && (
                <SettingsModal 
                    onClose={() => setShowSettings(false)} 
                    onSave={handleConfigSave} 
                    initialConfig={config}
                />
            )}
        </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
        <Sidebar 
            user={user} 
            currentView={currentView} 
            onChangeView={(view) => {
                setCurrentView(view);
                if (view === 'files') {
                    setFiles([]); 
                    loadFiles(currentFolderId);
                }
            }}
            onLogout={handleLogout}
        />
        
        <main className="flex-1 flex flex-col h-full relative w-full">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center space-x-2 md:hidden">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">CS</div>
                </div>

                <div className="flex-1 max-w-2xl mx-4 md:mx-0 relative">
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                            placeholder="Search in Drive..."
                            className="block w-full pl-10 pr-12 py-2 border border-slate-700 rounded-full leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                         <button 
                            onClick={handleSmartSearch}
                            disabled={isSearching}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center"
                        >
                             <div className={`p-1.5 rounded-full ${searchQuery ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                 {isSearching ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : 
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                             </div>
                        </button>
                    </div>
                </div>
                
                 <div className="hidden md:flex items-center space-x-3">
                    {user.picture && <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-slate-700" />}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                 {/* Breadcrumbs */}
                 <div className="flex items-center space-x-2 mb-6 text-sm text-slate-400">
                    <button onClick={() => { setCurrentFolderId('root'); setFiles([]); }} className="hover:text-white transition-colors">My Drive</button>
                    {breadcrumbs.map((crumb) => (
                        <React.Fragment key={crumb.id}>
                            <span>/</span>
                            <span className="text-white font-medium">{crumb.name}</span>
                        </React.Fragment>
                    ))}
                </div>

                {isLoadingFiles ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <p>No files found in this folder</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredFiles.map((file) => {
                             const type = getFileType(file.mimeType);
                             const historyItem = history.find(h => h.fileId === file.id);
                             const progressPercent = historyItem ? (historyItem.progress / historyItem.duration) * 100 : 0;
                             
                             return (
                                <div 
                                    key={file.id}
                                    onClick={() => handleFileClick(file)}
                                    className="group relative bg-slate-800 rounded-2xl p-4 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 transition-all cursor-pointer shadow-lg shadow-black/20 flex flex-col"
                                >
                                     <div className="aspect-square w-full rounded-xl bg-slate-900 mb-3 overflow-hidden flex items-center justify-center relative">
                                        {file.thumbnail ? (
                                             <>
                                                <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    {type === FileType.VIDEO && (
                                                         <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                         </div>
                                                    )}
                                                </div>
                                             </>
                                        ) : (
                                            ICONS[type] || ICONS['DOCUMENT']
                                        )}

                                        {type === FileType.VIDEO && progressPercent > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
                                                <div className="h-full bg-red-500" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">{file.name}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-slate-500">{file.size || 'Folder'}</span>
                                        </div>
                                     </div>
                                </div>
                             );
                        })}
                    </div>
                )}
            </div>

             {/* Mobile Nav Placeholder */}
             <div className="md:hidden h-16"></div>
        </main>

        <MobileNav 
            currentView={currentView}
            onChangeView={(view) => {
                setCurrentView(view);
                setCurrentFolderId('root');
            }}
        />

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