# QMUL Webpage Mirror

This repository contains the GitHub Pages mirror of Søren Riis's Queen Mary academic website.

- Official site: [Queen Mary](https://webspace.eecs.qmul.ac.uk/s.riis/)
- Mirror: [GitHub Pages](https://sr123.github.io/qmul-webpage-mirror/)
- Mirror source: static files at the root of this repository

## Current edition — 12 September 2026

The mirror includes the reviewed academic redesign, 48 bibliography records, four guided research games, six specialist interactive tools, the existing videos, and **The paper, unfolded**. The homepage links to Try it, Watch it, and the complete publication list.

The dated author PDF of *One Unit Separates Polynomial Time from Undecidability in Term Coding* is hosted directly at `papers/one-unit-term-coding-2026-09-12.pdf`. Choosing **Unfold the paper** loads the [interactive edition](https://sr123.github.io/term-coding-disequality-lean/) inside the homepage. That separately maintained edition includes the Lean proof-loading repair and requires internet access.

## Publishing and maintenance

GitHub Pages publishes directly from the repository root on `main`; `.nojekyll` keeps it a plain static site. A push to `main` triggers GitHub's Pages deployment. Internal navigation and assets use relative paths so they work under `/qmul-webpage-mirror/`; canonical URLs identify the Queen Mary site.

This is a manually updated mirror. Publishing to Queen Mary does not automatically update this repository, and pushing here does not upload files to Queen Mary. The embedded interactive edition is a separate GitHub Pages project and can update independently on both websites.

For subsequent releases, copy only the approved public website files into a clean checkout, preserve existing papers, videos, datasets, and URLs, check local links under the mirror prefix, then commit and push normally. Keep private backups, editorial material, upload scripts, and local paths outside this public repository. Use a revert commit on `main` if a published update needs to be rolled back, and verify the resulting Pages deployment.
