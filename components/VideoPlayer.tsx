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

  // API Endpoint with acknowledgeAbuse for Desktop
  const streamSrc = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}&acknowledgeAbuse=true`;

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
      return () => {
          saveProgress();
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
                    saveProgress();
                    onClose();
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors pointer-events-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* --- DESKTOP PLAYER --- */}
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
                <p className="text-white text-lg font-medium mb-2">Video Error</p>
                <p className="text-slate-400 max-w-md text-sm mb-6">
                    {error}
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
                    src={streamSrc}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPause={saveProgress}
                    onError={(e) => {
                        console.error("Video Error:", e);
                        setIsLoading(false);
                        setError("Video failed to play in browser.");
                    }}
                >
                Your browser does not support the video tag.
                </video>
            </div>
        )}
    </div>
  );
};

export default VideoPlayer;