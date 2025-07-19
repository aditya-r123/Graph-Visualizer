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
        
        // Simple, elegant glow based on mouse speed
        const intensity = Math.min(speed * 0.5, 1.0);
        const hue = 240 + (speed * 20); // Subtle color shift
        
        // Update CSS custom properties
        logoElement.style.setProperty('--glow-intensity', intensity);
        logoElement.style.setProperty('--glow-hue', hue);
    }

    // Mouse move event listener
    document.addEventListener('mousemove', (e) => {
        calculateMouseSpeed(e.clientX, e.clientY);
    });

    // Logo hover detection
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
                logoElement.style.setProperty('--glow-hue', '240');
            });
    }

    // Panel Drag and Drop System
    let draggedPanel = null;
    let dragOffset = { x: 0, y: 0 };
    let previewBox = null;
    let originalPositions = new Map();
    let panelOrder = [];
    
    // Initialize draggable panels
    function initializeDraggablePanels() {
        const panels = [
            { id: 'basicControlsSection', title: 'Controls' },
            { id: 'editControlsSection', title: 'Edit Vertex' },
            { id: 'deleteModePanel', title: 'Delete Mode' },
            { id: 'searchSection', title: 'Search Algorithms' }
        ];
        
        // Create preview box
        previewBox = document.createElement('div');
        previewBox.className = 'panel-preview-box';
        previewBox.style.cssText = `
            position: absolute;
            background: rgba(128, 128, 128, 0.3);
            border: 2px dashed #666;
            border-radius: 8px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            transition: none;
        `;
        document.body.appendChild(previewBox);
        
        // Make panels draggable
        panels.forEach(panel => {
            const element = document.getElementById(panel.id);
            if (element) {
                element.classList.add('draggable-panel');
                element.setAttribute('data-panel-id', panel.id);
                element.setAttribute('data-panel-title', panel.title);
                
                // Make the entire panel draggable (except buttons and interactive elements)
                element.classList.add('panel-drag-handle');
                element.style.cursor = 'grab';
                element.style.position = 'relative';
                
                // Store original position
                originalPositions.set(panel.id, {
                    element: element,
                    rect: element.getBoundingClientRect()
                });
                
                panelOrder.push(panel.id);
            }
        });
        
        // Add event listeners
        addDragEventListeners();
    }
    
    function addDragEventListeners() {
        document.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
    
    function handleDragStart(e) {
        const dragHandle = e.target.closest('.panel-drag-handle');
        if (!dragHandle) return;
        
        // Don't start drag if clicking on interactive elements
        const interactiveElements = e.target.closest('button, input, select, textarea, a, .expand-icon, label, .control-group, .button-group, .slider-container, .checkbox-label, .checkmark');
        if (interactiveElements) return;
        
        e.preventDefault();
        e.stopPropagation(); // Prevent other interactions from triggering
        
        const panel = dragHandle.closest('.draggable-panel');
        if (!panel) return;
        
        draggedPanel = panel;
        const rect = panel.getBoundingClientRect();
        dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Show preview box
        previewBox.style.display = 'block';
        previewBox.style.width = rect.width + 'px';
        previewBox.style.height = rect.height + 'px';
        
        // Add dragging class
        panel.classList.add('dragging');
        panel.style.zIndex = '1001';
        panel.style.position = 'fixed';
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.width = rect.width + 'px';
        panel.style.opacity = '0.8';
        panel.style.transform = 'rotate(2deg)';
    }
    
    function handleDragMove(e) {
        if (!draggedPanel) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Update dragged panel position
        draggedPanel.style.left = newX + 'px';
        draggedPanel.style.top = newY + 'px';
        
        // Update preview box position
        const sidebar = document.querySelector('.sidebar');
        const sidebarRect = sidebar.getBoundingClientRect();
        const sidebarContent = document.querySelector('.sidebar-content');
        
        // Calculate where the panel would be dropped
        const dropY = e.clientY - sidebarRect.top + sidebarContent.scrollTop;
        const dropIndex = calculateDropIndex(dropY);
        
        // Show preview at drop position
        showPreviewAtPosition(dropIndex);
    }
    
    function handleDragEnd(e) {
        if (!draggedPanel) return;
        
        // Hide preview box
        previewBox.style.display = 'none';
        
        // Remove dragging styles
        draggedPanel.classList.remove('dragging');
        draggedPanel.style.zIndex = '';
        draggedPanel.style.position = '';
        draggedPanel.style.left = '';
        draggedPanel.style.top = '';
        draggedPanel.style.width = '';
        draggedPanel.style.opacity = '';
        draggedPanel.style.transform = '';
        
        // Calculate final drop position
        const sidebar = document.querySelector('.sidebar');
        const sidebarRect = sidebar.getBoundingClientRect();
        const sidebarContent = document.querySelector('.sidebar-content');
        const dropY = e.clientY - sidebarRect.top + sidebarContent.scrollTop;
        const dropIndex = calculateDropIndex(dropY);
        
        // Reorder panels
        reorderPanels(draggedPanel.getAttribute('data-panel-id'), dropIndex);
        
        draggedPanel = null;
    }
    
    function calculateDropIndex(dropY) {
        const panels = Array.from(document.querySelectorAll('.draggable-panel'));
        const sidebarContent = document.querySelector('.sidebar-content');
        const scrollIndicator = document.getElementById('scrollIndicator');
        
        // Get all panel positions
        const panelPositions = panels.map(panel => {
            const rect = panel.getBoundingClientRect();
            const sidebarRect = sidebarContent.getBoundingClientRect();
            return {
                id: panel.getAttribute('data-panel-id'),
                top: rect.top - sidebarRect.top + sidebarContent.scrollTop,
                bottom: rect.bottom - sidebarRect.top + sidebarContent.scrollTop
            };
        });
        
        // Find where to insert
        for (let i = 0; i < panelPositions.length; i++) {
            if (dropY < panelPositions[i].top + (panelPositions[i].bottom - panelPositions[i].top) / 2) {
                return i;
            }
        }
        
        return panelPositions.length;
    }
    
    function showPreviewAtPosition(dropIndex) {
        const panels = Array.from(document.querySelectorAll('.draggable-panel'));
        const sidebarContent = document.querySelector('.sidebar-content');
        const sidebarRect = sidebarContent.getBoundingClientRect();
        
        if (dropIndex >= panels.length) {
            // Drop at the end
            const lastPanel = panels[panels.length - 1];
            const lastRect = lastPanel.getBoundingClientRect();
            previewBox.style.left = (lastRect.left - sidebarRect.left) + 'px';
            previewBox.style.top = (lastRect.bottom - sidebarRect.top + 10) + 'px';
        } else {
            // Drop before the panel at dropIndex
            const targetPanel = panels[dropIndex];
            const targetRect = targetPanel.getBoundingClientRect();
            previewBox.style.left = (targetRect.left - sidebarRect.left) + 'px';
            previewBox.style.top = (targetRect.top - sidebarRect.top - 5) + 'px';
        }
    }
    
    function reorderPanels(draggedPanelId, dropIndex) {
        const panels = Array.from(document.querySelectorAll('.draggable-panel'));
        const sidebarContent = document.querySelector('.sidebar-content');
        const scrollIndicator = document.getElementById('scrollIndicator');
        
        // Remove dragged panel from current position
        const draggedPanel = document.getElementById(draggedPanelId);
        const currentIndex = panelOrder.indexOf(draggedPanelId);
        
        if (currentIndex > -1) {
            panelOrder.splice(currentIndex, 1);
        }
        
        // Insert at new position
        if (dropIndex >= panelOrder.length) {
            panelOrder.push(draggedPanelId);
        } else {
            panelOrder.splice(dropIndex, 0, draggedPanelId);
        }
        
        // Reorder DOM elements
        const panelsToReorder = panelOrder.map(id => document.getElementById(id)).filter(Boolean);
        
        // Clear sidebar content (except scroll indicator)
        const existingPanels = sidebarContent.querySelectorAll('.draggable-panel');
        existingPanels.forEach(panel => panel.remove());
        
        // Reinsert panels in new order
        panelsToReorder.forEach(panel => {
            sidebarContent.appendChild(panel);
        });
        
        // Save panel order to localStorage
        localStorage.setItem('panelOrder', JSON.stringify(panelOrder));
    }
    
    // Load saved panel order
    function loadPanelOrder() {
        const savedOrder = localStorage.getItem('panelOrder');
        if (savedOrder) {
            try {
                panelOrder = JSON.parse(savedOrder);
                // Apply saved order
                const sidebarContent = document.querySelector('.sidebar-content');
                const panels = panelOrder.map(id => document.getElementById(id)).filter(Boolean);
                
                const existingPanels = sidebarContent.querySelectorAll('.draggable-panel');
                existingPanels.forEach(panel => panel.remove());
                
                panels.forEach(panel => {
                    sidebarContent.appendChild(panel);
                });
            } catch (e) {
                console.error('Failed to load panel order:', e);
            }
        }
    }
    
    // Initialize draggable panels after DOM is ready
    setTimeout(() => {
        initializeDraggablePanels();
        loadPanelOrder();
    }, 100);

    // Now initialize the app
    new GraphCreator();
});