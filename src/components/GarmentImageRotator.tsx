/**
 * AC — GarmentImageRotator
 * Premium ambient image rotator for garment catalog cards
 * Features:
 * - Configurable interval (default 5000ms)
 * - Premium crossfade transition (opacity 600ms, subtle scale 1.015 -> 1)
 * - Zero cumulative layout shift (CLS)
 * - Timer cleanup on unmount
 * - Preloading of upcoming image assets
 * - prefers-reduced-motion compliance
 */

import React, { useState, useEffect } from 'react';

interface GarmentImageRotatorProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  className?: string;
}

export const GarmentImageRotator: React.FC<GarmentImageRotatorProps> = ({
  images,
  alt,
  intervalMs = 5000,
  className = 'w-full h-full object-cover object-center'
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [nextIndex, setNextIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // If 0 or 1 image, render static image
  if (!images || images.length <= 1) {
    const singleSrc = images && images.length === 1 ? images[0] : '';
    return (
      <img
        src={singleSrc}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  // Preload all images on mount
  useEffect(() => {
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Interval timer for rotation
  useEffect(() => {
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setInterval(() => {
      const upcoming = (currentIndex + 1) % images.length;
      setNextIndex(upcoming);
      setIsTransitioning(true);

      transitionTimer = setTimeout(() => {
        setCurrentIndex(upcoming);
        setIsTransitioning(false);
      }, 600);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (transitionTimer) clearTimeout(transitionTimer);
    };
  }, [images, currentIndex, intervalMs]);

  const currentSrc = images[currentIndex];
  const upcomingSrc = images[nextIndex];

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100/50">
      {/* Current Base Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} transition-all duration-600 ease-out ${
          isTransitioning ? 'opacity-0 scale-100' : 'opacity-100 scale-[1.015]'
        } motion-reduce:transition-none motion-reduce:transform-none`}
      />

      {/* Crossfading Next Image */}
      {isTransitioning && (
        <img
          src={upcomingSrc}
          alt={alt}
          className={`absolute inset-0 ${className} transition-all duration-600 ease-out ${
            isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.015]'
          } motion-reduce:transition-none motion-reduce:transform-none`}
        />
      )}
    </div>
  );
};
