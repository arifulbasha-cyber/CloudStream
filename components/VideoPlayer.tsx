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

  // We construct a direct stream URL using the Drive API endpoint and the access token.
  // This allows the browser to handle range requests (streaming) natively, 
  // so playback starts almost instantly.
  const videoSrc = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}`;

  // Set initial time once metadata is loaded
  const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (videoRef.current && initialProgress > 0) {
          videoRef.current.currentTime = initialProgress;
      }
  };

  const saveProgress = () => {
    if (videoRef.current) {
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
            <h2 className="text-white font-medium truncate pr-4">{file.name}</h2>
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

        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}

        <video
          ref={videoRef}
          className="w-full max-h-full max-w-6xl aspect-video bg-black focus:outline-none"
          controls
          autoPlay
          src={videoSrc}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={saveProgress}
          onError={(e) => console.error("Video Error:", e)}
        >
          Your browser does not support the video tag.
        </video>
    </div>
  );
};

export default VideoPlayer;