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

let playlist = [];
let currentSongIndex = -1;
let isPlaying = false;

function toggleControls(enable) {
    playPauseBtn.disabled = !enable;
    prevBtn.disabled = !enable;
    nextBtn.disabled = !enable;
}

function loadSong(index) {
    if (playlist.length === 0) return;

    if (index >= 0 && index < playlist.length) {
        currentSongIndex = index;
        const file = playlist[currentSongIndex];

        const audioURL = URL.createObjectURL(file);
        audioPlayer.src = audioURL;
        audioPlayer.load();

        currentTitleEl.textContent = file.name;
        currentArtistAlbumEl.textContent = "Local File - Unknown Metadata";

        updatePlaylistUI();

        if (isPlaying) {
            playSong();
        } else {
            progressBar.value = 0;
            toggleControls(true);
        }
    }
}

function playPause() {
    if (playlist.length === 0) return;

    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶️ Play';
        isPlaying = false;
    } else {
        if (currentSongIndex === -1) {
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

function nextSong() {
    if (playlist.length === 0) return;

    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

function prevSong() {
    if (playlist.length === 0) return;

    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
    playSong();
}

function handleFiles(files) {
    const newSongs = Array.from(files).filter(file => file.type.startsWith('audio/'));

    if (newSongs.length > 0) {
        playlist.push(...newSongs);
        renderPlaylist();

        if (currentSongIndex === -1) {
            loadSong(0);
            playSong();
        }
    }
}

function clearPlaylist() {
    audioPlayer.pause();
    isPlaying = false;

    audioPlayer.src = '';
    currentSongIndex = -1;
    playlist = [];

    renderPlaylist();
    currentTitleEl.textContent = "No Song Loaded";
    currentArtistAlbumEl.textContent = "Click 'Add Song' to begin";
    playPauseBtn.textContent = '▶️ Play';
    progressBar.value = 0;
    toggleControls(false);
}

function renderPlaylist() {
    playlistEl.innerHTML = '';

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

        li.addEventListener('click', () => {
            loadSong(index);
            playSong();
        });

        playlistEl.appendChild(li);
    });
    updatePlaylistUI();
}

function updatePlaylistUI() {
    const listItems = playlistEl.querySelectorAll('li:not(.empty-message)');
    listItems.forEach((li, index) => {
        li.classList.toggle('active', index === currentSongIndex);
    });
}

audioFileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
});

clearPlaylistBtn.addEventListener('click', clearPlaylist);

playPauseBtn.addEventListener('click', playPause);

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});

audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const progressPercentage = (currentTime / duration) * 100;

        progressBar.value = progressPercentage;
    }
});

progressBar.addEventListener('click', (e) => {
    if (audioPlayer.duration) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPosition = (clickX / rect.width);
        const newTime = clickPosition * audioPlayer.duration;

        audioPlayer.currentTime = newTime;
    }
});

audioPlayer.addEventListener('ended', nextSong);

document.addEventListener('DOMContentLoaded', () => {
    renderPlaylist();

    audioPlayer.volume = volumeSlider.value / 100;

    toggleControls(false);
});