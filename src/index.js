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

    // Mouse speed tracking for dynamic glow effect
    let mousePositions = [];
    let lastMouseTime = Date.now();
    let mouseSpeed = 0;
    let isHoveringLogo = false;
    let logoElement = null;

    function calculateMouseSpeed(currentX, currentY) {
        const now = Date.now();
        const timeDelta = now - lastMouseTime;
        
        if (mousePositions.length > 0) {
            const lastPos = mousePositions[mousePositions.length - 1];
            const distance = Math.sqrt(
                Math.pow(currentX - lastPos.x, 2) + 
                Math.pow(currentY - lastPos.y, 2)
            );
            
            // Calculate velocity in pixels per millisecond
            mouseSpeed = distance / timeDelta;
            
            // Apply physics-based smoothing with damping
            const damping = 0.95;
            mouseSpeed = mouseSpeed * damping + (mouseSpeed * (1 - damping));
            
            // Clamp speed to reasonable range
            mouseSpeed = Math.min(mouseSpeed, 2.0);
            mouseSpeed = Math.max(mouseSpeed, 0.0);
        }
        
        // Store current position and time
        mousePositions.push({ x: currentX, y: currentY, time: now });
        
        // Keep only last 5 positions for smooth calculation
        if (mousePositions.length > 5) {
            mousePositions.shift();
        }
        
        lastMouseTime = now;
        
        // Update glow intensity if hovering logo
        if (isHoveringLogo && logoElement) {
            updateGlowIntensity(mouseSpeed);
        }
    }

    function updateGlowIntensity(speed) {
        if (!logoElement) return;
        
        // Convert speed to glow intensity using physics-based formulas
        const baseIntensity = 0.3;
        const speedMultiplier = Math.pow(speed, 1.5); // Non-linear response
        const intensity = Math.min(baseIntensity + speedMultiplier, 1.0);
        
        // Apply physics-based glow effects
        const glowRadius = 20 + (speed * 30); // Dynamic radius
        const glowOpacity = 0.3 + (speed * 0.7); // Dynamic opacity
        const pulseFrequency = 2 + (speed * 3); // Dynamic pulse
        
        // Update CSS custom properties for real-time glow adjustment
        logoElement.style.setProperty('--glow-intensity', intensity);
        logoElement.style.setProperty('--glow-radius', `${glowRadius}px`);
        logoElement.style.setProperty('--glow-opacity', glowOpacity);
        logoElement.style.setProperty('--pulse-frequency', `${pulseFrequency}s`);
        
        // Add velocity-based color shift
        const colorShift = Math.min(speed * 50, 30);
        const hue = 240 + colorShift; // Shift from blue to purple/cyan
        logoElement.style.setProperty('--glow-hue', hue);
    }

    // Mouse move event listener
    document.addEventListener('mousemove', (e) => {
        calculateMouseSpeed(e.clientX, e.clientY);
    });

    // Logo hover detection
    document.addEventListener('DOMContentLoaded', () => {
        logoElement = document.querySelector('.logo');
        
        if (logoElement) {
            logoElement.addEventListener('mouseenter', () => {
                isHoveringLogo = true;
                logoElement.classList.add('logo-hover');
            });
            
            logoElement.addEventListener('mouseleave', () => {
                isHoveringLogo = false;
                logoElement.classList.remove('logo-hover');
                // Reset glow to base state
                logoElement.style.setProperty('--glow-intensity', '0.3');
                logoElement.style.setProperty('--glow-radius', '20px');
                logoElement.style.setProperty('--glow-opacity', '0.3');
                logoElement.style.setProperty('--pulse-frequency', '2s');
                logoElement.style.setProperty('--glow-hue', '240');
            });
        }
    });

    // Now initialize the app
    new GraphCreator();
});