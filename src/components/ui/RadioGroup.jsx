import React from 'react';

// Replacement for CSC UI's CRadioGroup in `returnObject` mode: `value` is the
// selected item object and onChange receives the whole item, so callers compare
// on `.value`.
export const RadioGroup = ({ items = [], value, onChange, legend, inline = false, className = '' }) => (
    <fieldset className={className}>
        {legend && <legend className="sr-only">{legend}</legend>}
        <div className={`flex ${inline ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
            {items.map(item => (
                <label key={item.value} className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
                    <input
                        type="radio"
                        name={legend || 'radio-group'}
                        value={item.value}
                        checked={value?.value === item.value}
                        onChange={() => onChange(item)}
                        className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    <span>{item.name}</span>
                </label>
            ))}
        </div>
    </fieldset>
);
