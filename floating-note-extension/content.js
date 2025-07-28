// Create container
const container = document.createElement("div");
container.id = "floating-note-container";

// Create close button
const closeBtn = document.createElement("button");
closeBtn.id = "floating-note-close";
closeBtn.textContent = "×";
closeBtn.title = "Close note";

// Create mic button
const micBtn = document.createElement("button");
micBtn.id = "floating-note-mic";
micBtn.textContent = "🎤";
micBtn.title = "Speak to add to note";

// Create textarea
const note = document.createElement("textarea");
note.id = "floating-note";
note.placeholder = "Take notes here...";

// Append to container
const topBar = document.createElement("div");
topBar.id = "floating-note-topbar";
topBar.appendChild(micBtn);
topBar.appendChild(closeBtn);

container.appendChild(topBar);
container.appendChild(note);
document.body.appendChild(container);

// Storage key per domain
const key = `note_${location.hostname}`;
chrome.storage.local.get([key], (result) => {
  if (result[key]) note.value = result[key];
});

// Save on input
note.addEventListener("input", () => {
  const data = {};
  data[key] = note.value;
  chrome.storage.local.set(data);
});

// Drag container
container.addEventListener("mousedown", (e) => {
  if (e.target.closest("textarea") || e.target.tagName === "BUTTON") return;

  let shiftX = e.clientX - container.getBoundingClientRect().left;
  let shiftY = e.clientY - container.getBoundingClientRect().top;

  function moveAt(pageX, pageY) {
    container.style.left = pageX - shiftX + "px";
    container.style.top = pageY - shiftY + "px";
  }

  function onMouseMove(e) {
    moveAt(e.pageX, e.pageY);
  }

  document.addEventListener("mousemove", onMouseMove);
  container.onmouseup = () => {
    document.removeEventListener("mousemove", onMouseMove);
    container.onmouseup = null;
  };
});

container.ondragstart = () => false;

// Close button
closeBtn.addEventListener("click", () => {
  container.style.display = "none";
});

// 🎤 Microphone speech recognition
micBtn.addEventListener("click", () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    micBtn.textContent = "🎙️"; // show recording
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    note.value += (note.value ? "\n" : "") + transcript;
    note.dispatchEvent(new Event("input")); // trigger save
  };

  recognition.onerror = (e) => {
    console.error("Speech error", e);
  };

  recognition.onend = () => {
    micBtn.textContent = "🎤";
  };

  recognition.start();
});
