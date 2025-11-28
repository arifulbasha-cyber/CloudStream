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
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const abortController = new AbortController();

    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        // We fetch the video content using the API to bypass auth issues with standard <video> tags
        // Note: This loads the file into a blob. For very large movies (>1GB), this might be memory intensive.
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to load video: ${response.statusText}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
        setIsLoading(false);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error(err);
            setError("Unable to load secure video stream. File might be too large or restricted.");
            setIsLoading(false);
        }
      }
    };

    fetchVideo();

    return () => {
      abortController.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      saveProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id, accessToken]);

  // Set initial time once src is loaded
  useEffect(() => {
      if (!isLoading && videoRef.current && initialProgress > 0) {
          videoRef.current.currentTime = initialProgress;
      }
  }, [isLoading, initialProgress]);

  const saveProgress = () => {
    if (videoRef.current) {
        onUpdateHistory(file.id, videoRef.current.currentTime, videoRef.current.duration || 0);
    }
  };

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
            <div className="flex flex-col items-center text-white">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Securely loading stream...</p>
                <p className="text-xs text-slate-400 mt-2">Large files may take a moment</p>
            </div>
        )}

        {error && (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg text-center max-w-md">
                <p className="font-bold mb-2">Playback Error</p>
                <p>{error}</p>
            </div>
        )}

      {videoSrc && (
        <video
          ref={videoRef}
          className="w-full max-h-full max-w-6xl aspect-video bg-black"
          controls
          autoPlay
          src={videoSrc}
          onPause={saveProgress}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default VideoPlayer;
