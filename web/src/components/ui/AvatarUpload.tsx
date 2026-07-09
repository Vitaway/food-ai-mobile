import { forwardRef, useImperativeHandle, useRef } from 'react';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { cn } from '@/lib/utils';

export type AvatarUploadHandle = {
  openPicker: () => void;
};

type AvatarUploadProps = {
  name: string;
  imageUrl?: string;
  onChange?: (dataUrl: string) => void;
  onFileSelect?: (file: File) => void;
  size?: 'lg' | 'md';
  /** When false, the image is display-only — use openPicker() from a separate button. */
  clickable?: boolean;
};

export const AvatarUpload = forwardRef<AvatarUploadHandle, AvatarUploadProps>(
  function AvatarUpload({ name, imageUrl, onChange, onFileSelect, size = 'lg', clickable = true }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dims = size === 'lg' ? 'h-32 w-32 sm:h-36 sm:w-36' : 'h-20 w-20';

    useImperativeHandle(ref, () => ({
      openPicker: () => inputRef.current?.click(),
    }));

    function handleFile(file: File) {
      if (!file.type.startsWith('image/')) return;
      if (onFileSelect) {
        onFileSelect(file);
        return;
      }
      if (!onChange) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') onChange(reader.result);
      };
      reader.readAsDataURL(file);
    }

    const displaySrc =
      imageUrl?.startsWith('blob:') || imageUrl?.startsWith('data:')
        ? imageUrl
        : resolveMediaUrl(imageUrl);

    const avatarContent = (
      <>
        {displaySrc ? (
          <img src={displaySrc} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-spruce-100 text-3xl font-bold text-blue-spruce-700 sm:text-4xl">
            {name.charAt(0)}
          </div>
        )}
        {clickable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-spruce-900/0 transition group-hover:bg-blue-spruce-900/40">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-blue-spruce-800 opacity-0 transition group-hover:opacity-100">
              Upload photo
            </span>
          </div>
        ) : null}
      </>
    );

    const className = cn(
      'relative shrink-0 overflow-hidden rounded-full border-4 border-white bg-ash-grey-100 shadow-md ring-1 ring-ash-grey-200',
      dims,
      clickable && 'group',
    );

    return (
      <div className="relative shrink-0">
        {clickable ? (
          <button type="button" onClick={() => inputRef.current?.click()} className={className}>
            {avatarContent}
          </button>
        ) : (
          <div className={className}>{avatarContent}</div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  },
);

export function NavbarAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const src = resolveMediaUrl(imageUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-10 w-10 rounded-full border-2 border-white/30 object-cover shadow-sm"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
      {name.charAt(0)}
    </span>
  );
}

export function UserAvatar({
  name,
  imageUrl,
  size = 'md',
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const src = resolveMediaUrl(imageUrl);
  const dims =
    size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', dims, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-blue-spruce-100 font-bold text-blue-spruce-800',
        dims,
        className,
      )}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
