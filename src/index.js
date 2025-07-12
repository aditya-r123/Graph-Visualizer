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

    function showInstructionsModal() {
        if (overlay) {
            overlay.classList.add('show');
            overlay.style.display = 'flex';
        }
    }

    // Make showInstructionsModal globally available
    window.showInstructionsModal = showInstructionsModal;

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
    
    // Eye tracking for sun and moon
    const themeToggle = document.getElementById('themeToggle');
    const sunPupils = document.querySelectorAll('.sun-icon .pupil');
    const moonPupils = document.querySelectorAll('.moon-icon .pupil');
    
    function updateEyePosition(e) {
        const rect = themeToggle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from center
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        
        // Track eyes across the entire screen with constrained movement
        // Keep pupils within the eye socket boundaries (eye radius = 1.1, pupil radius = 0.6)
        // Maximum movement = eye radius - pupil radius = 1.1 - 0.6 = 0.5
        const maxMove = 0.5; // Constrain to stay within eye socket
        const sensitivity = 0.008; // Reduced sensitivity for smoother movement
        
        // Calculate movement with constraints
        const moveX = Math.max(-maxMove, Math.min(maxMove, deltaX * sensitivity));
        const moveY = Math.max(-maxMove, Math.min(maxMove, deltaY * sensitivity));
        
        // Apply movement to all pupils
        const allPupils = [...sunPupils, ...moonPupils];
        allPupils.forEach(pupil => {
            pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }
    
    // Track mouse movement
    document.addEventListener('mousemove', updateEyePosition);
    
    // Reset eyes when mouse leaves window
    document.addEventListener('mouseleave', () => {
        const allPupils = [...sunPupils, ...moonPupils];
        allPupils.forEach(pupil => {
            pupil.style.transform = 'translate(0px, 0px)';
        });
    });
    
    // Scroll indicator logic
    const sidebarContent = document.querySelector('.sidebar-content');
    const scrollIndicator = document.getElementById('scrollIndicator');
    let totalScrollDelta = 0;
    let lastScrollTop = 0;
    let indicatorHidden = false;
    
    function checkScrollIndicator() {
        if (sidebarContent && scrollIndicator && !indicatorHidden) {
            const hasScrollableContent = sidebarContent.scrollHeight > sidebarContent.clientHeight;
            const isScrolledToBottom = sidebarContent.scrollTop + sidebarContent.clientHeight >= sidebarContent.scrollHeight - 10;
            
            if (hasScrollableContent && !isScrolledToBottom) {
                scrollIndicator.classList.add('show');
            } else {
                scrollIndicator.classList.remove('show');
            }
        }
    }
    
    // Check on load and resize
    checkScrollIndicator();
    window.addEventListener('resize', checkScrollIndicator);
    
    // Track scroll delta and hide indicator permanently after 150px total scroll
    if (sidebarContent) {
        sidebarContent.addEventListener('scroll', (e) => {
            if (!indicatorHidden) {
                const currentScrollTop = sidebarContent.scrollTop;
                const scrollDelta = Math.abs(currentScrollTop - lastScrollTop);
                totalScrollDelta += scrollDelta;
                lastScrollTop = currentScrollTop;
                
                // Hide indicator permanently if total scroll delta reaches 150px
                if (totalScrollDelta >= 150) {
                    indicatorHidden = true;
                    scrollIndicator.classList.remove('show');
                    scrollIndicator.style.display = 'none';
                } else {
                    checkScrollIndicator();
                }
            }
        });
    }
    
    // Scroll to bottom and hide indicator when clicked
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            if (sidebarContent) {
                sidebarContent.scrollTo({
                    top: sidebarContent.scrollHeight,
                    behavior: 'smooth'
                });
            }
            scrollIndicator.classList.remove('show');
        });
    }
});