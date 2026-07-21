import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUrls';

type MealPhotoViewerProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
};

type Transform = { scale: number; x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Contained pinch/pan surface — does not zoom the page. */
function ZoomSurface({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startMid: { x: number; y: number };
    origin: Transform;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const gestureMovedRef = useRef(false);
  const lastTapRef = useRef(0);

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheelNative(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setTransform((t) => {
        const nextScale = clamp(t.scale + delta, MIN_SCALE, MAX_SCALE);
        if (nextScale <= 1) return { scale: 1, x: 0, y: 0 };
        return { ...t, scale: nextScale };
      });
    }
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length === 2) {
      gestureMovedRef.current = true;
      panRef.current = null;
      const [a, b] = points;
      pinchRef.current = {
        startDist: distance(a, b),
        startScale: transformRef.current.scale,
        startMid: midpoint(a, b),
        origin: { ...transformRef.current },
      };
      return;
    }

    if (points.length === 1) {
      gestureMovedRef.current = false;
      if (transformRef.current.scale > 1) {
        pinchRef.current = null;
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          originX: transformRef.current.x,
          originY: transformRef.current.y,
        };
      }
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const points = [...pointersRef.current.values()];

    if (points.length >= 2 && pinchRef.current) {
      gestureMovedRef.current = true;
      const [a, b] = points;
      const dist = distance(a, b);
      const mid = midpoint(a, b);
      const { startDist, startScale, startMid, origin } = pinchRef.current;
      if (startDist <= 0) return;

      const nextScale = clamp(startScale * (dist / startDist), MIN_SCALE, MAX_SCALE);
      const dx = mid.x - startMid.x;
      const dy = mid.y - startMid.y;
      const adjustedX = origin.x * (nextScale / origin.scale) + dx;
      const adjustedY = origin.y * (nextScale / origin.scale) + dy;

      setTransform({
        scale: nextScale,
        x: nextScale <= 1 ? 0 : adjustedX,
        y: nextScale <= 1 ? 0 : adjustedY,
      });
      return;
    }

    if (points.length === 1 && panRef.current && transformRef.current.scale > 1) {
      const { startX, startY, originX, originY } = panRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 6) gestureMovedRef.current = true;
      setTransform((t) => ({
        ...t,
        x: originX + dx,
        y: originY + dy,
      }));
    }
  }, []);

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 0) {
        panRef.current = null;
        if (transformRef.current.scale <= 1.02) {
          setTransform({ scale: 1, x: 0, y: 0 });
        }
        if (e.pointerType === 'touch' && !gestureMovedRef.current) {
          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            if (transformRef.current.scale > 1) reset();
            else setTransform({ scale: 2, x: 0, y: 0 });
            lastTapRef.current = 0;
          } else {
            lastTapRef.current = now;
          }
        }
        gestureMovedRef.current = false;
      } else if (pointersRef.current.size === 1 && transformRef.current.scale > 1) {
        const remaining = [...pointersRef.current.entries()][0];
        if (remaining) {
          panRef.current = {
            startX: remaining[1].x,
            startY: remaining[1].y,
            originX: transformRef.current.x,
            originY: transformRef.current.y,
          };
        }
      }
    },
    [reset],
  );

  return (
    <div
      ref={viewportRef}
      className={cn(
        'relative touch-none overscroll-contain overflow-hidden',
        className,
      )}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={(e) => {
        e.preventDefault();
        if (transformRef.current.scale > 1) reset();
        else setTransform({ scale: 2, x: 0, y: 0 });
      }}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn(
          'pointer-events-none select-none will-change-transform',
          imgClassName,
        )}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      />
      {transform.scale > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="absolute bottom-3 left-3 z-10 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/70">
          Reset zoom
        </button>
      ) : (
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-medium text-white/90">
          Pinch to zoom
        </span>
      )}
    </div>
  );
}

/** Left-rail meal photo: contained pinch/pan zoom; optional fullscreen lightbox. */
export function MealPhotoViewer({ imageUrl, alt, className }: MealPhotoViewerProps) {
  const src = resolveMediaUrl(imageUrl);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
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
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ash-grey-900"
                onClick={close}>
                Close
              </button>
            </div>
            <ZoomSurface
              src={src}
              alt={alt}
              className="relative z-[200] flex min-h-0 flex-1 items-center justify-center bg-black"
              imgClassName="max-h-[85vh] max-w-[95vw] object-contain"
            />
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
            Expand
          </button>
        </div>
        <ZoomSurface
          src={src}
          alt={alt}
          className="flex min-h-[320px] flex-1 items-center justify-center bg-ash-grey-950 p-3 xl:min-h-[420px]"
          imgClassName="max-h-[420px] w-full object-contain"
        />
      </div>
      {lightbox}
    </>
  );
}
