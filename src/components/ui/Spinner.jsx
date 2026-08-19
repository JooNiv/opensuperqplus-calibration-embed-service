import React from 'react';

// Replacement for CSC UI's CSpinner (see .spinner in global.css).
export const Spinner = ({ size = 24, width = 2, className = '' }) => (
    <span
        role="status"
        aria-label="Loading"
        className={`spinner ${className}`}
        style={{ width: size, height: size, borderWidth: width }}
    />
);
