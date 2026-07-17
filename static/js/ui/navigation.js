document.addEventListener('DOMContentLoaded', function() {
    const navUpload = document.getElementById('nav-upload');
    const navPhoto = document.getElementById('nav-photo');
    const navVideo = document.getElementById('nav-video');
    const navAudio = document.getElementById('nav-audio');

    const uploadSection = document.getElementById('upload-section');
    const photoSection = document.getElementById('photo-section');
    const videoSection = document.getElementById('video-section');
    const audioSection = document.getElementById('audio-section');

    const navLinks = [navUpload, navPhoto, navVideo, navAudio];

    function hideAllSections() {
        uploadSection.classList.add('d-none');
        photoSection.classList.add('d-none');
        videoSection.classList.add('d-none');
        audioSection.classList.add('d-none');
    }

    function showSection(section, activeNav) {
        hideAllSections();
        section.classList.remove('d-none');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    navUpload.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(uploadSection, navUpload);
    });

    navPhoto.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(photoSection, navPhoto);
    });

    navVideo.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(videoSection, navVideo);
        // Load library files when video section is shown
        if (typeof loadLibraryFiles === 'function') {
            loadLibraryFiles();
        }
    });

    navAudio.addEventListener('click', function(e) {
        e.preventDefault();
        showSection(audioSection, navAudio);
    });
    
    navUpload.classList.add('active');
});
