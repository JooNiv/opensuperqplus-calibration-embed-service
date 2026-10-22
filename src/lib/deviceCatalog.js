// Device catalog for the embed service (replaces the FiQCI site's Jekyll constants.yml).
//
// The catalog key is the canonical join key across four namespaces:
//   - the route segment            /embed/<key>
//   - the QC_LAYOUTS entry key     QC_LAYOUTS[<key>]
//   - the FiQCI API path segment   /device/<key>/calibration
//   - DEVICE_METRICS               resolved from device_id (case-insensitively)
//
// `source` selects the backend adapter in src/lib/sources/.

export const DEVICE_CATALOG = {
    q50: {
        slug: 'q50',
        device_id: 'Q50',
        source: 'fiqci',
        name: 'VTT Q50',
        qubits: 53,
        basis: 'PRX, CZ',
        topology: 'Square grid',
    },
    tuna9: {
        slug: 'tuna9',
        device_id: 'TUNA9',
        source: 'quantuminspire',
        backend_type_id: 6,
        name: 'Delft Tuna-9',
        qubits: 9,
        basis: "Rx, X, X90, mX90, Ry, Y, Y90, mY90, Rz, Z, S, T, Sdag, Tdag, H, CZ",
        topology: 'Diamond',
    },
    tuna17: {
        slug: 'tuna17',
        device_id: 'TUNA17',
        source: 'quantuminspire',
        backend_type_id: 7,
        name: 'Delft Tuna-17',
        qubits: 17,
        basis: "Rx, X, X90, mX90, Ry, Y, Y90, mY90, Rz, Z, S, T, Sdag, Tdag, H, CZ",
        topology: 'Ninja star',
    },
};


export const DEVICE_SLUGS = Object.keys(DEVICE_CATALOG);

export const getDevice = (slug) => DEVICE_CATALOG[String(slug).toLowerCase()] || null;
