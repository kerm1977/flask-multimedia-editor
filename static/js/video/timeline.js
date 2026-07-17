document.addEventListener('DOMContentLoaded', function() {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    initTimeline(timeline);
});

function initTimeline(timeline) {
    timeline.innerHTML = '';
    
    const track = createTimelineTrack();
    timeline.appendChild(track);
    
    // Don't create the small playhead - we use the large timeline playhead instead
    // const playhead = createPlayhead();
    // timeline.appendChild(playhead);
    
    timeline.addEventListener('click', handleTimelineClick);
    
    console.log('Timeline inicializado');
}

function createTimelineTrack() {
    const track = document.createElement('div');
    track.className = 'timeline-track';
    track.id = 'main-track';
    return track;
}

function createPlayhead() {
    const playhead = document.createElement('div');
    playhead.style.position = 'absolute';
    playhead.style.left = '0px';
    playhead.style.top = '0px';
    playhead.style.width = '2px';
    playhead.style.height = '100%';
    playhead.style.backgroundColor = '#ff0000';
    playhead.style.zIndex = '10';
    playhead.id = 'playhead';
    return playhead;
}

function updateTimeline(currentTime, duration) {
    const playhead = document.getElementById('playhead');
    const timeline = document.getElementById('timeline');
    
    if (!playhead || !timeline || duration === 0) return;
    
    const percentage = (currentTime / duration) * 100;
    const position = (percentage / 100) * timeline.offsetWidth;
    
    playhead.style.left = position + 'px';
}

function handleTimelineClick(event) {
    const timeline = document.getElementById('timeline');
    const videoPlayer = document.getElementById('video-player');
    
    if (!timeline || !videoPlayer) return;
    
    const rect = timeline.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / timeline.offsetWidth;
    
    if (videoPlayer.duration) {
        const newTime = percentage * videoPlayer.duration;
        videoPlayer.currentTime = newTime;
    }
}

function addClipToTimeline(startTime, duration, name) {
    const track = document.getElementById('main-track');
    if (!track) return;
    
    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.textContent = name;
    
    const timeline = document.getElementById('timeline');
    const percentage = (startTime / 10) * 100;
    const widthPercentage = (duration / 10) * 100;
    
    clip.style.left = percentage + '%';
    clip.style.width = widthPercentage + '%';
    
    track.appendChild(clip);
}

