import './styles.css';
import { GraphCreator } from './graphCreator.js';

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GraphCreator();
    
    // Instructions overlay logic
    var overlay = document.getElementById('instructionsOverlay');
    var modalContent = document.querySelector('.modal-content.instructions-content');
    var closeBtnX = document.getElementById('closeInstructionsX');
    var gotItBtn = document.getElementById('hideInstructions');

    function hideInstructionsModal() {
        if (overlay) {
            overlay.classList.remove('show');
            overlay.style.display = 'none';
        }
    }

    if (closeBtnX) closeBtnX.addEventListener('click', hideInstructionsModal);
    if (gotItBtn) gotItBtn.addEventListener('click', hideInstructionsModal);

    // Dismiss modal when clicking anywhere inside the modal content (gray box)
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            if (!e.target.closest('button, input, select, textarea, a')) {
                hideInstructionsModal();
            }
        });
    }

    // Dismiss modal when clicking outside modal-dialog (overlay background)
    if (overlay) {
        overlay.addEventListener('mousedown', function(e) {
            if (e.target === overlay) {
                hideInstructionsModal();
            }
        });
        overlay.addEventListener('touchstart', function(e) {
            if (e.target === overlay) {
                hideInstructionsModal();
            }
        });
        // Auto-dismiss after 10 seconds
        setTimeout(hideInstructionsModal, 10000);
    }
});