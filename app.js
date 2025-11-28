// ===== STATE =====
const state={currentPage:1,currentTag:'',isLoading:false,isSearching:false,images:[],categories:[]};

// ===== DOM =====
const el={
  sidebar:document.getElementById('sidebar'),
  hambBtn:document.getElementById('hambBtn'),
  closeSidebar:document.getElementById('closeSidebar'),
  themeBtn:document.getElementById('themeBtn'),
  searchInput:document.getElementById('searchInput'),
  searchButton:document.getElementById('searchButton'),
  imageGrid:document.getElementById('imageGrid'),
  imageModal:document.getElementById('imageModal'),
  modalClose:document.getElementById('modalClose'),
  modalImage:document.getElementById('modalImage'),
  modalTitle:document.getElementById('modalTitle'),
  modalArtist:document.getElementById('modalArtist'),
  modalTags:document.getElementById('modalTags'),
  modalRating:document.getElementById('modalRating'),
  downloadButton:document.getElementById('downloadButton'),
  infiniteLoading:document.getElementById('infiniteLoading'),
  toast:document.getElementById('toast'),
  year:document.getElementById('year'),
  pwaStatus:document.getElementById('pwa-status')
};

// ===== THEME (first code) =====
function toggleTheme(){
  const isDark=document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme',isDark?'dark':'light');
  el.themeBtn.classList.toggle('active',isDark);
  el.themeBtn.querySelector('.theme-slider-thumb').textContent=isDark?'☀️':'🌙';
  document.querySelector('meta[name="theme-color"]').setAttribute('content',isDark?'#000000':'#ffffff');
}
const saved=localStorage.getItem('theme');
if(saved==='dark'){document.documentElement.classList.add('dark');el.themeBtn.classList.add('active');el.themeBtn.querySelector('.theme-slider-thumb').textContent='☀️';}
el.themeBtn.addEventListener('click',toggleTheme);

// ===== SIDEBAR =====
function openSB(){el.sidebar.classList.add('open');el.sidebar.setAttribute('aria-hidden','false');el.closeSidebar.focus();}
function closeSB(){el.sidebar.classList.remove('open');el.sidebar.setAttribute('aria-hidden','true');}
el.hambBtn.addEventListener('click',openSB);
el.closeSidebar.addEventListener('click',closeSB);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSB();});
document.addEventListener('click',e=>{if(el.sidebar.classList.contains('open')&&!el.sidebar.contains(e.target)&&!el.hambBtn.contains(e.target))closeSB();});

// ===== TOAST =====
function showToast(msg,icon='ℹ️'){
  el.toast.innerHTML=`<span class="icon">${icon}</span><span>${msg}</span>`;
  el.toast.classList.add('show');
  setTimeout(()=>el.toast.classList.remove('show'),3000);
}

// ===== API =====
async function fetchImages(tags='',page=1,limit=20){
  const url=`https://danbooru.donmai.us/posts.json?tags=${tags}&limit=${limit}&page=${page}`;
  try{const r=await fetch(url);if(!r.ok)throw new Error('Network error');return await r.json();}catch(e){console.error(e);return[]}}
async function fetchCategories(){
  const url='https://danbooru.donmai.us/tags.json?limit=30&order=count';
  try{const r=await fetch(url);if(!r.ok)throw new Error('Network error');const t=await r.json();return t.slice(0,15).map(x=>x.name)}catch(e){return['anime','manga','art','illustration','digital art']}}

// ===== RENDER =====
function renderImages(images,append=false){
  if(!append)el.imageGrid.innerHTML='';
  images.forEach(img=>{
    if(!img.file_url)return;
    const card=document.createElement('div');card.className='image-card fade-in';
    card.onclick=()=>openModal(img);
    card.innerHTML=`
      <img src="${img.file_url}" alt="anime artwork" loading="lazy">
      <div class="image-overlay">
        <div class="image-info">
          <div class="image-title">${img.tag_string_character||'Anime Artwork'}</div>
          <div class="image-artist">${img.tag_string_artist||'Unknown Artist'}</div>
        </div>
      </div>`;
    el.imageGrid.appendChild(card);
  });
}
function renderCategories(list){
  el.imageGrid adjacentHTML='afterbegin','';
  list.forEach(c=>{
    const b=document.createElement('button');b.className='category-button';b.dataset.tag=c;b.textContent=c;
    b.onclick=()=>{document.querySelectorAll('.category-button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.currentTag=c;state.currentPage=1;state.isSearching=false;el.searchInput.value='';loadImages();};
    el.imageGrid.appendChild(b);
  });
}

// ===== MODAL =====
function openModal(img){
  el.modalImage.src=img.file_url;
  el.modalTitle.textContent=img.tag_string_character||'Anime Artwork';
  el.modalArtist.textContent=img.tag_string_artist||'Unknown Artist';
  el.modalRating.textContent=img.rating||'Safe';
  el.modalTags.innerHTML='';
  if(img.tag_string){
    img.tag_string.split(' ').slice(0,10).forEach(t=>{
      const sp=document.createElement('span');sp.className='tag';sp.textContent=t;el.modalTags.appendChild(sp);
    })
  }
  el.downloadButton.onclick=()=>downloadImage(img.file_url,`anime-image-${img.id}.jpg`);
  el.imageModal.classList.add('open');document.body.style.overflow='hidden';
}
function closeModal(){el.imageModal.classList.remove('open');document.body.style.overflow='';}
el.modalClose.addEventListener('click',closeModal);
el.imageModal.addEventListener('click',e=>{if(e.target===el.imageModal)closeModal()});

function downloadImage(url,name){
  fetch(url).then(r=>r.blob()).then(b=>{
    const u=URL.createObjectURL(b),a=document.createElement('a');a.style.display='none';a.href=u;a.download=name;
    document.body.appendChild(a);a.click();URL.revokeObjectURL(u);document.body.removeChild(a);
  }).catch(()=>showToast('Download failed','❌'));
}

// ===== SEARCH =====
function doSearch(){
  const q=el.searchInput.value.trim();if(!q)return;
  state.isSearching=true;state.currentPage=1;state.currentTag=q;loadImages();
}
el.searchButton.addEventListener('click',doSearch);
el.searchInput.addEventListener('keypress',e=>{if(e.key==='Enter')doSearch()});

// ===== INFINITE SCROLL =====
let scrollTimeout;
window.addEventListener('scroll',()=>{
  clearTimeout(scrollTimeout);
  scrollTimeout=setTimeout(()=>{
    if(state.isLoading)return;
    const pos=window.innerHeight+window.scrollY;
    const thresh=document.body.offsetHeight-500;
    if(pos>=thresh){state.currentPage++;loadMoreImages();}
  },100);
});

// ===== LOAD =====
async function loadImages(){
  state.isLoading=true;
  el.imageGrid.innerHTML='<div class="loading"><div class="loading-spinner"></div><p>Loading anime images...</p></div>';
  const images=await fetchImages(state.currentTag,state.currentPage);
  renderImages(images);state.isLoading=false;
}
async function loadMoreImages(){
  if(state.isLoading)return;
  state.isLoading=true;el.infiniteLoading.style.display='block';
  const images=await fetchImages(state.currentTag,state.currentPage);
  renderImages(images,true);state.isLoading=false;el.infiniteLoading.style.display='none';
}

// ===== INIT =====
async function init(){
  el.year.textContent=new Date().getFullYear();
  if('serviceWorker' in navigator)el.pwaStatus.textContent='PWA Ready';
  const categories=await fetchCategories();
  renderCategories(categories);
  await loadImages();
}
init();
