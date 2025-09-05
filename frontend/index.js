document.addEventListener("DOMContentLoaded", async () => {
  const catalog = document.getElementById("catalog");
  const items = await loadAllPlaylists();

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <button onclick="watch('${encodeURIComponent(item.url)}')">Смотреть</button>
    `;
    catalog.appendChild(card);
  });
});

function watch(url) {
  window.location.href = `watch.html?src=${url}`;
}
