function showProgress(){try{document.querySelectorAll('[data-room]').forEach(a=>a.querySelector('.visited').hidden=localStorage.getItem('riis-play-'+a.dataset.room)!=='done');}catch{}}
showProgress();window.addEventListener('pageshow',showProgress);
document.querySelector('#clear-progress').onclick=()=>{try{['signal','assembly','invariant','garden'].forEach(k=>localStorage.removeItem('riis-play-'+k));showProgress();}catch{}};
