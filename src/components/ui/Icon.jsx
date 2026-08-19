import React from 'react';

// Replacement for CSC UI's CIcon. `path` is an SVG path `d` string; the one icon
// this app uses is inlined below so @mdi/js is not a dependency.
export const Icon = ({ path, title, size = 20, className = '' }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : 'true'}
        className={className}
    >
        {title && <title>{title}</title>}
        <path d={path} fill="currentColor" />
    </svg>
);

// mdiHelpCircleOutline
export const HELP_CIRCLE_OUTLINE = 'M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,11.5 11,11.75 11,14H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z';
