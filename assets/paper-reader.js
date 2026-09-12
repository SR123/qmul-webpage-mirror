/* Load the published interactive edition only after the reader chooses it. */
(() => {
  'use strict';
  const reader = document.getElementById('paper-reader');
  const mount = document.getElementById('paper-reader-mount');
  const close = document.getElementById('close-paper-reader');
  if (!reader || !mount || !close) return;
  let frame;
  function reveal() {
    if (!reader.open || frame) return;
    frame = document.createElement('iframe');
    frame.title = 'Interactive paper: One Unit Separates Polynomial Time from Undecidability in Term Coding';
    frame.src = 'https://sr123.github.io/term-coding-disequality-lean/';
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('aria-describedby', 'paper-reader-status');
    mount.append(frame);
  }
  reader.addEventListener('toggle', reveal);
  close.hidden = false;
  close.addEventListener('click', () => {
    reader.open = false;
    reader.querySelector('summary').focus();
  });
  function followAnchor() {
    if (location.hash === '#paper-reader') {
      reader.open = true;
      reveal();
    }
  }
  window.addEventListener('hashchange', followAnchor);
  followAnchor();
  reveal();
})();
