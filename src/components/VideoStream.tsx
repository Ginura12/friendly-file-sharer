import { useEffect, useRef } from "react";

interface VideoStreamProps {
  stream: MediaStream;
  muted?: boolean;
  className?: string;
}

export const VideoStream = ({ stream, muted = false, className = "" }: VideoStreamProps) => {
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
      className={`w-full h-full min-h-[300px] object-cover rounded-lg border border-gray-200 ${className}`}
    />
  );
};