import React from 'react';

// Replacement for CSC UI's CButton, with only the variants this app uses.
const VARIANTS = {
    filled: 'bg-brand text-white hover:bg-brand-dark disabled:bg-line-2 disabled:text-ink/50',
    text: 'bg-transparent text-brand-darker hover:bg-brand/10 disabled:text-ink/40',
};

const SIZES = {
    sm: 'px-3 py-1 text-[14px]',
    md: 'px-4 py-2 text-[15px]',
};

export const Button = ({
    onClick,
    disabled = false,
    size = 'md',
    variant = 'filled',
    type = 'button',
    className = '',
    children,
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`rounded-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${SIZES[size] || SIZES.md} ${VARIANTS[variant] || VARIANTS.filled} ${className}`}
    >
        {children}
    </button>
);
