import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

const VideoPlayer = ({ src, poster, className }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    // If HLS (.m3u8) and browser supports MediaSource
    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
    } else {
      // Regular MP4 or other sources
      video.src = src;
    }

    const player = new Plyr(video, {
      controls: [
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'fullscreen',
      ],
      settings: ['quality'],
    });

    // Map HLS qualities to Plyr quality menu (only for HLS)
    if (hls) {
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls?.levels || [];
        const availableQualities = levels
          .map((l) => l.height)
          .filter((v, i, self) => v && self.indexOf(v) === i)
          .sort((a, b) => a - b);

        if (!availableQualities.length) return;

        player.quality = {
          default: Math.max(...availableQualities),
          options: availableQualities,
          forced: true,
          onChange: (newQuality: number) => {
            if (!hls) return;
            const levelIndex = hls.levels.findIndex((level) => level.height === newQuality);
            if (levelIndex !== -1) {
              hls.currentLevel = levelIndex;
            }
          },
        };
      });
    }

    return () => {
      player.destroy();
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline
      controls
      poster={poster}
    />
  );
};

export default VideoPlayer;

