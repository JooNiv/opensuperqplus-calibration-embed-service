// Layout data for quantum computer topology maps.
//
// To add a new QC: add one entry to QC_LAYOUTS keyed by the device catalog slug
// (== the lowercased device_id), with { spacing, nodes, edges }. No new component
// or call-site change is needed.
//
// Two topology shapes are supported:
//   1. Lattice  — qubits coupled directly to neighbouring qubits. `edges` is a list
//      of [qubitA, qubitB] pairs.
//   2. Star     — every qubit couples to a single central resonator providing
//      one-to-all connectivity. Add a `resonator` descriptor and make each edge a
//      [qubit, resonator.id] pair. The resonator renders as a central bar and each
//      edge as a coupler from its qubit to that bar.
//
// Nodes are positioned on a diagonal grid: coupled neighbours differ by (±1, ±1),
// and QcLayout draws nodes as 45°-rotated diamonds, so the lattice reads as a
// square grid on screen. `grid(xOrigin, yOrigin, spacing)` returns a helper
// `(id, col, row) => { id, x, y }` so coordinates read as grid offsets instead of
// repeated `xOrigin + spacing * N` arithmetic. `y` is up-positive (QcLayout negates
// it when drawing), so rows go negative downwards.
//
// A node's `id` must match its calibration key exactly (QB1, QB2, …).

const grid = (xOrigin, yOrigin, spacing) => (id, col, row) => ({
    id,
    x: xOrigin + spacing * col,
    y: yOrigin + spacing * row,
});

// --- Q50 (VTT, 54-site square grid) ------------------------------------------
const q50Spacing = 100;
const q50 = grid(-210, 440, q50Spacing);
const q50Nodes = [
    // Row 1 (3 qubits)
    q50('QB54', 0, 0), q50('QB53', -1, -1), q50('QB52', -2, -2),
    // Row 2 (5 qubits)
    q50('QB51', 2, 0), q50('QB50', 1, -1), q50('QB49', 0, -2), q50('QB48', -1, -3), q50('QB47', -2, -4),
    // Row 3 (7 qubits)
    q50('QB46', 4, 0), q50('QB45', 3, -1), q50('QB44', 2, -2), q50('QB43', 1, -3), q50('QB42', 0, -4), q50('QB41', -1, -5), q50('QB40', -2, -6),
    // Row 4 (8 qubits)
    q50('QB39', 6, 0), q50('QB38', 5, -1), q50('QB37', 4, -2), q50('QB36', 3, -3), q50('QB35', 2, -4), q50('QB34', 1, -5), q50('QB33', 0, -6), q50('QB32', -1, -7),
    // Row 5 (9 qubits)
    q50('QB31', 7, -1), q50('QB30', 6, -2), q50('QB29', 5, -3), q50('QB28', 4, -4), q50('QB27', 3, -5), q50('QB26', 2, -6), q50('QB25', 1, -7), q50('QB24', 0, -8), q50('QB23', -1, -9),
    // Row 6 (8 qubits)
    q50('QB22', 7, -3), q50('QB21', 6, -4), q50('QB20', 5, -5), q50('QB19', 4, -6), q50('QB18', 3, -7), q50('QB17', 2, -8), q50('QB16', 1, -9), q50('QB15', 0, -10),
    // Row 7 (7 qubits)
    q50('QB14', 8, -4), q50('QB13', 7, -5), q50('QB12', 6, -6), q50('QB11', 5, -7), q50('QB10', 4, -8), q50('QB9', 3, -9), q50('QB8', 2, -10),
    // Row 8 (5 qubits)
    q50('QB7', 8, -6), q50('QB6', 7, -7), q50('QB5', 6, -8), q50('QB4', 5, -9), q50('QB3', 4, -10),
    // Row 9 (2 qubits)
    q50('QB2', 8, -8), q50('QB1', 7, -9),
];
const q50Edges = [
    // Row 1 connections
    ['QB54', 'QB53'], ['QB53', 'QB52'], ['QB54', 'QB50'], ['QB53', 'QB49'], ['QB52', 'QB48'],
    // Row 2 connections
    ['QB51', 'QB50'], ['QB50', 'QB49'], ['QB49', 'QB48'], ['QB48', 'QB47'],
    ['QB51', 'QB45'], ['QB50', 'QB44'], ['QB49', 'QB43'], ['QB48', 'QB42'], ['QB47', 'QB41'],
    // Row 3 connections
    ['QB46', 'QB45'], ['QB45', 'QB44'], ['QB44', 'QB43'], ['QB43', 'QB42'], ['QB42', 'QB41'], ['QB41', 'QB40'],
    ['QB46', 'QB38'], ['QB45', 'QB37'], ['QB44', 'QB36'], ['QB43', 'QB35'], ['QB42', 'QB34'], ['QB41', 'QB33'], ['QB40', 'QB32'],
    // Row 4 connections
    ['QB39', 'QB38'], ['QB38', 'QB37'], ['QB37', 'QB36'], ['QB36', 'QB35'], ['QB35', 'QB34'], ['QB34', 'QB33'], ['QB33', 'QB32'],
    ['QB39', 'QB31'], ['QB38', 'QB30'], ['QB37', 'QB29'], ['QB36', 'QB28'], ['QB35', 'QB27'], ['QB34', 'QB26'], ['QB33', 'QB25'], ['QB32', 'QB24'],
    // Row 5 connections
    ['QB31', 'QB30'], ['QB30', 'QB29'], ['QB29', 'QB28'], ['QB28', 'QB27'], ['QB27', 'QB26'], ['QB26', 'QB25'], ['QB25', 'QB24'], ['QB24', 'QB23'],
    ['QB30', 'QB22'], ['QB29', 'QB21'], ['QB28', 'QB20'], ['QB27', 'QB19'], ['QB26', 'QB18'], ['QB25', 'QB17'], ['QB24', 'QB16'], ['QB23', 'QB15'],
    // Row 6 connections
    ['QB22', 'QB21'], ['QB21', 'QB20'], ['QB20', 'QB19'], ['QB19', 'QB18'], ['QB18', 'QB17'], ['QB17', 'QB16'], ['QB16', 'QB15'],
    ['QB22', 'QB14'], ['QB21', 'QB13'], ['QB20', 'QB12'], ['QB19', 'QB11'], ['QB18', 'QB10'], ['QB17', 'QB9'], ['QB16', 'QB8'],
    // Row 7 connections
    ['QB14', 'QB13'], ['QB13', 'QB12'], ['QB12', 'QB11'], ['QB11', 'QB10'], ['QB10', 'QB9'], ['QB9', 'QB8'],
    ['QB13', 'QB7'], ['QB12', 'QB6'], ['QB11', 'QB5'], ['QB10', 'QB4'], ['QB9', 'QB3'],
    // Row 8 connections
    ['QB7', 'QB6'], ['QB6', 'QB5'], ['QB5', 'QB4'], ['QB4', 'QB3'],
    ['QB6', 'QB2'], ['QB5', 'QB1'],
    // Row 9 connections
    ['QB2', 'QB1'],
];

// --- Tuna-9 (Delft, 9-qubit diamond) -----------------------------------------
const tuna9Spacing = 100;
const t9 = grid(0, 0, tuna9Spacing);
const tuna9Nodes = [
    t9('QB0', 0, 0),
    t9('QB1', -1, 1), t9('QB2', 1, 1),
    t9('QB3', -2, 2), t9('QB4', 0, 2), t9('QB5', 2, 2),
    t9('QB6', -1, 3), t9('QB7', 1, 3),
    t9('QB8', 0, 4),
];
const tuna9Edges = [
    ['QB0', 'QB1'], ['QB0', 'QB2'], ['QB1', 'QB3'], ['QB1', 'QB4'], ['QB2', 'QB4'],
    ['QB2', 'QB5'], ['QB3', 'QB6'], ['QB4', 'QB6'], ['QB4', 'QB7'], ['QB5', 'QB7'],
    ['QB6', 'QB8'], ['QB7', 'QB8'],
];

// --- Tuna-17 (Delft, 17-qubit "ninja star") ----------------------------------
const tuna17Spacing = 100;
const t17 = grid(0, 0, tuna17Spacing);
const tuna17Nodes = [
    t17('QB0', 0, 0),
    t17('QB1', 1, -1), t17('QB2', 1, 1), t17('QB3', 1, 3),
    t17('QB4', 2, 0), t17('QB5', 2, 2), t17('QB6', 2, 4),
    t17('QB7', 3, -1), t17('QB8', 3, 1), t17('QB9', 3, 3),
    t17('QB10', 4, -2), t17('QB11', 4, 0), t17('QB12', 4, 2),
    t17('QB13', 5, -1), t17('QB14', 5, 1), t17('QB15', 5, 3),
    t17('QB16', 6, 2),
];
const tuna17Edges = [
    ['QB0', 'QB1'], ['QB0', 'QB2'], ['QB1', 'QB4'], ['QB2', 'QB4'], ['QB2', 'QB5'],
    ['QB3', 'QB5'], ['QB3', 'QB6'], ['QB4', 'QB7'], ['QB4', 'QB8'], ['QB5', 'QB8'],
    ['QB5', 'QB9'], ['QB6', 'QB9'], ['QB7', 'QB10'], ['QB7', 'QB11'], ['QB8', 'QB11'],
    ['QB8', 'QB12'], ['QB9', 'QB12'], ['QB10', 'QB13'], ['QB11', 'QB13'], ['QB11', 'QB14'],
    ['QB12', 'QB14'], ['QB12', 'QB15'], ['QB14', 'QB16'], ['QB15', 'QB16'],
];

export const QC_LAYOUTS = {
    q50: { spacing: q50Spacing, nodes: q50Nodes, edges: q50Edges },
    tuna9: { spacing: tuna9Spacing, nodes: tuna9Nodes, edges: tuna9Edges },
    tuna17: { spacing: tuna17Spacing, nodes: tuna17Nodes, edges: tuna17Edges },
};
