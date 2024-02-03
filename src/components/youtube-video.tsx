"use client";

import { useEffect, useRef, useState } from "react";

const YouTubeVideo = ({ videoId, className }: { videoId: string, className?: string }) => {
  const [ load, setLoad ] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoad(true);
        observer.disconnect();
      }
    });

    observer.observe(videoRef.current as Element);

    return () => {
      if (videoRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div ref={videoRef} className={className}>
      {load ? (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          className="border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

YouTubeVideo.displayName = "YouTube Video";

export { YouTubeVideo };

// <iframe width="560" height="315" src="https://www.youtube.com/embed/Evj1u4CFQqo?si=jq27uBWtV0XaCncM" title="YouTube
// video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope;
// picture-in-picture; web-share" allowfullscreen></iframe> <iframe width="560" height="315"
// src="https://www.youtube.com/embed/Evj1u4CFQqo?si=jq27uBWtV0XaCncM&amp;controls=0" title="YouTube video player"
// frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
// web-share" allowfullscreen></iframe>
