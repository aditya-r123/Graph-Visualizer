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
        
        // Apply to all properties
        this.applyToAllVertices = false;
        this.applyToAllEdges = false;
        
        // Flash effect properties
        this.flashingVertices = new Set();
        this.distanceFlashingVertices = null;
        this.flashTimer = null;
        
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
        
        this.initializeCanvas();
        this.initializeEventListeners();
        this.startAutoSave();
        this.loadSavedGraphs();
        this.updateInfo();
        this.updateTime();
        this.updateTargetVertexDisplay();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
        
        // Add event listener for the reset button after DOM is loaded
        // (call this in constructor or after DOMContentLoaded)
        this.setupResetTargetBtn();

        // In constructor, after DOMContentLoaded, call this.setupMinimalEditModeEvents();
        this.setupMinimalEditModeEvents();
    }
    
    initializeCanvas() {
        // Set canvas size to match container
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
        
        // Update root node dropdown
        this.updateRootDropdown();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
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
            this.draw();
        });
        
        document.getElementById('edgeType').addEventListener('change', (e) => {
            this.edgeType = e.target.value;
            this.draw();
        });
        
        document.getElementById('edgeDirection').addEventListener('change', (e) => {
            this.edgeDirection = e.target.value;
            this.draw();
        });
        
        document.getElementById('calculateDistance').addEventListener('click', () => {
            this.toggleDistanceMode();
        });
        
        document.getElementById('clearGraph').addEventListener('click', () => {
            this.clearGraph();
        });
        
        document.getElementById('hideInstructions').addEventListener('click', () => {
            this.hideInstructions();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
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
        
        // Save/Load controls
        const saveGraphBtn = document.getElementById('saveGraph');
        const loadGraphBtn = document.getElementById('loadGraph');
        const takeScreenshotBtn = document.getElementById('takeScreenshot');
        
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
        
        // File input for loading
        document.getElementById('loadFileInput').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });
        
        // Edit label controls
        document.getElementById('saveLabelBtn').addEventListener('click', () => {
            this.saveVertexLabel();
        });
        
        document.getElementById('cancelLabelBtn').addEventListener('click', () => {
            this.cancelVertexLabelEdit();
        });
        
        // Enter key to save label, Escape to cancel
        document.getElementById('editVertexLabel').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveVertexLabel();
            }
        });
        
        // Global escape key listener for canceling label edit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingVertex) {
                this.cancelVertexLabelEdit();
            } else if (e.key === 'Escape' && this.editModeElement) {
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
                    <button class="load-btn" title="Load graph">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="delete-btn" title="Delete saved graph">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            // Add event listeners
            const editNameBtn = item.querySelector('.edit-name-btn');
            const loadBtn = item.querySelector('.load-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            const nameElement = item.querySelector('.saved-graph-name');
            editNameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editSavedGraphName(index, nameElement);
            });
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadSavedGraphWithConfirmation(savedGraph);
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
    saveGraph() {
        console.log('saveGraph function called');
        if (this.vertices.length === 0) {
            this.updateStatus('No graph to save');
            return;
        }

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
            this.updateStatus(`Graph "${name}" saved successfully!`);
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
            
            // Set canvas size
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            
            console.log('Set temp canvas size to:', tempCanvas.width, 'x', tempCanvas.height);
            
            // Fill background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            console.log('Filled background');
            
            // Draw edges first (so they appear behind vertices)
            console.log('Drawing edges...');
            this.edges.forEach((edge, index) => {
                console.log(`Drawing edge ${index}:`, edge.from.label, '->', edge.to.label);
                this.drawSimpleEdge(tempCtx, edge);
            });
            
            // Draw vertices on top
            console.log('Drawing vertices...');
            this.vertices.forEach((vertex, index) => {
                console.log(`Drawing vertex ${index}:`, vertex.label, 'at', vertex.x, vertex.y);
                this.drawSimpleVertex(tempCtx, vertex);
            });
            
            console.log('Starting blob conversion...');
            
            // Convert to blob and download as JPG
            tempCanvas.toBlob((blob) => {
                console.log('Blob callback executed, blob:', blob);
                if (blob) {
                    console.log('Blob size:', blob.size, 'bytes');
                    const url = URL.createObjectURL(blob);
                    console.log('Created object URL:', url);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `graph-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    console.log('Triggering download...');
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.updateStatus('Screenshot saved as JPG!');
                    console.log('Screenshot downloaded successfully');
                } else {
                    console.error('Failed to create blob for screenshot');
                    this.updateStatus('Failed to create screenshot');
                }
            }, 'image/jpeg', 0.9); // Save as JPG with 90% quality
            
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
        document.getElementById('editLabelGroup').style.display = 'none';
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
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    handleCanvasClick(e) {
        const pos = this.getMousePos(e);
        const clickedVertex = this.getVertexAt(pos.x, pos.y);
        const clickedEdge = this.getEdgeAt(pos.x, pos.y);

        // If clicking a curved edge control point, do nothing
        if (clickedEdge && clickedEdge.type === 'curved' && clickedEdge.controlPoint) {
            return;
        }

        // Automatically set target vertex when clicking on a vertex
        if (clickedVertex) {
            this.selectTargetVertex(clickedVertex);
            
            if (this.isDistanceMode) {
                this.handleDistanceModeClick(clickedVertex);
            } else if (this.editModeElement === clickedVertex && this.editModeType === 'vertex') {
                // Already in edit mode for this vertex, do nothing (edit mode UI is in sidebar)
            }
            // Otherwise, do nothing
            return;
        }

        // Otherwise, add a vertex
        this.addVertex(pos.x, pos.y);
    }
    
    handleRightClick(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const clickedVertex = this.getVertexAt(pos.x, pos.y);
        
        if (clickedVertex) {
            // Handle edge creation logic (double-click two vertices)
            this.handleVertexRightClick(clickedVertex);
            return;
        }
    }
    
    handleVertexRightClick(vertex) {
        // Edge creation logic - double-click two vertices to create edge
        if (this.selectedVertices.length === 0) {
            this.selectedVertices.push(vertex);
            this.updateStatus(`Selected vertex "${vertex.label}" - right-click another vertex to create edge`);
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
        // Only allow label/font/color editing in edit mode (handled in sidebar)
        if (this.isDistanceMode) {
            this.handleDistanceModeClick(vertex);
        }
        // Otherwise, do nothing
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
            // Start long-press timer for edit mode
            this.longPressTimer = setTimeout(() => {
                this.enterEditMode(vertex);
                this.updateStatus(`Editing vertex "${vertex.label}"`);
            }, 500); // 500ms hold time
            
            // Set up for dragging
            this.draggedVertex = vertex;
            this.isDragging = true;
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
            this.canvas.style.cursor = 'grabbing';
            // Remove status message for dragging
            
            // Set the dragged vertex as the target
            this.selectTargetVertex(vertex);
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging && this.draggedVertex) {
            const pos = this.getMousePos(e);
            this.draggedVertex.x = pos.x;
            this.draggedVertex.y = pos.y;
            
            // Update edit mode info in real-time if dragging in edit mode
            if (this.editModeElement === this.draggedVertex && this.editModeType === 'vertex') {
                this.updateEditModeInfo();
            }
            
            this.draw();
        } else if (this.isDraggingEdge && this.draggedEdge) {
            const pos = this.getMousePos(e);
            this.draggedEdge.controlPoint = { x: pos.x, y: pos.y };
            this.draw();
        } else {
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
    
    handleMouseUp(e) {
        // Clear long-press timer if mouse is released before hold time
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isDragging && this.draggedVertex) {
            this.isDragging = false;
            this.draggedVertex = null;
            this.canvas.style.cursor = 'crosshair';
            // Remove status message for vertex movement
        }
        
        if (this.isDraggingEdge && this.draggedEdge) {
            this.isDraggingEdge = false;
            this.draggedEdge = null;
            this.canvas.style.cursor = 'crosshair';
            this.updateStatus('Edge curve adjusted');
        }
    }
    
    enterEditMode(element, type) {
        // Exit any existing edit mode
        this.exitEditMode();
        
        this.editModeElement = element;
        this.editModeType = type;
        this.isLongPressing = true;
        
        // Start shaking animation
        this.startShakeAnimation();
        
        // Show edit controls in sidebar
        this.showEditControls();
        
        this.updateStatus(`${type === 'vertex' ? 'Vertex' : 'Edge'} in edit mode - use sidebar to modify`);
    }
    
    exitEditMode() {
        if (this.editModeElement) {
            // Stop shaking animation
            this.stopShakeAnimation();
            
            // Hide edit controls
            this.hideEditControls();
            
            this.editModeElement = null;
            this.editModeType = null;
            this.isLongPressing = false;
            
            this.updateStatus('Edit mode exited');
        }
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
        this.draw();
        this.updateStatus(`Vertex "${label}" added!`);
        
        // Set the newly created vertex as the target
        this.selectTargetVertex(vertex);
        
        // Clear custom label input
        document.getElementById('vertexLabel').value = '';
        this.updateRootDropdown();
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
        }
        this.draw();
        this.updateInfo();
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
    
    stopSearch() {
        this.isSearching = false;
        this.visitedVertices.clear();
        this.pathVertices.clear();
        
        document.getElementById('runBFS').disabled = false;
        document.getElementById('runDFS').disabled = false;
        document.getElementById('stopSearch').disabled = true;
        
        this.draw();
        this.updateStatus('Search stopped');
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
    
    startVertexLabelEdit(vertex) {
        this.editingVertex = vertex;
        this.selectedVertices = [vertex]; // Select the vertex being edited
        
        // Show the edit interface
        document.getElementById('editLabelGroup').style.display = 'block';
        document.getElementById('editVertexLabel').value = vertex.label;
        document.getElementById('editingVertexLabel').textContent = vertex.label;
        
        // Focus on the input
        document.getElementById('editVertexLabel').focus();
        document.getElementById('editVertexLabel').select();
        
        this.draw();
        this.updateStatus(`Editing vertex "${vertex.label}" - Press Enter to save, Escape to cancel`);
    }
    
    saveVertexLabel() {
        if (!this.editingVertex) return;
        
        const newLabel = document.getElementById('editVertexLabel').value.trim();
        if (!newLabel) {
            this.updateStatus('Label cannot be empty!');
            return;
        }
        
        // Check if label already exists (except for the current vertex)
        const existingVertex = this.vertices.find(v => v.label === newLabel && v.id !== this.editingVertex.id);
        if (existingVertex) {
            this.updateStatus(`Label "${newLabel}" already exists! Each vertex must have a unique label.`);
            return;
        }
        
        const oldLabel = this.editingVertex.label;
        this.editingVertex.label = newLabel;
        
        // Hide the edit interface
        this.cancelVertexLabelEdit();
        
        this.draw();
        this.updateStatus(`Vertex label changed from "${oldLabel}" to "${newLabel}"`);
        this.updateRootDropdown();
    }
    
    cancelVertexLabelEdit() {
        this.editingVertex = null;
        this.selectedVertices = [];
        
        // Hide the edit interface
        document.getElementById('editLabelGroup').style.display = 'none';
        document.getElementById('editVertexLabel').value = '';
        document.getElementById('editingVertexLabel').textContent = '';
        
        this.draw();
        this.updateStatus('Label editing cancelled');
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
        if (!this.hasUnsavedChanges()) {
            this.showLoadDialog();
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-exclamation-triangle"></i> Unsaved Changes</h3>
                <p>You have unsaved changes in your current graph. What would you like to do?</p>
                <div class="modal-buttons">
                    <button class="btn btn-success" id="saveAndLoadBtn">
                        <i class="fas fa-save"></i> Save & Load
                    </button>
                    <button class="btn btn-warning" id="loadWithoutSaveBtn">
                        <i class="fas fa-folder-open"></i> Load Without Saving
                    </button>
                    <button class="btn btn-secondary" id="cancelLoadBtn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        document.getElementById('saveAndLoadBtn').addEventListener('click', () => {
            this.saveCurrentGraphAndLoad();
            document.body.removeChild(dialog);
        });
        
        document.getElementById('loadWithoutSaveBtn').addEventListener('click', () => {
            this.showLoadDialog();
            document.body.removeChild(dialog);
        });
        
        document.getElementById('cancelLoadBtn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
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
        this.updateTargetVertexDisplay();
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
        document.getElementById('distanceInfo').classList.remove('show');
        document.getElementById('searchInfo').classList.remove('show');
        document.getElementById('calculateDistance').classList.remove('active');
        document.getElementById('runBFS').disabled = false;
        document.getElementById('runDFS').disabled = false;
        document.getElementById('stopSearch').disabled = true;
        document.getElementById('editLabelGroup').style.display = 'none';
        this.lastSavedState = null;
        this.currentGraphId = null; // Clear id
        this.updateInfo();
        this.draw();
        this.updateStatus('Graph cleared!');
        this.updateRootDropdown();
    }
    
    hideInstructions() {
        const overlay = document.getElementById('instructionsOverlay');
        overlay.style.display = 'none';
        this.updateStatus('Instructions hidden. You can start creating your graph!');
    }
    
    updateInfo() {
        document.getElementById('vertexCount').textContent = this.vertices.length;
        document.getElementById('edgeCount').textContent = this.edges.length;
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
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdge(edge));
        
        // Draw vertices
        this.vertices.forEach(vertex => this.drawVertex(vertex));
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
                x: (edge.from.x + edge.to.x) / 2,
                y: (edge.from.y + edge.to.y) / 2 - 40
            };
            this.ctx.moveTo(edge.from.x, edge.from.y);
            this.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, edge.to.x, edge.to.y);
        } else {
            // Draw straight edge
            this.ctx.moveTo(edge.from.x, edge.from.y);
            this.ctx.lineTo(edge.to.x, edge.to.y);
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
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2 - 60;
            } else {
                // For straight edges, position weight at midpoint
                midX = (edge.from.x + edge.to.x) / 2;
                midY = (edge.from.y + edge.to.y) / 2;
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
        const size = vertex.size || this.vertexSize;
        
        // Check if this vertex is selected for edge creation
        const isSelectedForEdge = this.selectedVertices.includes(vertex);
        
        // Check if this vertex is flashing (after edge creation)
        const isFlashing = this.flashingVertices.has(vertex);
        
        // Check if this vertex is flashing for distance calculation
        const isDistanceFlashing = this.distanceFlashingVertices && this.distanceFlashingVertices.has(vertex);
        
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
        
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw vertex label
        const fontSize = vertex.fontSize || this.vertexFontSize;
        const fontFamily = vertex.fontFamily || this.vertexFontFamily;
        const fontColor = vertex.fontColor || this.vertexFontColor;
        
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
            display.innerHTML = '<span class="target-placeholder">Click on any vertex to set as target</span>';
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
        this.originalLabel = vertex.label;
        this.originalSize = vertex.size || this.vertexSize;
        console.log('[EditMode] Original values stored - label:', this.originalLabel, 'size:', this.originalSize);
        
        // Show the edit controls section
        const editSection = document.getElementById('editControlsSection');
        if (editSection) {
            editSection.style.display = 'block';
            console.log('[EditMode] Edit section displayed');
        } else {
            console.error('[EditMode] Edit section not found!');
        }
        
        // Hide other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection') section.style.display = 'none';
        });
        
        // Update the section title to show which vertex is being edited
        const editTitle = editSection.querySelector('h3');
        if (editTitle) {
            editTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Vertex "${vertex.label}"`;
            console.log('[EditMode] Title updated to show vertex:', vertex.label);
        }
        
        // Populate form with current values
        const labelInput = document.getElementById('editVertexLabel');
        const sizeInput = document.getElementById('editVertexSize');
        const sizeValue = document.getElementById('editVertexSizeValue');
        
        if (labelInput && sizeInput && sizeValue) {
            labelInput.value = vertex.label;
            sizeInput.value = vertex.size || this.vertexSize;
            sizeValue.textContent = vertex.size || this.vertexSize;
            console.log('[EditMode] Form populated - label:', vertex.label, 'size:', vertex.size || this.vertexSize);
        } else {
            console.error('[EditMode] Form elements not found!');
        }
        
        // Clear any previous validation styling
        labelInput.style.borderColor = '';
        labelInput.style.boxShadow = '';
        const warningMsg = document.getElementById('editVertexLabelWarning');
        if (warningMsg) warningMsg.textContent = '';
        
        // Focus on the label input for immediate editing
        setTimeout(() => {
            if (labelInput) {
                labelInput.focus();
                labelInput.select();
                console.log('[EditMode] Label input focused and selected');
            }
        }, 100);
    }

    exitEditMode() {
        this.editModeElement = null;
        this.editModeType = null;
        this.originalLabel = null;
        this.originalSize = null;
        // Hide edit controls
        const editSection = document.getElementById('editControlsSection');
        if (editSection) editSection.style.display = 'none';
        // Show all other control sections
        document.querySelectorAll('.control-section').forEach(section => {
            if (section.id !== 'editControlsSection') section.style.display = 'block';
        });
        // Reset the edit section title
        const editTitle = editSection?.querySelector('h3');
        if (editTitle) {
            editTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Vertex';
        }
        this.draw();
    }

    setupMinimalEditModeEvents() {
        // Label input: immediate update with no validation blocking
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
            console.log('[EditMode] Label input event fired');
            if (this.editModeElement) {
                const newLabel = e.target.value;
                console.log('[EditMode] New label:', newLabel);
                
                // Always update the vertex label for immediate visual feedback
                this.editModeElement.label = newLabel;
                this.draw();
                this.updateRootDropdown();
                
                // Show validation warnings but don't block updates
                const trimmed = newLabel.trim();
                let error = '';
                if (!trimmed) {
                    error = 'Label cannot be empty.';
                } else if (this.vertices.some(v => v !== this.editModeElement && v.label === trimmed)) {
                    error = `Label "${trimmed}" already exists!`;
                }
                
                // Update UI based on validation (show warnings but don't disable save)
                if (error) {
                    labelInput.style.borderColor = 'var(--danger-color)';
                    labelInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                    warningMsg.textContent = error;
                    console.log('[EditMode] Validation warning:', error);
                } else {
                    labelInput.style.borderColor = '';
                    labelInput.style.boxShadow = '';
                    warningMsg.textContent = '';
                    console.log('[EditMode] Label valid');
                }
            } else {
                console.log('[EditMode] No editModeElement set');
            }
        });
        
        // Size slider: immediate update
        document.getElementById('editVertexSize').addEventListener('input', (e) => {
            const newSize = parseInt(e.target.value);
            document.getElementById('editVertexSizeValue').textContent = newSize;
            if (this.editModeElement) {
                this.editModeElement.size = newSize;
                this.draw();
            }
        });
        
        // Save button: just exit edit mode (changes already applied)
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.editModeElement) {
                console.log('[EditMode] Save clicked - exiting edit mode');
                this.exitEditMode();
                this.updateStatus('Vertex updated successfully!');
            }
        });
        
        // Cancel button: restore original values
        document.getElementById('cancelVertexEdit').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.editModeElement && this.originalLabel !== null) {
                // Restore original values
                this.editModeElement.label = this.originalLabel;
                this.editModeElement.size = this.originalSize;
                
                // Clear any error styling
                labelInput.style.borderColor = '';
                labelInput.style.boxShadow = '';
                warningMsg.textContent = '';
                
                this.exitEditMode();
                this.updateRootDropdown();
                this.draw();
                this.updateStatus('Edit cancelled - changes reverted.');
                console.log('[EditMode] Cancel clicked, reverted to original values');
            }
        });
        
        // Form submit: same as save button
        document.getElementById('vertexEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            saveBtn.click();
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
} 