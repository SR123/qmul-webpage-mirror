# Maximal Condorcet Domain Explorer

Interactive static demo for exploring maximal Condorcet domains (MUCD/MCD style datasets).

## Graph definition used

For each domain:
- Each permutation is a node.
- Two nodes are connected by an edge iff one permutation is obtained from the other by swapping exactly one adjacent pair.

This is the induced subgraph of the adjacent-transposition graph (permutohedron graph).

## Data format

Each input file is parsed as a sequence of domains:
- One permutation per line (integers).
- Domain separator: a line that starts with `-1`.
- Comments starting with `#` are ignored.

The parser also accepts list-like lines (for example `[0,1,2,3]`) because it extracts integer tokens from each row.

## Run

Two options:

1. Open `/Users/sorenriis/Documents/ChatGpt_codex_folder/Condorcet/condorcet-demo/index.html` directly in your browser.
2. Or run a local server from `/Users/sorenriis/Documents/ChatGpt_codex_folder/Condorcet/condorcet-demo`:

```bash
python3 -m http.server 8000
```

The page now auto-loads bundled MUCD files at startup from `UMCDs/bundled-umcds.js`.

## Alternative loading modes

- **Bundled embedded mode**: reads all bundled files from `UMCDs/bundled-umcds.js` (works for direct file-open demos).
- **Bundled fetch mode**: uses `UMCDs/manifest.json` and file fetches (used when serving over HTTP).
- **Local mode**: click **Load local file(s) or folder** and select your own files/folder.

## Main controls

- Filter datasets by file label `n` (parsed from file names like `mucds-n=5-*`).
- Select dataset file.
- Move between domains with `Prev`, `Next`, `Random`.
- Graph layout toggle: inversion layers or force-directed.
- Graph color modes (mostly relabeling-invariant because they use only graph structure):
  - `component`, `degree`, `distance from selected`
  - `eccentricity`, `closeness centrality`, `betweenness centrality`
  - `k-core index`, `clustering coefficient`, `WL refinement class`
  - `triple class (label-dependent)` (kept as an optional non-invariant mode)
- Graph size modes: `fixed`, `degree`, `k-core`, `closeness`, `betweenness`.
- Graph edge modes: `uniform`, `swap position`, `BFS layers from selected`.
- Click a node (or a row) to inspect its neighbors and local statistics.

## Relabeling-invariant feedback

Most visual feedback modes are computed from the adjacent-swap graph only (adjacency, distances, centralities, k-core, clustering, WL classes), so they are invariant under relabeling of alternatives up to graph isomorphism.

## Note on current bundled files

In the current `UMCDs` folder:
- Files named `mucds-n=4-*` contain permutations of length `4`.
- Files named `mucds-n=5-*` contain permutations of length `6` (alternatives `0..5`).

The explorer now displays:
- `n` from the file name (so these files show `n=5`).
- `permutation length` separately in the stats (so you can still see length `6` explicitly).

## Triple-class color rule

When color mode is `triple class`, each node is colored from the relative order of alternatives `1,2,3`:
- Amber: `1N3` and `2N3`
- Cyan: `1N2` and `3N2`
- Green: `2N1` and `3N1`

Here `aNb` means: among `{1,2,3}`, alternative `a` is highest and `b` is lowest in that permutation.
