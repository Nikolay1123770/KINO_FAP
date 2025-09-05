// Твои плейлисты
const PLAYLISTS = [
  "https://iptvmaster.ru/Filmy_60_FPS.m3u",
  "https://iptvmaster.ru/film1.m3u",
  "https://iptvmaster.ru/films-Karnei4.m3u",
  "https://webarmen.com/my/iptv/auto.nogrp.m3u"
];

// Адрес твоего прокси на Render
// ⚠️ Замени kino-proxy.onrender.com на свой реальный URL
const PROXY = "https://kino-proxy.onrender.com/proxy?url=";

// Функция для загрузки и парсинга плейлиста
async function loadPlaylist(url) {
  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) {
      throw new Error("Ошибка загрузки: " + res.status);
    }

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
  } catch (e) {
    console.error("Ошибка при загрузке плейлиста", url, e);
    return [];
  }
}

// Загружаем все плейлисты и собираем общий список
async function loadAllPlaylists() {
  let all = [];
  for (let p of PLAYLISTS) {
    const items = await loadPlaylist(p);
    all = all.concat(items);
  }
  return all;
}
