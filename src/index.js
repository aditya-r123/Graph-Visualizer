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
    let originalPositions = new Map();
    
    // Initialize draggable panels
    function initializeDraggablePanels() {
        const leftSidebarPanels = [
            { id: 'basicControlsSection', title: 'Controls', sidebar: 'left' },
            { id: 'editControlsSection', title: 'Edit Vertex', sidebar: 'left' },
            { id: 'deleteModePanel', title: 'Delete Mode', sidebar: 'left' },
            { id: 'searchSection', title: 'Search Algorithms', sidebar: 'left' }
        ];
        
        const rightSidebarPanels = [
            { id: 'saveExportSection', title: 'Save & Export', sidebar: 'right' },
            { id: 'canvasManagementSection', title: 'Canvas Management', sidebar: 'right' },
            { id: 'utilitiesSection', title: 'Utilities', sidebar: 'right' }
        ];
        
        const allPanels = [...leftSidebarPanels, ...rightSidebarPanels];
        
        // Make panels draggable
        allPanels.forEach(panel => {
            const element = document.getElementById(panel.id);
            if (element) {
                element.classList.add('draggable-panel');
                element.setAttribute('data-panel-id', panel.id);
                element.setAttribute('data-panel-title', panel.title);
                element.setAttribute('data-sidebar', panel.sidebar);
                
                // Make the entire panel draggable (except buttons and interactive elements)
                element.classList.add('panel-drag-handle');
                element.style.cursor = 'grab';
                element.style.position = 'relative';
                
                // Store original position
                originalPositions.set(panel.id, {
                    element: element,
                    rect: element.getBoundingClientRect()
                });
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
    
    // Variables for click vs drag detection
    let dragStartTime = 0;
    let dragStartPos = { x: 0, y: 0 };
    let isDragging = false;
    let dragHoldTimer = null;
    const HOLD_THRESHOLD = 300; // milliseconds - time to hold before entering drag mode
    const DRAG_THRESHOLD = 5; // pixels
    
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
        
        // Initialize drag detection
        dragStartTime = Date.now();
        dragStartPos = { x: e.clientX, y: e.clientY };
        isDragging = false;
        
        draggedPanel = panel;
        const rect = panel.getBoundingClientRect();
        dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Store the sidebar type for this panel
        draggedPanel.setAttribute('data-dragging-sidebar', draggedPanel.getAttribute('data-sidebar'));
        
        // Add holding class for visual feedback
        panel.classList.add('holding');
        
        // Start hold timer - only enter drag mode after holding for 0.3 seconds
        dragHoldTimer = setTimeout(() => {
            if (draggedPanel && !isDragging) {
                isDragging = true;
                
                // Remove holding class and add dragging class
                draggedPanel.classList.remove('holding');
                draggedPanel.classList.add('dragging');
                draggedPanel.style.zIndex = '1001';
                draggedPanel.style.position = 'fixed';
                draggedPanel.style.left = rect.left + 'px';
                draggedPanel.style.top = rect.top + 'px';
                draggedPanel.style.width = rect.width + 'px';
                draggedPanel.style.opacity = '0.8';
                draggedPanel.style.transform = 'rotate(2deg)';
            }
        }, HOLD_THRESHOLD);
    }
    
    function handleDragMove(e) {
        if (!draggedPanel || !isDragging) return;
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Update dragged panel position
        draggedPanel.style.left = newX + 'px';
        draggedPanel.style.top = newY + 'px';
        
        // Get the sidebar type for the dragged panel
        const draggedSidebar = draggedPanel.getAttribute('data-dragging-sidebar');
        
        // Calculate where the panel would be dropped based on sidebar type
        if (draggedSidebar === 'left') {
            const sidebar = document.querySelector('.sidebar');
            const sidebarRect = sidebar.getBoundingClientRect();
            const sidebarContent = document.querySelector('.sidebar-content');
            const dropY = e.clientY - sidebarRect.top + sidebarContent.scrollTop;
            const dropIndex = calculateDropIndex(dropY, 'left');
        } else if (draggedSidebar === 'right') {
            const rightSidebar = document.querySelector('.right-sidebar');
            const rightSidebarRect = rightSidebar.getBoundingClientRect();
            const rightSidebarContent = document.querySelector('.right-sidebar-content');
            const dropY = e.clientY - rightSidebarRect.top + rightSidebarContent.scrollTop;
            const dropIndex = calculateDropIndex(dropY, 'right');
        }
    }
    
    function handleDragEnd(e) {
        if (!draggedPanel) return;
        
        // Clear the hold timer
        if (dragHoldTimer) {
            clearTimeout(dragHoldTimer);
            dragHoldTimer = null;
        }
        
        if (isDragging) {
            // Handle drag - reorder panels
            // Get the sidebar type for the dragged panel
            const draggedSidebar = draggedPanel.getAttribute('data-dragging-sidebar');
            
            // Calculate final drop position based on sidebar type
            let dropIndex;
            if (draggedSidebar === 'left') {
                const sidebar = document.querySelector('.sidebar');
                const sidebarRect = sidebar.getBoundingClientRect();
                const sidebarContent = document.querySelector('.sidebar-content');
                const dropY = e.clientY - sidebarRect.top + sidebarContent.scrollTop;
                dropIndex = calculateDropIndex(dropY, 'left');
            } else if (draggedSidebar === 'right') {
                const rightSidebar = document.querySelector('.right-sidebar');
                const rightSidebarRect = rightSidebar.getBoundingClientRect();
                const rightSidebarContent = document.querySelector('.right-sidebar-content');
                const dropY = e.clientY - rightSidebarRect.top + rightSidebarContent.scrollTop;
                dropIndex = calculateDropIndex(dropY, 'right');
            }
            
            // Reorder panels
            reorderPanels(draggedPanel.getAttribute('data-panel-id'), dropIndex, draggedSidebar);
        } else {
            // Handle click - toggle panel expansion
            handlePanelClick(draggedPanel);
        }
        
        // Remove dragging styles
        draggedPanel.classList.remove('dragging', 'holding');
        draggedPanel.style.zIndex = '';
        draggedPanel.style.position = '';
        draggedPanel.style.left = '';
        draggedPanel.style.top = '';
        draggedPanel.style.width = '';
        draggedPanel.style.opacity = '';
        draggedPanel.style.transform = '';
        
        // Clean up
        draggedPanel.removeAttribute('data-dragging-sidebar');
        draggedPanel = null;
        isDragging = false;
    }
    
    function calculateDropIndex(dropY, sidebarType) {
        const panels = Array.from(document.querySelectorAll('.draggable-panel')).filter(panel => 
            panel.getAttribute('data-sidebar') === sidebarType
        );
        
        let sidebarContent, scrollIndicator;
        if (sidebarType === 'left') {
            sidebarContent = document.querySelector('.sidebar-content');
            scrollIndicator = document.getElementById('scrollIndicator');
        } else if (sidebarType === 'right') {
            sidebarContent = document.querySelector('.right-sidebar-content');
            scrollIndicator = null; // Right sidebar doesn't have a scroll indicator
        }
        
        // Get all panel positions for this sidebar
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
    

    
    function reorderPanels(draggedPanelId, dropIndex, sidebarType) {
        const panels = Array.from(document.querySelectorAll('.draggable-panel')).filter(panel => 
            panel.getAttribute('data-sidebar') === sidebarType
        );
        
        let sidebarContent, scrollIndicator;
        if (sidebarType === 'left') {
            sidebarContent = document.querySelector('.sidebar-content');
            scrollIndicator = document.getElementById('scrollIndicator');
        } else if (sidebarType === 'right') {
            sidebarContent = document.querySelector('.right-sidebar-content');
            scrollIndicator = null;
        }
        
        // Get panel order for this specific sidebar
        const sidebarPanelOrder = panels.map(panel => panel.getAttribute('data-panel-id'));
        
        // Remove dragged panel from current position
        const draggedPanel = document.getElementById(draggedPanelId);
        const currentIndex = sidebarPanelOrder.indexOf(draggedPanelId);
        
        if (currentIndex > -1) {
            sidebarPanelOrder.splice(currentIndex, 1);
        }
        
        // Insert at new position
        if (dropIndex >= sidebarPanelOrder.length) {
            sidebarPanelOrder.push(draggedPanelId);
        } else {
            sidebarPanelOrder.splice(dropIndex, 0, draggedPanelId);
        }
        
        // Reorder DOM elements
        const panelsToReorder = sidebarPanelOrder.map(id => document.getElementById(id)).filter(Boolean);
        
        // Clear sidebar content (except scroll indicator for left sidebar)
        const existingPanels = sidebarContent.querySelectorAll('.draggable-panel');
        existingPanels.forEach(panel => panel.remove());
        
        // Reinsert panels in new order
        panelsToReorder.forEach(panel => {
            sidebarContent.appendChild(panel);
        });
        
        // Save panel order to localStorage (separate for each sidebar)
        const leftSidebarPanels = Array.from(document.querySelectorAll('.draggable-panel[data-sidebar="left"]')).map(panel => panel.getAttribute('data-panel-id'));
        const rightSidebarPanels = Array.from(document.querySelectorAll('.draggable-panel[data-sidebar="right"]')).map(panel => panel.getAttribute('data-panel-id'));
        
        localStorage.setItem('leftSidebarPanelOrder', JSON.stringify(leftSidebarPanels));
        localStorage.setItem('rightSidebarPanelOrder', JSON.stringify(rightSidebarPanels));
    }
    
    // Handle panel click to toggle expansion
    function handlePanelClick(panel) {
        // Find the expandable header within this panel
        const expandableHeader = panel.querySelector('.expandable-header');
        if (!expandableHeader) return;
        
        // Find the target content
        const targetId = expandableHeader.getAttribute('data-target');
        if (!targetId) return;
        
        const targetContent = document.getElementById(targetId);
        if (!targetContent) return;
        
        // Toggle the expansion
        const isExpanded = targetContent.classList.contains('show');
        
        if (isExpanded) {
            // Collapse
            targetContent.classList.remove('show');
            expandableHeader.classList.remove('expanded');
            const expandIcon = expandableHeader.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.style.transform = 'rotate(0deg)';
            }
        } else {
            // Expand
            targetContent.classList.add('show');
            expandableHeader.classList.add('expanded');
            const expandIcon = expandableHeader.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.style.transform = 'rotate(180deg)';
            }
        }
    }
    
    // Load saved panel order
    function loadPanelOrder() {
        // Migrate from old format if needed
        const oldOrder = localStorage.getItem('panelOrder');
        if (oldOrder) {
            try {
                const oldPanelOrder = JSON.parse(oldOrder);
                // Convert old format to new format (all old panels were left sidebar)
                localStorage.setItem('leftSidebarPanelOrder', oldOrder);
                localStorage.removeItem('panelOrder');
            } catch (e) {
                console.error('Failed to migrate old panel order:', e);
            }
        }
        
        // Load left sidebar order
        const savedLeftOrder = localStorage.getItem('leftSidebarPanelOrder');
        if (savedLeftOrder) {
            try {
                const leftPanelOrder = JSON.parse(savedLeftOrder);
                const sidebarContent = document.querySelector('.sidebar-content');
                const leftPanels = leftPanelOrder.map(id => document.getElementById(id)).filter(Boolean);
                
                const existingLeftPanels = sidebarContent.querySelectorAll('.draggable-panel[data-sidebar="left"]');
                existingLeftPanels.forEach(panel => panel.remove());
                
                leftPanels.forEach(panel => {
                    sidebarContent.appendChild(panel);
                });
            } catch (e) {
                console.error('Failed to load left sidebar panel order:', e);
            }
        }
        
        // Load right sidebar order
        const savedRightOrder = localStorage.getItem('rightSidebarPanelOrder');
        if (savedRightOrder) {
            try {
                const rightPanelOrder = JSON.parse(savedRightOrder);
                const rightSidebarContent = document.querySelector('.right-sidebar-content');
                const rightPanels = rightPanelOrder.map(id => document.getElementById(id)).filter(Boolean);
                
                const existingRightPanels = rightSidebarContent.querySelectorAll('.draggable-panel[data-sidebar="right"]');
                existingRightPanels.forEach(panel => panel.remove());
                
                rightPanels.forEach(panel => {
                    rightSidebarContent.appendChild(panel);
                });
            } catch (e) {
                console.error('Failed to load right sidebar panel order:', e);
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