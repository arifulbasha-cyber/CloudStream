import React, { useRef, useEffect, useState } from 'react';
import { FileSystemItem } from '../types';

interface VideoPlayerProps {
  file: FileSystemItem;
  initialProgress: number;
  accessToken: string;
  onClose: () => void;
  onUpdateHistory: (fileId: string, progress: number, duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ file, initialProgress, accessToken, onClose, onUpdateHistory }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- STREAMING ENDPOINTS ---

  // 1. API Endpoint: Best for HTML5 <video> tag in the browser.
  // It handles CORS and range requests decently for web.
  const webSrc = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}&acknowledgeAbuse=true`;

  // 2. User Content (UC) Endpoint: Best for External Android Players (MX Player, VLC).
  // It acts more like a direct file download/stream and often buffers faster.
  // Note: We append the access token as a query param for compatibility, but the real security works via the Intent Headers below.
  const ucSrc = `https://drive.google.com/uc?export=download&id=${file.id}&access_token=${accessToken}`;

  const isAndroid = /Android/i.test(navigator.userAgent);

  // --- INTENT GENERATION ---

  // We explicitly pass the Authorization header in the intent.
  // This is the robust way to let MX Player access private Drive files.
  const intentHeaders = `Authorization: Bearer ${accessToken}`;
  const encodedTitle = encodeURIComponent(file.name);
  const mimeType = file.mimeType || 'video/*';

  // Generic Intent (Let Android choose)
  const genericIntent = `intent:${ucSrc}#Intent;action=android.intent.action.VIEW;type=${mimeType};S.headers=${intentHeaders};S.title=${encodedTitle};end`;

  // Explicit MX Player Intent
  const mxPlayerIntent = `intent:${ucSrc}#Intent;package=com.mxtech.videoplayer.ad;type=${mimeType};S.headers=${intentHeaders};S.title=${encodedTitle};end`;

  const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (videoRef.current && initialProgress > 0) {
          videoRef.current.currentTime = initialProgress;
      }
  };

  const saveProgress = () => {
    if (videoRef.current && !error) {
        onUpdateHistory(file.id, videoRef.current.currentTime, videoRef.current.duration || 0);
    }
  };

  const copyToClipboard = () => {
      // Copy the UC link for external players
      navigator.clipboard.writeText(ucSrc).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  // On Android, mark history immediately since we can't track external apps
  useEffect(() => {
      if (isAndroid) {
          onUpdateHistory(file.id, 0, 0); 
          setIsLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAndroid]);

  useEffect(() => {
      return () => {
          if (!isAndroid) saveProgress();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10 pointer-events-none">
            <h2 className="text-white font-medium truncate pr-4 text-sm md:text-base pointer-events-auto">{file.name}</h2>
            <button 
                onClick={() => {
                    if (!isAndroid) saveProgress();
                    onClose();
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors pointer-events-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* --- ANDROID LAUNCHER UI --- */}
        {isAndroid ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-sm w-full h-full bg-[#1a232e]">
                <div className="w-24 h-24 bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/10">
                     <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Play</h3>
                    <p className="text-slate-400 text-xs px-4">
                        Native player is disabled. Select an external app below.
                    </p>
                </div>

                <div className="w-full space-y-3">
                    {/* Primary Option: Generic Intent (Ask Android to find a player) */}
                    <a 
                        href={genericIntent}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/30 font-bold text-base flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <span>Open in External Player</span>
                    </a>

                    {/* Secondary Option: Force MX Player */}
                    <a 
                        href={mxPlayerIntent}
                        className="w-full py-3 bg-[#263238] border border-slate-600 text-slate-200 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                        <span>Force MX Player</span>
                    </a>
                </div>

                {/* Fallback: Copy Link */}
                <div className="pt-4 w-full border-t border-slate-700/50">
                    <button 
                        onClick={copyToClipboard}
                        className="w-full py-3 text-slate-400 text-xs flex items-center justify-center space-x-2 hover:text-white"
                    >
                        {copied ? (
                            <span className="text-green-400 font-bold">Link Copied!</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                                </svg>
                                <span>Copy Stream Link</span>
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Paste into MX Player Network Stream if needed.
                    </p>
                </div>
            </div>
        ) : (
            /* --- DESKTOP PLAYER (Kept for PC users) --- */
            <>
                {isLoading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center bg-slate-900">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <p className="text-white text-lg font-medium mb-2">Format Not Supported</p>
                        <p className="text-slate-400 max-w-md text-sm mb-6">
                            This video format might not play in the browser.
                        </p>
                        <button 
                            onClick={onClose}
                            className="w-full max-w-xs py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700"
                        >
                            Close
                        </button>
                    </div>
                )}

                {!error && (
                    <div className="relative w-full h-full flex flex-col justify-center">
                        <video
                            ref={videoRef}
                            className="w-full max-h-full max-w-6xl aspect-video bg-black focus:outline-none mx-auto"
                            controls
                            autoPlay
                            src={webSrc}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPause={saveProgress}
                            onError={(e) => {
                                console.error("Video Error:", e);
                                setIsLoading(false);
                                setError("Video failed to play.");
                            }}
                        >
                        Your browser does not support the video tag.
                        </video>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default VideoPlayer;