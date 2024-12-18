import { useEffect, useRef } from 'react';

interface VideoStreamProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export const VideoStream = ({ stream, muted = false, className = '' }: VideoStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full rounded-lg border ${className}`}
    />
  );
};