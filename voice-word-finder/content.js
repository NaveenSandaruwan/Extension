let matches = [];
let currentIndex = -1;
let isListening = false;

// Create robot button
const robot = document.createElement("img");
robot.src = chrome.runtime.getURL("robot.png");
robot.id = "voice-robot";
robot.title = "Click to talk!";
robot.alt = "Voice Robot";

// Debug: Log the image source URL
console.log("Robot image URL:", robot.src);

// Ensure robot is visible with inline styles as fallback
robot.style.position = "fixed";
robot.style.bottom = "30px";
robot.style.right = "30px";
robot.style.width = "60px";
robot.style.height = "60px";
robot.style.zIndex = "9999";
robot.style.cursor = "pointer";
robot.style.transition = "all 1.5s ease-in-out"; // Smooth transition for all properties including position
robot.style.border = "2px solid red"; // Temporary red border to see if element exists

// Handle image load events
robot.onload = function () {
  console.log("Robot image loaded successfully!");
  robot.style.border = "none"; // Remove red border when image loads
};

robot.onerror = function () {
  console.error("Failed to load robot image!");
  // Fallback: Create a colored div if image fails to load
  robot.style.backgroundColor = "#4CAF50";
  robot.style.borderRadius = "50%";
  robot.style.border = "none";
  robot.innerHTML = "🤖";
  robot.style.fontSize = "30px";
  robot.style.textAlign = "center";
  robot.style.lineHeight = "60px";
};

document.body.appendChild(robot);

// Add highlight CSS class name
const highlightClass = "voice-highlight";

// Reset robot to default position
function resetRobotPosition() {
  robot.style.position = "fixed";
  robot.style.bottom = "30px";
  robot.style.right = "30px";
  robot.style.left = "auto";
  robot.style.top = "auto";
  robot.style.zIndex = "9999";
  robot.style.transition = "all 1.5s ease-in-out"; // Ensure smooth transition when returning home
}

// Clear existing highlights
function clearHighlights() {
  matches.forEach((span) => (span.outerHTML = span.innerText));
  matches = [];
  currentIndex = -1;
  resetRobotPosition(); // Reset robot to default position when clearing
}

// Highlight all matches
function highlightWord(word) {
  clearHighlights();
  const regex = new RegExp(`\\b${word}\\b`, "gi");
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      !node.parentElement ||
      ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)
    )
      continue;
    let result;
    while ((result = regex.exec(node.textContent)) !== null) {
      const span = document.createElement("span");
      span.className = highlightClass;
      span.textContent = result[0];

      const after = node.splitText(result.index);
      after.textContent = after.textContent.substring(result[0].length);
      node.parentNode.insertBefore(span, after);
      matches.push(span);

      // Move walker back to after node
      walker.currentNode = after;
      break; // one match per text node
    }
  }

  if (matches.length > 0) {
    currentIndex = 0;
    focusMatch(currentIndex);
  }
}

// Focus and scroll to match
function focusMatch(index) {
  if (index < 0 || index >= matches.length) return;
  matches.forEach((m, i) => m.classList.toggle("active", i === index));
  const el = matches[index];

  // Scroll to the element first
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Simple positioning with proper delay
  setTimeout(() => {
    // Get the element's position after scroll completes
    const rect = el.getBoundingClientRect();

    // Calculate position relative to the document
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    // Position robot to the left of the highlighted word
    const robotLeft = scrollLeft + rect.left - 80; // 80px to the left
    const robotTop = scrollTop + rect.top - 10; // 10px above

    // Ensure robot doesn't go off-screen
    const minLeft = scrollLeft + 10;
    const minTop = scrollTop + 10;

    const finalLeft = Math.max(minLeft, robotLeft);
    const finalTop = Math.max(minTop, robotTop);

    // Set robot position with smooth animation
    robot.style.position = "absolute";
    robot.style.transition = "all 1.5s ease-in-out"; // Ensure smooth movement
    robot.style.left = `${finalLeft}px`;
    robot.style.top = `${finalTop}px`;
    robot.style.zIndex = "10000";

    console.log(`Element rect: top=${rect.top}, left=${rect.left}`);
    console.log(`Scroll position: top=${scrollTop}, left=${scrollLeft}`);
    console.log(`Robot final position: left=${finalLeft}px, top=${finalTop}px`);
  }, 800); // Longer delay to ensure smooth scroll completes
}

// Speech recognition
let recog;
if ("webkitSpeechRecognition" in window) {
  recog = new webkitSpeechRecognition();
  recog.continuous = false;
  recog.lang = "en-US";

  recog.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);
    if (transcript.startsWith("find ")) {
      const word = transcript.slice(5).trim();
      highlightWord(word);
    } else if (transcript === "next") {
      if (currentIndex < matches.length - 1) currentIndex++;
      focusMatch(currentIndex);
    } else if (["back", "previous"].includes(transcript)) {
      if (currentIndex > 0) currentIndex--;
      focusMatch(currentIndex);
    }
  };

  recog.onerror = (e) => console.error("Speech error:", e);
  recog.onend = () => {
    robot.classList.remove("listening");
    isListening = false;
  };
}

// Start/stop listening on click
robot.addEventListener("click", () => {
  if (isListening || !recog) return;
  recog.start();
  robot.classList.add("listening");
  isListening = true;
});
