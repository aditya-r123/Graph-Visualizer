import './styles.css';
import { GraphCreator } from './graphCreator.js';
import './assets/logo.png';

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
                element.style.position = 'relative';
                
                // Find the drag handle area and make it the drag handle
                const dragHandleArea = element.querySelector('.drag-handle-area');
                if (dragHandleArea) {
                    dragHandleArea.classList.add('panel-drag-handle');
                    dragHandleArea.style.cursor = 'grab';
                }
                
                // Force a reflow to ensure proper positioning
                element.offsetHeight;
                
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
    const HOLD_THRESHOLD = 450; // milliseconds - time to hold before entering drag mode
    const DRAG_THRESHOLD = 5; // pixels
    
    function handleDragStart(e) {
        // Check if clicking on a drag handle area
        const dragHandle = e.target.closest('.drag-handle-area');
        if (!dragHandle) return;
        
        // Get the panel that contains this drag handle
        const panel = dragHandle.closest('.draggable-panel');
        if (!panel) return;
        
        e.preventDefault();
        e.stopPropagation(); // Prevent other interactions from triggering
        

        
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
                
                // Panel is now in drag mode
                
                // Mouse coordinates will be hidden automatically by graphCreator.js
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
        let dropIndex;
        if (draggedSidebar === 'left') {
            const sidebar = document.querySelector('.sidebar');
            const sidebarRect = sidebar.getBoundingClientRect();
            const sidebarContent = document.querySelector('.sidebar-content');
            const dropY = e.clientY - sidebarRect.top + sidebarContent.scrollTop;
            dropIndex = calculateDropIndex(dropY, 'left');
            updateDropPreview('left', dropIndex, draggedPanel);
        } else if (draggedSidebar === 'right') {
            const rightSidebar = document.querySelector('.right-sidebar');
            const rightSidebarRect = rightSidebar.getBoundingClientRect();
            const rightSidebarContent = document.querySelector('.right-sidebar-content');
            const dropY = e.clientY - rightSidebarRect.top + rightSidebarContent.scrollTop;
            dropIndex = calculateDropIndex(dropY, 'right');
            updateDropPreview('right', dropIndex, draggedPanel);
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
            // Handle click - no action needed since expandable functionality is handled by graphCreator.js
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
        
        // Remove preview
        removeDropPreview();
        
        // Mouse coordinates will be shown automatically by graphCreator.js
        
        // Clean up
        draggedPanel.removeAttribute('data-dragging-sidebar');
        draggedPanel = null;
        isDragging = false;
    }
    
    function calculateDropIndex(dropY, sidebarType) {
        // Get the currently dragged panel
        const draggedPanel = document.querySelector('.draggable-panel.dragging');
        
        const panels = Array.from(document.querySelectorAll('.draggable-panel')).filter(panel => 
            panel.getAttribute('data-sidebar') === sidebarType && 
            panel !== draggedPanel
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
            const panelCenter = panelPositions[i].top + (panelPositions[i].bottom - panelPositions[i].top) / 2;
            if (dropY < panelCenter) {
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
        
        // Temporarily remove scroll indicator for left sidebar to avoid interference
        if (sidebarType === 'left' && scrollIndicator) {
            scrollIndicator.remove();
        }
        
        // Reinsert panels in new order
        panelsToReorder.forEach(panel => {
            sidebarContent.appendChild(panel);
        });
        
        // Ensure scroll indicator stays at the bottom for left sidebar
        if (sidebarType === 'left' && scrollIndicator) {
            sidebarContent.appendChild(scrollIndicator);
        }
        
        // Save panel order to localStorage (separate for each sidebar)
        const leftSidebarPanels = Array.from(document.querySelectorAll('.draggable-panel[data-sidebar="left"]')).map(panel => panel.getAttribute('data-panel-id'));
        const rightSidebarPanels = Array.from(document.querySelectorAll('.draggable-panel[data-sidebar="right"]')).map(panel => panel.getAttribute('data-panel-id'));
        
        localStorage.setItem('leftSidebarPanelOrder', JSON.stringify(leftSidebarPanels));
        localStorage.setItem('rightSidebarPanelOrder', JSON.stringify(rightSidebarPanels));
    }
    

    
    // Update drop preview
    function updateDropPreview(sidebarType, dropIndex, draggedPanel) {
        // Remove existing preview elements
        removeDropPreview();
        
        // Get panels for this sidebar, excluding the currently dragged panel
        const panels = Array.from(document.querySelectorAll('.draggable-panel')).filter(panel => 
            panel.getAttribute('data-sidebar') === sidebarType && 
            panel !== draggedPanel
        );
        
        if (panels.length === 0) return;
        

        
        // Get the dragged panel's height for preview
        const draggedPanelHeight = draggedPanel.offsetHeight;
        const draggedPanelMargin = 16; // 1rem margin between panels
        const totalHeight = draggedPanelHeight + draggedPanelMargin;
        
        // Always create preview - even when moving to original position
        // This ensures consistent behavior across both sidebars
        if (dropIndex === 0) {
            // Insert at the beginning
            createDropPreview(panels[0], 'before', totalHeight);
        } else if (dropIndex >= panels.length) {
            // Insert at the end
            createDropPreview(panels[panels.length - 1], 'after', totalHeight);
        } else {
            // Insert between panels
            createDropPreview(panels[dropIndex - 1], 'after', totalHeight);
        }
    }
    
    // Create drop preview element
    function createDropPreview(referencePanel, position, height) {
        const preview = document.createElement('div');
        preview.className = 'drop-preview';
        preview.style.height = height + 'px';
        preview.style.margin = '8px 0';
        preview.style.border = '2px dashed var(--primary-color)';
        preview.style.borderRadius = '8px';
        preview.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        preview.style.transition = 'all 0.2s ease';
        preview.style.position = 'relative';
        preview.style.zIndex = '999';
        
        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.position = 'absolute';
        indicator.style.left = '50%';
        indicator.style.top = '50%';
        indicator.style.transform = 'translate(-50%, -50%)';
        indicator.style.color = 'var(--primary-color)';
        indicator.style.fontSize = '0.875rem';
        indicator.style.fontWeight = '500';
        indicator.innerHTML = '<i class="fas fa-plus"></i> Drop here';
        preview.appendChild(indicator);
        
        // Insert the preview
        if (position === 'before') {
            referencePanel.parentNode.insertBefore(preview, referencePanel);
        } else {
            referencePanel.parentNode.insertBefore(preview, referencePanel.nextSibling);
        }
    }
    
    // Remove drop preview
    function removeDropPreview() {
        const previews = document.querySelectorAll('.drop-preview');
        previews.forEach(preview => preview.remove());
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
    function initializeApp() {
        initializeDraggablePanels();
        loadPanelOrder();
        
        // Force a reflow after initialization to ensure proper positioning
        setTimeout(() => {
            const panels = document.querySelectorAll('.draggable-panel');
            panels.forEach(panel => {
                panel.offsetHeight; // Force reflow
            });
        }, 50);
    }
    
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // DOM is already ready
        setTimeout(initializeApp, 100);
    }

    // Now initialize the app
    new GraphCreator();
});