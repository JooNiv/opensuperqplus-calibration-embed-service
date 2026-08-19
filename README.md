# QC calibration embed service

Standalone, iframe-embeddable calibration views for quantum computers. Each device
gets its own prerendered page with an interactive topology map coloured by calibration
metric, a median-metrics overview, and a raw JSON/table view designed to be framed
by a third-party site such as opensuperqplus.eu.

Ported using claude from the FiQCI website's status modal (`fiqci/dev/src/components/StatusModal`
and `QcLayouts`), with the CSC UI web components replaced, the modal shell dropped,
and a source-adapter layer added so devices on different backends share one UI.

## Devices

| Route | Device | Data source |
|---|---|---|
| `/embed/q50` | VTT Q50 | FiQCI backend, live (`PUBLIC_FIQCI_API`) |
| `/embed/tuna17` | Delft Tuna-17 | placeholder snapshot in `public/data/tuna17/` (`PUBLIC_TUNA17_BASE`) |

`?tab=overview\|layout\|raw` opens the embed on a specific tab.

Adding a device means one entry in `src/lib/deviceCatalog.js`, one in `QC_LAYOUTS`
(`src/components/qc/layouts.js`), optionally one in `DEVICE_METRICS`
(`src/lib/deviceMetrics.js`), and an adapter only if it is a new backend.

## Development

```sh
npm install
npm run dev              
npm run build && npm run preview
npm run check:tuna17     # verifies the Tuna-17 adapter and layout against the data
```

Copy `.env.example` to `.env` to point the app at different backends.

## How data flows

Every backend is normalised by an adapter in `src/lib/sources/` into one canonical
shape, so no component knows which device it is rendering:

```
metrics[metricName][id]      = { unit, value, timestamp }   id = QB1 or QB1__QB2
metrics[metricName].statistics = { average, median }        required, not optional
quality_metric_set_end_timestamp                            drives "Last calibrated"
```

`__` in an id is the only thing that distinguishes a coupler from a qubit. Units
come from the data (`'s'` renders as µs, `''` as a percentage) and a metric is
treated as lower-is-better when its key contains `error`.

The FiQCI backend already emits this shape, so `sources/fiqci.js` only unwraps the
response envelope. `sources/tuna17.js` does real work: it relabels `q0…q16` as
`QB0…QB16` (Tuna-17's qubit numbers are kept as published, not renumbered from 1
like Q50's), flattens nested two-qubit metrics to `QBa__QBb`, assigns units,
synthesises the `statistics` block Tuna-17 does not publish, and recovers the
calibration timestamp from the record's ObjectId.

Metric keys stay exactly as each backend publishes them; `DEVICE_METRICS` supplies
the shared display labels, so Q50's `t1_time` and Tuna-17's `t1` both read as
"T1 Time". Q50's `cz_irb_crf_crf_fidelity` and Tuna-17's `bell_state_fidelity`
deliberately keep separate labels — they are different measurements.

## Switching Tuna-17 to the real Delft API

Set `PUBLIC_TUNA17_BASE` to a base URL serving `static.json` and `calibration.json`
in the same shapes as `public/data/tuna17/`. If the real API differs, `sources/tuna17.js`
is the only file that changes; `npm run check:tuna17` verifies the result. The API
must send permissive CORS headers, since the browser fetches it directly.

## Embedding

```html
<iframe src="https://EMBED_HOST/embed/tuna17" title="Delft Tuna-17 calibration"
        width="100%" height="900" style="border:0" loading="lazy"></iframe>
```

The page posts `{ type: 'calib-embed:height', height }` to its parent on load and on
every resize, so a host can size the iframe to its content:

```js
addEventListener('message', (e) => {
    if (e.origin !== 'https://EMBED_HOST') return;
    if (e.data?.type === 'calib-embed:height') frame.height = e.data.height;
});
```

Framing is controlled by the host's response headers, not by Astro. `public/_headers`
carries a Netlify/Cloudflare Pages version. Translate it for the chosen host and
tighten `frame-ancestors` to the real allowlist before production. Never send
`X-Frame-Options`, any value of it blocks framing entirely. On GitHub Pages `frame-ancestors` can't be set so embedding still works but cannot control who is allowed to embed.

## Outstanding

- The deploy target is undecided, so `public/_headers` allows any framing ancestor.
