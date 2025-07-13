import './styles.css';
import { GraphCreator } from './graphCreator.js';

document.addEventListener('DOMContentLoaded', () => {
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
        document.querySelector('.app-container').classList.remove('instructions-active');
    }

    function showInstructionsModal() {
        if (overlay) {
            overlay.classList.add('show');
            overlay.style.display = 'flex';
        }
        document.querySelector('.app-container').classList.add('instructions-active');
    }

    window.showInstructionsModal = showInstructionsModal;

    if (closeBtnX) closeBtnX.addEventListener('click', hideInstructionsModal);
    if (gotItBtn) gotItBtn.addEventListener('click', hideInstructionsModal);

    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            if (!e.target.closest('button, input, select, textarea, a')) {
                hideInstructionsModal();
            }
        });
    }

    // Now initialize the app
    new GraphCreator();
});