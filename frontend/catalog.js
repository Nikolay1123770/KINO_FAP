const PLAYLISTS = [
  "https://iptvmaster.ru/Filmy_60_FPS.m3u",
  "https://iptvmaster.ru/film1.m3u",
  "https://iptvmaster.ru/films-Karnei4.m3u",
  "https://webarmen.com/my/iptv/auto.nogrp.m3u"
];

// Парсер M3U
async function loadPlaylist(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split("\n");

  const items = [];
  let title = "";

  for (let line of lines) {
    if (line.startsWith("#EXTINF")) {
      title = line.split(",").pop().trim();
    } else if (line.startsWith("http")) {
      items.push({ title, url: line });
    }
  }
  return items;
}

// Загружаем все плейлисты
async function loadAllPlaylists() {
  let all = [];
  for (let p of PLAYLISTS) {
    try {
      const items = await loadPlaylist(p);
      all = all.concat(items);
    } catch (e) {
      console.error("Ошибка загрузки плейлиста", p, e);
    }
  }
  return all;
}
