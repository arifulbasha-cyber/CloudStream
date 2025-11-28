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

  // Direct stream URL with abuse acknowledgment
  const videoSrc = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}&acknowledgeAbuse=true`;

  // Android Intent URL for MX Player or other external players
  // This explicitly asks for type=video/* and passes the title
  const intentUrl = `intent:${videoSrc}#Intent;type=${file.mimeType || 'video/*'};S.title=${encodeURIComponent(file.name)};end`;
  
  const isAndroid = /Android/i.test(navigator.userAgent);

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

  // On Android, we just want to update the history "as if" they watched it, 
  // since we can't track external player progress easily.
  useEffect(() => {
      if (isAndroid) {
          onUpdateHistory(file.id, 0, 0); // Mark as accessed
          setIsLoading(false); // Stop spinner immediately so UI is visible
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
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-sm w-full">
                <div className="w-24 h-24 bg-blue-900/50 rounded-2xl flex items-center justify-center border border-blue-500/30">
                     <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Open Video</h3>
                    <p className="text-slate-400 text-sm">Choose an external player for the best experience.</p>
                </div>

                <a 
                    href={intentUrl}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 font-bold text-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <span>Play in MX Player</span>
                </a>

                <div className="text-xs text-slate-500">
                    If MX Player is not installed, you can try opening in browser below.
                </div>

                <button 
                   onClick={() => window.open(videoSrc, '_blank')}
                   className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
                >
                    Open in Browser / Download
                </button>
            </div>
        ) : (
            /* --- DESKTOP PLAYER --- */
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
                            src={videoSrc}
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