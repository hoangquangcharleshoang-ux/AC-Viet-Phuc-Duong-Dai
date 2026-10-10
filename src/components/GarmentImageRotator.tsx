/**
 * AC — GarmentImageRotator
 * Premium ambient image rotator for garment catalog cards
 * Features:
 * - Two overlapping image layers for true soft morph / dissolve
 * - Easing: cubic-bezier(0.22, 1, 0.36, 1) over 1000ms
 * - Scale & subtle blur transition for incoming/outgoing frames
 * - Zero cumulative layout shift (CLS)
 * - Timer & transition cleanup on unmount
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

  // Preload all images on mount & change
  useEffect(() => {
    if (!images) return;
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Interval timer for soft morph rotation
  useEffect(() => {
    if (!images || images.length <= 1) return;

    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setInterval(() => {
      const upcoming = (currentIndex + 1) % images.length;
      setNextIndex(upcoming);

      // Trigger soft morph transition
      setIsTransitioning(true);

      // Finalize after 1000ms soft morph completes
      transitionTimer = setTimeout(() => {
        setCurrentIndex(upcoming);
        setIsTransitioning(false);
      }, 1000);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (transitionTimer) clearTimeout(transitionTimer);
    };
  }, [images, currentIndex, intervalMs]);

  // Static fallback if no images or single image
  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-stone-100/50">
        <img
          src={images[0]}
          alt={alt}
          className={className}
          loading="lazy"
        />
      </div>
    );
  }

  const currentSrc = images[currentIndex];
  const upcomingSrc = images[nextIndex];

  // Soft Morph Easing & Transformations
  const softMorphStyleOutgoing: React.CSSProperties = isTransitioning
    ? {
        opacity: 0,
        transform: 'scale(1.02)',
        filter: 'blur(2px)',
        transition: 'all 1000ms cubic-bezier(0.22, 1, 0.36, 1)'
      }
    : {
        opacity: 1,
        transform: 'scale(1)',
        filter: 'blur(0px)',
        transition: 'all 1000ms cubic-bezier(0.22, 1, 0.36, 1)'
      };

  const softMorphStyleIncoming: React.CSSProperties = isTransitioning
    ? {
        opacity: 1,
        transform: 'scale(1)',
        filter: 'blur(0px)',
        transition: 'all 1000ms cubic-bezier(0.22, 1, 0.36, 1)'
      }
    : {
        opacity: 0,
        transform: 'scale(1.025)',
        filter: 'blur(3px)',
        transition: 'all 1000ms cubic-bezier(0.22, 1, 0.36, 1)'
      };

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100/50">
      {/* Base Outgoing Image Layer */}
      <img
        src={currentSrc}
        alt={alt}
        style={softMorphStyleOutgoing}
        className={`absolute inset-0 ${className} motion-reduce:!transition-opacity motion-reduce:!duration-300 motion-reduce:!transform-none motion-reduce:!filter-none`}
      />

      {/* Overlapping Incoming Image Layer */}
      {isTransitioning && (
        <img
          src={upcomingSrc}
          alt={alt}
          style={softMorphStyleIncoming}
          className={`absolute inset-0 ${className} motion-reduce:!transition-opacity motion-reduce:!duration-300 motion-reduce:!transform-none motion-reduce:!filter-none`}
        />
      )}
    </div>
  );
};
