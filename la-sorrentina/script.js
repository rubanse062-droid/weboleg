(()=>{
const nav=document.querySelector('#navigation'),toggle=document.querySelector('.nav-toggle'),header=document.querySelector('.header');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pages=window.restaurantPages||{};
let cleanup=()=>{},previousFocus;
function updateHeaderSize(){document.documentElement.style.setProperty('--header-height',header.getBoundingClientRect().height+'px');}
updateHeaderSize();
if('ResizeObserver' in window)new ResizeObserver(updateHeaderSize).observe(header);
else window.addEventListener('resize',updateHeaderSize,{passive:true});
document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!header.contains(e.target))closeNavigation();});
document.addEventListener('focusin',e=>{if(nav.classList.contains('open')&&!header.contains(e.target))closeNavigation();});
function closeNavigation(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');nav.classList.remove('open');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeNavigation();toggle.focus();}});
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>20),{passive:true});
matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)closeNavigation();});
document.querySelector('#year').textContent=new Date().getFullYear();
const lightbox=document.querySelector('#lightbox');
lightbox.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('close',()=>previousFocus?.isConnected&&previousFocus.focus());
lightbox.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();}});
function mount(){
const abort=new AbortController(),observers=[];const opts={signal:abort.signal};
if('IntersectionObserver'in window){const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');reveal.unobserve(e.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));observers.push(reveal);}
const films=Array.from(document.querySelectorAll('video'));
films.forEach(film=>{const container=film.closest('.film');const control=container.querySelector('.film-toggle');let paused=false,visible=false;
function sync(){control.textContent=film.paused?'▶ PLAY FILM':'Ⅱ PAUSE FILM';control.setAttribute('aria-label',film.paused?'Play restaurant film':'Pause restaurant film');}
async function play(){try{await film.play();}catch{}if(!abort.signal.aborted)sync();}
function auto(){if(visible&&!document.hidden&&!paused&&!reduced.matches&&!navigator.connection?.saveData&&!/^(slow-)?2g$/.test(navigator.connection?.effectiveType||''))play();else film.pause();}
control.addEventListener('click',()=>{if(film.paused){paused=false;play();}else{paused=true;film.pause();}},opts);
film.addEventListener('play',sync,opts);film.addEventListener('pause',sync,opts);
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;auto();},{threshold:.15});observer.observe(film);observers.push(observer);}
document.addEventListener('visibilitychange',auto,opts);reduced.addEventListener('change',auto,opts);
function failure(){container.querySelector('.video-error').hidden=false;control.hidden=true;}
film.addEventListener('error',failure,opts);film.querySelector('source').addEventListener('error',failure,opts);
});
cleanup=()=>{abort.abort();observers.forEach(o=>o.disconnect());films.forEach(film=>{film.pause();film.removeAttribute('src');film.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));film.load();});};
}
function pathKey(path){if(path==='/'||path==='/index.html')return '/index.html';if(path.endsWith('/index.html'))return path.slice(0,-11)+'.html';if(path.endsWith('/'))return path.slice(0,-1)+'.html';return path;}
function navigate(url,push){const key=pathKey(url.pathname),page=pages[key];if(!page)return false;
cleanup();if(lightbox.open)lightbox.close();closeNavigation();
document.querySelector('#main').innerHTML=page.main;document.title=page.title;
nav.querySelectorAll('a').forEach(a=>{if(pathKey(new URL(a.href).pathname)===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
if(push)history.pushState({},'',url.pathname+url.search+url.hash);
mount();const main=document.querySelector('#main');main.setAttribute('tabindex','-1');main.focus({preventScroll:true});
if(url.hash){document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();}else scrollTo({top:0,left:0,behavior:'instant'});
return true;}
document.addEventListener('click',e=>{
const photo=e.target.closest('[data-photo]');if(photo){previousFocus=photo;lightbox.querySelector('img').src=photo.dataset.photo;lightbox.querySelector('img').alt=photo.dataset.caption;lightbox.querySelector('p').textContent=photo.dataset.caption;lightbox.showModal();return;}
const a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;
const url=new URL(a.href);if(url.origin!==location.origin||!pages[pathKey(url.pathname)])return;
if(pathKey(url.pathname)===pathKey(location.pathname)&&url.hash){closeNavigation();return;}
e.preventDefault();navigate(url,true);
});
window.addEventListener('popstate',()=>{if(!navigate(new URL(location.href),false))location.reload();});
mount();
})();
