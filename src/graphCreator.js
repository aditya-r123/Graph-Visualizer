export class GraphCreator {
    constructor() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.vertices = [];
        this.edges = [];
        this.nextVertexId = 1;
        this.selectedVertices = [];
        this.draggedVertex = null;
        this.isDragging = false;
        this.vertexSize = 25;
        this.edgeType = 'straight';
        this.edgeDirection = 'undirected'; // 'undirected', 'directed-forward', 'directed-backward'
        this.defaultEdgeWeight = null;
        this.isDistanceMode = false;
        this.distanceModeVertices = [];
        this.isSearching = false;
        this.searchAnimation = null;
        this.visitedVertices = new Set();
        this.pathVertices = new Set();
        this.currentTheme = 'dark';
        this.savedGraphs = [];
        this.autoSaveInterval = null;
        this.editingVertex = null;
        this.lastSavedState = null;
        this.autosaveEnabled = true;
        
        // Target selection properties
        this.selectedTargetVertex = null;
        
        // Edge dragging properties
        this.draggedEdge = null;
        this.isDraggingEdge = false;
        this.edgeControlPointSize = 8;
        
        // Long-press and edit mode properties
        this.longPressTimer = null;
        this.longPressDuration = 2000; // 2 seconds
        this.isLongPressing = false;
        this.editModeElement = null; // Currently selected element for editing
        this.editModeType = null; // 'vertex' or 'edge'
        this.shakeAnimation = null;
        this.shakeOffset = 0;
        this.shakeDirection = 1;
        
        // Hold timer visual feedback properties
        this.holdStartTime = null;
        this.holdProgressVertex = null;
        this.holdProgressAnimation = null;
        this.holdProgress = 0;
        this.holdTimerWasActive = false; // Track if hold timer was active to prevent edge creation
        
        // Apply to all properties
        this.applyToAllVertices = false;
        this.applyToAllEdges = false;
        
        // Flash effect properties
        this.flashingVertices = new Set();
        this.distanceFlashingVertices = null;
        this.flashTimer = null;
        
        // Delete mode properties
        this.isDeleteMode = false;
        this.verticesToDelete = new Set();
        this.originalVertices = [];
        this.originalEdges = [];
        

        
        // Mouse coordinate tracking
        this.mouseCoordinates = { x: 0, y: 0 };
        this.showMouseCoordinates = true;
        this.mouseOverCanvas = false;
        
        // Coordinate grid properties
        this.showCoordinateGrid = false;
        this.gridDensity = 50; // Default density (10-100)
        this.gridSpacing = 50; // Calculated from density
        
        // Mouse interaction properties
        this.dragThreshold = 5; // Minimum distance to consider as drag
        this.isDragging = false;
        this.draggedVertex = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hasDragged = false;
        this.justFinishedDragging = false; // Flag to prevent clicks after drag
        this.longPressTimer = null;
        this.longPressDelay = 2500; // 2.5 seconds for edit mode
        
        // Debug mode for phantom node detection
        this.debugMode = false;
        this.vertexDrawCount = new Map(); // Track how many times each vertex is drawn
        
        // Styling properties
        this.vertexColor = '#1e293b';
        this.vertexBorderColor = '#475569';
        this.vertexFontSize = 14;
        this.vertexFontFamily = 'Inter';
        this.vertexFontColor = '#ffffff';
        
        this.edgeColor = '#6366f1';
        this.edgeWidth = 3;
        this.edgeFontSize = 14;
        this.edgeFontFamily = 'Inter';
        this.edgeFontColor = '#06b6d4';
        
        this.editingZoneWidth = null; // Store current editing zone width
        this.editingZoneHeight = null;
        
        this.initializeCanvas();
        this.initializeEventListeners();
        this.startAutoSave();
        this.loadSavedGraphs();
        this.updateInfo();
        this.updateTime();
        this.updateTargetVertexDisplay();
        
        // Enable debug mode for phantom node detection (set to false in production)
        this.debugMode = true;
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
        
        // Add event listener for the reset button after DOM is loaded
        // (call this in constructor or after DOMContentLoaded)
        this.setupResetTargetBtn();

        // In constructor, after DOMContentLoaded, call this.setupMinimalEditModeEvents();
        this.setupMinimalEditModeEvents();
        
        // Setup expandable sections
        this.setupExpandableSections();
        
        // Setup mouse coordinate tracking
        this.setupMouseCoordinateTracking();
        
        // Initialize grid spacing
        this.updateGridSpacing();
        this.initializeEditingZoneIndicator();
    }
    
    initializeEditingZoneIndicator() {
        // Set up the editing zone indicator width on load and resize
        const updateEditingZone = () => {
            const leftSidebar = document.querySelector('.sidebar');
            const rightSidebar = document.querySelector('.right-sidebar');
            const mainContent = document.querySelector('.main-content');
            const indicator = document.querySelector('.editing-zone-indicator');
            if (!leftSidebar || !rightSidebar || !mainContent || !indicator) return;

            // Get bounding rects
            const leftRect = leftSidebar.getBoundingClientRect();
            const rightRect = rightSidebar.getBoundingClientRect();
            const mainRect = mainContent.getBoundingClientRect();

            // Calculate the available width between the right edge of the left sidebar and the left edge of the right sidebar
            const zoneLeft = leftRect.right;
            const zoneRight = rightRect.left;
            const zoneWidth = Math.max(0, zoneRight - zoneLeft);
            const zoneHeight = mainRect.height;

            // Set the indicator's width and left offset
            indicator.style.width = zoneWidth + 'px';
            indicator.style.left = (zoneLeft - mainRect.left) + 'px';
            indicator.style.height = zoneHeight + 'px';

            // Store for drag boundary
            this.editingZoneWidth = zoneWidth;
            this.editingZoneHeight = zoneHeight;

            // Update label
            indicator.setAttribute('data-zone-label', `${Math.round(zoneWidth)}×${Math.round(zoneHeight)} Editing Zone`);
            // Update the ::before content using a CSS variable
            indicator.style.setProperty('--zone-label', `'${Math.round(zoneWidth)}×${Math.round(zoneHeight)} Editing Zone'`);
        };
        window.addEventListener('resize', updateEditingZone);
        window.addEventListener('DOMContentLoaded', updateEditingZone);
        setTimeout(updateEditingZone, 100); // In case of late layout
        updateEditingZone();
    }
    
    startEditModeTimer(vertex) {
        // Clear any existing timer and animation
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        if (this.holdProgressAnimation) {
            cancelAnimationFrame(this.holdProgressAnimation);
        }
        
        // Start hold progress tracking
        this.holdStartTime = Date.now();
        this.holdProgressVertex = vertex;
        this.holdTimerWasActive = false; // Reset the flag
        
        // Start visual feedback animation
        this.startHoldProgressAnimation();
        
        // Start new timer
        this.longPressTimer = setTimeout(() => {
            if (!this.editModeElement && !this.hasDragged && this.draggedVertex === vertex) {
                this.enterEditMode(vertex);
                this.updateStatus(`Editing vertex "${vertex.label}"`);
            }
            // Clear hold progress
            this.clearHoldProgress();
        }, this.longPressDelay);
    }
    
    startHoldProgressAnimation() {
        const animate = () => {
            if (this.holdProgressVertex && this.holdStartTime) {
                const elapsed = Date.now() - this.holdStartTime;
                const totalTime = this.longPressDelay;
                
                // Only show progress after 1 second
                if (elapsed >= 1000) {
                    const progress = Math.min(1, (elapsed - 1000) / (totalTime - 1000));
                    this.holdProgress = progress;
                    
                    // Only mark as active if held for more than 0.25 seconds after visual feedback starts
                    if (elapsed >= 1250) {
                        this.holdTimerWasActive = true;
                    }
                    
                    this.draw(); // Redraw to show the glow effect
                }
                
                // Continue animation if still holding
                if (elapsed < totalTime && this.holdProgressVertex) {
                    this.holdProgressAnimation = requestAnimationFrame(animate);
                }
            }
        };
        
        this.holdProgressAnimation = requestAnimationFrame(animate);
    }
    
    clearHoldProgress() {
        this.holdStartTime = null;
        this.holdProgressVertex = null;
        this.holdProgress = 0;
        if (this.holdProgressAnimation) {
            cancelAnimationFrame(this.holdProgressAnimation);
            this.holdProgressAnimation = null;
        }
        // Don't reset holdTimerWasActive here - it should persist until the next mouse down
        this.draw(); // Redraw to clear the glow effect
    }
    

    

    
    initializeCanvas() {
        // Set canvas size to match container
        this.resizeCanvas();
        // Redraw on window resize or devicePixelRatio change
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
        // Listen for devicePixelRatio changes (for some browsers)
        if (window.matchMedia) {
            window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => {
                this.resizeCanvas();
                this.draw();
            });
        }
        // Update root node dropdown
        this.updateRootDropdown();
    }
    
    resizeCanvas() {
        // Dynamically size canvas to match parent container
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Use Math.floor to avoid subpixel blurring
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        // Force complete redraw after resize to prevent phantom nodes
        this.forceRedraw();
    }
    
    initializeEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Control events
        document.getElementById('vertexSize').addEventListener('input', (e) => {
            this.vertexSize = parseInt(e.target.value);
            document.getElementById('vertexSizeValue').textContent = this.vertexSize;
            this.forceRedraw();
        });
        
        document.getElementById('edgeType').addEventListener('change', (e) => {
            this.edgeType = e.target.value;
            this.forceRedraw();
        });
        
        document.getElementById('edgeDirection').addEventListener('change', (e) => {
            this.edgeDirection = e.target.value;
            this.forceRedraw();
        });
        
        document.getElementById('calculateDistance').addEventListener('click', () => {
            this.toggleDistanceMode();
        });
        
        document.getElementById('clearGraph').addEventListener('click', () => {
            this.clearGraph();
        });
        
        // Auto-save toggle
        document.getElementById('autosaveToggle').addEventListener('change', (e) => {
            this.autosaveEnabled = e.target.checked;
            this.updateStatus(`Auto-save ${this.autosaveEnabled ? 'enabled' : 'disabled'}`);
        });
        
        // Mouse coordinate toggle (simple checkbox)
        const mouseCoordinateToggle = document.getElementById('mouseCoordinateToggle');
        if (mouseCoordinateToggle) {
            // Initialize the checkbox state
            mouseCoordinateToggle.checked = this.showMouseCoordinates;
            console.log('Mouse coordinate checkbox found and initialized:', this.showMouseCoordinates);
            
            // Add both change and click event listeners for maximum compatibility
            mouseCoordinateToggle.addEventListener('change', (e) => {
                this.showMouseCoordinates = e.target.checked;
                this.updateMouseCoordinateDisplay();
                this.updateStatus(`Mouse coordinates ${this.showMouseCoordinates ? 'enabled' : 'disabled'}`);
                console.log('Mouse coordinate checkbox changed to:', this.showMouseCoordinates);
            });
            
            mouseCoordinateToggle.addEventListener('click', (e) => {
                // Prevent event bubbling
                e.stopPropagation();
                console.log('Mouse coordinate checkbox clicked');
            });
        } else {
            console.error('Mouse coordinate checkbox not found!');
        }
        
        // Coordinate grid toggle
        const coordinateGridToggle = document.getElementById('coordinateGridToggle');
        if (coordinateGridToggle) {
            coordinateGridToggle.addEventListener('change', (e) => {
                this.showCoordinateGrid = e.target.checked;
                const gridDensityContainer = document.getElementById('gridDensityContainer');
                if (gridDensityContainer) {
                    gridDensityContainer.style.display = this.showCoordinateGrid ? 'block' : 'none';
                }
                this.forceRedraw(); // Redraw to show/hide grid
            });
        } else {
            console.error('Coordinate grid toggle not found!');
        }
        
        // Grid density slider
        const gridDensitySlider = document.getElementById('gridDensity');
        if (gridDensitySlider) {
            gridDensitySlider.addEventListener('input', (e) => {
                this.gridDensity = parseInt(e.target.value);
                document.getElementById('gridDensityValue').textContent = this.gridDensity;
                this.updateGridSpacing();
                this.forceRedraw(); // Redraw to update grid
            });
        } else {
            console.error('Grid density slider not found!');
        }
        
        document.getElementById('hideInstructions').addEventListener('click', () => {
            this.hideInstructions();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            if (window.showInstructionsModal) {
                window.showInstructionsModal();
            } else {
                console.error('showInstructionsModal function not found');
            }
        });
        
        // Search controls
        document.getElementById('runBFS').addEventListener('click', () => {
            this.runBFS();
        });
        
        document.getElementById('runDFS').addEventListener('click', () => {
            this.runDFS();
        });
        
        document.getElementById('stopSearch').addEventListener('click', () => {
            this.stopSearch();
        });
        
        // Clear target button - this is handled in setupResetTargetBtn()
        
        // Contact button
        document.querySelector('.contact-status-item').addEventListener('click', () => {
            this.showContactModal();
        });
        
        // Contact form submission
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmit();
        });
        
        // Save/Load controls
        const newGraphBtn = document.getElementById('newGraph');
        const saveGraphBtn = document.getElementById('saveGraph');
        const loadGraphBtn = document.getElementById('loadGraph');
        const takeScreenshotBtn = document.getElementById('takeScreenshot');
        
        if (newGraphBtn) {
            newGraphBtn.addEventListener('click', () => {
                console.log('New Graph button clicked');
                this.createNewGraph();
            });
        } else {
            console.error('New Graph button not found!');
        }
        
        if (saveGraphBtn) {
            saveGraphBtn.addEventListener('click', () => {
                console.log('Save Graph button clicked');
            this.saveGraph();
        });
        } else {
            console.error('Save Graph button not found!');
        }
        
        if (loadGraphBtn) {
            loadGraphBtn.addEventListener('click', () => {
                console.log('Load Graph button clicked');
            this.showLoadConfirmation();
        });
        } else {
            console.error('Load Graph button not found!');
        }
        
        if (takeScreenshotBtn) {
            takeScreenshotBtn.addEventListener('click', () => {
                console.log('Take Screenshot button clicked');
            this.takeScreenshot();
        });
        } else {
            console.error('Take Screenshot button not found!');
        }
        
        // Delete all saved graphs button
        const deleteAllGraphsBtn = document.getElementById('deleteAllGraphs');
        if (deleteAllGraphsBtn) {
            deleteAllGraphsBtn.addEventListener('click', () => {
                this.deleteAllSavedGraphs();
            });
        } else {
            console.error('Delete All Graphs button not found!');
        }
        
        // Delete nodes mode controls
        const deleteNodesBtn = document.getElementById('deleteNodesBtn');
        const saveDeleteChangesBtn = document.getElementById('saveDeleteChanges');
        const cancelDeleteChangesBtn = document.getElementById('cancelDeleteChanges');
        
        if (deleteNodesBtn) {
            deleteNodesBtn.addEventListener('click', () => {
                this.enterDeleteMode();
            });
        } else {
            console.error('Delete Nodes button not found!');
        }
        
        if (saveDeleteChangesBtn) {
            saveDeleteChangesBtn.addEventListener('click', () => {
                this.saveDeleteChanges();
            });
        } else {
            console.error('Save Delete Changes button not found!');
        }
        
        if (cancelDeleteChangesBtn) {
            cancelDeleteChangesBtn.addEventListener('click', () => {
                this.cancelDeleteChanges();
            });
        } else {
            console.error('Cancel Delete Changes button not found!');
        }
        
        // File input for loading
        document.getElementById('loadFileInput').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });
        
        // Global escape key listener for canceling edit mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModeElement) {
                this.exitEditMode();
            }
        });
        
        // Edit mode controls - these are handled in setupMinimalEditModeEvents()
        
        // Edit mode styling controls - removed as these elements don't exist in HTML
        
        // Original styling controls - removed as these elements don't exist in HTML
        
        // Prevent default context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.vertices.length > 0) {
                this.autoSave();
            }
        }, 30000);
    }
    
    autoSave() {
        // Only auto-save if there are unsaved changes
        if (!this.hasUnsavedChanges()) {
            return;
        }
        
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        
        // Create a temporary auto-save entry (not added to saved graphs list)
        const autoSaveData = {
            name: `Graph ${new Date().toLocaleDateString()}`,
            data: graphData,
            timestamp: timestamp,
            vertices: this.vertices.length,
            edges: this.edges.length,
            isAutoSave: true
        };
        
        try {
            localStorage.setItem('graph_autosave_current', JSON.stringify(autoSaveData));
            this.updateStatus('Graph auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    loadSavedGraphs() {
        try {
            const savedGraphsData = localStorage.getItem('savedGraphs');
            if (savedGraphsData) {
                const parsed = JSON.parse(savedGraphsData);
                
                // Handle migration from old format to new format
                this.savedGraphs = parsed.map(graph => {
                    if (graph.data) {
                        // New format
                        return graph;
                    } else {
                        // Old format - convert to new format
                        return {
                            name: graph.name || 'Unnamed Graph',
                            data: graph,
                            timestamp: graph.timestamp || new Date().toISOString(),
                            vertices: graph.vertices || 0,
                            edges: graph.edges || 0
                        };
                    }
                });
                
                this.updateSavedGraphsList();
            }
        } catch (error) {
            console.error('Failed to load saved graphs:', error);
        }
    }
    
    updateSavedGraphsList() {
        const container = document.getElementById('savedGraphsList');
        container.innerHTML = '';
        this.savedGraphs.slice(0, 5).forEach((savedGraph, index) => {
            const item = document.createElement('div');
            item.className = 'saved-graph-item';
            item.innerHTML = `
                <div class="saved-graph-info">
                    <div class="saved-graph-name" data-index="${index}">${savedGraph.name}</div>
                    <div class="saved-graph-details">${savedGraph.vertices} vertices, ${savedGraph.edges} edges</div>
                    <div class="saved-graph-time">Last edited: ${new Date(savedGraph.timestamp).toLocaleString()}</div>
                </div>
                <div class="saved-graph-actions">
                    <button class="edit-name-btn" title="Edit graph name">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" title="Delete saved graph">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Make the entire item clickable to load the graph
            item.addEventListener('click', () => {
                this.loadSavedGraphWithConfirmation(savedGraph);
            });
            
            // Add event listeners for action buttons (with stopPropagation to prevent loading)
            const editNameBtn = item.querySelector('.edit-name-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            const nameElement = item.querySelector('.saved-graph-name');
            
            editNameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editSavedGraphName(index, nameElement);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSavedGraph(savedGraph.id);
            });
            
            container.appendChild(item);
        });
    }
    
    // Helper to get a timestamp string
    getTimestampString() {
        const now = new Date();
        return now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
    }

    // Save the current graph (update if editing, otherwise new)
    saveGraph(isAutoSave = false) {
        console.log('saveGraph function called', isAutoSave ? '(auto-save)' : '(manual)');
        
        // If editing a loaded/saved graph, update it; otherwise, create new
        let currentId = this.currentGraphId;
        let name;
        if (!currentId) {
            // New graph: assign id and name as timestamp
            currentId = Date.now();
            this.currentGraphId = currentId;
            name = this.getTimestampString();
        } else {
            // Existing graph: find its name
            const existing = this.savedGraphs.find(g => g.id === currentId);
            name = existing ? existing.name : this.getTimestampString();
        }
        
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        
        const savedGraph = {
            id: currentId,
            name: name,
            data: graphData,
            timestamp: timestamp,
            vertices: this.vertices.length,
            edges: this.edges.length
        };
        
        // Check if updating existing
        const idx = this.savedGraphs.findIndex(g => g.id === currentId);
        if (idx !== -1) {
            this.savedGraphs[idx] = savedGraph;
        } else {
        this.savedGraphs.unshift(savedGraph);
        }
        
        // Keep only last 10 saved graphs
        if (this.savedGraphs.length > 10) {
            this.savedGraphs = this.savedGraphs.slice(0, 10);
        }
        
        try {
            localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
            this.updateSavedGraphsList();
            this.lastSavedState = JSON.stringify({
                vertices: this.vertices.map(v => ({ id: v.id, x: v.x, y: v.y, label: v.label })),
                edges: this.edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, type: e.type }))
            });
            
            // Only show status message for manual saves, not auto-saves
            if (!isAutoSave) {
            this.updateStatus(`Graph "${name}" saved successfully!`);
            }
        } catch (error) {
            console.error('Failed to save graph:', error);
            this.updateStatus('Failed to save graph');
        }
    }
    
    loadSavedGraphWithConfirmation(savedGraph) {
        console.log('loadSavedGraphWithConfirmation called', savedGraph);
        // Always auto-save current graph if there are changes, then load the new graph
        if (this.hasUnsavedChanges()) {
            this.saveCurrentGraphAndLoadSpecific(savedGraph);
        } else {
            this.loadSavedGraph(savedGraph);
        }
    }
    
    loadSavedGraph(savedGraph) {
        console.log('loadSavedGraph called', savedGraph);
        try {
            // Clear current graph
            this.vertices = [];
            this.edges = [];
            this.nextVertexId = 1;
            this.selectedVertices = [];
            this.draggedVertex = null;
            this.isDragging = false;
            this.distanceModeVertices = [];
            this.isDistanceMode = false;
            this.visitedVertices.clear();
            this.pathVertices.clear();
            this.isSearching = false;
            this.editingVertex = null;
            this.selectedTargetVertex = null;
            this.currentGraphId = savedGraph.id;
            
            // Import the saved graph data
            this.importGraph(savedGraph.data);
            
            // Update UI
            this.updateTargetVertexDisplay();
            this.updateInfo();
            this.updateRootDropdown();
            this.draw();
            
            this.updateStatus(`Loaded graph: "${savedGraph.name}"`);
            console.log('Graph loaded successfully');
            } catch (error) {
            console.error('Failed to load saved graph:', error);
            this.updateStatus('Failed to load saved graph');
        }
    }
    
    saveCurrentGraphAndLoadSpecific(targetGraph) {
        // First save the current graph to localStorage without adding to savedGraphs list
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        const name = this.getTimestampString();
        
        const currentGraphData = {
            id: this.currentGraphId || Date.now(),
            name: name,
            data: graphData,
            timestamp: timestamp,
            vertices: this.vertices.length,
            edges: this.edges.length
        };
        
        // Save to localStorage as a temporary backup (not in savedGraphs list)
        try {
            localStorage.setItem('graph_temp_backup', JSON.stringify(currentGraphData));
            this.updateStatus('Current graph backed up before loading new graph');
        } catch (error) {
            console.error('Failed to backup current graph:', error);
            this.updateStatus('Failed to backup current graph');
        }
        
        // Now load the target graph
        this.loadSavedGraph(targetGraph);
    }
    
    loadGraph() {
        document.getElementById('loadFileInput').click();
    }
    
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const graphData = JSON.parse(e.target.result);
                this.importGraph(graphData);
                this.currentGraphId = null; // New graph, not linked to savedGraphs
                this.updateStatus(`Loaded graph from file: ${file.name}`);
            } catch (error) {
                console.error('Failed to parse graph file:', error);
                this.updateStatus('Invalid graph file format');
            }
        };
        reader.readAsText(file);
        // Reset file input
        event.target.value = '';
    }
    
    takeScreenshot() {
        console.log('takeScreenshot function called');
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        console.log('Number of vertices:', this.vertices.length);
        console.log('Number of edges:', this.edges.length);
        
        try {
        // Create a temporary canvas for the screenshot
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
            
            console.log('Created temporary canvas');
        
        // Set canvas size to fixed coordinate system
        tempCanvas.width = 1800;
        tempCanvas.height = 1800;
            
            console.log('Set temp canvas size to:', tempCanvas.width, 'x', tempCanvas.height);
        
        // Get the selected format
        const formatSelect = document.getElementById('screenshotFormat');
        const format = formatSelect ? formatSelect.value : 'jpg';
        
        // Fill background - transparent for PNG, white for JPG
        if (format === 'png') {
            // Clear the canvas for transparency (no fill)
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        } else {
            // Fill with white background for JPG
            tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
            console.log('Filled background');
            
            // Draw the entire graph using the fixed coordinate system
            console.log('Drawing graph on screenshot canvas...');
            this.drawOnCanvas(tempCtx, 1800, 1800);
            
            console.log('Starting blob conversion...');
            
            // Convert to blob and download
        tempCanvas.toBlob((blob) => {
                console.log('Blob callback executed, blob:', blob);
                if (blob) {
                    console.log('Blob size:', blob.size, 'bytes');
            const url = URL.createObjectURL(blob);
                    console.log('Created object URL:', url);
            const a = document.createElement('a');
            a.href = url;
                    a.download = `graph-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
                    a.style.display = 'none';
            document.body.appendChild(a);
                    console.log('Triggering download...');
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
                    this.updateStatus(`Screenshot saved as ${format.toUpperCase()}!`);
                    console.log('Screenshot downloaded successfully');
                } else {
                    console.error('Failed to create blob for screenshot');
                    this.updateStatus('Failed to create screenshot');
                }
            }, format === 'png' ? 'image/png' : 'image/jpeg', format === 'png' ? 1.0 : 0.9);
            
            console.log('toBlob called, waiting for callback...');
        } catch (error) {
            console.error('Error taking screenshot:', error);
            console.error('Error stack:', error.stack);
            this.updateStatus('Error taking screenshot');
        }
    }
    
    drawSimpleEdge(ctx, edge) {
        // Simple edge drawing - just a line between vertices
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
        ctx.stroke();
        
        // Draw arrow for directed edges
        if (edge.direction !== 'undirected') {
            this.drawSimpleArrow(ctx, edge);
        }
        
        // Draw weight if exists
        if (edge.weight !== null && edge.weight !== '') {
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(midX - 15, midY - 8, 30, 16);
            
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), midX, midY);
        }
    }
    
    drawSimpleArrow(ctx, edge) {
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6; // 30 degrees
        
        const dx = edge.to.x - edge.from.x;
        const dy = edge.to.y - edge.from.y;
        const angle = Math.atan2(dy, dx);
        
        // Determine arrow direction
        let endX, endY;
        if (edge.direction === 'directed-backward') {
            angle += Math.PI;
            endX = edge.from.x;
            endY = edge.from.y;
        } else {
            endX = edge.to.x;
            endY = edge.to.y;
        }
        
        // Calculate arrow position
        const vertexRadius = this.vertexSize;
        const arrowDistance = vertexRadius + 3;
        
        const arrowX = endX - arrowDistance * Math.cos(angle);
        const arrowY = endY - arrowDistance * Math.sin(angle);
        
        // Draw arrow
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - arrowAngle),
            arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + arrowAngle),
            arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
    }
    
    drawSimpleVertex(ctx, vertex) {
        // Simple vertex drawing - just a circle with label
        const size = this.vertexSize;
        
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw vertex label
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex.label, vertex.x, vertex.y);
    }
    
    drawEdgeForScreenshot(ctx, edge) {
        // Read edge data and recreate appearance
        const edgeColor = edge.color || this.edgeColor;
        const edgeWidth = edge.width || this.edgeWidth;
        const edgeFontSize = edge.fontSize || this.edgeFontSize;
        const edgeFontFamily = edge.fontFamily || this.edgeFontFamily;
        const edgeFontColor = edge.fontColor || this.edgeFontColor;
        
        // Draw the edge line
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = edgeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (edge.type === 'curved') {
            // Draw curved edge
            const controlPoint = {
                x: (edge.from.x + edge.to.x) / 2,
                y: (edge.from.y + edge.to.y) / 2 - 40
            };
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, edge.to.x, edge.to.y);
        } else {
            // Draw straight edge
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();
        
        // Draw arrow for directed edges
        if (edge.direction !== 'undirected') {
            this.drawArrowForScreenshot(ctx, edge);
        }
        
        // Draw weight if exists
        if (edge.weight !== null && edge.weight !== '') {
            let midX, midY;
            if (edge.type === 'curved') {
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2 - 60;
            } else {
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2;
            }
            
            // Background for weight text
            ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(midX - 20, midY - 12, 40, 24);
            
            // Weight text
            ctx.fillStyle = edgeFontColor;
            ctx.font = `bold ${edgeFontSize}px ${edgeFontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), midX, midY);
        }
    }
    
    drawArrowForScreenshot(ctx, edge) {
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6; // 30 degrees
        
        let endX, endY;
        let angle;
        
        if (edge.type === 'curved') {
            // For curved edges, calculate angle at the end point
            const controlPoint = {
                x: (edge.from.x + edge.to.x) / 2,
                y: (edge.from.y + edge.to.y) / 2 - 40
            };
            const dx = edge.to.x - controlPoint.x;
            const dy = edge.to.y - controlPoint.y;
            angle = Math.atan2(dy, dx);
        } else {
            // For straight edges
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Determine arrow direction
        if (edge.direction === 'directed-backward') {
            angle += Math.PI;
            endX = edge.from.x;
            endY = edge.from.y;
        } else {
            endX = edge.to.x;
            endY = edge.to.y;
        }
        
        // Calculate arrow position
        const vertexRadius = edge.from.size || this.vertexSize;
        const arrowDistance = vertexRadius + 5;
        
        const arrowX = endX - arrowDistance * Math.cos(angle);
        const arrowY = endY - arrowDistance * Math.sin(angle);
        
        // Draw arrow
        ctx.strokeStyle = edge.color || this.edgeColor;
        ctx.lineWidth = edge.width || this.edgeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - arrowAngle),
            arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + arrowAngle),
            arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
    }
    
    drawVertexForScreenshot(ctx, vertex) {
        // Read vertex data and recreate appearance
        const fillColor = vertex.color || this.vertexColor;
        const borderColor = vertex.borderColor || this.vertexBorderColor;
        const fontSize = vertex.fontSize || this.vertexFontSize;
        const fontFamily = vertex.fontFamily || this.vertexFontFamily;
        const fontColor = vertex.fontColor || this.vertexFontColor;
        const size = vertex.size || this.vertexSize;
        
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw vertex label
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(vertex.label, vertex.x, vertex.y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    drawOnCanvas(ctx, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdgeOnCanvas(ctx, edge));
        
        // Draw vertices
        this.vertices.forEach(vertex => this.drawVertexOnCanvas(ctx, vertex));
    }
    
    drawEdgeOnCanvas(ctx, edge) {
        // Use individual edge styling or fall back to global styling
        const edgeColor = edge.color || this.edgeColor;
        const edgeWidth = edge.width || this.edgeWidth;
        const edgeFontSize = edge.fontSize || this.edgeFontSize;
        const edgeFontFamily = edge.fontFamily || this.edgeFontFamily;
        const edgeFontColor = edge.fontColor || this.edgeFontColor;
        
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = edgeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (edge.type === 'curved') {
            // Draw curved edge with quadratic Bézier curve using fixed control point
            const controlPoint = {
                x: (edge.from.x + edge.to.x) / 2,
                y: (edge.from.y + edge.to.y) / 2 - 40
            };
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, edge.to.x, edge.to.y);
        } else {
            // Draw straight edge
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        
        ctx.stroke();
        
        // Draw arrow for directed edges
        if (edge.direction !== 'undirected') {
            this.drawArrowOnCanvas(ctx, edge);
        }
        
        // Draw weight if exists
        if (edge.weight !== null && edge.weight !== '') {
            let midX, midY;
            if (edge.type === 'curved') {
                // For curved edges, position weight near the fixed control point
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2 - 60;
            } else {
                // For straight edges, position weight at midpoint
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2;
            }
            
            // Background for weight text
            ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(midX - 20, midY - 12, 40, 24);
            
            // Weight text
            ctx.fillStyle = edgeFontColor;
            ctx.font = `bold ${edgeFontSize}px ${edgeFontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), midX, midY);
        }
    }
    
    drawArrowOnCanvas(ctx, edge) {
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6; // 30 degrees
        
        let endX, endY;
        let angle;
        
        if (edge.type === 'curved' && edge.controlPoint) {
            // For curved edges, calculate the angle at the end point using control point
            const controlPoint = edge.controlPoint;
            
            // Calculate the tangent at the end point
            const dx = edge.to.x - controlPoint.x;
            const dy = edge.to.y - controlPoint.y;
            angle = Math.atan2(dy, dx);
        } else {
            // For straight edges
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Determine arrow direction based on edge direction setting
        if (edge.direction === 'directed-backward') {
            angle += Math.PI; // Reverse the arrow
            endX = edge.from.x;
            endY = edge.from.y;
        } else {
            // directed-forward or default
            endX = edge.to.x;
            endY = edge.to.y;
        }
        
        // Calculate arrow position (slightly inside the vertex)
        const vertexRadius = edge.from.size || this.vertexSize;
        const arrowDistance = vertexRadius + 5;
        
        const arrowX = endX - arrowDistance * Math.cos(angle);
        const arrowY = endY - arrowDistance * Math.sin(angle);
        
        // Draw arrow
        ctx.strokeStyle = edge.color || this.edgeColor;
        ctx.lineWidth = edge.width || this.edgeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - arrowAngle),
            arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + arrowAngle),
            arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
    }
    
    drawVertexOnCanvas(ctx, vertex) {
        // Use individual vertex styling or fall back to global styling
        const fillColor = vertex.color || this.vertexColor;
        const borderColor = vertex.borderColor || this.vertexBorderColor;
        const fontSize = vertex.fontSize || this.vertexFontSize;
        const fontFamily = vertex.fontFamily || this.vertexFontFamily;
        const fontColor = vertex.fontColor || this.vertexFontColor;
        const size = vertex.size || this.vertexSize;
        
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw vertex label
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a subtle text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(vertex.label, vertex.x, vertex.y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    exportGraph() {
        return {
            vertices: this.vertices.map(v => ({
                id: v.id,
                x: v.x,
                y: v.y,
                label: v.label,
                size: v.size,
                color: v.color,
                borderColor: v.borderColor,
                fontSize: v.fontSize,
                fontFamily: v.fontFamily,
                fontColor: v.fontColor
            })),
            edges: this.edges.map(e => ({
                from: e.from.id,
                to: e.to.id,
                weight: e.weight,
                type: e.type,
                direction: e.direction,
                controlPoint: e.controlPoint,
                color: e.color,
                width: e.width,
                fontSize: e.fontSize,
                fontFamily: e.fontFamily,
                fontColor: e.fontColor
            })),
            nextVertexId: this.nextVertexId,
            vertexSize: this.vertexSize,
            edgeType: this.edgeType,
            edgeDirection: this.edgeDirection,
            theme: this.currentTheme,
            // Global styling properties
            vertexColor: this.vertexColor,
            vertexBorderColor: this.vertexBorderColor,
            vertexFontSize: this.vertexFontSize,
            vertexFontFamily: this.vertexFontFamily,
            vertexFontColor: this.vertexFontColor,
            edgeColor: this.edgeColor,
            edgeWidth: this.edgeWidth,
            edgeFontSize: this.edgeFontSize,
            edgeFontFamily: this.edgeFontFamily,
            edgeFontColor: this.edgeFontColor
        };
    }
    
    importGraph(graphData) {
        console.log('importGraph called', graphData);
        this.vertices = [];
        this.edges = [];
        this.selectedVertices = [];
        this.draggedVertex = null;
        this.visitedVertices.clear();
        this.pathVertices.clear();
        this.editingVertex = null;
        this.vertices = graphData.vertices.map(v => ({
            id: v.id,
            x: v.x,
            y: v.y,
            label: v.label,
            size: v.size,
            color: v.color,
            borderColor: v.borderColor,
            fontSize: v.fontSize,
            fontFamily: v.fontFamily,
            fontColor: v.fontColor
        }));
        this.edges = graphData.edges.map(e => {
            const fromVertex = this.vertices.find(v => v.id === e.from);
            const toVertex = this.vertices.find(v => v.id === e.to);
            return {
                from: fromVertex,
                to: toVertex,
                weight: e.weight,
                type: e.type,
                direction: e.direction || 'undirected',
                controlPoint: e.controlPoint,
                color: e.color,
                width: e.width,
                fontSize: e.fontSize,
                fontFamily: e.fontFamily,
                fontColor: e.fontColor
            };
        });
        this.nextVertexId = graphData.nextVertexId || this.vertices.length + 1;
        this.vertexSize = graphData.vertexSize || 25;
        this.edgeType = graphData.edgeType || 'straight';
        this.edgeDirection = graphData.edgeDirection || 'undirected';
        this.vertexColor = graphData.vertexColor || '#1e293b';
        this.vertexBorderColor = graphData.vertexBorderColor || '#475569';
        this.vertexFontSize = graphData.vertexFontSize || 14;
        this.vertexFontFamily = graphData.vertexFontFamily || 'Inter';
        this.vertexFontColor = graphData.vertexFontColor || '#ffffff';
        this.edgeColor = graphData.edgeColor || '#6366f1';
        this.edgeWidth = graphData.edgeWidth || 3;
        this.edgeFontSize = graphData.edgeFontSize || 14;
        this.edgeFontFamily = graphData.edgeFontFamily || 'Inter';
        this.edgeFontColor = graphData.edgeFontColor || '#06b6d4';
        if (graphData.theme && graphData.theme !== this.currentTheme) {
            this.currentTheme = graphData.theme;
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            const themeToggle = document.getElementById('themeToggle');
            const icon = themeToggle.querySelector('i');
            if (this.currentTheme === 'light') {
                icon.className = 'fas fa-sun';
                themeToggle.title = 'Switch to dark mode';
            } else {
                icon.className = 'fas fa-moon';
                themeToggle.title = 'Switch to light mode';
            }
        }
        this.lastSavedState = JSON.stringify({
            vertices: this.vertices.map(v => ({ id: v.id, x: v.x, y: v.y, label: v.label })),
            edges: this.edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, type: e.type, direction: e.direction, controlPoint: e.controlPoint })),
            vertexSize: this.vertexSize,
            edgeType: this.edgeType,
            edgeDirection: this.edgeDirection,
            vertexColor: this.vertexColor,
            vertexBorderColor: this.vertexBorderColor,
            vertexFontSize: this.vertexFontSize,
            vertexFontFamily: this.vertexFontFamily,
            vertexFontColor: this.vertexFontColor,
            edgeColor: this.edgeColor,
            edgeWidth: this.edgeWidth,
            edgeFontSize: this.edgeFontSize,
            edgeFontFamily: this.edgeFontFamily,
            edgeFontColor: this.edgeFontColor
        });
        this.updateInfo();
        this.draw();
        this.updateRootDropdown();
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (this.currentTheme === 'light') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to dark mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to light mode';
        }
        
        this.draw();
        this.updateStatus(`Switched to ${this.currentTheme} mode`);
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Return CSS pixel coordinates for consistent coordinate system
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleCanvasClick(e) {
        const pos = this.getMousePos(e);
        
        // Check for delete button clicks first
        if (this.handleDeleteButtonClick(pos)) {
            return;
        }
        
        const clickedVertex = this.getVertexAt(pos.x, pos.y);
        const clickedEdge = this.getEdgeAt(pos.x, pos.y);

        // If clicking a curved edge control point, do nothing
        if (clickedEdge && clickedEdge.type === 'curved' && clickedEdge.controlPoint) {
            return;
        }

        // Prevent interactions during edit mode or delete mode
        if (this.editModeElement || this.isDeleteMode) {
            return;
        }

        // Prevent clicks if hold timer was active (to prevent edge creation)
        if (this.holdTimerWasActive) {
            console.log('Click prevented - hold timer was active');
            this.holdTimerWasActive = false; // Reset the flag
            return;
        }

        // Prevent clicks if we just finished dragging (to prevent edge creation)
        if (this.justFinishedDragging) {
            console.log('Click prevented - just finished dragging');
            return;
        }

        // Handle vertex clicks
        if (clickedVertex) {
            this.handleVertexClick(clickedVertex);
            return;
        }

        // Otherwise, add a vertex
        this.addVertex(pos.x, pos.y);
    }
    
    handleRightClick(e) {
        e.preventDefault();
        
        // Prevent action if simultaneous click was detected
        if (this.simultaneousClickDetected) {
            return;
        }
        
        const pos = this.getMousePos(e);
        const vertex = this.getVertexAt(pos.x, pos.y);
        
        if (vertex) {
            // Right-click on vertex - handle edge creation
            this.handleVertexRightClick(vertex);
        }
    }
    
    handleVertexRightClick(vertex) {
        if (this.isDistanceMode) {
            // In distance mode, right-click sets target vertex
            this.selectTargetVertex(vertex);
            this.updateStatus(`Target vertex set to "${vertex.label}"`);
            return;
        }
        
        // Handle edge creation logic - right-click two vertices to create edge
        if (this.selectedVertices.length === 0) {
            this.selectedVertices.push(vertex);
            this.updateStatus(`Selected vertex "${vertex.label}" for edge creation - right-click another vertex to create edge`);
            this.draw(); // Redraw to show purple highlighting
        } else if (this.selectedVertices.length === 1) {
            const vertex1 = this.selectedVertices[0];
            const vertex2 = vertex;
            
            if (vertex1.id === vertex2.id) {
                this.updateStatus('Cannot create edge to same vertex');
                this.selectedVertices = [];
                this.draw(); // Redraw to clear highlighting
            return;
        }
        
            // Check if edge already exists
            const existingEdge = this.edges.find(edge => 
                (edge.from.id === vertex1.id && edge.to.id === vertex2.id) ||
                (edge.from.id === vertex2.id && edge.to.id === vertex1.id)
            );
            
            if (existingEdge) {
                this.updateStatus('Edge already exists between these vertices');
                this.selectedVertices = [];
                this.draw(); // Redraw to clear highlighting
                return;
            }
            
            // Add second vertex to selection for visual feedback
            this.selectedVertices.push(vertex2);
            this.draw(); // Redraw to show both vertices in purple
            
            // Get edge weight from input
            const weightInput = document.getElementById('edgeWeight');
            const weight = weightInput.value.trim() ? parseFloat(weightInput.value) : null;
            
            // Create the edge
            this.addEdge(vertex1, vertex2, weight);
            this.selectedVertices = [];
            
            // Flash the vertices briefly
            this.flashVertices(vertex1, vertex2);
        }
    }
    

    
    handleVertexClick(vertex) {
        // Set target vertex
        this.selectTargetVertex(vertex);
        
        if (this.isDistanceMode) {
            this.handleDistanceModeClick(vertex);
            return;
        }
        
        // Left click on vertex - just select it, no edge creation
        this.updateStatus(`Selected vertex "${vertex.label}"`);
    }
    
    handleDistanceModeClick(vertex) {
        this.distanceModeVertices.push(vertex);
        
        if (this.distanceModeVertices.length === 2) {
            // Flash the second vertex in blue before calculating distance
            this.flashDistanceVertices(this.distanceModeVertices[0], this.distanceModeVertices[1]);
            
            const { distance, path } = this.calculateShortestPathDistance(this.distanceModeVertices[0], this.distanceModeVertices[1]);
            this.showDistanceInfo(distance, path);
            this.distanceModeVertices = [];
            this.isDistanceMode = false;
            this.updateStatus('Distance calculated!');
        } else {
            this.updateStatus('Click another vertex to calculate distance');
        }
        
        this.draw();
    }
    
    calculateShortestPathDistance(vertex1, vertex2) {
        if (vertex1.id === vertex2.id) return { distance: 0, path: [vertex1] };
        
        const adjacencyList = this.getAdjacencyList();
        const queue = [{ vertex: vertex1, distance: 0 }];
        const visited = new Set();
        const parent = {};
        
        visited.add(vertex1.id);
        
        while (queue.length > 0) {
            const { vertex, distance } = queue.shift();
            
            if (vertex.id === vertex2.id) {
                // Reconstruct path
                const path = [];
                let current = vertex;
                while (current) {
                    path.unshift(current);
                    current = parent[current.id];
                }
                return { distance, path };
            }
            
            const neighbors = adjacencyList[vertex.id] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    parent[neighbor.id] = vertex;
                    queue.push({ vertex: neighbor, distance: distance + 1 });
                }
            }
        }
        
        return { distance: -1, path: [] }; // No path found
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const vertex = this.getVertexAt(pos.x, pos.y);
        
        if (vertex) {
            // Prevent interactions during edit mode or delete mode
            if (this.editModeElement || this.isDeleteMode) {
                return;
            }
            
            // Allow dragging even if vertex is selected for edge creation
            // Clear edge selection when starting to drag
            if (this.selectedVertices.includes(vertex)) {
                this.selectedVertices = [];
                this.draw(); // Redraw to clear purple highlighting
            }
            
            // Initialize drag state
            this.draggedVertex = vertex;
            this.isDragging = true;
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
            this.hasDragged = false;
            this.holdTimerWasActive = false; // Reset hold timer flag for new interaction
            this.canvas.style.cursor = 'grabbing';
            
            // Add global mouse event listeners to handle dragging outside canvas
            this.globalMouseMoveHandler = (e) => this.handleMouseMove(e);
            this.globalMouseUpHandler = (e) => this.handleMouseUp(e);
            document.addEventListener('mousemove', this.globalMouseMoveHandler);
            document.addEventListener('mouseup', this.globalMouseUpHandler);
            
            // Start edit mode timer
            this.startEditModeTimer(vertex);
            
            // Prevent default to avoid text selection
            e.preventDefault();
        }
    }
    
    // Color wall collision detection
    isVertexTouchingColorWall(x, y, size) {
        const borderColor = '#d3d3d3'; // Light gray color wall
        const tolerance = 5; // Color matching tolerance
        
        // Check if vertex would touch the border at this position
        const borderWidth = 3;
        const minX = size + borderWidth;
        const minY = size + borderWidth;
        const maxX = (this.editingZoneWidth ? this.editingZoneWidth : this.canvas.width / (window.devicePixelRatio || 1)) - size - borderWidth;
        const maxY = (this.editingZoneHeight ? this.editingZoneHeight : this.canvas.height / (window.devicePixelRatio || 1)) - size - borderWidth;
        
        // Check if vertex would be at the border
        if (x <= minX || x >= maxX || y <= minY || y >= maxY) {
            return true;
        }
        
        return false;
    }

    handleMouseMove(e) {
        if (this.isDragging && this.draggedVertex) {
            const pos = this.getMousePos(e); // Now in CSS pixels
            // Calculate drag distance
            const dragDistance = Math.sqrt(
                Math.pow(pos.x - this.dragStartX, 2) + 
                Math.pow(pos.y - this.dragStartY, 2)
            );
            // Check if we've started dragging
            if (dragDistance > this.dragThreshold && !this.hasDragged) {
                this.hasDragged = true;
                console.log('Drag started - distance:', dragDistance);
                // Cancel edit mode timer when dragging starts
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                // Clear hold progress when dragging starts
                this.clearHoldProgress();
            }
            // Check if we've stopped dragging (moved back within threshold)
            if (dragDistance <= this.dragThreshold && this.hasDragged) {
                this.hasDragged = false;
                console.log('Drag stopped - restarting edit mode timer');
                // Restart edit mode timer when dragging stops
                this.startEditModeTimer(this.draggedVertex);
            }
            
            // COLOR WALL: Check if vertex would touch the light gray border
            const size = this.draggedVertex.size || this.vertexSize;
            if (this.isVertexTouchingColorWall(pos.x, pos.y, size)) {
                // Don't allow movement - vertex would touch the color wall
                return;
            }
            
            // Store old position for debug
            const oldX = this.draggedVertex.x;
            const oldY = this.draggedVertex.y;
            
            // Update vertex position in place (no copying, no removal/re-addition)
            this.draggedVertex.x = pos.x;
            this.draggedVertex.y = pos.y;
            
            // Debug: Log position changes
            if (this.debugMode && (oldX !== this.draggedVertex.x || oldY !== this.draggedVertex.y)) {
                console.log(`Vertex ${this.draggedVertex.label} moved from (${oldX}, ${oldY}) to (${this.draggedVertex.x}, ${this.draggedVertex.y})`);
            }
            
            // Update edit mode info if in edit mode
            if (this.editModeElement === this.draggedVertex && this.editModeType === 'vertex') {
                this.updateEditModeInfo();
            }
            
            // Only redraw once during drag
            this.draw();
        } else if (this.isDraggingEdge && this.draggedEdge) {
            const pos = this.getMousePos(e);
            this.draggedEdge.controlPoint = { x: pos.x, y: pos.y };
            this.draw();
        } else {
            // Update cursor
            const pos = this.getMousePos(e);
            const vertex = this.getVertexAt(pos.x, pos.y);
            const edge = this.getEdgeAt(pos.x, pos.y);
            if (vertex) {
                this.canvas.style.cursor = 'grab';
            } else if (edge && edge.type === 'curved') {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }
    
    // Force a complete redraw with enhanced clearing to prevent phantom nodes
    forceRedraw() {
        // Clear vertex draw count for this frame
        this.vertexDrawCount.clear();
        
        // Perform a complete redraw
        this.draw();
        
        // Debug: Check for duplicate vertices
        if (this.debugMode) {
            const vertexPositions = new Map();
            this.vertices.forEach(vertex => {
                const key = `${vertex.x},${vertex.y}`;
                if (vertexPositions.has(key)) {
                    console.warn(`DUPLICATE POSITION DETECTED: ${vertex.label} and ${vertexPositions.get(key)} at (${vertex.x}, ${vertex.y})`);
                } else {
                    vertexPositions.set(key, vertex.label);
                }
            });
        }
    }
    
    handleMouseUp(e) {
        // Clear edit mode timer and hold progress
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.clearHoldProgress();
        
        if (this.isDragging && this.draggedVertex) {
            console.log('MouseUp: Resetting drag state, hasDragged was:', this.hasDragged);
            
            // Debug: Log final vertex state
            if (this.debugMode) {
                console.log(`Drag ended for vertex ${this.draggedVertex.label} at (${this.draggedVertex.x}, ${this.draggedVertex.y})`);
                console.log('Total vertices in array:', this.vertices.length);
                this.vertices.forEach((v, i) => {
                    console.log(`Vertex ${i}: ${v.label} at (${v.x}, ${v.y})`);
                });
            }
            
            this.isDragging = false;
            this.draggedVertex = null;
            this.canvas.style.cursor = 'crosshair';
            // FIX: Reset hasDragged so vertex creation works after drag
            this.hasDragged = false;
            console.log('MouseUp: hasDragged reset to:', this.hasDragged);
            
            // Set flag to prevent clicks after drag
            this.justFinishedDragging = true;
            // Clear the flag after a short delay to allow future clicks
            setTimeout(() => {
                this.justFinishedDragging = false;
            }, 100);
            
            // Remove global mouse event listeners
            if (this.globalMouseMoveHandler) {
                document.removeEventListener('mousemove', this.globalMouseMoveHandler);
                this.globalMouseMoveHandler = null;
            }
            if (this.globalMouseUpHandler) {
                document.removeEventListener('mouseup', this.globalMouseUpHandler);
                this.globalMouseUpHandler = null;
            }
            
            // Final redraw to ensure clean state (no phantom nodes)
            this.draw();
        }
        
        if (this.isDraggingEdge && this.draggedEdge) {
            this.isDraggingEdge = false;
            this.draggedEdge = null;
            this.canvas.style.cursor = 'crosshair';
            this.updateStatus('Edge curve adjusted');
        }
    }
    
    enterEditMode(vertex) {
        console.log('[EditMode] Entering edit mode for vertex:', vertex.label);
        this.exitEditMode();
        this.editModeElement = vertex;
        this.editModeType = 'vertex';
        // Store original values for cancellation
        this._editOriginal = {
            label: vertex.label,
            size: vertex.size || this.vertexSize,
        };
        // Temporary edit state for preview
        this._editPreview = {
            label: vertex.label,
            size: vertex.size || this.vertexSize,
            pendingDelete: false
        };
        this._originalAllVertexSizes = this.vertices.map(v => v.size || this.vertexSize);
        this.startShakeAnimation();
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'block';
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection') section.style.display = 'none';
        });
        const editTitle = editSection.querySelector('h3');
        if (editTitle) editTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Vertex "${vertex.label}"`;
        const labelInput = document.getElementById('editVertexLabel');
        const sizeInput = document.getElementById('editVertexSize');
        const sizeValue = document.getElementById('editVertexSizeValue');
        if (labelInput && sizeInput && sizeValue) {
            labelInput.value = vertex.label;
            sizeInput.value = vertex.size || this.vertexSize;
            sizeValue.textContent = vertex.size || this.vertexSize;
        }
        labelInput.style.borderColor = '';
        labelInput.style.boxShadow = '';
        const warningMsg = document.getElementById('editVertexLabelWarning');
        if (warningMsg) warningMsg.textContent = '';
        const applyToAllToggle = document.getElementById('applyToAllToggle');
        if (applyToAllToggle) applyToAllToggle.checked = false;
        setTimeout(() => { if (labelInput) { labelInput.focus(); labelInput.select(); } }, 100);
        this._setupApplyToAllImmediateListeners();
        this._updateEditPanelForPendingDelete(false);
        this._updateDeleteButtonText();
        this.draw();
    }

    _updateEditPanelForPendingDelete(isPending) {
        const labelInput = document.getElementById('editVertexLabel');
        const sizeInput = document.getElementById('editVertexSize');
        const applyToAllToggle = document.getElementById('applyToAllToggle');
        const saveBtn = document.getElementById('saveVertexEdit');
        
        if (isPending) {
            // Replace label input with plain purple text when marked for deletion
            if (labelInput) {
                const labelContainer = labelInput.closest('.control-group');
                if (labelContainer) {
                    // Create or update the plain text display
                    let labelDisplay = labelContainer.querySelector('.label-display');
                    if (!labelDisplay) {
                        labelDisplay = document.createElement('div');
                        labelDisplay.className = 'label-display';
                        labelDisplay.style.cssText = `
                            color: #8b5cf6;
                            font-weight: 500;
                            padding: 8px 12px;
                            background: transparent;
                            border: none;
                            font-size: 14px;
                            font-family: inherit;
                        `;
                        labelInput.parentNode.insertBefore(labelDisplay, labelInput);
                    }
                    labelDisplay.textContent = labelInput.value || 'No label';
                    labelDisplay.style.display = 'block';
                    labelInput.style.display = 'none';
                }
            }
            // Hide size control when marked for deletion
            if (sizeInput) sizeInput.style.display = 'none';
            // Hide apply to all toggle when marked for deletion
            if (applyToAllToggle) {
                const applyToAllContainer = applyToAllToggle.closest('.control-group');
                if (applyToAllContainer) applyToAllContainer.style.display = 'none';
            }
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-trash"></i> Confirm Deletion';
        } else {
            // Show all edit controls when not marked for deletion
            if (labelInput) {
                const labelContainer = labelInput.closest('.control-group');
                if (labelContainer) {
                    // Hide the plain text display and show the input
                    const labelDisplay = labelContainer.querySelector('.label-display');
                    if (labelDisplay) {
                        labelDisplay.style.display = 'none';
                    }
                    labelInput.style.display = 'block';
                    labelInput.disabled = false;
                    labelInput.style.backgroundColor = '';
                    labelInput.style.color = '';
                }
            }
            if (sizeInput) sizeInput.style.display = 'block';
            if (applyToAllToggle) {
                const applyToAllContainer = applyToAllToggle.closest('.control-group');
                if (applyToAllContainer) applyToAllContainer.style.display = 'block';
            }
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Edits';
        }
        this._updateDeleteButtonText();
    }

    _updateDeleteButtonText() {
        const deleteBtn = document.getElementById('deleteCurrentVertex');
        if (!deleteBtn) return;
        if (this._editPreview && this._editPreview.pendingDelete) {
            deleteBtn.innerHTML = '<i class="fas fa-undo"></i> Un-delete Current Node';
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Current Node';
        }
        deleteBtn.disabled = false;
    }
    
    exitEditMode() {
            // Stop shaking animation
            this.stopShakeAnimation();
            this.editModeElement = null;
            this.editModeType = null;
        this._editOriginal = null;
        this._editPreview = null;
        // Hide edit controls
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'none';
        // Always hide delete mode panel when exiting edit mode
        const deletePanel = document.getElementById('deleteModePanel');
        if (deletePanel) deletePanel.style.display = 'none';
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection' && section.id !== 'deleteModePanel') section.style.display = 'block';
        });
        // Reset the edit section title
        const editTitle = editSection?.querySelector('h3');
        if (editTitle) {
            editTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Vertex';
        }
        this.draw();
    }
    
    startShakeAnimation() {
        this.shakeOffset = 0;
        this.shakeDirection = 1;
        
        const shake = () => {
            if (this.editModeElement) {
                this.shakeOffset += this.shakeDirection * 2;
                if (Math.abs(this.shakeOffset) > 8) {
                    this.shakeDirection *= -1;
                }
                this.draw();
                this.shakeAnimation = requestAnimationFrame(shake);
            }
        };
        
        this.shakeAnimation = requestAnimationFrame(shake);
    }
    
    stopShakeAnimation() {
        if (this.shakeAnimation) {
            cancelAnimationFrame(this.shakeAnimation);
            this.shakeAnimation = null;
        }
        this.shakeOffset = 0;
        this.draw();
    }
    
    showEditControls() {
        // Hide styling section
        const stylingSection = document.getElementById('stylingSection');
        if (stylingSection) {
            stylingSection.style.display = 'none';
        }
        
        // Show edit controls section
        const editSection = document.getElementById('editControlsSection');
        if (editSection) {
            editSection.style.display = 'block';
        }
        
        // Show basic controls (vertex size, edge type, etc.)
        const basicControls = document.getElementById('basicControlsSection');
        if (basicControls) {
            basicControls.style.display = 'block';
        }
        
        // Show tools section
        const toolsSection = document.getElementById('toolsSection');
        if (toolsSection) {
            toolsSection.style.display = 'block';
        }
        
        // Show info section
        const infoSection = document.getElementById('infoSection');
        if (infoSection) {
            infoSection.style.display = 'block';
        }
        
        // Show save/load section
        const saveLoadSection = document.getElementById('saveLoadSection');
        if (saveLoadSection) {
            saveLoadSection.style.display = 'block';
        }
        
        // Show search section
        const searchSection = document.getElementById('searchSection');
        if (searchSection) {
            searchSection.style.display = 'block';
        }
        
        // Reset apply-to-all checkboxes
        document.getElementById('applyToAllVertices').checked = false;
        document.getElementById('applyToAllEdges').checked = false;
        this.applyToAllVertices = false;
        this.applyToAllEdges = false;
        
        // Populate edit mode info
        const editModeInfo = document.getElementById('editModeInfo');
        if (editModeInfo) {
            if (this.editModeType === 'vertex') {
                // Count connected edges
                const connectedEdges = this.edges.filter(edge => 
                    edge.from.id === this.editModeElement.id || edge.to.id === this.editModeElement.id
                ).length;
                
                editModeInfo.innerHTML = `
                    <div class="edit-mode-item">
                        <i class="fas fa-circle"></i>
                        <strong>Vertex:</strong> ${this.editModeElement.label}
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <strong>Position:</strong> (${Math.round(this.editModeElement.x)}, ${Math.round(this.editModeElement.y)})
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-link"></i>
                        <strong>Connected Edges:</strong> ${connectedEdges}
                    </div>
                `;
                
                // Show vertex edit controls
                document.getElementById('vertexEditControls').style.display = 'block';
                document.getElementById('edgeEditControls').style.display = 'none';
                
                // Populate current values
                document.getElementById('editVertexColor').value = this.editModeElement.color || this.vertexColor;
                document.getElementById('editVertexBorderColor').value = this.editModeElement.borderColor || this.vertexBorderColor;
                document.getElementById('editVertexSize').value = this.editModeElement.size || this.vertexSize;
                document.getElementById('editVertexSizeValue').textContent = this.editModeElement.size || this.vertexSize;
                document.getElementById('editVertexFontSize').value = this.editModeElement.fontSize || this.vertexFontSize;
                document.getElementById('editVertexFontSizeValue').textContent = this.editModeElement.fontSize || this.vertexFontSize;
                document.getElementById('editVertexFontFamily').value = this.editModeElement.fontFamily || this.vertexFontFamily;
                document.getElementById('editVertexFontColor').value = this.editModeElement.fontColor || this.vertexFontColor;
                document.getElementById('editVertexLabel').value = this.editModeElement.label;
                
            } else if (this.editModeType === 'edge') {
                editModeInfo.innerHTML = `
                    <div class="edit-mode-item">
                        <i class="fas fa-minus"></i>
                        <strong>Edge:</strong> ${this.editModeElement.from.label} → ${this.editModeElement.to.label}
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-weight-hanging"></i>
                        <strong>Weight:</strong> ${this.editModeElement.weight || 'None'}
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-wave-square"></i>
                        <strong>Type:</strong> ${this.editModeElement.type || 'straight'}
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-arrow-right"></i>
                        <strong>Direction:</strong> ${this.editModeElement.direction || 'undirected'}
                    </div>
                `;
                
                // Show edge edit controls
                document.getElementById('edgeEditControls').style.display = 'block';
                document.getElementById('vertexEditControls').style.display = 'none';
                
                // Populate current values
                document.getElementById('editEdgeColor').value = this.editModeElement.color || this.edgeColor;
                document.getElementById('editEdgeWidth').value = this.editModeElement.width || this.edgeWidth;
                document.getElementById('editEdgeWidthValue').textContent = this.editModeElement.width || this.edgeWidth;
                document.getElementById('editEdgeFontSize').value = this.editModeElement.fontSize || this.edgeFontSize;
                document.getElementById('editEdgeFontSizeValue').textContent = this.editModeElement.fontSize || this.edgeFontSize;
                document.getElementById('editEdgeFontFamily').value = this.editModeElement.fontFamily || this.edgeFontFamily;
                document.getElementById('editEdgeFontColor').value = this.editModeElement.fontColor || this.edgeFontColor;
            }
        }
    }
    
    hideEditControls() {
        // Hide the edit controls section
        const editSection = document.getElementById('editControlsSection');
        if (editSection) {
            editSection.style.display = 'none';
        }
        // Show all other control sections except edit controls
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection') {
                section.style.display = 'block';
            }
        });
    }
    
    deleteSelectedElement() {
        if (!this.editModeElement || !this.editModeType) return;
        
        if (this.editModeType === 'vertex') {
            // Remove all edges connected to this vertex
            this.edges = this.edges.filter(edge => 
                edge.from.id !== this.editModeElement.id && edge.to.id !== this.editModeElement.id
            );
            
            // Remove the vertex
            this.vertices = this.vertices.filter(v => v.id !== this.editModeElement.id);
            
            this.updateStatus(`Vertex "${this.editModeElement.label}" deleted`);
        } else if (this.editModeType === 'edge') {
            // Remove the edge
            this.edges = this.edges.filter(edge => edge !== this.editModeElement);
            
            this.updateStatus('Edge deleted');
        }
        
        this.exitEditMode();
        this.updateInfo();
        this.draw();
        this.updateRootDropdown();
    }
    
    getVertexAt(x, y) {
        return this.vertices.find(vertex => {
            const distance = Math.sqrt((vertex.x - x) ** 2 + (vertex.y - y) ** 2);
            // Use vertexSize in CSS pixels for consistent hit detection
            return distance <= this.vertexSize;
        });
    }
    
    getEdgeAt(x, y) {
        return this.edges.find(edge => {
            if (edge.type === 'curved' && edge.controlPoint) {
                const distance = Math.sqrt((edge.controlPoint.x - x) ** 2 + (edge.controlPoint.y - y) ** 2);
                return distance <= this.edgeControlPointSize;
            }
            return false;
        });
    }
    
    addVertex(x, y) {
        const customLabel = document.getElementById('vertexLabel').value.trim();
        let label = customLabel;
        
        if (!label) {
            // Auto-generate label - find the next available numeric label
            label = this.findNextAvailableLabel();
        } else {
            // Check if custom label already exists
            const existingVertex = this.vertices.find(v => v.label === label);
            if (existingVertex) {
                this.updateStatus(`Label "${label}" already exists! Each vertex must have a unique label.`);
                return;
            }
        }
        
        const vertex = {
            id: this.nextVertexId++,
            x: x,
            y: y,
            label: label
        };
        
        this.vertices.push(vertex);
        this.updateInfo();
        this.forceRedraw();
        this.updateStatus(`Vertex "${label}" added!`);
        
        // Set the newly created vertex as the target
        this.selectTargetVertex(vertex);
        
        // Clear custom label input
        document.getElementById('vertexLabel').value = '';
        this.updateRootDropdown();
        
        // Auto-save if enabled
        if (this.autosaveEnabled) {
            this.saveGraph(true);
        }
    }
    
    findNextAvailableLabel() {
        // Get all existing labels
        const existingLabels = this.vertices.map(v => v.label);
        
        // Try to find the first available numeric label starting from 1
        let nextLabel = 1;
        while (existingLabels.includes(nextLabel.toString())) {
            nextLabel++;
        }
        
        return nextLabel.toString();
    }
    
    addEdge(vertex1, vertex2, weight = null) {
        // Check if edge already exists
        const existingEdge = this.edges.find(edge => 
            (edge.from === vertex1 && edge.to === vertex2) ||
            (edge.from === vertex2 && edge.to === vertex1)
        );
        
        if (!existingEdge) {
            const edge = {
                from: vertex1,
                to: vertex2,
                weight: weight,
                type: this.edgeType,
                direction: this.edgeDirection
            };
            // Remove control point for curved edges (always use fixed curve)
            // No edge.controlPoint
            this.edges.push(edge);
            
            // Update status with edge creation message
            const weightText = weight ? ` (weight: ${weight})` : '';
            this.updateStatus(`Edge created between vertices "${vertex1.label}" and "${vertex2.label}"${weightText}`);
        } else {
            // Edge already exists
            this.updateStatus(`Edge already exists between vertices "${vertex1.label}" and "${vertex2.label}"`);
        }
    this.forceRedraw();
        this.updateInfo();
        
        // Auto-save if enabled
        if (this.autosaveEnabled) {
            this.saveGraph(true);
        }
    }
    
    getAdjacencyList() {
        const adjacencyList = {};
        
        this.vertices.forEach(vertex => {
            adjacencyList[vertex.id] = [];
        });
        
        this.edges.forEach(edge => {
            adjacencyList[edge.from.id].push(edge.to);
            adjacencyList[edge.to.id].push(edge.from);
        });
        
        return adjacencyList;
    }
    
    findVertexByLabel(label) {
        return this.vertices.find(vertex => vertex.label === label);
    }
    
    findMostUpwardVertex() {
        if (this.vertices.length === 0) return null;
        return this.vertices.reduce((mostUpward, vertex) => {
            return vertex.y < mostUpward.y ? vertex : mostUpward;
        });
    }
    
    async runBFS() {
        if (!this.selectedTargetVertex) {
            this.updateStatus('Please select a target vertex first');
            return;
        }
        
        const rootLabel = document.getElementById('searchRoot').value;
        const targetVertex = this.selectedTargetVertex;
        
        if (this.vertices.length === 0) {
            this.updateStatus('No vertices to search');
            return;
        }
        
        let startVertex;
        if (rootLabel) {
            startVertex = this.findVertexByLabel(rootLabel);
            if (!startVertex) {
                this.updateStatus(`Root vertex "${rootLabel}" not found`);
                return;
            }
        } else {
            startVertex = this.findMostUpwardVertex();
        }
        
        // Check if root node is connected to at least one other node
        const adjacencyList = this.getAdjacencyList();
        if (!adjacencyList[startVertex.id] || adjacencyList[startVertex.id].length === 0) {
            this.updateStatus('Root node must be connected to at least one other node');
            return;
        }
        
        this.startSearch();
        await this.animateBFS(targetVertex, startVertex);
    }
    
    async runDFS() {
        if (!this.selectedTargetVertex) {
            this.updateStatus('Please select a target vertex first');
            return;
        }
        
        const rootLabel = document.getElementById('searchRoot').value;
        const targetVertex = this.selectedTargetVertex;
        
        if (this.vertices.length === 0) {
            this.updateStatus('No vertices to search');
            return;
        }
        
        let startVertex;
        if (rootLabel) {
            startVertex = this.findVertexByLabel(rootLabel);
            if (!startVertex) {
                this.updateStatus(`Root vertex "${rootLabel}" not found`);
                return;
            }
        } else {
            startVertex = this.findMostUpwardVertex();
        }
        
        // Check if root node is connected to at least one other node
        const adjacencyList = this.getAdjacencyList();
        if (!adjacencyList[startVertex.id] || adjacencyList[startVertex.id].length === 0) {
            this.updateStatus('Root node must be connected to at least one other node');
            return;
        }
        
        this.startSearch();
        await this.animateDFS(targetVertex, startVertex);
    }
    
    startSearch() {
        this.isSearching = true;
        this.visitedVertices.clear();
        this.pathVertices.clear();
        
        document.getElementById('runBFS').disabled = true;
        document.getElementById('runDFS').disabled = true;
        document.getElementById('stopSearch').disabled = false;
        
        this.updateStatus('Searching...');
    }
    
    stopSearch(showNotification = true) {
        this.isSearching = false;
        this.visitedVertices.clear();
        this.pathVertices.clear();
        
        document.getElementById('runBFS').disabled = false;
        document.getElementById('runDFS').disabled = false;
        document.getElementById('stopSearch').disabled = true;
        
        this.draw();
        if (showNotification) {
        this.updateStatus('Search stopped');
        }
    }
    
    async animateBFS(targetVertex, startVertex) {
        const adjacencyList = this.getAdjacencyList();
        const queue = [startVertex]; // Start from the specified starting vertex
        const visited = new Set();
        const parent = {};
        
        visited.add(startVertex.id);
        
        while (queue.length > 0 && this.isSearching) {
            const current = queue.shift();
            
            // Mark as visited
            this.visitedVertices.add(current);
            this.draw();
            await this.sleep(500);
            
            if (current.id === targetVertex.id) {
                // Found target, reconstruct path
                this.reconstructPath(parent, targetVertex);
                this.showSearchResult(true, 'BFS');
                return;
            }
            
            // Add neighbors to queue
            const neighbors = adjacencyList[current.id] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    parent[neighbor.id] = current;
                    queue.push(neighbor);
                }
            }
        }
        
        if (this.isSearching) {
            this.showSearchResult(false, 'BFS');
        }
    }
    
    async animateDFS(targetVertex, startVertex) {
        const adjacencyList = this.getAdjacencyList();
        const visited = new Set();
        const parent = {};
        
        const dfs = async (current) => {
            if (!this.isSearching) return false;
            
            visited.add(current.id);
            this.visitedVertices.add(current);
            this.draw();
            await this.sleep(500);
            
            if (current.id === targetVertex.id) {
                this.reconstructPath(parent, targetVertex);
                this.showSearchResult(true, 'DFS');
                return true;
            }
            
            const neighbors = adjacencyList[current.id] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    parent[neighbor.id] = current;
                    const found = await dfs(neighbor);
                    if (found) return true;
                }
            }
            
            return false;
        };
        
        const found = await dfs(startVertex);
        if (!found && this.isSearching) {
            this.showSearchResult(false, 'DFS');
        }
    }
    
    reconstructPath(parent, targetVertex) {
        const path = [];
        let current = targetVertex;
        
        while (current) {
            path.unshift(current);
            current = parent[current.id];
        }
        
        this.pathVertices = new Set(path);
        this.draw();
    }
    
    showSearchResult(found, algorithm) {
        this.isSearching = false;
        
        document.getElementById('runBFS').disabled = false;
        document.getElementById('runDFS').disabled = false;
        document.getElementById('stopSearch').disabled = true;
        
        const searchInfo = document.getElementById('searchInfo');
        if (found) {
            searchInfo.textContent = `${algorithm} found target! Path length: ${this.pathVertices.size}`;
            this.updateStatus(`${algorithm} found target vertex!`);
        } else {
            searchInfo.textContent = `${algorithm} did not find target vertex`;
            this.updateStatus(`${algorithm} completed - target not found`);
        }
        
        searchInfo.classList.add('show');
        
        // Clear after 5 seconds
        setTimeout(() => {
            this.visitedVertices.clear();
            this.pathVertices.clear();
            searchInfo.classList.remove('show');
            this.draw();
        }, 5000);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    

    
    hasUnsavedChanges() {
        if (!this.lastSavedState) {
            return this.vertices.length > 0 || this.edges.length > 0;
        }
        
        const currentState = JSON.stringify({
            vertices: this.vertices.map(v => ({ id: v.id, x: v.x, y: v.y, label: v.label })),
            edges: this.edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, type: e.type, direction: e.direction, controlPoint: e.controlPoint })),
            vertexSize: this.vertexSize,
            edgeType: this.edgeType,
            edgeDirection: this.edgeDirection,
            vertexColor: this.vertexColor,
            vertexBorderColor: this.vertexBorderColor,
            vertexFontSize: this.vertexFontSize,
            vertexFontFamily: this.vertexFontFamily,
            vertexFontColor: this.vertexFontColor,
            edgeColor: this.edgeColor,
            edgeWidth: this.edgeWidth,
            edgeFontSize: this.edgeFontSize,
            edgeFontFamily: this.edgeFontFamily,
            edgeFontColor: this.edgeFontColor
        });
        
        return currentState !== this.lastSavedState;
    }
    
    showLoadConfirmation() {
        console.log('showLoadConfirmation function called');
        
        // Always auto-save the current graph if there are any changes
        if (this.hasUnsavedChanges()) {
            this.saveCurrentGraphAndLoad();
        } else {
            this.showLoadDialog();
        }
    }
    
    saveCurrentGraphAndLoad() {
        // First save the current graph
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        const name = this.getTimestampString();
        
        const savedGraph = {
            id: Date.now(), // New graph gets a unique id
            name: name,
            data: graphData,
            timestamp: timestamp,
            vertices: this.vertices.length,
            edges: this.edges.length
        };
        
        // Add to saved graphs
        this.savedGraphs.unshift(savedGraph);
        if (this.savedGraphs.length > 10) {
            this.savedGraphs = this.savedGraphs.slice(0, 10);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
            this.updateSavedGraphsList();
            this.updateStatus('Current graph saved before loading new graph');
        } catch (error) {
            console.error('Failed to save graph:', error);
            this.updateStatus('Failed to save current graph');
        }
        
        // Now show load dialog
        this.showLoadDialog();
    }
    
    showLoadDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-folder-open"></i> Load Graph</h3>
                <div class="load-options">
                    <div class="load-section">
                        <h4><i class="fas fa-history"></i> Recent Graphs</h4>
                        <div id="loadRecentGraphs" class="load-graphs-list">
                            ${this.savedGraphs.length === 0 ? '<p class="no-graphs">No saved graphs found</p>' : ''}
                        </div>
                    </div>
                    <div class="load-section">
                        <h4><i class="fas fa-upload"></i> Import from File</h4>
                        <input type="file" id="loadFileInputModal" accept=".json" style="display: none;">
                        <button class="btn btn-secondary" id="browseFileBtn">
                            <i class="fas fa-folder"></i> Browse Files
                        </button>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" id="cancelLoadDialogBtn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Populate recent graphs
        this.populateLoadRecentGraphs();
        
        // Add event listeners
        document.getElementById('browseFileBtn').addEventListener('click', () => {
            document.getElementById('loadFileInputModal').click();
        });
        
        document.getElementById('loadFileInputModal').addEventListener('change', (e) => {
            this.handleFileLoad(e);
            document.body.removeChild(dialog);
        });
        
        document.getElementById('cancelLoadDialogBtn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    populateLoadRecentGraphs() {
        const container = document.getElementById('loadRecentGraphs');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.savedGraphs.forEach((savedGraph, index) => {
            const item = document.createElement('div');
            item.className = 'load-graph-item';
            item.innerHTML = `
                <div class="load-graph-info">
                    <div class="load-graph-name">${savedGraph.name}</div>
                    <div class="load-graph-details">${savedGraph.vertices} vertices, ${savedGraph.edges} edges</div>
                    <div class="load-graph-time">${new Date(savedGraph.timestamp).toLocaleString()}</div>
                </div>
                <button class="btn btn-primary load-graph-btn" data-index="${index}">
                    <i class="fas fa-download"></i> Load
                </button>
            `;
            
            const loadBtn = item.querySelector('.load-graph-btn');
            loadBtn.addEventListener('click', () => {
                this.loadSavedGraphWithConfirmation(savedGraph);
                document.body.removeChild(document.querySelector('.modal-overlay'));
            });
            
            container.appendChild(item);
        });
    }
    
    toggleDistanceMode() {
        this.isDistanceMode = !this.isDistanceMode;
        this.distanceModeVertices = [];
        this.selectedVertices = [];
        
        if (this.isDistanceMode) {
            document.getElementById('calculateDistance').classList.add('active');
            this.updateStatus('Distance mode: Click two vertices to calculate shortest path distance');
        } else {
            document.getElementById('calculateDistance').classList.remove('active');
            this.updateStatus('Distance mode disabled');
        }
        
        this.draw();
    }
    
    showDistanceInfo(distance, path) {
        const distanceInfo = document.getElementById('distanceInfo');
        const pathInfo = document.getElementById('pathInfo');

        if (distance === -1) {
            distanceInfo.textContent = 'No path exists between these vertices';
            pathInfo.textContent = '';
        } else if (distance === 0) {
            distanceInfo.textContent = 'Same vertex selected';
            pathInfo.textContent = '';
        } else {
            distanceInfo.textContent = `Shortest path distance: ${distance} edge${distance !== 1 ? 's' : ''}`;
            pathInfo.textContent = `Path: ${path.map(v => v.label).join(' -> ')}`;
        }
        distanceInfo.classList.add('show');
        pathInfo.classList.add('show');
        
        // Hide after 5 seconds
        setTimeout(() => {
            distanceInfo.classList.remove('show');
            pathInfo.classList.remove('show');
        }, 5000);
    }
    
    clearGraph() {
        if (this.vertices.length === 0 && this.edges.length === 0) {
            this.updateStatus('Graph is already empty');
            return;
        }
        
        // Get the current graph name if it exists
        let graphName = 'Untitled Graph';
        if (this.currentGraphId) {
            const existing = this.savedGraphs.find(g => g.id === this.currentGraphId);
            if (existing) {
                graphName = existing.name;
            }
        }
        
        // Show confirmation dialog with graph name
        const confirmed = confirm(`Are you sure you want to reset the graph "${graphName}"? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }
        
        // Clear the graph
        this.vertices = [];
        this.edges = [];
        this.selectedVertices = [];
        this.targetVertex = null;
        this.distanceMode = false;
        this.stopSearch();
        
        // Reset edit mode
        this.exitEditMode();
        
        // Clear any flashing vertices
        this.flashingVertices.clear();
        this.distanceFlashingVertices = null;
        
        // Update UI
        this.updateInfo();
        this.updateRootDropdown();
        this.updateTargetVertexDisplay();
        this.draw();
        
        this.updateStatus('Graph reset');
    }
    
    createNewGraph() {
        // Check if there's a current graph to save
        if (this.vertices.length > 0 || this.edges.length > 0) {
            // Auto-save the current graph first
            this.saveGraph(true); // true = auto-save mode
            this.updateStatus('Current graph saved, starting new graph');
        } else {
            this.updateStatus('Starting new graph');
        }
        
        // Clear the graph
        this.vertices = [];
        this.edges = [];
        this.selectedVertices = [];
        this.targetVertex = null;
        this.distanceMode = false;
        this.stopSearch(false); // Don't show "Search stopped" notification
        
        // Reset edit mode
        this.exitEditMode();
        
        // Clear any flashing vertices
        this.flashingVertices.clear();
        this.distanceFlashingVertices = null;
        
        // Reset current graph ID so new graph will be saved as a new entry
        this.currentGraphId = null;
        
        // Update UI
        this.updateInfo();
        this.updateRootDropdown();
        this.updateTargetVertexDisplay();
        this.draw();
    }
    
    hideInstructions() {
        const overlay = document.getElementById('instructionsOverlay');
        if (overlay) {
        overlay.style.display = 'none';
        }
    }
    
    updateInfo() {
        document.getElementById('vertexCount').textContent = this.vertices.length;
        document.getElementById('edgeCount').textContent = this.edges.length;
        
        // Hide/show delete nodes button based on vertex count
        const deleteNodesBtn = document.getElementById('deleteNodesBtn');
        if (deleteNodesBtn) {
            if (this.vertices.length === 0) {
                deleteNodesBtn.style.display = 'none';
            } else {
                deleteNodesBtn.style.display = 'block';
            }
        }
    }
    
    updateStatus(message) {
        document.getElementById('statusMessage').textContent = message;
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('currentTime').textContent = timeString;
    }
    
    draw() {
        // Clear canvas completely - use fillRect for more thorough clearing
        this.ctx.fillStyle = this.currentTheme === 'dark' ? '#0f172a' : '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset any canvas state that might cause artifacts
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw coordinate grid first (behind everything)
        this.drawCoordinateGrid();
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdge(edge));
        
        // Draw vertices with debug logging and duplicate detection
        this.vertices.forEach(vertex => {
            // Debug: Log each vertex being drawn
            if (this.debugMode) {
                console.log(`Drawing vertex: ${vertex.label} at (${vertex.x}, ${vertex.y})`);
                
                // Track how many times each vertex is drawn
                const key = `${vertex.label}-${vertex.x}-${vertex.y}`;
                this.vertexDrawCount.set(key, (this.vertexDrawCount.get(key) || 0) + 1);
                
                if (this.vertexDrawCount.get(key) > 1) {
                    console.warn(`VERTEX DRAWN MULTIPLE TIMES: ${vertex.label} at (${vertex.x}, ${vertex.y}) - drawn ${this.vertexDrawCount.get(key)} times`);
                }
            }
            this.drawVertex(vertex);
        });
        
        // Draw delete buttons if in delete mode
        if (this.isDeleteMode) {
            this.vertices.forEach(vertex => this.drawDeleteButton(vertex));
        }
    }
    
    drawEdge(edge) {
        // Apply shaking animation if this edge is in edit mode
        let drawFromX = edge.from.x;
        let drawFromY = edge.from.y;
        let drawToX = edge.to.x;
        let drawToY = edge.to.y;
        
        if (this.editModeElement === edge && this.editModeType === 'edge') {
            drawFromX += this.shakeOffset;
            drawFromY += this.shakeOffset * 0.5;
            drawToX += this.shakeOffset;
            drawToY += this.shakeOffset * 0.5;
        }
        
        // Determine edge styling based on individual properties
        let edgeColor = edge.color || this.edgeColor;
        let edgeWidth = edge.width || this.edgeWidth;
        let edgeFontSize = edge.fontSize || this.edgeFontSize;
        let edgeFontFamily = edge.fontFamily || this.edgeFontFamily;
        let edgeFontColor = edge.fontColor || this.edgeFontColor;
        
        if (this.editModeElement === edge && this.editModeType === 'edge') {
            edgeColor = '#ef4444';
        }
        
        this.ctx.strokeStyle = edgeColor;
        this.ctx.lineWidth = edgeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        
        if (edge.type === 'curved') {
            // Draw curved edge with quadratic Bézier curve using fixed control point
            const controlPoint = {
                x: (drawFromX + drawToX) / 2,
                y: (drawFromY + drawToY) / 2 - 40
            };
            this.ctx.moveTo(drawFromX, drawFromY);
            this.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, drawToX, drawToY);
        } else {
            // Draw straight edge
            this.ctx.moveTo(drawFromX, drawFromY);
            this.ctx.lineTo(drawToX, drawToY);
        }
        this.ctx.stroke();
        
        // Draw arrow for directed edges
        if (edge.direction !== 'undirected') {
            this.drawArrow(edge);
        }
        
        // Draw weight if exists
        if (edge.weight !== null && edge.weight !== '') {
            let midX, midY;
            if (edge.type === 'curved') {
                // For curved edges, position weight near the fixed control point
                midX = (drawFromX + drawToX) / 2;
                midY = (drawFromY + drawToY) / 2 - 60;
            } else {
                // For straight edges, position weight at midpoint
                midX = (drawFromX + drawToX) / 2;
                midY = (drawFromY + drawToY) / 2;
            }
            // Background for weight text
            this.ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(midX - 20, midY - 12, 40, 24);
            // Weight text
            this.ctx.fillStyle = edgeFontColor;
            this.ctx.font = `bold ${edgeFontSize}px ${edgeFontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(edge.weight.toString(), midX, midY);
        }
        
        // Add glow effect for edit mode
        if (this.editModeElement === edge && this.editModeType === 'edge') {
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawVertex(vertex) {
        const ctx = this.ctx;
        let size = (vertex.size || this.vertexSize);
        let label = vertex.label;
        let isPendingDeleteEdit = false;
        // If in edit mode and this is the vertex being edited, use preview state
        if (this.editModeElement === vertex && this._editPreview) {
            size = this._editPreview.size;
            label = this._editPreview.label;
            isPendingDeleteEdit = !!this._editPreview.pendingDelete;
        }
        
        // Check if this vertex is selected for edge creation
        const isSelectedForEdge = this.selectedVertices.includes(vertex);
        
        // Check if this vertex is flashing (after edge creation)
        const isFlashing = this.flashingVertices.has(vertex);
        
        // Check if this vertex is flashing for distance calculation
        const isDistanceFlashing = this.distanceFlashingVertices && this.distanceFlashingVertices.has(vertex);
        
        // Check if this vertex is in edit mode (shaking)
        const isInEditMode = this.editModeElement === vertex && this.editModeType === 'vertex';
        
        // Check if vertex is marked for deletion
        const isMarkedForDeletion = this.isDeleteMode && this.verticesToDelete.has(vertex.id);
        
        // Check if this vertex is being held for edit mode
        const isBeingHeld = this.holdProgressVertex === vertex && this.holdProgress > 0;
        
        // Apply shake offset if in edit mode
        let drawX = vertex.x;
        let drawY = vertex.y;
        if (isInEditMode && this.shakeOffset !== undefined) {
            drawX += this.shakeOffset;
            drawY += this.shakeOffset * 0.5;
        }
        
        // Set colors based on selection state
        let fillColor = vertex.color || this.vertexColor;
        let borderColor = vertex.borderColor || this.vertexBorderColor;
        
        if (isSelectedForEdge || isFlashing) {
            // Purple for vertices selected for edge creation or flashing after edge creation
            fillColor = '#8b5cf6'; // Purple
            borderColor = '#a855f7'; // Lighter purple
        } else if (isDistanceFlashing) {
            // Blue flash for distance calculation vertices
            fillColor = '#3b82f6'; // Blue
            borderColor = '#60a5fa'; // Lighter blue
        } else if (this.visitedVertices.has(vertex)) {
            // Green for visited vertices during search
            fillColor = '#10b981';
            borderColor = '#34d399';
        } else if (this.pathVertices.has(vertex)) {
            // Orange for path vertices during search
            fillColor = '#f59e0b';
            borderColor = '#fbbf24';
        } else if (this.distanceModeVertices.includes(vertex)) {
            // Blue for distance mode vertices
            fillColor = '#3b82f6';
            borderColor = '#60a5fa';
        }
        
        // Draw red glow effect for held vertex
        if (isBeingHeld) {
            ctx.save();
            const maxGlowRadius = size * 2; // Maximum glow radius
            const glowRadius = size + (maxGlowRadius - size) * this.holdProgress;
            const glowAlpha = 0.3 + 0.4 * this.holdProgress;
            const glowIntensity = 0.5 + 0.5 * this.holdProgress;
            const gradient = ctx.createRadialGradient(drawX, drawY, size, drawX, drawY, glowRadius);
            gradient.addColorStop(0, `rgba(239, 68, 68, ${glowAlpha * glowIntensity})`);
            gradient.addColorStop(0.5, `rgba(239, 68, 68, ${glowAlpha * 0.7})`);
            gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
            ctx.beginPath();
            ctx.arc(drawX, drawY, glowRadius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
        
        // Apply fade effect for deleted vertices
        if (isMarkedForDeletion || isPendingDeleteEdit) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            fillColor = '#ec4899';
            borderColor = '#f472b6';
        }
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, size, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Draw vertex label
        const fontSize = (vertex.fontSize || this.vertexFontSize);
        const fontFamily = vertex.fontFamily || this.vertexFontFamily;
        const fontColor = vertex.fontColor || this.vertexFontColor;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(label, drawX, drawY);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        if (isMarkedForDeletion || isPendingDeleteEdit) {
            ctx.restore();
        }
    }
    
    drawArrow(edge) {
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6; // 30 degrees
        
        let endX, endY;
        let angle;
        
        if (edge.type === 'curved' && edge.controlPoint) {
            // For curved edges, calculate the angle at the end point using control point
            const controlPoint = edge.controlPoint;
            
            // Calculate the tangent at the end point
            const dx = edge.to.x - controlPoint.x;
            const dy = edge.to.y - controlPoint.y;
            angle = Math.atan2(dy, dx);
        } else {
            // For straight edges
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Determine arrow direction based on edge direction setting
        if (edge.direction === 'directed-backward') {
            angle += Math.PI; // Reverse the arrow
            endX = edge.from.x;
            endY = edge.from.y;
        } else {
            // directed-forward or default
            endX = edge.to.x;
            endY = edge.to.y;
        }
        
        // Calculate arrow position (slightly inside the vertex)
        const vertexRadius = this.vertexSize;
        const arrowDistance = vertexRadius + 5;
        
        const arrowX = endX - arrowDistance * Math.cos(angle);
        const arrowY = endY - arrowDistance * Math.sin(angle);
        
        // Draw arrow
        this.ctx.strokeStyle = this.edgeColor;
        this.ctx.lineWidth = this.edgeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - arrowAngle),
            arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + arrowAngle),
            arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }
    
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    // Add this method to update the root node dropdown
    updateRootDropdown() {
        const rootDropdown = document.getElementById('searchRoot');
        if (!rootDropdown) return;
        const current = rootDropdown.value;
        // Clear all except the first option
        while (rootDropdown.options.length > 1) {
            rootDropdown.remove(1);
        }
        this.vertices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.label;
            opt.textContent = v.label;
            rootDropdown.appendChild(opt);
        });
        // Try to restore previous selection if possible
        if (current && Array.from(rootDropdown.options).some(o => o.value === current)) {
            rootDropdown.value = current;
        } else {
            rootDropdown.value = '';
        }
    }
    
    // Setup reset target button
    setupResetTargetBtn() {
        const resetBtn = document.getElementById('resetTargetBtn');
        console.log('Reset button found:', resetBtn); // Debug
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Reset button clicked'); // Debug
                this.clearTargetVertex();
            });
        } else {
            console.error('Reset target button not found!');
        }
    }
    
    // Target Selection Methods
    selectTargetVertex(vertex) {
        this.selectedTargetVertex = vertex;
        
        // Update the display
        this.updateTargetVertexDisplay();
        
        // Remove status message for target updates
    }
    
    updateTargetVertexDisplay() {
        const display = document.getElementById('targetVertexDisplay');
        
        if (this.selectedTargetVertex) {
            display.innerHTML = `
                <div class="target-vertex-info">
                    <div class="target-vertex-icon">${this.selectedTargetVertex.label}</div>
                    <span class="target-vertex-label">Vertex ${this.selectedTargetVertex.label}</span>
                    <span class="target-vertex-coords">(${Math.round(this.selectedTargetVertex.x)}, ${Math.round(this.selectedTargetVertex.y)})</span>
                </div>
            `;
            display.classList.add('has-target');
        } else {
            display.innerHTML = '<span class="target-placeholder">Right click on any vertex to set as target</span>';
            display.classList.remove('has-target');
        }
    }
    
    clearTargetVertex() {
        this.selectedTargetVertex = null;
        this.updateTargetVertexDisplay();
        // Remove status message for clearing target
    }
    
    // Edit Mode Application Methods
    applyVertexEdit(property, value) {
        if (this.editModeType !== 'vertex') return;
        
        if (this.applyToAllVertices) {
            // Apply to all vertices
            this.vertices.forEach(vertex => {
                if (property === 'size') {
                    vertex.size = value;
                } else if (property === 'label') {
                    // For labels, ensure uniqueness
                    if (value && value.trim()) {
                        const existingVertex = this.vertices.find(v => v.id !== vertex.id && v.label === value.trim());
                        if (!existingVertex) {
                            vertex.label = value.trim();
                        }
                    }
                } else {
                    vertex[property] = value;
                }
            });
            this.updateStatus(`Applied ${property} to all vertices`);
        } else {
            // Apply to selected vertex only
            if (property === 'size') {
                this.editModeElement.size = value;
            } else if (property === 'label') {
                // For labels, ensure uniqueness
                if (value && value.trim()) {
                    const existingVertex = this.vertices.find(v => v.id !== this.editModeElement.id && v.label === value.trim());
                    if (!existingVertex) {
                        this.editModeElement.label = value.trim();
                    } else {
                        this.updateStatus(`Label "${value.trim()}" already exists!`);
                        return;
                    }
                }
            } else {
                this.editModeElement[property] = value;
            }
            this.updateStatus(`Updated vertex ${property}`);
        }
        
        this.draw();
        this.updateEditModeInfo();
        this.updateRootDropdown();
    }
    
    applyEdgeEdit(property, value) {
        if (this.editModeType !== 'edge') return;
        
        if (this.applyToAllEdges) {
            // Apply to all edges
            this.edges.forEach(edge => {
                edge[property] = value;
            });
            this.updateStatus(`Applied ${property} to all edges`);
        } else {
            // Apply to selected edge only
            this.editModeElement[property] = value;
            this.updateStatus(`Updated edge ${property}`);
        }
        
        this.draw();
        this.updateEditModeInfo();
    }
    
    // Save and exit edit mode
    saveAndExitEditMode() {
        if (this.editModeElement && this.editModeType) {
            this.updateStatus(`${this.editModeType === 'vertex' ? 'Vertex' : 'Edge'} changes saved`);
            this.exitEditMode();
        }
    }
    
    updateEditModeInfo() {
        if (!this.editModeElement || !this.editModeType) return;
        
        const editModeInfo = document.getElementById('editModeInfo');
        if (!editModeInfo) return;
        
        if (this.editModeType === 'vertex') {
            const applyAllWarning = this.applyToAllVertices ? 
                '<div class="edit-mode-item" style="color: var(--warning-color); font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> <strong>⚠️ APPLYING TO ALL VERTICES</strong></div>' : '';
            
            editModeInfo.innerHTML = `
                ${applyAllWarning}
                <div class="edit-mode-item">
                    <i class="fas fa-circle"></i>
                    <strong>Vertex:</strong> ${this.editModeElement.label}
                </div>
                <div class="edit-mode-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Position:</strong> (${Math.round(this.editModeElement.x)}, ${Math.round(this.editModeElement.y)})
                </div>
                <div class="edit-mode-item">
                    <i class="fas fa-expand-arrows-alt"></i>
                    <strong>Size:</strong> ${this.editModeElement.size || this.vertexSize}
                </div>
            `;
        } else if (this.editModeType === 'edge') {
            const applyAllWarning = this.applyToAllEdges ? 
                '<div class="edit-mode-item" style="color: var(--warning-color); font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> <strong>⚠️ APPLYING TO ALL EDGES</strong></div>' : '';
            
            editModeInfo.innerHTML = `
                ${applyAllWarning}
                <div class="edit-mode-item">
                    <i class="fas fa-minus"></i>
                    <strong>Edge:</strong> ${this.editModeElement.from.label} → ${this.editModeElement.to.label}
                </div>
                <div class="edit-mode-item">
                    <i class="fas fa-weight-hanging"></i>
                    <strong>Weight:</strong> ${this.editModeElement.weight || 'None'}
                </div>
            `;
        }
    }

    // --- Minimal Vertex Edit Mode Implementation ---
    enterEditMode(vertex) {
        console.log('[EditMode] Entering edit mode for vertex:', vertex.label);
        this.exitEditMode();
        this.editModeElement = vertex;
        this.editModeType = 'vertex';
        // Store original values for cancellation
        this._editOriginal = {
            label: vertex.label,
            size: vertex.size || this.vertexSize,
        };
        // Temporary edit state for preview
        this._editPreview = {
            label: vertex.label,
            size: vertex.size || this.vertexSize,
            pendingDelete: false
        };
        this._originalAllVertexSizes = this.vertices.map(v => v.size || this.vertexSize);
        this.startShakeAnimation();
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'block';
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection') section.style.display = 'none';
        });
        const editTitle = editSection.querySelector('h3');
        if (editTitle) editTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Vertex "${vertex.label}"`;
        const labelInput = document.getElementById('editVertexLabel');
        const sizeInput = document.getElementById('editVertexSize');
        const sizeValue = document.getElementById('editVertexSizeValue');
        if (labelInput && sizeInput && sizeValue) {
            labelInput.value = vertex.label;
            sizeInput.value = vertex.size || this.vertexSize;
            sizeValue.textContent = vertex.size || this.vertexSize;
        }
        labelInput.style.borderColor = '';
        labelInput.style.boxShadow = '';
        const warningMsg = document.getElementById('editVertexLabelWarning');
        if (warningMsg) warningMsg.textContent = '';
        const applyToAllToggle = document.getElementById('applyToAllToggle');
        if (applyToAllToggle) applyToAllToggle.checked = false;
        setTimeout(() => { if (labelInput) { labelInput.focus(); labelInput.select(); } }, 100);
        this._setupApplyToAllImmediateListeners();
        this._updateEditPanelForPendingDelete(false);
        this._updateDeleteButtonText();
        this.draw();
    }

    _setupApplyToAllImmediateListeners() {
        const sizeInput = document.getElementById('editVertexSize');
        const applyToAllToggle = document.getElementById('applyToAllToggle');
        if (!sizeInput || !applyToAllToggle) return;
        // Remove previous listeners if any
        if (this._applyToAllSizeListener) sizeInput.removeEventListener('input', this._applyToAllSizeListener);
        if (this._applyToAllToggleListener) applyToAllToggle.removeEventListener('change', this._applyToAllToggleListener);
        // Listener for size slider
        this._applyToAllSizeListener = (e) => {
            const newSize = parseInt(e.target.value);
            document.getElementById('editVertexSizeValue').textContent = newSize;
            if (this.editModeElement) {
                this.editModeElement.size = newSize;
                if (applyToAllToggle.checked) {
                    this.vertices.forEach((v, idx) => {
                        if (v !== this.editModeElement) v.size = newSize;
                    });
                }
                this.draw();
            }
        };
        sizeInput.addEventListener('input', this._applyToAllSizeListener);
        // Listener for apply-to-all toggle
        this._applyToAllToggleListener = (e) => {
            const checked = e.target.checked;
            const newSize = parseInt(sizeInput.value);
            if (checked) {
                // Apply current size to all other vertices
                this.vertices.forEach((v, idx) => {
                    if (v !== this.editModeElement) v.size = newSize;
                });
            } else {
                // Revert all other vertices to their original sizes
                this.vertices.forEach((v, idx) => {
                    if (v !== this.editModeElement) v.size = this._originalAllVertexSizes[idx];
                });
            }
            this.draw();
        };
        applyToAllToggle.addEventListener('change', this._applyToAllToggleListener);
    }

    exitEditMode() {
        // Stop shaking animation
        this.stopShakeAnimation();
        
        this.editModeElement = null;
        this.editModeType = null;
        this._editOriginal = null;
        this._editPreview = null;
        // Hide edit controls
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'none';
        // Always hide delete mode panel when exiting edit mode
        const deletePanel = document.getElementById('deleteModePanel');
        if (deletePanel) deletePanel.style.display = 'none';
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection' && section.id !== 'deleteModePanel') section.style.display = 'block';
        });
        // Reset the edit section title
        const editTitle = editSection?.querySelector('h3');
        if (editTitle) {
            editTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Vertex';
        }
        this.draw();
    }

    setupMinimalEditModeEvents() {
        // Label input: immediate update with validation
        const labelInput = document.getElementById('editVertexLabel');
        const saveBtn = document.getElementById('saveVertexEdit');
        // Create warning message element if it doesn't exist
        let warningMsg = document.getElementById('editVertexLabelWarning');
        if (!warningMsg) {
            warningMsg = document.createElement('div');
            warningMsg.id = 'editVertexLabelWarning';
            warningMsg.style.color = 'var(--danger-color)';
            warningMsg.style.fontSize = '0.8rem';
            warningMsg.style.marginTop = '0.25rem';
            warningMsg.style.fontWeight = '500';
            labelInput.parentElement.appendChild(warningMsg);
        }
        labelInput.addEventListener('input', (e) => {
            if (this.editModeElement && this._editPreview && !this._editPreview.pendingDelete) {
                this._editPreview.label = e.target.value;
                this.draw();
                this.updateRootDropdown();
                // Show validation warnings and disable save if not unique
                const trimmed = e.target.value.trim();
                let error = '';
                if (!trimmed) {
                    error = 'Label cannot be empty.';
                } else if (this.vertices.some(v => v !== this.editModeElement && v.label === trimmed)) {
                    error = `Label "${trimmed}" already exists! Each vertex must have a unique label.`;
                }
                if (error) {
                    labelInput.style.borderColor = 'var(--danger-color)';
                    labelInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                    warningMsg.textContent = error;
                    saveBtn.disabled = true;
                } else {
                    labelInput.style.borderColor = '';
                    labelInput.style.boxShadow = '';
                    warningMsg.textContent = '';
                    saveBtn.disabled = false;
                }
            }
        });
        
        // Size slider: immediate update with apply-to-all support
        document.getElementById('editVertexSize').addEventListener('input', (e) => {
            if (this.editModeElement && this._editPreview && !this._editPreview.pendingDelete) {
            const newSize = parseInt(e.target.value);
            document.getElementById('editVertexSizeValue').textContent = newSize;
                this._editPreview.size = newSize;
                this.draw();
            }
        });
        
        // Apply-to-all toggle: immediate apply/revert
        document.getElementById('applyToAllToggle').addEventListener('change', (e) => {
            const checked = e.target.checked;
            const newSize = parseInt(document.getElementById('editVertexSize').value);
            
            if (checked) {
                // Apply current size to all other vertices
                this.vertices.forEach(vertex => {
                    if (vertex !== this.editModeElement) {
                        vertex.size = newSize;
                    }
                });
            } else {
                // Revert all other vertices to their original sizes
                this.vertices.forEach(vertex => {
                    if (vertex !== this.editModeElement && this._originalAllVertexSizes) {
                        const originalIndex = this.vertices.findIndex(v => v === vertex);
                        if (originalIndex !== -1 && this._originalAllVertexSizes[originalIndex]) {
                            vertex.size = this._originalAllVertexSizes[originalIndex];
                        }
                    }
                });
            }
            this.draw();
        });
        
        // Save button: validate and exit edit mode
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.editModeElement && this._editPreview) {
                if (this._editPreview.pendingDelete) {
                    // Actually delete the node now
                    const vertexToDelete = this.editModeElement;
                    const vertexLabel = vertexToDelete.label;
                    this.edges = this.edges.filter(edge => edge.from.id !== vertexToDelete.id && edge.to.id !== vertexToDelete.id);
                    this.vertices = this.vertices.filter(v => v.id !== vertexToDelete.id);
                    this.updateStatus(`Vertex "${vertexLabel}" deleted`);
                this.exitEditMode();
                    this.updateInfo();
                    this.updateRootDropdown();
                    this.draw();
                    if (this.autosaveEnabled) this.saveGraph(true);
                    return;
                }
                // Apply label/size edits
                this.editModeElement.label = this._editPreview.label;
                this.editModeElement.size = this._editPreview.size;
                this.updateStatus('Vertex updated successfully!');
                this.exitEditMode();
                this.updateRootDropdown();
                this.draw();
                if (this.autosaveEnabled) this.saveGraph(true);
            }
        });
        
        // Cancel button: restore original values
        document.getElementById('cancelVertexEdit').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.editModeElement && this._editPreview) {
                // Revert preview
                this._editPreview = null;
                // Restore original values
                this.editModeElement.label = this._editOriginal.label;
                this.editModeElement.size = this._editOriginal.size;
                const labelInput = document.getElementById('editVertexLabel');
                if (labelInput) { labelInput.style.borderColor = ''; labelInput.style.boxShadow = ''; }
                let warningMsg = document.getElementById('editVertexLabelWarning');
                if (warningMsg) warningMsg.textContent = '';
                this.exitEditMode();
                this.updateRootDropdown();
                this.draw();
                this.updateStatus('Edit cancelled - changes reverted.');
            }
        });
        
        // Form submit: same as save button
        document.getElementById('vertexEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveBtn.click();
        });
        
        // Enter key to save, Escape to cancel
        labelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBtn.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.getElementById('cancelVertexEdit').click();
            }
        });
        
        // Delete current vertex button: toggle pending delete
        document.getElementById('deleteCurrentVertex').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.editModeElement && this._editPreview) {
                this._editPreview.pendingDelete = !this._editPreview.pendingDelete;
                this._updateEditPanelForPendingDelete(this._editPreview.pendingDelete);
                this.draw();
            }
        });
    }

    // --- END Minimal Vertex Edit Mode ---

    // In constructor, after DOMContentLoaded, call this.setupMinimalEditModeEvents();

    // Flash effect for vertices after edge creation
    flashVertices(vertex1, vertex2) {
        // Add vertices to flashing set
        this.flashingVertices.add(vertex1);
        this.flashingVertices.add(vertex2);
        
        // Redraw to show flash
        this.draw();
        
        // Clear flash after 1 second
        this.flashTimer = setTimeout(() => {
            this.flashingVertices.clear();
            this.draw();
        }, 1000);
    }
    
    // Flash effect for vertices during distance calculation
    flashDistanceVertices(vertex1, vertex2) {
        // Add vertices to distance flashing set
        this.distanceFlashingVertices = new Set([vertex1, vertex2]);
        
        // Redraw to show flash
        this.draw();
        
        // Clear flash after 1 second
        setTimeout(() => {
            this.distanceFlashingVertices = null;
            this.draw();
        }, 1000);
    }

    // Edit the name of a saved graph
    editSavedGraphName(index, nameElement) {
        const savedGraph = this.savedGraphs[index];
        if (!savedGraph) return;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = savedGraph.name;
        input.style.cssText = `
            width: 100%;
            padding: 0.25rem 0.5rem;
            border: 1px solid var(--primary-color);
            border-radius: var(--radius-sm);
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 0.875rem;
            font-weight: 500;
        `;
        
        // Replace the name element with input
        const originalContent = nameElement.innerHTML;
        nameElement.innerHTML = '';
        nameElement.appendChild(input);
        input.focus();
        input.select();
        
        // Handle save on Enter or blur
        const saveName = () => {
            const newName = input.value.trim();
            if (newName && newName !== savedGraph.name) {
                // Check for duplicate names
                const isDuplicate = this.savedGraphs.some((g, i) => i !== index && g.name === newName);
                if (isDuplicate) {
                    this.updateStatus(`Name "${newName}" already exists!`);
                    return;
                }
                
                // Update the saved graph name
                savedGraph.name = newName;
                
                // Save to localStorage
                try {
                    localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
                    this.updateSavedGraphsList();
                    this.updateStatus(`Graph renamed to "${newName}"`);
                } catch (error) {
                    console.error('Failed to save graph name:', error);
                    this.updateStatus('Failed to save graph name');
                }
            } else {
                // Restore original content if no change or empty
                nameElement.innerHTML = originalContent;
            }
        };
        
        // Handle cancel on Escape
        const cancelEdit = () => {
            nameElement.innerHTML = originalContent;
        };
        
        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveName();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }
    
    // Setup expandable sections
    setupExpandableSections() {
        const searchHeader = document.getElementById('searchSectionHeader');
        const searchContent = document.getElementById('searchSectionContent');
        const searchIcon = document.getElementById('searchExpandIcon');
        
        if (searchHeader && searchContent && searchIcon) {
            searchHeader.addEventListener('click', () => {
                const isExpanded = searchHeader.classList.contains('expanded');
                
                if (isExpanded) {
                    // Collapse
                    searchContent.style.display = 'none';
                    searchContent.classList.remove('show');
                    searchHeader.classList.remove('expanded');
                    searchIcon.style.transform = 'rotate(0deg)';
                } else {
                    // Expand
                    searchContent.style.display = 'block';
                    searchContent.classList.add('show');
                    searchHeader.classList.add('expanded');
                    searchIcon.style.transform = 'rotate(180deg)';
                }
            });
        }
    }
    
    // Setup mouse coordinate tracking
    setupMouseCoordinateTracking() {
        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.getMousePos(e);
            this.mouseCoordinates = pos;
            this.mouseOverCanvas = true;
            this.updateMouseCoordinateDisplay();
        });
        
        this.canvas.addEventListener('mouseenter', () => {
            this.mouseOverCanvas = true;
            this.updateMouseCoordinateDisplay();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseOverCanvas = false;
            this.updateMouseCoordinateDisplay();
        });
    }
    
    // Update mouse coordinate display
    updateMouseCoordinateDisplay() {
        const coordDisplay = document.getElementById('mouseCoordinates');
        if (coordDisplay) {
            if (!this.showMouseCoordinates || !this.mouseOverCanvas) {
                coordDisplay.textContent = '';
            } else {
                // Display coordinates in bottom-left origin system
                const displayX = Math.round(this.mouseCoordinates.x);
                const displayY = Math.round(this.mouseCoordinates.y);
                coordDisplay.textContent = `(${displayX}, ${displayY})`;
            }
        }
    }
    
    updateGridSpacing() {
        // Convert density (10-100) to spacing (100-10 pixels)
        // Higher density = smaller spacing
        this.gridSpacing = Math.max(10, 110 - this.gridDensity);
    }
    
    drawCoordinateGrid() {
        if (!this.showCoordinateGrid) return;
        
        const ctx = this.ctx;
        const width = 1800; // Fixed coordinate system width
        const height = 1800; // Fixed coordinate system height
        
        // Set grid styling
        ctx.strokeStyle = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= width; x += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Draw horizontal lines (top-left origin)
        for (let y = 0; y <= height; y += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw coordinate labels at grid intersections (every 5th line for readability)
        if (this.gridSpacing >= 30) { // Only show labels if grid is not too dense
            ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            for (let x = this.gridSpacing * 5; x <= width; x += this.gridSpacing * 5) {
                for (let y = this.gridSpacing * 5; y <= height; y += this.gridSpacing * 5) {
                    // Display top-left origin coordinates
                    ctx.fillText(`${x}, ${y}`, x + 2, y + 2);
                }
            }
        }
    }
    
    // Delete a saved graph by id
    deleteSavedGraph(id) {
        if (!confirm('Are you sure you want to delete this saved graph?')) return;
        const idx = this.savedGraphs.findIndex(g => g.id === id);
        if (idx !== -1) {
            this.savedGraphs.splice(idx, 1);
            try {
                localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
                this.updateSavedGraphsList();
                this.updateStatus('Saved graph deleted');
            } catch (error) {
                console.error('Failed to delete saved graph:', error);
                this.updateStatus('Failed to delete saved graph');
            }
        }
    }
    
    // Delete all saved graphs
    deleteAllSavedGraphs() {
        if (this.savedGraphs.length === 0) {
            this.updateStatus('No saved graphs to delete');
            return;
        }
        
        const graphCount = this.savedGraphs.length;
        const confirmed = confirm(`Are you sure you want to delete all ${graphCount} saved graphs? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }
        
        try {
            this.savedGraphs = [];
            localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
            this.updateSavedGraphsList();
            this.updateStatus(`All ${graphCount} saved graphs deleted`);
        } catch (error) {
            console.error('Failed to delete all saved graphs:', error);
            this.updateStatus('Failed to delete saved graphs');
        }
    }
    
    // Contact modal functionality
    showContactModal() {
        // Reset form
        document.getElementById('contactForm').reset();
        
        // Show modal using Bootstrap
        const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
        contactModal.show();
    }
    
    handleContactSubmit() {
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        };
        
        // For now, just log the data and show a success message
        console.log('Contact form submitted:', formData);
        
        // Show success message
        this.updateStatus('Thank you for your message! I\'ll get back to you soon.');
        
        // Close modal
        const contactModal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        contactModal.hide();
        
        // Reset form
        document.getElementById('contactForm').reset();
    }

    // --- Delete Nodes Mode ---
    enterDeleteMode() {
        this.isDeleteMode = true;
        this.verticesToDelete = new Set();
        // Save original state for cancel
        this.originalVertices = this.vertices.map(v => ({ ...v }));
        this.originalEdges = this.edges.map(e => ({ ...e }));
        document.body.classList.add('delete-mode-active');
        document.getElementById('deleteNodesControls').style.display = 'none';
        // Show delete mode panel
        this.showDeleteModePanel();
        this.draw();
    }

    saveDeleteChanges() {
        // Remove vertices marked for deletion
        this.vertices = this.vertices.filter(v => !this.verticesToDelete.has(v.id));
        // Remove edges connected to deleted vertices
        this.edges = this.edges.filter(e => !this.verticesToDelete.has(e.from.id) && !this.verticesToDelete.has(e.to.id));
        this.isDeleteMode = false;
        this.verticesToDelete = new Set();
        document.body.classList.remove('delete-mode-active');
        document.getElementById('deleteNodesControls').style.display = 'flex';
        // Hide delete mode panel
        this.hideDeleteModePanel();
        // Ensure edit controls section is hidden after delete mode
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'none';
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection' && section.id !== 'deleteModePanel') {
                section.style.display = 'block';
            }
        });
        this.updateInfo();
        this.updateRootDropdown();
        this.draw();
        this.updateStatus('Deleted selected nodes');
        // Auto-save if enabled
        if (this.autosaveEnabled) {
            this.saveGraph(true);
        }
    }

    cancelDeleteChanges() {
        // Restore original state
        this.vertices = this.originalVertices.map(v => ({ ...v }));
        this.edges = this.originalEdges.map(e => ({ ...e }));
        this.isDeleteMode = false;
        this.verticesToDelete = new Set();
        document.body.classList.remove('delete-mode-active');
        document.getElementById('deleteNodesControls').style.display = 'flex';
        // Hide delete mode panel
        this.hideDeleteModePanel();
        // Ensure edit controls section is hidden after delete mode
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'none';
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection' && section.id !== 'deleteModePanel') {
                section.style.display = 'block';
            }
        });
        this.updateInfo();
        this.updateRootDropdown();
        this.draw();
        this.updateStatus('Cancelled node deletion');
    }

    showDeleteModePanel() {
        // Hide all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'deleteModePanel') {
                section.style.display = 'none';
            }
        });
        
        // Show delete mode panel
        const deletePanel = document.getElementById('deleteModePanel');
        if (deletePanel) {
            deletePanel.style.display = 'block';
            this.updateDeleteModeInfo();
        }
    }

    hideDeleteModePanel() {
        // Hide delete mode panel
        const deletePanel = document.getElementById('deleteModePanel');
        if (deletePanel) {
            deletePanel.style.display = 'none';
        }
        
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'deleteModePanel') {
                section.style.display = 'block';
            }
        });
    }

    updateDeleteModeInfo() {
        const deletePanel = document.getElementById('deleteModePanel');
        if (!deletePanel) return;

        const selectedCount = this.verticesToDelete.size;
        const totalCount = this.vertices.length;
        
        const infoText = deletePanel.querySelector('.delete-mode-info-text');
        if (infoText) {
            infoText.textContent = `Delete Mode Active - ${selectedCount} of ${totalCount} vertices selected for deletion`;
        }

        const selectedList = deletePanel.querySelector('.selected-vertices-list');
        if (selectedList) {
            selectedList.innerHTML = '';
            this.vertices.forEach(vertex => {
                if (this.verticesToDelete.has(vertex.id)) {
                    const item = document.createElement('div');
                    item.className = 'selected-vertex-item';
                    item.innerHTML = `
                        <i class="fas fa-circle" style="color: #ec4899;"></i>
                        <strong>${vertex.label}</strong>
                        <span class="vertex-coords">(${Math.round(vertex.x)}, ${Math.round(vertex.y)})</span>
                    `;
                    selectedList.appendChild(item);
                }
            });
        }
    }



    drawDeleteButton(vertex) {
        // Draw a red X button at the top right of the vertex
        const size = vertex.size || this.vertexSize;
        const x = vertex.x + size * 0.7;
        const y = vertex.y - size * 0.7;
        const r = 10;
        // Draw circle
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.fill();
        this.ctx.stroke();
        // Draw X
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 4, y - 4);
        this.ctx.lineTo(x + 4, y + 4);
        this.ctx.moveTo(x + 4, y - 4);
        this.ctx.lineTo(x - 4, y + 4);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Handle click for delete button - this will be called from the main handleCanvasClick
    handleDeleteButtonClick(pos) {
        if (!this.isDeleteMode) return false;
        
        // Check if a delete button was clicked
        for (const vertex of this.vertices) {
            const size = vertex.size || this.vertexSize;
            const x = vertex.x + size * 0.7;
            const y = vertex.y - size * 0.7;
            const r = 10;
            const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
            if (dist <= r) {
                if (this.verticesToDelete.has(vertex.id)) {
                    // Unselect vertex for deletion
                    this.verticesToDelete.delete(vertex.id);
                    this.updateStatus(`Unselected vertex "${vertex.label}" from deletion`);
                } else {
                    // Select vertex for deletion
                    this.verticesToDelete.add(vertex.id);
                    this.updateStatus(`Marked vertex "${vertex.label}" for deletion`);
                }
                this.updateDeleteModeInfo();
                this.draw();
                return true;
            }
        }
        
        // Check if a vertex was clicked (for delete mode)
        const clickedVertex = this.getVertexAt(pos.x, pos.y);
        if (clickedVertex) {
            if (this.verticesToDelete.has(clickedVertex.id)) {
                // Unselect vertex for deletion
                this.verticesToDelete.delete(clickedVertex.id);
                this.updateStatus(`Unselected vertex "${clickedVertex.label}" from deletion`);
            } else {
                // Select vertex for deletion
                this.verticesToDelete.add(clickedVertex.id);
                this.updateStatus(`Marked vertex "${clickedVertex.label}" for deletion`);
            }
            this.updateDeleteModeInfo();
            this.draw();
            return true;
        }
        
        return false;
    }
} // End of GraphCreator class 