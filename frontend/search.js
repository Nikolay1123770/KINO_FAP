const sInput = document.getElementById('searchInput');
const sResults = document.getElementById('searchResults');

sInput?.addEventListener('input', async (e)=>{
  const q = e.target.value.trim();
  if(!q){ sResults.innerHTML=''; return; }
  if(/^\d+$/.test(q)){
    sResults.innerHTML = `<div class="result" onclick="location.href='watch.html?id=${q}'">
      <img src="https://via.placeholder.com/48x72?text=ID"/>
      <div><div><b>Открыть по ID:</b> ${q}</div><div class="sub">Kinopoisk ID</div></div>
    </div>`;
    return;
  }
  // title search
  if(!KINOPOISK_API_KEY || KINOPOISK_API_KEY.includes('REPLACE')){
    sResults.innerHTML = `<div class="sub" style="color:#aaa">Поиск по названию доступен с API ключом</div>`;
    return;
  }
  const url=`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(q)}&page=1`;
  const r=await fetch(url,{headers:{'X-API-KEY':KINOPOISK_API_KEY}});
  const d=await r.json();
  const items = (d.films||[]).slice(0,10);
  sResults.innerHTML = items.map(f=>{
    const id = f.filmId;
    const t = f.nameRu||f.nameEn||'Без названия';
    const p = f.posterUrlPreview||'';
    const sub = [f.year, f.rating?`⭐ ${f.rating}`:''].filter(Boolean).join(' • ');
    return `<div class="result" onclick="location.href='watch.html?id=${id}'">
      <img src="${p}" alt="${t}"/>
      <div><div>${t}</div><div class="sub">${sub}</div></div>
    </div>`;
  }).join('');
});
