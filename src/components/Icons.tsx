// Small inline icons (no icon library needed).
type P = { size?: number; className?: string };
const base = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const IconCheck = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconX = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconArrowRight = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconArrowLeft = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const IconChevronLeft = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M15 6l-6 6 6 6" /></svg>);
export const IconChevronRight = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M9 6l6 6-6 6" /></svg>);
export const IconDoubleLeft = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M11 6l-6 6 6 6M19 6l-6 6 6 6" /></svg>);
export const IconDoubleRight = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M5 6l6 6-6 6M13 6l6 6-6 6" /></svg>);
export const IconLock = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>);
export const IconPlay = ({ size, className }: P) => (<svg {...base(size)} className={className} fill="currentColor" stroke="none"><path d="M8 5.5v13l10.5-6.5z" /></svg>);
export const IconHome = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5" /></svg>);
export const IconBulb = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0012 3z" /></svg>);
export const IconClock = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2.5h6" /></svg>);
export const IconInfo = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5v.01" /></svg>);
export const IconPencil = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>);
export const IconCaret = ({ size, className }: P) => (<svg {...base(size)} className={className} fill="currentColor" stroke="none"><path d="M6 9h12l-6 7z" /></svg>);
export const IconFlame = ({ size, className }: P) => (
  <svg width={size ?? 18} height={size ?? 18} viewBox="0 0 24 24" aria-hidden className={className}>
    <path d="M12 2.5c.6 3-1.2 4.6-2.6 6.2C7.9 10.4 6.5 12.2 6.5 15a5.5 5.5 0 0011 0c0-2.2-1-3.9-2.1-5.2-.2 1.3-.9 2.3-1.9 2.7.5-3.6-.6-7.4-1.5-10z" fill="#ff7a1a" />
    <path d="M12 21a3.2 3.2 0 01-3.2-3.2c0-1.7 1.2-2.7 2.1-3.8.4 1 .9 1.6 1.6 1.9.1-.9.6-1.6 1.1-2 .9 1 1.6 2.3 1.6 3.9A3.2 3.2 0 0112 21z" fill="#ffc94d" />
  </svg>
);
