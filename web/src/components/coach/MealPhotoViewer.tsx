import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUrls';

type MealPhotoViewerProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
};

/** Left-rail meal photo: full image visible (contain), click to zoom in a body-level lightbox. */
export function MealPhotoViewer({ imageUrl, alt, className }: MealPhotoViewerProps) {
  const src = resolveMediaUrl(imageUrl);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const close = useCallback(() => {
    setOpen(false);
    setZoom(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z + 0.25));
      if (e.key === '-') setZoom((z) => Math.max(1, z - 0.25));
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!src) {
    return (
      <div
        className={cn(
          'flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-ash-grey-200 bg-ash-grey-100 px-4 text-center',
          className,
        )}>
        <p className="text-sm font-medium text-ash-grey-700">No meal photo</p>
        <p className="mt-1 max-w-xs text-xs text-ash-grey-500">
          Ask the patient to open MiraFood — photos sync on launch.
        </p>
      </div>
    );
  }

  const lightbox =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-black"
            role="dialog"
            aria-modal
            aria-label="Meal photo zoom">
            <div className="relative z-[201] flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{alt}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>
                  −
                </button>
                <span className="min-w-[3rem] text-center text-sm text-white/80">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>
                  +
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ash-grey-900"
                  onClick={close}>
                  Close
                </button>
              </div>
            </div>
            <div
              className="relative z-[200] flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
              onClick={close}
              onWheel={(e) => {
                e.preventDefault();
                setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.15 : -0.15))));
              }}>
              <img
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-[95vw] origin-center object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border border-ash-grey-200 bg-ash-grey-900',
          className,
        )}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <p className="text-xs font-medium text-white/80">Meal photo</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/20">
            Zoom
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex min-h-[320px] flex-1 items-center justify-center bg-ash-grey-950 p-3 outline-none xl:min-h-[420px]"
          aria-label="Open meal photo zoom">
          <img
            src={src}
            alt={alt}
            className="max-h-[420px] w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Click to zoom
          </span>
        </button>
      </div>
      {lightbox}
    </>
  );
}
