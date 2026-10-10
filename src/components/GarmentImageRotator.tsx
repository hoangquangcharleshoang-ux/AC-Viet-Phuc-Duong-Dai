import React, { useState, useEffect, useRef } from 'react';

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
  const [slotA, setSlotA] = useState<string>(() => (images && images[0] ? images[0] : ''));
  const [slotB, setSlotB] = useState<string>(() => (images && images[1] ? images[1] : (images && images[0] ? images[0] : '')));
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  const indexRef = useRef<number>(0);
  const activeSlotRef = useRef<'A' | 'B'>('A');

  // Preload all image assets
  useEffect(() => {
    if (!images) return;
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Sync state if images array changes completely
  useEffect(() => {
    if (!images || images.length === 0) return;
    indexRef.current = 0;
    activeSlotRef.current = 'A';
    setSlotA(images[0]);
    setSlotB(images[1] || images[0]);
    setActiveSlot('A');
  }, [images]);

  // Rotation cycle timer using persistent two-slot crossfade
  useEffect(() => {
    if (!images || images.length <= 1) return;

    let raf1: number | null = null;
    let raf2: number | null = null;

    const timer = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % images.length;
      indexRef.current = nextIndex;
      const nextSrc = images[nextIndex];

      if (activeSlotRef.current === 'A') {
        // Set hidden slot B src to upcoming image
        setSlotB(nextSrc);
        // Ensure browser paints slot B with opacity 0 before initiating opacity crossfade
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            activeSlotRef.current = 'B';
            setActiveSlot('B');
          });
        });
      } else {
        // Set hidden slot A src to upcoming image
        setSlotA(nextSrc);
        // Ensure browser paints slot A with opacity 0 before initiating opacity crossfade
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            activeSlotRef.current = 'A';
            setActiveSlot('A');
          });
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [images, intervalMs]);

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

  const slotAStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: activeSlot === 'A' ? 1 : 0,
    transition: 'opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'none'
  };

  const slotBStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: activeSlot === 'B' ? 1 : 0,
    transition: 'opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'none'
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-100/50">
      {/* Persistent Slot A */}
      <img
        src={slotA}
        alt={alt}
        style={slotAStyle}
        className={`${className} motion-reduce:!transition-opacity motion-reduce:!duration-200`}
      />

      {/* Persistent Slot B */}
      <img
        src={slotB}
        alt={alt}
        style={slotBStyle}
        className={`${className} motion-reduce:!transition-opacity motion-reduce:!duration-200`}
      />
    </div>
  );
};
