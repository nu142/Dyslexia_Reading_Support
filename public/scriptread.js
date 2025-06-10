// DOM Elements
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");

// Reference text
const referenceText = document.getElementById("reading-text").innerText.trim();

// Speech recognition variables
let recognition = null;
let transcript = "";
let startTime = 0;
let finalTranscript = "";

// Text-to-speech for status messages
let speechSynthesisUtterance;
let selectedFemaleVoice = null;

// Speak function with female voice selection
function speak(text) {
  if (speechSynthesisUtterance) {
    window.speechSynthesis.cancel();
  }

  speechSynthesisUtterance = new SpeechSynthesisUtterance(text);

  // Use selected female voice if available
  if (selectedFemaleVoice) {
    speechSynthesisUtterance.voice = selectedFemaleVoice;
  }

  window.speechSynthesis.speak(speechSynthesisUtterance);
}

// Load and select female voice when available
function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  selectedFemaleVoice = voices.find(
    (voice) =>
      voice.name.toLowerCase().includes("female") ||
      voice.name.toLowerCase().includes("woman") ||
      voice.name.toLowerCase().includes("susan") ||
      voice.name.toLowerCase().includes("zira") ||
      voice.name.toLowerCase().includes("samantha")
  );
}

// Initialize speech recognition
function initSpeechRecognition() {
  try {
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      transcriptEl.innerHTML = `
                <p>${finalTranscript}</p>
                <p><em style="color: #888;">${interimTranscript}</em></p>
            `;
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      statusEl.textContent = `Error: ${event.error}. Please try again.`;
      speak(statusEl.textContent);
      resetUI();
    };

    recognition.onend = () => {
      if (!stopBtn.disabled) {
        recognition.start();
        statusEl.textContent = "Still listening...";
        speak(statusEl.textContent);
      }
    };

    return true;
  } catch (error) {
    console.error("Speech recognition not supported:", error);
    statusEl.textContent =
      "Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.";
    speak(statusEl.textContent);
    startBtn.disabled = true;
    return false;
  }
}

// Start the reading test
function startTest() {
  if (!recognition && !initSpeechRecognition()) {
    return;
  }

  finalTranscript = "";
  transcriptEl.innerHTML = "<p>Listening...</p>";
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.textContent = "Listening... Read the passage aloud.";
  speak(statusEl.textContent);
  startTime = Date.now();

  try {
    recognition.start();
  } catch (error) {
    console.error("Could not start recognition:", error);
    statusEl.textContent =
      "Error starting recognition. Please refresh the page and try again.";
    speak(statusEl.textContent);
    resetUI();
  }
}

// Stop the reading test
function stopTest() {
  if (!recognition) return;

  const duration = (Date.now() - startTime) / 1000;
  recognition.stop();
  stopBtn.disabled = true;
  startBtn.disabled = false;
  submitBtn.disabled = false;
  statusEl.textContent = "Reading complete! Please review and submit.";
  speak(statusEl.textContent);
  analyzeReading(finalTranscript, referenceText, duration);
}

// Reset UI state
function resetUI() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  submitBtn.disabled = true;
}

// Calculate Word Error Rate (WER)
function calculateWER(reference, hypothesis) {
  reference = reference
    .toLowerCase()
    .split(" ")
    .filter((word) => word);
  hypothesis = hypothesis
    .toLowerCase()
    .split(" ")
    .filter((word) => word);
  const dp = Array(hypothesis.length + 1)
    .fill()
    .map(() => Array(reference.length + 1).fill(0));
  for (let i = 0; i <= hypothesis.length; i++) dp[i][0] = i;
  for (let j = 0; j <= reference.length; j++) dp[0][j] = j;
  for (let i = 1; i <= hypothesis.length; i++) {
    for (let j = 1; j <= reference.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + (hypothesis[i - 1] === reference[j - 1] ? 0 : 1),
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1
      );
    }
  }
  return dp[hypothesis.length][reference.length] / reference.length;
}

// Detect letter reversals
function detectLetterReversals(transcript, reference) {
  const reversals = [
    ["b", "d"],
    ["d", "b"],
    ["p", "q"],
    ["q", "p"],
  ];
  let reversalCount = 0;
  const transcriptWords = transcript.toLowerCase().split(" ");
  const referenceWords = reference.toLowerCase().split(" ");
  for (
    let i = 0;
    i < Math.min(transcriptWords.length, referenceWords.length);
    i++
  ) {
    const tWord = transcriptWords[i];
    const rWord = referenceWords[i];
    if (tWord && rWord) {
      for (const [char1, char2] of reversals) {
        if (tWord.includes(char1) && rWord.includes(char2) && tWord !== rWord) {
          reversalCount++;
          break;
        }
      }
    }
  }
  return reversalCount;
}

// Detect syllable omissions
function detectSyllableOmissions(transcript, reference) {
  const transcriptWords = transcript.toLowerCase().split(" ");
  const referenceWords = reference.toLowerCase().split(" ");
  let omissionCount = 0;
  for (
    let i = 0;
    i < Math.min(transcriptWords.length, referenceWords.length);
    i++
  ) {
    const tWord = transcriptWords[i];
    const rWord = referenceWords[i];
    if (tWord && rWord && tWord.length < rWord.length * 0.7) {
      omissionCount++;
    }
  }
  return omissionCount;
}

// Analyze reading
function analyzeReading(spokenText, originalText, durationSec) {
  const wordCount = originalText.split(" ").length;
  const expectedDuration = wordCount * 0.5;
  const wer = calculateWER(originalText, spokenText);
  const reversals = detectLetterReversals(spokenText, originalText);
  const omissions = detectSyllableOmissions(spokenText, originalText);

  const readingScores = {
    auditory: 0,
    phonological: 0,
    visual: 0,
    math: 0,
    memory: 0,
  };

  if (durationSec > expectedDuration * 1.5) {
    readingScores.auditory = 3;
  } else if (durationSec > expectedDuration * 1.2) {
    readingScores.auditory = 2;
  } else {
    readingScores.auditory = 1;
  }

  if (wer > 0.3 || omissions > 2) {
    readingScores.phonological = 3;
  } else if (wer > 0.15 || omissions > 0) {
    readingScores.phonological = 2;
  } else {
    readingScores.phonological = 1;
  }

  if (reversals > 2 || wer > 0.3) {
    readingScores.visual = 3;
  } else if (reversals > 0 || wer > 0.15) {
    readingScores.visual = 2;
  } else {
    readingScores.visual = 1;
  }

  readingScores.math = 1;

  if (durationSec > expectedDuration * 1.5 || wer > 0.3) {
    readingScores.memory = 3;
  } else if (durationSec > expectedDuration * 1.2 || wer > 0.15) {
    readingScores.memory = 2;
  } else {
    readingScores.memory = 1;
  }

  localStorage.setItem("readingScores", JSON.stringify(readingScores));
  console.log("Reading scores saved:", readingScores);
}

// Submit reading data
function submitReading() {
  const readingData = JSON.parse(localStorage.getItem("readingScores"));
  if (!readingData) {
    statusEl.textContent = "No reading data found. Please try again.";
    speak(statusEl.textContent);
    return;
  }

  statusEl.textContent = "Submitting your reading...";
  speak(statusEl.textContent);

  setTimeout(() => {
    statusEl.textContent = "Reading submitted successfully!";
    speak(statusEl.textContent);
    window.location.href = "home.html";
  }, 1500);
}

// Event listeners
startBtn.addEventListener("click", startTest);
stopBtn.addEventListener("click", stopTest);
submitBtn.addEventListener("click", submitReading);

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  transcriptEl.innerHTML =
    '<p class="transcript-placeholder">Your reading will appear here as you speak...</p>';
  submitBtn.disabled = true;

  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    loadVoices();
    statusEl.textContent = "Ready to begin";
    speak(statusEl.textContent);
    initSpeechRecognition();
  } else {
    statusEl.textContent =
      "Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.";
    speak(statusEl.textContent);
    startBtn.disabled = true;
  }
});

// Reload voices when available
window.speechSynthesis.onvoiceschanged = () => {
  loadVoices();
};
