let page=1, loading=false, done=false;
const grid=document.getElementById('grid');
const sentinel=document.getElementById('sentinel');
const detailModal=document.getElementById('detailModal');
const detailBody=document.getElementById('detailBody');

// Fetch popular list (KP unofficial) or fallback demo
async function fetchPopular(page){
  if(!KINOPOISK_API_KEY || KINOPOISK_API_KEY.includes('REPLACE')){
    // Fallback demo items
    const items=[
      {kinopoiskId:301,nameRu:'Матрица',year:1999,posterUrl:'https://st.kp.yandex.net/images/film_big/301.jpg',ratingKinopoisk:8.7,genres:[{genre:'фантастика'}]},
      {kinopoiskId:535341,nameRu:'Начало',year:2010,posterUrl:'https://st.kp.yandex.net/images/film_big/535341.jpg',ratingKinopoisk:8.7,genres:[{genre:'триллер'}]},
      {kinopoiskId:258687,nameRu:'Интерстеллар',year:2014,posterUrl:'https://st.kp.yandex.net/images/film_big/258687.jpg',ratingKinopoisk:8.6,genres:[{genre:'драма'}]},
    ];
    return {items, total: items.length};
  }
  const url=`https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=${page}`;
  const r=await fetch(url,{headers:{'X-API-KEY':KINOPOISK_API_KEY}});
  if(!r.ok) throw new Error('API error');
  const d=await r.json();
  const items=(d.films||d.items||[]).map(x=>({
    kinopoiskId: x.filmId||x.kinopoiskId,
    nameRu: x.nameRu||x.nameEn, year: x.year,
    posterUrl: x.posterUrl||x.posterUrlPreview,
    ratingKinopoisk: x.rating&&parseFloat(x.rating)||x.ratingKinopoisk,
    genres: x.genres
  }));
  return {items, total: d.pagesCount||200};
}

function cardTpl(f){
  const rating = f.ratingKinopoisk ? ` • ⭐ ${f.ratingKinopoisk}`:'';
  const year = f.year? `, ${f.year}`:'';
  return `<div class="card" data-id="${f.kinopoiskId}">
    <img src="${f.posterUrl||''}" alt="${f.nameRu||''}"/>
    <div class="meta">
      <div class="title">${f.nameRu||'Без названия'}</div>
      <div class="sub">${(f.genres?.[0]?.genre)||''}${year}${rating}</div>
    </div>
  </div>`;
}

async function loadMore(){
  if(loading||done) return; loading=true;
  try{
    const {items,total}=await fetchPopular(page);
    if(!items.length){ done=true; sentinel.textContent='Больше нет'; return; }
    grid.insertAdjacentHTML('beforeend', items.map(cardTpl).join(''));
    page++;
  }catch(e){ console.error(e); sentinel.textContent='Ошибка загрузки'; }
  finally{ loading=false; }
}

const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) loadMore(); });
});
io.observe(sentinel);

// Details modal on click
grid.addEventListener('click', async (e)=>{
  const card=e.target.closest('.card');
  if(!card) return;
  const id=card.dataset.id;
  const d = await fetchDetails(id);
  showDetails(d);
});

async function fetchDetails(id){
  if(!KINOPOISK_API_KEY || KINOPOISK_API_KEY.includes('REPLACE')){
    return {kinopoiskId:id, nameRu:'Фильм '+id, posterUrl:'https://via.placeholder.com/300x450?text='+id, description:'Описание недоступно без API ключа', genres:[{genre:'жанр'}], countries:[{country:'страна'}], year:'', ratingKinopoisk:'', ratingImdb:'', filmLength:''};
  }
  const r=await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`,{headers:{'X-API-KEY':KINOPOISK_API_KEY}});
  return await r.json();
}

function showDetails(f){
  const genres=(f.genres||[]).map(x=>x.genre).join(', ');
  const countries=(f.countries||[]).map(x=>x.country).join(', ');
  detailBody.innerHTML=`
    <div class="detail">
      <img src="${f.posterUrl||f.posterUrlPreview||''}" alt="${f.nameRu}"/>
      <div>
        <h2>${f.nameRu||f.nameEn||'Без названия'}</h2>
        <div class="kv">
          ${f.year?`<span class="tag">${f.year}</span>`:''}
          ${genres?`<span class="tag">${genres}</span>`:''}
          ${countries?`<span class="tag">${countries}</span>`:''}
          ${f.filmLength?`<span class="tag">⏱ ${f.filmLength} мин</span>`:''}
          ${f.ratingKinopoisk?`<span class="tag">⭐ КП ${f.ratingKinopoisk}</span>`:''}
          ${f.ratingImdb?`<span class="tag">⭐ IMDb ${f.ratingImdb}</span>`:''}
        </div>
        <p style="color:#ddd">${f.description||'Без описания'}</p>
        <div class="detail-actions">
          <button class="btn" onclick="location.href='watch.html?id=${f.kinopoiskId}'">Смотреть</button>
          <button class="btn secondary" onclick="createTogether(${f.kinopoiskId})">Смотреть вместе</button>
          <button class="btn ghost" onclick="openTrailer(${f.kinopoiskId})">Трейлер</button>
          <button class="btn ghost" onclick="toggleFav(${f.kinopoiskId}, '${(f.nameRu||'').replace("'","\'")}', '${(f.posterUrl||'').replace("'","\'")}')">⭐ В избранное</button>
        </div>
      </div>
    </div>`;
  detailModal.classList.add('show');
}

document.getElementById('closeDetail').onclick=()=>detailModal.classList.remove('show');

function createTogether(id){
  const room=Math.random().toString(36).slice(2,8);
  location.href=`watch.html?id=${id}&room=${room}`;
}

function openTrailer(id){
  // Встроим трейлер в новой вкладке, если API вернул ссылку; иначе YouTube поиск
  window.open(`https://www.youtube.com/results?search_query=трейлер+${id}+kinopoisk`, '_blank');
}

// Favorites
function getFav(){ return JSON.parse(localStorage.getItem('favorites')||'[]'); }
function saveFav(x){ localStorage.setItem('favorites', JSON.stringify(x)); }
function toggleFav(id,title,poster){
  let list=getFav();
  const has=list.some(i=>i.id==id);
  if(has){ list=list.filter(i=>i.id!=id); } else { list.push({id,title,poster}); }
  saveFav(list);
}

// Search modal (simple)
const searchModal=document.getElementById('searchModal');
document.getElementById('openSearch').onclick=()=>{ searchModal.classList.add('show'); setTimeout(()=>document.getElementById('searchInput').focus(),0); };
document.getElementById('closeSearch').onclick=()=>searchModal.classList.remove('show');
document.addEventListener('keydown',e=>{ if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); searchModal.classList.add('show'); } });
