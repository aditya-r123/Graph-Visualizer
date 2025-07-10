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
        this.loadSavedGraphs();
        this.startAutoSave();
        this.updateInfo();
        this.updateStatus('Ready to create your graph!');
        this.updateTime();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
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
        
        // Save/Load controls
        document.getElementById('saveGraph').addEventListener('click', () => {
            this.saveGraph();
        });
        
        document.getElementById('loadGraph').addEventListener('click', () => {
            this.showLoadConfirmation();
        });
        
        document.getElementById('takeScreenshot').addEventListener('click', () => {
            this.takeScreenshot();
        });
        
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
        
        // Edit mode controls
        document.getElementById('exitEditMode').addEventListener('click', () => {
            this.exitEditMode();
        });
        
        document.getElementById('deleteSelectedElement').addEventListener('click', () => {
            this.deleteSelectedElement();
        });
        
        // Edit mode styling controls
        document.getElementById('editVertexColor').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'vertex') {
                this.editModeElement.color = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editVertexBorderColor').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'vertex') {
                this.editModeElement.borderColor = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editVertexFontSize').addEventListener('input', (e) => {
            if (this.editModeElement && this.editModeType === 'vertex') {
                this.editModeElement.fontSize = parseInt(e.target.value);
                document.getElementById('editVertexFontSizeValue').textContent = this.editModeElement.fontSize;
                this.draw();
            }
        });
        
        document.getElementById('editVertexFontFamily').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'vertex') {
                this.editModeElement.fontFamily = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editVertexFontColor').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'vertex') {
                this.editModeElement.fontColor = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editEdgeColor').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'edge') {
                this.editModeElement.color = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editEdgeWidth').addEventListener('input', (e) => {
            if (this.editModeElement && this.editModeType === 'edge') {
                this.editModeElement.width = parseInt(e.target.value);
                document.getElementById('editEdgeWidthValue').textContent = this.editModeElement.width;
                this.draw();
            }
        });
        
        document.getElementById('editEdgeFontSize').addEventListener('input', (e) => {
            if (this.editModeElement && this.editModeType === 'edge') {
                this.editModeElement.fontSize = parseInt(e.target.value);
                document.getElementById('editEdgeFontSizeValue').textContent = this.editModeElement.fontSize;
                this.draw();
            }
        });
        
        document.getElementById('editEdgeFontFamily').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'edge') {
                this.editModeElement.fontFamily = e.target.value;
                this.draw();
            }
        });
        
        document.getElementById('editEdgeFontColor').addEventListener('change', (e) => {
            if (this.editModeElement && this.editModeType === 'edge') {
                this.editModeElement.fontColor = e.target.value;
                this.draw();
            }
        });
        
        // Original styling controls (for global styling)
        document.getElementById('vertexColor').addEventListener('change', (e) => {
            this.vertexColor = e.target.value;
            this.draw();
        });
        
        document.getElementById('vertexBorderColor').addEventListener('change', (e) => {
            this.vertexBorderColor = e.target.value;
            this.draw();
        });
        
        document.getElementById('vertexFontSize').addEventListener('input', (e) => {
            this.vertexFontSize = parseInt(e.target.value);
            document.getElementById('vertexFontSizeValue').textContent = this.vertexFontSize;
            this.draw();
        });
        
        document.getElementById('vertexFontFamily').addEventListener('change', (e) => {
            this.vertexFontFamily = e.target.value;
            this.draw();
        });
        
        document.getElementById('vertexFontColor').addEventListener('change', (e) => {
            this.vertexFontColor = e.target.value;
            this.draw();
        });
        
        document.getElementById('edgeColor').addEventListener('change', (e) => {
            this.edgeColor = e.target.value;
            this.draw();
        });
        
        document.getElementById('edgeWidth').addEventListener('input', (e) => {
            this.edgeWidth = parseInt(e.target.value);
            document.getElementById('edgeWidthValue').textContent = this.edgeWidth;
            this.draw();
        });
        
        document.getElementById('edgeFontSize').addEventListener('input', (e) => {
            this.edgeFontSize = parseInt(e.target.value);
            document.getElementById('edgeFontSizeValue').textContent = this.edgeFontSize;
            this.draw();
        });
        
        document.getElementById('edgeFontFamily').addEventListener('change', (e) => {
            this.edgeFontFamily = e.target.value;
            this.draw();
        });
        
        document.getElementById('edgeFontColor').addEventListener('change', (e) => {
            this.edgeFontColor = e.target.value;
            this.draw();
        });
        
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
                this.deleteSavedGraph(index);
            });
            
            container.appendChild(item);
        });
    }
    
    saveGraph() {
        if (this.vertices.length === 0) {
            this.updateStatus('No graph to save');
            return;
        }
        
        const name = prompt('Enter a name for this graph:', `Graph ${new Date().toLocaleDateString()}`);
        if (!name) return;
        
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        
        const savedGraph = {
            name: name,
            data: graphData,
            timestamp: timestamp,
            vertices: this.vertices.length,
            edges: this.edges.length
        };
        
        this.savedGraphs.unshift(savedGraph);
        
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
    
    loadSavedGraph(savedGraph) {
        try {
            this.importGraph(savedGraph.data);
            this.updateStatus(`Loaded graph "${savedGraph.name}"`);
        } catch (error) {
            console.error('Failed to load graph:', error);
            this.updateStatus('Failed to load graph');
        }
    }
    
    deleteSavedGraph(index) {
        if (confirm('Are you sure you want to delete this saved graph?')) {
            this.savedGraphs.splice(index, 1);
            try {
                localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
                this.updateSavedGraphsList();
                this.updateStatus('Saved graph deleted');
            } catch (error) {
                console.error('Failed to delete saved graph:', error);
            }
        }
    }
    
    editSavedGraphName(index, nameElement) {
        const savedGraph = this.savedGraphs[index];
        const newName = prompt('Enter new name for this graph:', savedGraph.name);
        
        if (newName && newName.trim() !== '' && newName.trim() !== savedGraph.name) {
            savedGraph.name = newName.trim();
            savedGraph.timestamp = new Date().toISOString();
            
            try {
                localStorage.setItem('savedGraphs', JSON.stringify(this.savedGraphs));
                this.updateSavedGraphsList();
                this.updateStatus(`Graph renamed to "${newName.trim()}"`);
            } catch (error) {
                console.error('Failed to update saved graph:', error);
                this.updateStatus('Failed to rename graph');
            }
        }
    }
    
    loadSavedGraphWithConfirmation(savedGraph) {
        // Always auto-save current graph if there are changes, then load the new graph
        if (this.hasUnsavedChanges()) {
            this.saveCurrentGraphAndLoadSpecific(savedGraph);
        } else {
            this.loadSavedGraph(savedGraph);
        }
    }
    
    saveCurrentGraphAndLoadSpecific(targetGraph) {
        // First save the current graph
        const graphData = this.exportGraph();
        const timestamp = new Date().toISOString();
        const name = `Graph ${new Date().toLocaleDateString()}`;
        
        const savedGraph = {
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
        // Create a temporary canvas for the screenshot
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set canvas size
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        // Fill background
        tempCtx.fillStyle = this.currentTheme === 'dark' ? '#0f172a' : '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the graph
        this.drawOnCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
        
        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `graph-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.updateStatus('Screenshot saved!');
        }, 'image/png');
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
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        if (edge.type === 'curved') {
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2 - 40;
            
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.quadraticCurveTo(midX, midY, edge.to.x, edge.to.y);
        } else {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        
        ctx.stroke();
        
        if (edge.weight !== null && edge.weight !== '') {
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2;
            
            if (edge.type === 'curved') {
                midY -= 20;
            }
            
            ctx.fillStyle = this.currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(midX - 20, midY - 12, 40, 24);
            
            ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), midX, midY);
        }
    }
    
    drawVertexOnCanvas(ctx, vertex) {
        let fillColor = '#1e293b';
        let borderColor = '#475569';
        
        if (this.pathVertices.has(vertex)) {
            fillColor = '#10b981';
            borderColor = '#059669';
        } else if (this.visitedVertices.has(vertex)) {
            fillColor = '#f59e0b';
            borderColor = '#d97706';
        } else if (this.selectedVertices.includes(vertex)) {
            fillColor = '#6366f1';
            borderColor = '#4f46e5';
        } else if (this.distanceModeVertices.includes(vertex)) {
            fillColor = '#f59e0b';
            borderColor = '#d97706';
        } else if (vertex === this.draggedVertex) {
            fillColor = '#10b981';
            borderColor = '#059669';
        }
        
        if (this.currentTheme === 'light') {
            if (fillColor === '#1e293b') {
                fillColor = '#e2e8f0';
                borderColor = '#cbd5e1';
            }
        }
        
        const gradient = ctx.createRadialGradient(
            vertex.x - this.vertexSize * 0.3, 
            vertex.y - this.vertexSize * 0.3, 
            0,
            vertex.x, 
            vertex.y, 
            this.vertexSize
        );
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, this.adjustColor(fillColor, -20));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, this.vertexSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = this.currentTheme === 'dark' ? '#ffffff' : '#1e293b';
        ctx.font = `bold ${Math.max(14, this.vertexSize / 2)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex.label.toString(), vertex.x, vertex.y);
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
        // Clear current graph
        this.vertices = [];
        this.edges = [];
        this.selectedVertices = [];
        this.draggedVertex = null;
        this.visitedVertices.clear();
        this.pathVertices.clear();
        this.editingVertex = null;
        
        // Import vertices
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
        
        // Import edges
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
        
        // Import settings
        this.nextVertexId = graphData.nextVertexId || this.vertices.length + 1;
        this.vertexSize = graphData.vertexSize || 25;
        this.edgeType = graphData.edgeType || 'straight';
        this.edgeDirection = graphData.edgeDirection || 'undirected';
        
        // Import styling properties (with fallbacks)
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
        
        // Update UI
        document.getElementById('vertexSize').value = this.vertexSize;
        document.getElementById('vertexSizeValue').textContent = this.vertexSize;
        document.getElementById('edgeType').value = this.edgeType;
        document.getElementById('edgeDirection').value = this.edgeDirection;
        
        // Update styling UI
        document.getElementById('vertexColor').value = this.vertexColor;
        document.getElementById('vertexBorderColor').value = this.vertexBorderColor;
        document.getElementById('vertexFontSize').value = this.vertexFontSize;
        document.getElementById('vertexFontSizeValue').textContent = this.vertexFontSize;
        document.getElementById('vertexFontFamily').value = this.vertexFontFamily;
        document.getElementById('vertexFontColor').value = this.vertexFontColor;
        
        document.getElementById('edgeColor').value = this.edgeColor;
        document.getElementById('edgeWidth').value = this.edgeWidth;
        document.getElementById('edgeWidthValue').textContent = this.edgeWidth;
        document.getElementById('edgeFontSize').value = this.edgeFontSize;
        document.getElementById('edgeFontSizeValue').textContent = this.edgeFontSize;
        document.getElementById('edgeFontFamily').value = this.edgeFontFamily;
        document.getElementById('edgeFontColor').value = this.edgeFontColor;
        
        // Update theme if different
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
        
        // Hide edit label interface
        document.getElementById('editLabelGroup').style.display = 'none';
        
        // Reset saved state since we're loading a new graph
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
        
        // Update root node dropdown
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

        // Only allow left-clicking a node to do something in distance mode or edit mode
        if (clickedVertex) {
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
            this.handleVertexRightClick(clickedVertex);
        }
    }
    
    handleVertexClick(vertex) {
        // Only allow label/font/color editing in edit mode (handled in sidebar)
        if (this.isDistanceMode) {
            this.handleDistanceModeClick(vertex);
        }
        // Otherwise, do nothing
    }
    
    handleVertexRightClick(vertex) {
        if (this.isDistanceMode) {
            this.handleDistanceModeClick(vertex);
            return;
        }
        
        // Add to selection for edge creation
        if (!this.selectedVertices.includes(vertex)) {
            this.selectedVertices.push(vertex);
        }
        
        // Create edge if we have two vertices selected
        if (this.selectedVertices.length === 2) {
            const weight = document.getElementById('edgeWeight').value || this.defaultEdgeWeight;
            this.addEdge(this.selectedVertices[0], this.selectedVertices[1], weight);
            this.selectedVertices = [];
            this.updateStatus('Edge created successfully!');
        } else {
            this.updateStatus(`Right-click another vertex to create an edge (${this.selectedVertices.length}/2)`);
        }
        
        this.draw();
    }
    
    handleDistanceModeClick(vertex) {
        this.distanceModeVertices.push(vertex);
        
        if (this.distanceModeVertices.length === 2) {
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
        const edge = this.getEdgeAt(pos.x, pos.y);
        
        // Clear any existing long-press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (vertex) {
            // Start long-press timer for vertex
            this.longPressTimer = setTimeout(() => {
                this.enterEditMode(vertex, 'vertex');
            }, this.longPressDuration);
            
            this.draggedVertex = vertex;
            this.isDragging = true;
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
            this.canvas.style.cursor = 'grabbing';
            this.updateStatus('Dragging vertex...');
        } else if (edge && edge.type === 'curved' && edge.controlPoint) {
            // Start long-press timer for edge
            this.longPressTimer = setTimeout(() => {
                this.enterEditMode(edge, 'edge');
            }, this.longPressDuration);
            
            this.draggedEdge = edge;
            this.isDraggingEdge = true;
            this.canvas.style.cursor = 'grabbing';
            this.updateStatus('Dragging edge curve...');
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging && this.draggedVertex) {
            const pos = this.getMousePos(e);
            this.draggedVertex.x = pos.x;
            this.draggedVertex.y = pos.y;
            this.draw();
        } else if (this.isDraggingEdge && this.draggedEdge) {
            const pos = this.getMousePos(e);
            this.draggedEdge.controlPoint.x = pos.x;
            this.draggedEdge.controlPoint.y = pos.y;
            this.draw();
        } else {
            const pos = this.getMousePos(e);
            const vertex = this.getVertexAt(pos.x, pos.y);
            const edge = this.getEdgeAt(pos.x, pos.y);
            
            if (vertex) {
                this.canvas.style.cursor = 'grab';
            } else if (edge && edge.type === 'curved' && edge.controlPoint) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }
    
    handleMouseUp(e) {
        // Clear long-press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isDragging) {
            const pos = this.getMousePos(e);
            const dragDistance = Math.sqrt((pos.x - this.dragStartX) ** 2 + (pos.y - this.dragStartY) ** 2);
            
            this.isDragging = false;
            this.draggedVertex = null;
            this.canvas.style.cursor = 'crosshair';
            
            if (dragDistance >= 5) {
                this.updateStatus('Vertex moved successfully!');
            } else {
                this.updateStatus('Vertex selected');
            }
        } else if (this.isDraggingEdge) {
            this.isDraggingEdge = false;
            this.draggedEdge = null;
            this.canvas.style.cursor = 'crosshair';
            this.updateStatus('Edge curve adjusted!');
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
        
        // Populate edit mode info
        const editModeInfo = document.getElementById('editModeInfo');
        if (editModeInfo) {
            if (this.editModeType === 'vertex') {
                editModeInfo.innerHTML = `
                    <div class="edit-mode-item">
                        <i class="fas fa-circle"></i>
                        <strong>Vertex:</strong> ${this.editModeElement.label}
                    </div>
                    <div class="edit-mode-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <strong>Position:</strong> (${Math.round(this.editModeElement.x)}, ${Math.round(this.editModeElement.y)})
                    </div>
                `;
                
                // Show vertex edit controls
                document.getElementById('vertexEditControls').style.display = 'block';
                document.getElementById('edgeEditControls').style.display = 'none';
                
                // Populate current values
                document.getElementById('editVertexColor').value = this.editModeElement.color || this.vertexColor;
                document.getElementById('editVertexBorderColor').value = this.editModeElement.borderColor || this.vertexBorderColor;
                document.getElementById('editVertexFontSize').value = this.editModeElement.fontSize || this.vertexFontSize;
                document.getElementById('editVertexFontSizeValue').textContent = this.editModeElement.fontSize || this.vertexFontSize;
                document.getElementById('editVertexFontFamily').value = this.editModeElement.fontFamily || this.vertexFontFamily;
                document.getElementById('editVertexFontColor').value = this.editModeElement.fontColor || this.vertexFontColor;
                
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
        const targetLabel = document.getElementById('searchTarget').value.trim();
        const rootLabel = document.getElementById('searchRoot').value;
        if (!targetLabel) {
            this.updateStatus('Please enter a target vertex label');
            return;
        }
        const targetVertex = this.findVertexByLabel(targetLabel);
        if (!targetVertex) {
            this.updateStatus(`Vertex "${targetLabel}" not found`);
            return;
        }
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
        const targetLabel = document.getElementById('searchTarget').value.trim();
        const rootLabel = document.getElementById('searchRoot').value;
        if (!targetLabel) {
            this.updateStatus('Please enter a target vertex label');
            return;
        }
        const targetVertex = this.findVertexByLabel(targetLabel);
        if (!targetVertex) {
            this.updateStatus(`Vertex "${targetLabel}" not found`);
            return;
        }
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
        const name = `Graph ${new Date().toLocaleDateString()}`;
        
        const savedGraph = {
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
        
        // Reset styling properties to defaults
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
        
        // Hide edit label interface
        document.getElementById('editLabelGroup').style.display = 'none';
        
        // Reset saved state since we're clearing the graph
        this.lastSavedState = null;
        
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
        // Apply shaking animation if this vertex is in edit mode
        let drawX = vertex.x;
        let drawY = vertex.y;
        if (this.editModeElement === vertex && this.editModeType === 'vertex') {
            drawX += this.shakeOffset;
        }
        // Determine vertex color based on state and individual styling
        let fillColor = vertex.color || this.vertexColor;
        let borderColor = vertex.borderColor || this.vertexBorderColor;
        let fontColor = vertex.fontColor || this.vertexFontColor;
        let fontSize = vertex.fontSize || this.vertexFontSize;
        let fontFamily = vertex.fontFamily || this.vertexFontFamily;
        if (this.pathVertices.has(vertex)) {
            fillColor = '#10b981';
            borderColor = '#059669';
            fontColor = '#ffffff';
        } else if (this.visitedVertices.has(vertex)) {
            fillColor = '#f59e0b';
            borderColor = '#d97706';
            fontColor = '#ffffff';
        } else if (this.editingVertex === vertex) {
            fillColor = '#06b6d4';
            borderColor = '#0891b2';
            fontColor = '#ffffff';
        } else if (this.selectedVertices.includes(vertex)) {
            fillColor = '#6366f1';
            borderColor = '#4f46e5';
            fontColor = '#ffffff';
        } else if (this.distanceModeVertices.includes(vertex)) {
            fillColor = '#f59e0b';
            borderColor = '#d97706';
            fontColor = '#ffffff';
        } else if (vertex === this.draggedVertex) {
            fillColor = '#10b981';
            borderColor = '#059669';
            fontColor = '#ffffff';
        }
        // Remove special red highlight for edit mode (no longer force red)
        // Adjust colors for light theme
        if (this.currentTheme === 'light') {
            if (fillColor === this.vertexColor) {
                fillColor = '#e2e8f0';
                borderColor = '#cbd5e1';
                fontColor = '#1e293b';
            }
        }
        // Draw vertex circle with gradient
        const gradient = this.ctx.createRadialGradient(
            drawX - this.vertexSize * 0.3, 
            drawY - this.vertexSize * 0.3, 
            0,
            drawX, 
            drawY, 
            this.vertexSize
        );
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, this.adjustColor(fillColor, -20));
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, this.vertexSize, 0, 2 * Math.PI);
        this.ctx.fill();
        // Draw border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        // Draw label
        this.ctx.fillStyle = fontColor;
        this.ctx.font = `bold ${Math.max(fontSize, this.vertexSize / 2)}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(vertex.label.toString(), drawX, drawY);
        // Add glow effect for selected vertices
        if (this.selectedVertices.includes(vertex)) {
            this.ctx.shadowColor = '#6366f1';
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        // Add special glow effect for editing vertex
        if (this.editingVertex === vertex) {
            this.ctx.shadowColor = '#06b6d4';
            this.ctx.shadowBlur = 20;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        // Add special glow effect for edit mode (no color override)
        if (this.editModeElement === vertex && this.editModeType === 'vertex') {
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 25;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
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
} 