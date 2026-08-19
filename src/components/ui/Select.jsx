import React from 'react';

// Replacement for CSC UI's CSelect/COption. A native <select> keeps the
// per-option `title` tooltips (which carry the metric abbreviations) and gets
// keyboard behaviour and mobile pickers for free.
export const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Choose an option',
    className = '',
    label,
    id,
}) => (
    <select
        id={id}
        aria-label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-sm border border-line-2 bg-bg px-2 py-1.5 text-[14px] text-ink focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${className}`}
    >
        {/* Selecting this clears the metric — CSelect's `clearable` equivalent. */}
        <option value="">{placeholder}</option>
        {options.map(option => (
            <option key={option.value} value={option.value} title={option.title}>
                {option.name}
            </option>
        ))}
    </select>
);
