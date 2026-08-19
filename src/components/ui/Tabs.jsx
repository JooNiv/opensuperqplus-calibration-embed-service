import React, { createContext, useContext, useRef } from 'react';

// Minimal replacement for CSC UI's CTabs/CTab/CTabItems/CTabItem: a roving-tabindex
// tablist plus panels that render only while selected. Keeping inactive panels
// unmounted is deliberate — the layout and table tabs are expensive to build.
const TabsContext = createContext(null);

export const Tabs = ({ value, onChange, items, className = '', children }) => {
    const buttons = useRef({});

    const move = (offset) => {
        const index = items.findIndex(item => item.value === value);
        const next = items[(index + offset + items.length) % items.length];
        if (!next) return;
        onChange(next.value);
        buttons.current[next.value]?.focus();
    };

    const onKeyDown = (event) => {
        const actions = {
            ArrowRight: () => move(1),
            ArrowLeft: () => move(-1),
            Home: () => { onChange(items[0].value); buttons.current[items[0].value]?.focus(); },
            End: () => {
                const last = items[items.length - 1];
                onChange(last.value);
                buttons.current[last.value]?.focus();
            },
        };
        const action = actions[event.key];
        if (!action) return;
        event.preventDefault();
        action();
    };

    return (
        <div className={className}>
            <div role="tablist" onKeyDown={onKeyDown} className="flex gap-1 border-b border-line-1">
                {items.map((item) => {
                    const selected = item.value === value;
                    return (
                        <button
                            key={item.value}
                            ref={(el) => { buttons.current[item.value] = el; }}
                            type="button"
                            role="tab"
                            id={`tab-${item.value}`}
                            aria-selected={selected}
                            aria-controls={`panel-${item.value}`}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => onChange(item.value)}
                            className={`-mb-px border-b-2 px-4 py-2 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                                selected
                                    ? 'border-brand text-brand-darker'
                                    : 'border-transparent text-ink/60 hover:border-line-2 hover:text-ink'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
            <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
        </div>
    );
};

export const TabPanel = ({ value, className = '', children }) => {
    const active = useContext(TabsContext);
    if (active !== value) return null;
    return (
        <div role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} className={className}>
            {children}
        </div>
    );
};
