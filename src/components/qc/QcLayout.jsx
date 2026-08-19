import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getColorForMetricValue } from '../../lib/generateGradient';
import { formatMetricValue } from '../../lib/formatMetricValue';
import { getMetricStatistics } from '../../lib/sidebarUtils';

const DEFAULT_NODE_COLOR = '#005a61'; // --color-brand-darker
const GREY = '#888888';

// Node rect side length in SVG user units (must match the <rect> below).
const NODE_UNITS = 90;
// Largest a qubit node may render on screen, in pixels. The whole layout is
// capped proportionally so nodes/couplers never exceed this, regardless of how
// few qubits a layout has (otherwise small layouts like Q20 scale up huge).
const MAX_NODE_PX = 48;

export function QcLayout({ layout, metrics }) {
    const { spacing, nodes, edges, resonator } = layout;
    // Star layouts (with a central resonator) render qubits as upright squares;
    // lattice layouts render them as 45°-rotated diamonds.
    const nodeRotation = resonator ? 0 : 45;
    const {
        calibrationData, qubitMetric, couplerMetric,
        qubitMetricFormatted, couplerMetricFormatted,
        thresholdQubit, thresholdCoupler,
    } = metrics;

    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredEdge, setHoveredEdge] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [tooltip, setTooltip] = useState(null);
    const containerRef = useRef(null);

    // Get the metric value for a given id (qubit id or coupler key)
    const getMetricValue = (metric, id) => {
        if (!calibrationData || !metric || !calibrationData[metric]) return null;
        return calibrationData[metric][id]?.value ?? null;
    };

    // Get the unit for a metric, read from the first entry that has one
    const getMetricUnit = (metric) => {
        if (!calibrationData || !metric || !calibrationData[metric]) return '';
        const entry = Object.values(calibrationData[metric]).find(data => data?.unit);
        return entry?.unit || '';
    };

    // Resolve a coupler key from the two endpoints (try both orderings).
    const couplerKey = (a, b) => {
        if (getMetricValue(couplerMetric, `${a}__${b}`) !== null) return `${a}__${b}`;
        if (getMetricValue(couplerMetric, `${b}__${a}`) !== null) return `${b}__${a}`;
        // Star MOVE/CZ gates routed through the resonator to a fixed anchor qubit
        // are keyed QBx__RES__QBanchor. The edge is (QBx, RES): find the matching
        // key so the gate's value renders on that edge (and shows on hover).
        if (resonator && calibrationData?.[couplerMetric]) {
            const qubit = a === resonator.id ? b : a;
            const prefix = `${qubit}__${resonator.id}__`;
            const match = Object.keys(calibrationData[couplerMetric]).find(k => k.startsWith(prefix));
            if (match) return match;
        }
        return `${a}__${b}`;
    };

    // Color for a metric value. dim: 1 = qubit, 2 = coupler, 3 = resonator.
    const getColor = (metric, id, dim, threshold) => {
        // No metric selected: qubits/resonator get the brand blue, couplers a light grey
        if (!metric || metric === '') return dim === 2 ? '#aaa' : DEFAULT_NODE_COLOR;
        if (!calibrationData || !calibrationData[metric]) return GREY;

        const value = getMetricValue(metric, id);
        if (value === null || value === undefined) return GREY;

        const stats = getMetricStatistics(calibrationData, metric, dim);
        if (!stats) return GREY;

        let worst = stats.worst;
        let best = stats.best;
        // Reverse the scale for metrics where lower is better (error rates)
        if (metric.includes('error')) {
            worst = stats.best;
            best = stats.worst;
            if (parseFloat(value) > threshold) return GREY; // above threshold = worse
        } else if (parseFloat(value) < threshold) {
            return GREY; // below threshold = worse
        }

        return getColorForMetricValue(value, worst, best, stats.average);
    };

    // Build tooltip content for a hovered qubit or coupler.
    // label is the displayed title (e.g. "Qubit: QB1" / "Coupler: QB1__QB2").
    const buildTooltip = (type, metric, id, formatted, label) => {
        const value = getMetricValue(metric, id);
        const unit = getMetricUnit(metric);
        const metricInfo = value !== null && formatted ? `${formatted}: ${formatMetricValue(value, unit)}` : '';

        const details = (metric && metric !== '' && value === null) ? 'Disabled' : metricInfo;

        return { type, content: label, details };
    };

    // Handle mouse move to update tooltip position relative to the container
    const handleMouseMove = (event) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            });
        }
    };

    // Calculate tooltip position with boundary checking
    const getTooltipPosition = () => {
        if (!containerRef.current || !tooltip) return { left: 0, top: 0 };

        const containerRect = containerRef.current.getBoundingClientRect();

        let tooltipWidth = 300; // rough estimate
        let tooltipHeight = 150; // rough estimate

        if (qubitMetric === '' && couplerMetric === '') {
            tooltipWidth = 100; // rough estimate
            tooltipHeight = 70; // rough estimate
        }

        let left = mousePos.x + 8;
        let top = mousePos.y + 8;

        // Horizontal: keep the tooltip's right edge within the layout area so it
        // never spills past the right edge. If it would, flip it to the left of
        // the cursor; never let it run off the left of the viewport.
        const maxLeft = containerRect.width - tooltipWidth - 8; // relative to container
        if (left > maxLeft) {
            left = mousePos.x - tooltipWidth - 8; // flip to the left of the cursor
        }
        const minLeft = 8; // keep the tooltip's left edge inside the layout area
        left = Math.min(left, maxLeft);
        left = Math.max(left, minLeft);

        // Vertical: keep the tooltip's bottom within the layout area so it never
        // spills past the bottom edge. If it would, flip it above the cursor; let
        // it extend upward (the modal has room above) but never above the viewport.
        const maxTop = containerRect.height - tooltipHeight - 8; // relative to container
        if (top > maxTop) {
            top = mousePos.y - tooltipHeight - 8; // flip above the cursor
        }
        const minTop = 8; // keep the tooltip's top edge inside the layout area
        top = Math.min(top, maxTop);
        top = Math.max(top, minTop);

        return { left, top };
    };

    // Build coordinate map directly from nodes
    const coordMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    // Resolve an edge's two endpoints. A star-layout edge connects a qubit to the
    // central resonator: that endpoint isn't a node, so it maps to the point on the
    // resonator bar directly above/below the qubit (a vertical coupler).
    const endpoint = (id, other) => {
        if (resonator && id === resonator.id) return { x: coordMap[other].x, y: resonator.y };
        return coordMap[id];
    };

    // Compute dynamic bounds (include the resonator bar if present)
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    if (resonator) {
        xs.push(resonator.x1, resonator.x2);
        ys.push(resonator.y);
    }
    // Margin around the outermost nodes. Star layouts pack tightly (upright
    // squares), so they only need a node-sized margin; lattice layouts keep a
    // full spacing of breathing room.
    const margin = resonator ? NODE_UNITS * 0.75 : spacing;
    const minX = Math.min(...xs) - margin;
    const maxX = Math.max(...xs) + margin;
    const minY = Math.min(...ys) - margin;
    const maxY = Math.max(...ys) + margin;
    const viewBoxWidth = maxX - minX;
    const viewBoxHeight = maxY - minY;
    const viewBox = `${minX} ${-maxY} ${viewBoxWidth} ${viewBoxHeight}`;

    // Cap the rendered size so an SVG unit never maps to more pixels than
    // MAX_NODE_PX / NODE_UNITS — i.e. nodes/couplers stay the same on-screen size
    // across layouts. The container matches the viewBox aspect ratio so a wide,
    // short layout (e.g. the star) isn't padded out to a tall square.
    const pxPerUnit = MAX_NODE_PX / NODE_UNITS;
    const maxRenderWidth = pxPerUnit * viewBoxWidth;
    const maxRenderHeight = pxPerUnit * viewBoxHeight;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden flex justify-center items-center mx-auto"
            style={{
                aspectRatio: `${viewBoxWidth} / ${viewBoxHeight}`,
                maxWidth: `${maxRenderWidth}px`,
                maxHeight: `${maxRenderHeight}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredNode(null); setHoveredEdge(null); setTooltip(null); }}
        >
            <TransformWrapper
                key={`${nodes.length}-${spacing}`}
                minScale={0.5}
                maxScale={8}
                doubleClick={{ mode: 'reset' }}
                wheel={{ step: 0.003, smoothStep: 0.0002 }}
                panning={{ velocityDisabled: true }}
                onPanningStart={() => setTooltip(null)}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute top-2 right-2 z-50 flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() => zoomIn()}
                                aria-label="Zoom in"
                                className="w-8 h-8 flex items-center justify-center text-lg leading-none bg-brand-darker/85 text-white rounded-sm shadow-sm hover:bg-brand-dark"
                            >+</button>
                            <button
                                type="button"
                                onClick={() => zoomOut()}
                                aria-label="Zoom out"
                                className="w-8 h-8 flex items-center justify-center text-lg leading-none bg-brand-darker/85 text-white rounded-sm shadow-sm hover:bg-brand-dark"
                            >−</button>
                            <button
                                type="button"
                                onClick={() => resetTransform()}
                                aria-label="Reset view"
                                className="w-8 h-8 flex items-center justify-center text-base leading-none bg-brand-darker/85 text-white rounded-sm shadow-sm hover:bg-brand-dark"
                            >⟳</button>
                        </div>
                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full !flex !items-center !justify-center">
                            <svg
                                viewBox={viewBox}
                                preserveAspectRatio="xMidYMid meet"
                                className="w-full h-full"
                                            >
                                {edges.map(([a, b]) => {
                    const A = endpoint(a, b);
                    const B = endpoint(b, a);
                    const key = `${a}-${b}`;
                    const hover = hoveredEdge === key;
                    const edgeColor = getColor(couplerMetric, couplerKey(a, b), 2, thresholdCoupler);
                    return (
                        <motion.line
                            key={key}
                            x1={A.x} y1={-A.y}
                            x2={B.x} y2={-B.y}
                            stroke={edgeColor}
                            strokeWidth={hover ? 80 : 60}
                            strokeLinecap="round"
                            initial={{ strokeWidth: 60 }}
                            animate={{ strokeWidth: hover ? 80 : 60 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            onMouseEnter={() => {
                                setHoveredEdge(key);
                                setTooltip(buildTooltip('edge', couplerMetric, couplerKey(a, b), couplerMetricFormatted, `Coupler: ${couplerKey(a, b)}`));
                            }}
                            onMouseLeave={() => { setHoveredEdge(null); setTooltip(null); }}
                            className={hover ? 'cursor-pointer filter drop-shadow-md' : 'cursor-pointer'}
                        />
                    );
                })}
                {resonator && (() => {
                    const hover = hoveredEdge === resonator.id;
                    const barHeight = 90;
                    // The resonator has no dropdown of its own: its T1/T2 share the
                    // qubit keys, so the bar follows the selected qubit metric.
                    const barColor = getColor(qubitMetric, resonator.id, 1, thresholdQubit);
                    return (
                        <motion.g
                            initial={{ scale: 1 }}
                            animate={{ scale: hover ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                            onMouseEnter={() => {
                                setHoveredEdge(resonator.id);
                                setTooltip(buildTooltip('resonator', qubitMetric, resonator.id, qubitMetricFormatted, `Resonator: ${resonator.id}`));
                            }}
                            onMouseLeave={() => { setHoveredEdge(null); setTooltip(null); }}
                            className={hover ? 'cursor-pointer filter drop-shadow-lg' : 'cursor-pointer'}
                        >
                            <rect
                                x={resonator.x1}
                                y={-resonator.y - barHeight / 2}
                                width={resonator.x2 - resonator.x1}
                                height={barHeight}
                                rx={10}
                                fill={barColor}
                            />
                            <text
                                x={(resonator.x1 + resonator.x2) / 2}
                                y={-resonator.y}
                                fill="#fff"
                                fontFamily="monospace"
                                fontSize={40}
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="central"
                            >{resonator.id}</text>
                        </motion.g>
                    );
                })()}
                {nodes.map(n => {
                    const hover = hoveredNode === n.id;
                    const nodeColor = getColor(qubitMetric, n.id, 1, thresholdQubit);
                    return (
                        <g key={n.id} transform={`translate(${n.x} ${-n.y})`}>
                            <motion.g
                                initial={{ scale: 1.1 }}
                                animate={{ scale: hover ? 1.25 : 1.1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                onMouseEnter={() => {
                                    setHoveredNode(n.id);
                                    setTooltip(buildTooltip('node', qubitMetric, n.id, qubitMetricFormatted, `Qubit: ${n.id}`));
                                }}
                                onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
                                className={hover ? 'cursor-pointer filter drop-shadow-lg' : 'cursor-pointer'}
                            >
                                <g transform={`rotate(${nodeRotation})`}>
                                    <rect x={-45} y={-45} width={90} height={90} rx={10} fill={nodeColor} />
                                    <text
                                        x={0} y={0}
                                        fill="#fff"
                                        fontFamily="monospace"
                                        fontSize={32}
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        transform={`rotate(${-nodeRotation})`}
                                    >{n.id}</text>
                                </g>
                            </motion.g>
                        </g>
                    );
                })}
                            </svg>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            {tooltip && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="max-w-[320px] absolute pointer-events-none z-50 shadow-2xl"
                    style={{
                        left: getTooltipPosition().left + 'px',
                        top: getTooltipPosition().top + 'px'
                    }}
                >
                    <div className="rounded-lg border border-line-2 bg-bg p-3 shadow-xl">
                        {/* Header with icon */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${tooltip.type === 'node' ? 'bg-brand' : 'bg-brand-darker'}`}></div>
                            <div className="font-semibold text-ink text-lg font-mono tracking-wide">
                                {tooltip.content}
                            </div>
                        </div>

                        {/* Details with better formatting */}
                        {tooltip.details &&
                            <div className="flex flex-col text-ink/80 font-mono leading-relaxed bg-bg-alt rounded-sm px-2 py-1.5 border border-line-1">
                                <p className='font-bold'>
                                    {tooltip.details.split(":")[0]}
                                    {tooltip.details !== "Disabled" &&
                                        <span className='mr-1'>:</span>
                                    }
                                </p>

                                <p>
                                    {tooltip.details.split(":")[1]}
                                </p>
                            </div>
                        }


                        {/* Bottom accent */}
                        <div className={`mt-2 h-0.5 rounded-full ${tooltip.type === 'node' ? 'bg-brand' : 'bg-brand-darker'}`}></div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
