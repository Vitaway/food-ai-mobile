type IconProps = {
  className?: string;
};

function IconShell({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      {children}
    </svg>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Compact glyphs for dashboard row actions — no icon package. */
export function CheckIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M20 6L9 17l-5-5" {...stroke} />
    </IconShell>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M18 6L6 18M6 6l12 12" {...stroke} />
    </IconShell>
  );
}

export function BanIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M5.2 5.2l13.6 13.6" {...stroke} />
    </IconShell>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" {...stroke} />
      <path d="M21 3v6h-6" {...stroke} />
    </IconShell>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M3 7h18v3H3z" {...stroke} />
      <path d="M5 10v9h14v-9" {...stroke} />
      <path d="M10 14h4" {...stroke} />
    </IconShell>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M12 20h9" {...stroke} />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" {...stroke} />
    </IconShell>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </IconShell>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" {...stroke} />
    </IconShell>
  );
}

export function PrintIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M6 9V3h12v6" {...stroke} />
      <path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" {...stroke} />
      <path d="M6 13h12v8H6z" {...stroke} />
    </IconShell>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M8 2v3M16 2v3M4 9h16" {...stroke} />
      <path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...stroke} />
    </IconShell>
  );
}

export function FilePdfIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...stroke} />
      <path d="M14 2v6h6" {...stroke} />
      <path d="M10 13h1.5a1.5 1.5 0 0 1 0 3H10v2M14.5 13v5M14.5 15.5H17" {...stroke} />
    </IconShell>
  );
}

export function FileSpreadsheetIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...stroke} />
      <path d="M14 2v6h6M8 13h8M8 17h8M12 13v4" {...stroke} />
    </IconShell>
  );
}
