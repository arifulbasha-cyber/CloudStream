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

  // We construct a direct stream URL using the Drive API endpoint and the access token.
  // added &acknowledgeAbuse=true to bypass the virus scan warning for large files which blocks playback.
  const videoSrc = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}&acknowledgeAbuse=true`;

  // Android Intent URL for MX Player or other external players
  // Format: intent:{url}#Intent;type={mimeType};S.title={title};end
  const isAndroid = /Android/i.test(navigator.userAgent);
  const intentUrl = `intent:${videoSrc}#Intent;type=${file.mimeType};S.title=${encodeURIComponent(file.name)};end`;

  // Set initial time once metadata is loaded
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

  useEffect(() => {
      // Cleanup on unmount
      return () => {
          saveProgress();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
            <h2 className="text-white font-medium truncate pr-4 text-sm md:text-base">{file.name}</h2>
            <button 
                onClick={() => {
                    saveProgress();
                    onClose();
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-white text-lg font-medium mb-2">Playback Error</p>
                <p className="text-slate-400 max-w-md text-sm">{error}</p>
                <div className="flex space-x-4 mt-6">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
                    >
                        Close
                    </button>
                    {isAndroid && (
                         <a 
                            href={intentUrl}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            <span>Open in MX Player</span>
                        </a>
                    )}
                </div>
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
                        setError("Unable to play in browser. Large files or specific formats (MKV, AVI) often fail in browsers.");
                    }}
                >
                Your browser does not support the video tag.
                </video>
                
                {/* External Player FAB for Android */}
                {isAndroid && !isLoading && (
                    <a 
                        href={intentUrl}
                        className="absolute bottom-20 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-black/50 flex items-center space-x-2 z-20"
                        title="Open in External Player"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        <span className="font-medium text-sm">External Player</span>
                    </a>
                )}
            </div>
        )}
    </div>
  );
};

export default VideoPlayer;