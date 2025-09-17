// Minimal landing interactions
document.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.getElementById('enterEditorBtn');
    if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
            // no-op; regular link navigation to /editor handled by href
        });
    }
});


