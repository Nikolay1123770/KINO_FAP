const urlParams = new URLSearchParams(window.location.search);
const src = decodeURIComponent(urlParams.get("src"));

const player = videojs("videoPlayer", {
  autoplay: true,
  controls: true,
  preload: "auto",
  fluid: true,
  sources: [{ src, type: "application/x-mpegURL" }]
});

// WebSocket для чата и синхронизации
const WS_URL = "wss://kino-fap1.onrender.com/ws"; // твой Render-сервер
const ws = new WebSocket(WS_URL);

// Отправка сообщений
function sendMessage() {
  const input = document.getElementById("msgInput");
  if (input.value.trim()) {
    ws.send(JSON.stringify({ type: "chat", text: input.value }));
    input.value = "";
  }
}

// Вывод чата
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "chat") {
    const li = document.createElement("li");
    li.textContent = data.text;
    document.getElementById("messages").appendChild(li);
  }
};
