import React from 'react';

// Replacement for CSC UI's CSwitch. Emits the new boolean, where CSwitch emitted
// it on e.detail.
export const Switch = ({ checked, onChange, children, className = '' }) => (
    <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-2 text-[14px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
    >
        <span
            aria-hidden="true"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line-3'}`}
        >
            <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`}
            />
        </span>
        <span>{children}</span>
    </button>
);
