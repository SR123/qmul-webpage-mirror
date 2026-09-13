# Seven-alternative Condorcet domains: summary and selected collections

Snapshot: 13 September 2026.

Source: Klas Markström’s Condorcet-domain archive:
http://abel.math.umu.se/~klasm/Data/CONDORCET/
http://abel.math.umu.se/~klasm/Data/CONDORCET/MUCDS/

Research: Dolica Akello-Egwel, Charles Leedham-Green, Alastair Litterick,
Klas Markström and Søren Riis, *Condorcet domains on at most seven
alternatives*, Mathematical Social Sciences 133 (2025), 23–33.
https://doi.org/10.1016/j.mathsocsci.2024.12.002

## Scope

The complete size census contains 171,870,480 archived representatives of
maximal unitary Condorcet domains (MUCDs) on seven alternatives. The source
classifies domains up to isomorphism. This website includes every archived
representative at sizes at most 16 or at least 88:

- Small: 3,353 domains in ten files (sizes 4, 8, 9, 10, 11, 12, 13, 14, 15, 16).
- Large: 4,679 domains in twelve files (sizes 88–98 and 100).
- Total: 8,032 domains; 311,937 bytes in the original compressed files.

There are no archived domains at sizes 1–3, 5–7 or 99. The middle-range
domain files (sizes 17–87) are not included; their counts are included.
No claim of a new enumeration or independent isomorphism classification is made.

## Files and encoding

- `summary.csv`: all sizes 1–100, their counts and availability here.
- `summary.json`: counts, source URLs, retrieval date, byte lengths and SHA-256
  checksums for every included file.
- `source/sizes.txt`: the unmodified upstream count summary.
- `source/*.gz`: the original compressed files, unchanged. Each line is a
  permutation of 0,1,2,3,4,5,6; a line containing -1 separates domains.
- `n7/size-XXX.json`: compact browser data. Every alternative is relabelled
  by adding one (0–6 becomes 1–7). Each domain is a string of space-separated
  seven-digit rankings. Domain and ranking order are preserved.
- `small-mucds-n7.zip` / `large-mucds-n7.zip`: the corresponding original
  gzip files with these notes and the complete size summary.

The browser’s domain numbers start at 1 within each size file. Rankings
are displayed from best to worst. “Size” counts rankings, not voters.
“Maximal” means no additional ranking can be added while preserving the
Condorcet property; it does not mean maximum size or a connected swap graph.

## Checks

Each included domain was checked for valid distinct rankings, inclusion of
the natural order, the Condorcet triple condition and maximality among all
7! possible rankings. Counts were compared with the upstream summary.
SHA-256 checksums preserve the relationship to the downloaded source files.
Completeness and isomorphism classification are attributed to the authors’
archive and paper.

The website loads no domain collection automatically. Selecting “Load this
collection” fetches the single browser JSON file for the chosen size; the
largest is approximately 1.44 MB. The complete set of browser JSON files
is approximately 3.74 MB. Original compressed downloads are smaller.

Please cite the research paper and acknowledge the source archive when
using these data. Refer to the source for any terms attached to reuse.
