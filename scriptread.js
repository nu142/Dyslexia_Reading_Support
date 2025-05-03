// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');

// Reference text (the text we expect users to read)
const referenceText = document.getElementById('reading-text').innerText.trim();

// Speech recognition variables
let recognition = null;
let transcript = '';
let startTime = 0;
let finalTranscript = '';

// Initialize speech recognition
function initSpeechRecognition() {
    try {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Handle speech recognition results
        recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Display transcripts
            transcriptEl.innerHTML = `
                <p>${finalTranscript}</p>
                <p><em style="color: #888;">${interimTranscript}</em></p>
            `;
            
            // Scroll to bottom of transcript to show latest content
            transcriptEl.scrollTop = transcriptEl.scrollHeight;
        };
        
        // Handle speech recognition errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            statusEl.textContent = `Error: ${event.error}. Please try again.`;
            resetUI();
        };
        
        // Handle when speech recognition ends
        recognition.onend = () => {
            if (stopBtn.disabled === false) {
                // If we're still in recording mode but recognition stopped, restart it
                recognition.start();
                statusEl.textContent = 'Still listening...';
            }
        };
        
        return true;
    } catch (error) {
        console.error('Speech recognition not supported:', error);
        statusEl.textContent = 'Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.';
        startBtn.disabled = true;
        return false;
    }
}

// Start the reading test
function startTest() {
    if (!recognition && !initSpeechRecognition()) {
        return;
    }
    
    // Reset previous results
    finalTranscript = '';
    transcriptEl.innerHTML = '<p>Listening...</p>';
    
    // Update UI
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = 'Listening... Read the passage aloud.';
    
    // Start recording time
    startTime = Date.now();
    
    // Start recognition
    try {
        recognition.start();
    } catch (error) {
        console.error('Could not start recognition:', error);
        statusEl.textContent = 'Error starting recognition. Please refresh the page and try again.';
        resetUI();
    }
}

// Stop the reading test and save the results
function stopTest() {
    if (!recognition) return;
    
    // Calculate duration
    const duration = (Date.now() - startTime) / 1000; // in seconds
    
    // Stop recognition
    recognition.stop();
    
    // Update UI
    stopBtn.disabled = true;
    startBtn.disabled = false;
    submitBtn.disabled = false;
    statusEl.textContent = 'Reading complete! Please review and submit.';
    
    // Save the reading data to localStorage (would connect to backend in real app)
    saveReadingData(finalTranscript, referenceText, duration);
}

// Reset UI state
function resetUI() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    submitBtn.disabled = true;
}

// Save reading data for later analysis
function saveReadingData(spokenText, originalText, durationSec) {
    // In a real app, this would be sent to a backend server
    // For now, we'll just save to localStorage as demonstration
    const readingData = {
        spokenText: spokenText,
        originalText: originalText,
        durationSec: durationSec,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('lastReadingAssessment', JSON.stringify(readingData));
    
    console.log('Reading data saved:', readingData);
    
    // Here you would typically redirect to a results page
    // window.location.href = 'results.html';
}

// Submit reading data to server/next page
function submitReading() {
    // Get the saved reading data
    const readingData = JSON.parse(localStorage.getItem('lastReadingAssessment'));
    
    if (!readingData) {
        statusEl.textContent = 'No reading data found. Please try again.';
        return;
    }
    
    // Here you would typically submit to a server
    // For now, we'll simulate a submission
    statusEl.textContent = 'Submitting your reading...';
    
    // Simulate sending data to server
    setTimeout(() => {
        statusEl.textContent = 'Reading submitted successfully!';
        
        // Normally you would redirect to results page
        // window.location.href = 'results.html';
        
        // Reset for another attempt
        setTimeout(() => {
            startBtn.disabled = false;
            submitBtn.disabled = true;
            finalTranscript = '';
            transcriptEl.innerHTML = '<p class="transcript-placeholder">Your reading will appear here as you speak...</p>';
            statusEl.textContent = 'Ready for another reading';
        }, 2000);
    }, 1500);
}

// Event listeners
startBtn.addEventListener('click', startTest);
stopBtn.addEventListener('click', stopTest);
submitBtn.addEventListener('click', submitReading);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Clear placeholder when starting
    transcriptEl.innerHTML = '<p class="transcript-placeholder">Your reading will appear here as you speak...</p>';
    
    // Disable submit button initially
    submitBtn.disabled = true;
    
    // Check if speech recognition is available
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        statusEl.textContent = 'Ready to begin';
        initSpeechRecognition();
    } else {
        statusEl.textContent = 'Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.';
        startBtn.disabled = true;
    }
});
