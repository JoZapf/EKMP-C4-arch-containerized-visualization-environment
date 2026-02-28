# PlantUML Large Diagram Optimization Settings

## Configuration Overview

| Parameter | Current Value | Next Step |
|---|---|---|
| `PLANTUML_LIMIT_SIZE` | `8192` px | `16384` px |
| JVM Heap Max (`-Xmx`) | `3g` | `5g` |
| JVM Heap Initial (`-Xms`) | `1g` | `2g` |
| Jetty Request Header Size | `65536` (64 KB) | `131072` (128 KB) |
| Container `mem_limit` | `6g` | `10g` |
| Container `mem_reservation` | `2g` | `4g` |
| nginx `proxy_buffer_size` | `128k` | `256k` |
| nginx `proxy_buffers` | `4 256k` (1 MB total) | `8 512k` (4 MB total) |
| nginx `proxy_busy_buffers_size` | `256k` | `512k` |

---

## Technical Background

### `PLANTUML_LIMIT_SIZE`
Caps the maximum **pixel dimension** (width or height) of the rendered output image. This is not a source file size limit. Diagrams exceeding this threshold are silently truncated rather than rejected. At 8192 px, complex activity diagrams with many swimlane columns already approach this ceiling. Doubling to 16384 px directly expands the renderable canvas without JVM changes.

### JVM Heap (`-Xmx` / `-Xms`)
PlantUML renders entirely in-memory. The layout engine for `ActivityDiagram3` (the current default renderer for `@startuml` activity syntax) builds an in-memory tile tree (`FtileAssembly`, `Swimlanes`) whose size scales non-linearly with diagram complexity — nested swimlanes and long text blocks are the primary heap consumers. `-Xms` controls initial allocation; setting it closer to `-Xmx` reduces GC pressure from heap resizing under load. **Note:** `JAVA_TOOL_OPTIONS` must be used in the Docker Jetty image — neither `JAVA_OPTS` nor `_JAVA_OPTIONS` are reliably picked up by the Jetty launcher.

### Jetty Request Header Size
Relevant for `GET`-based diagram rendering, where the diagram source is Deflate-compressed and Base64-encoded into the URL path. At 13 KB source, the encoded path approaches ~9 KB. The 64 KB header limit is not the bottleneck today, but becomes relevant beyond ~40 KB source files. `POST`-based rendering (e.g. via Kroki) bypasses this entirely.

### Container Memory (`mem_limit` / `mem_reservation`)
The container ceiling must exceed the JVM heap (`-Xmx`) by a meaningful margin to accommodate JVM overhead: class metadata, thread stacks, the Jetty I/O layer, and off-heap buffers typically add 1–2 GB on top of the configured heap. `mem_reservation` is a soft guarantee under host memory pressure; setting it to ~40–50% of `mem_limit` is a reasonable heuristic.

### nginx Proxy Buffers
The proxy buffer configuration determines how nginx handles upstream responses from the PlantUML Jetty backend before forwarding them to the client. `proxy_buffering on` is required for `sub_filter` (HTML injection). For large SVG outputs — which can reach several MB on complex diagrams — undersized buffers cause nginx to write to a temporary file on disk, introducing latency and potential I/O bottlenecks. `proxy_buffer_size` covers the response header; `proxy_buffers` covers the response body. The `proxy_busy_buffers_size` limit must not exceed `proxy_buffer_size + proxy_buffers` total.
