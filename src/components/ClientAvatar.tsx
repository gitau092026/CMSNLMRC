import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchImage } from '@/lib/clientCache';

// Set of URLs that have already successfully loaded in this browser session
const sessionLoadedUrls = new Set<string>();

interface ClientAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  sizeClassName?: string;
  iconClassName?: string;
  priority?: boolean;
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({
  src,
  alt = 'Client Avatar',
  className = '',
  sizeClassName = 'h-32 w-32 md:h-40 md:w-40',
  iconClassName = 'h-16 w-16 text-primary',
  priority = true,
}) => {
  const isAlreadyLoaded = Boolean(src && sessionLoadedUrls.has(src));
  const [loaded, setLoaded] = useState<boolean>(isAlreadyLoaded);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setLoaded(false);
      setError(false);
      return;
    }

    if (sessionLoadedUrls.has(src)) {
      setLoaded(true);
      setError(false);
      return;
    }

    // Prefetch proactively
    prefetchImage(src);

    // Test load
    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      sessionLoadedUrls.add(src);
      setLoaded(true);
      setError(false);
    } else {
      img.onload = () => {
        sessionLoadedUrls.add(src);
        setLoaded(true);
        setError(false);
      };
      img.onerror = () => {
        setError(true);
        setLoaded(false);
      };
    }
  }, [src]);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border-4 border-primary/40 shadow-2xl ring-4 ring-primary/20 bg-primary/10 flex items-center justify-center select-none',
        sizeClassName,
        className
      )}
    >
      {/* Fallback Icon / Placeholder */}
      {(!src || error || !loaded) && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-primary/10 transition-opacity duration-200',
            loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <User className={iconClassName} />
        </div>
      )}

      {/* Instant Native Image */}
      {src && !error && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          // @ts-ignore
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => {
            sessionLoadedUrls.add(src);
            setLoaded(true);
          }}
          onError={() => {
            setError(true);
            setLoaded(false);
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
};
