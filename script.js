// --- 1. Audio and DOM Element References ---
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const volumeSlider = document.getElementById('volume-slider');
const playlistEl = document.getElementById('playlist');
const currentTitleEl = document.getElementById('current-title');
const currentArtistAlbumEl = document.getElementById('current-artist-album');
const audioFileInput = document.getElementById('audio-file-input');
const clearPlaylistBtn = document.getElementById('clear-playlist-btn');

let playlist = []; // Dynamic playlist now starts empty
let currentSongIndex = -1;
let isPlaying = false;

// --- 2. Core Functions ---

// Enable/Disable main control buttons based on playlist size
function toggleControls(enable) {
    playPauseBtn.disabled = !enable;
    prevBtn.disabled = !enable;
    nextBtn.disabled = !enable;
}

// Load and start playing a song from the playlist
function loadSong(index) {
    if (playlist.length === 0) return;

    if (index >= 0 && index < playlist.length) {
        currentSongIndex = index;
        const file = playlist[currentSongIndex];

        // Use URL.createObjectURL() to make the local file playable by the <audio> element
        const audioURL = URL.createObjectURL(file);
        audioPlayer.src = audioURL;
        audioPlayer.load(); // Load the new file

        // Update Song Information Display
        currentTitleEl.textContent = file.name;
        // NOTE: File API does not easily get metadata (Artist/Album). We use a placeholder.
        currentArtistAlbumEl.textContent = "Local File - Unknown Metadata";

        // Update Playlist UI
        updatePlaylistUI();

        // If a song was already playing, start the new one automatically
        if (isPlaying) {
            playSong();
        } else {
            // Reset progress bar on load if not playing
            progressBar.value = 0;
            // Enable controls once a file is loaded
            toggleControls(true);
        }
    }
}

// Handle Play/Pause Functionality
function playPause() {
    if (playlist.length === 0) return;

    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶️ Play';
        isPlaying = false;
    } else {
        if (currentSongIndex === -1) {
             // If player is idle, load the first song
            loadSong(0);
        }
        playSong();
    }
}

function playSong() {
    audioPlayer.play();
    playPauseBtn.textContent = '⏸️ Pause';
    isPlaying = true;
}

// Handle Playlist Navigation
function nextSong() {
    if (playlist.length === 0) return;

    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

function prevSong() {
    if (playlist.length === 0) return;

    // Loop back to the end if the current song is the first one
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

// --- 3. Dynamic Playlist Management ---

// Handle files selected by the user
function handleFiles(files) {
    // Convert FileList to Array and filter for audio files
    const newSongs = Array.from(files).filter(file => file.type.startsWith('audio/'));

    if (newSongs.length > 0) {
        // Add new files to the playlist array
        playlist.push(...newSongs);
        renderPlaylist();

        // If no song was playing, load the first one added
        if (currentSongIndex === -1) {
            loadSong(0);
            playSong();
        }
    }
}

// Clear the entire playlist
function clearPlaylist() {
    // Pause playback
    audioPlayer.pause();
    isPlaying = false;

    // Clear audio source and reset controls
    audioPlayer.src = '';
    currentSongIndex = -1;
    playlist = [];

    // Update UI
    renderPlaylist();
    currentTitleEl.textContent = "No Song Loaded";
    currentArtistAlbumEl.textContent = "Click 'Add Song' to begin";
    playPauseBtn.textContent = '▶️ Play';
    progressBar.value = 0;
    toggleControls(false);
}

// --- 4. UI Rendering and Event Listeners ---

// Populate the Playlist UI
function renderPlaylist() {
    playlistEl.innerHTML = ''; // Clear existing list

    if (playlist.length === 0) {
        const li = document.createElement('li');
        li.classList.add('empty-message');
        li.textContent = "No songs added. Click 'Add Song(s)' above.";
        playlistEl.appendChild(li);
        return;
    }

    playlist.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${file.name}`;
        li.dataset.index = index;

        // Add click listener to load and play song
        li.addEventListener('click', () => {
            loadSong(index);
            playSong();
        });

        playlistEl.appendChild(li);
    });
    updatePlaylistUI();
}

// Update the 'active' class on the playlist items
function updatePlaylistUI() {
    const listItems = playlistEl.querySelectorAll('li:not(.empty-message)');
    listItems.forEach((li, index) => {
        li.classList.toggle('active', index === currentSongIndex);
    });
}


// --- Event Handlers ---

// Listen for file selection
audioFileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Clear the input so the user can re-upload the same file later
});

// Clear Playlist Button
clearPlaylistBtn.addEventListener('click', clearPlaylist);

// Play/Pause Button
playPauseBtn.addEventListener('click', playPause);

// Previous/Next Buttons
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Volume Control (Updates audio volume based on slider position)
volumeSlider.addEventListener('input', (e) => {
    // Slider value is 0-100, audio volume is 0.0-1.0
    audioPlayer.volume = e.target.value / 100;
});

// Progress Bar (Updates during playback)
audioPlayer.addEventListener('timeupdate', () => {
    // Only update if the song's duration is available
    if (audioPlayer.duration) {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const progressPercentage = (currentTime / duration) * 100;

        progressBar.value = progressPercentage;
    }
});

// Seeking (Allows user to click on the progress bar)
progressBar.addEventListener('click', (e) => {
    if (audioPlayer.duration) {
        // Calculate the click position relative to the progress bar width
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPosition = (clickX / rect.width); // 0.0 to 1.0
        const newTime = clickPosition * audioPlayer.duration;

        // Set the new time for the audio player (Fulfills seek requirement)
        audioPlayer.currentTime = newTime;
    }
});

// End of Song (Automatically plays the next song)
audioPlayer.addEventListener('ended', nextSong);


// --- 5. Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Render the initial empty playlist
    renderPlaylist();

    // 2. Set initial volume based on the slider
    audioPlayer.volume = volumeSlider.value / 100;

    // 3. Disable controls until a song is loaded
    toggleControls(false);
});