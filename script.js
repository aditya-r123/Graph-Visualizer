class GraphCreator {
    constructor() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.vertices = [];
        this.edges = [];
        this.nextVertexId = 1;
        this.selectedVertex = null;
        this.draggedVertex = null;
        this.isDragging = false;
        this.lastClickTime = 0;
        this.clickTimeout = 500; // milliseconds
        this.vertexSize = 20;
        this.edgeType = 'straight';
        this.defaultEdgeWeight = null;
        
        this.initializeEventListeners();
        this.updateInfo();
    }
    
    initializeEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
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
        
        document.getElementById('calculateDistance').addEventListener('click', () => {
            this.calculateDistanceMode();
        });
        
        document.getElementById('clearGraph').addEventListener('click', () => {
            this.clearGraph();
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleCanvasClick(e) {
        const pos = this.getMousePos(e);
        const clickedVertex = this.getVertexAt(pos.x, pos.y);
        
        if (clickedVertex) {
            this.handleVertexClick(clickedVertex);
        } else {
            this.addVertex(pos.x, pos.y);
        }
    }
    
    handleVertexClick(vertex) {
        const currentTime = Date.now();
        
        if (currentTime - this.lastClickTime < this.clickTimeout) {
            // Double click - create edge
            if (this.selectedVertex && this.selectedVertex !== vertex) {
                const weight = document.getElementById('edgeWeight').value || this.defaultEdgeWeight;
                this.addEdge(this.selectedVertex, vertex, weight);
                this.selectedVertex = null;
            }
        } else {
            // Single click - select vertex
            this.selectedVertex = vertex;
        }
        
        this.lastClickTime = currentTime;
        this.draw();
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const vertex = this.getVertexAt(pos.x, pos.y);
        
        if (vertex) {
            this.draggedVertex = vertex;
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging && this.draggedVertex) {
            const pos = this.getMousePos(e);
            this.draggedVertex.x = pos.x;
            this.draggedVertex.y = pos.y;
            this.draw();
        } else {
            const pos = this.getMousePos(e);
            const vertex = this.getVertexAt(pos.x, pos.y);
            this.canvas.style.cursor = vertex ? 'grab' : 'crosshair';
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.draggedVertex = null;
        this.canvas.style.cursor = 'crosshair';
    }
    
    getVertexAt(x, y) {
        return this.vertices.find(vertex => {
            const distance = Math.sqrt((vertex.x - x) ** 2 + (vertex.y - y) ** 2);
            return distance <= this.vertexSize;
        });
    }
    
    addVertex(x, y) {
        const vertex = {
            id: this.nextVertexId++,
            x: x,
            y: y,
            label: this.nextVertexId - 1
        };
        
        this.vertices.push(vertex);
        this.updateInfo();
        this.draw();
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
                type: this.edgeType
            };
            
            this.edges.push(edge);
            this.updateInfo();
            this.draw();
        }
    }
    
    calculateDistanceMode() {
        if (this.vertices.length < 2) {
            alert('Need at least 2 vertices to calculate distance');
            return;
        }
        
        let clicks = 0;
        let firstVertex = null;
        let secondVertex = null;
        
        const originalClickHandler = this.handleVertexClick.bind(this);
        
        this.handleVertexClick = (vertex) => {
            clicks++;
            
            if (clicks === 1) {
                firstVertex = vertex;
                this.selectedVertex = vertex;
                this.draw();
            } else if (clicks === 2) {
                secondVertex = vertex;
                const distance = this.calculateDistance(firstVertex, secondVertex);
                document.getElementById('distanceInfo').textContent = 
                    `Distance between vertex ${firstVertex.label} and vertex ${secondVertex.label}: ${distance.toFixed(2)}`;
                
                // Reset
                clicks = 0;
                firstVertex = null;
                secondVertex = null;
                this.selectedVertex = null;
                this.handleVertexClick = originalClickHandler;
                this.draw();
            }
        };
        
        alert('Click on two vertices to calculate distance');
    }
    
    calculateDistance(vertex1, vertex2) {
        return Math.sqrt((vertex2.x - vertex1.x) ** 2 + (vertex2.y - vertex1.y) ** 2);
    }
    
    clearGraph() {
        this.vertices = [];
        this.edges = [];
        this.nextVertexId = 1;
        this.selectedVertex = null;
        this.draggedVertex = null;
        this.isDragging = false;
        document.getElementById('distanceInfo').textContent = '';
        this.updateInfo();
        this.draw();
    }
    
    updateInfo() {
        document.getElementById('vertexCount').textContent = this.vertices.length;
        document.getElementById('edgeCount').textContent = this.edges.length;
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
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        if (edge.type === 'curved') {
            // Draw curved edge
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2 - 30;
            
            this.ctx.moveTo(edge.from.x, edge.from.y);
            this.ctx.quadraticCurveTo(midX, midY, edge.to.x, edge.to.y);
        } else {
            // Draw straight edge
            this.ctx.moveTo(edge.from.x, edge.from.y);
            this.ctx.lineTo(edge.to.x, edge.to.y);
        }
        
        this.ctx.stroke();
        
        // Draw weight if exists
        if (edge.weight !== null) {
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2;
            
            if (edge.type === 'curved') {
                midY -= 15;
            }
            
            this.ctx.fillStyle = '#764ba2';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(edge.weight.toString(), midX, midY);
        }
    }
    
    drawVertex(vertex) {
        // Draw vertex circle
        this.ctx.fillStyle = vertex === this.selectedVertex ? '#667eea' : '#4a5568';
        this.ctx.beginPath();
        this.ctx.arc(vertex.x, vertex.y, this.vertexSize, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw label
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${Math.max(12, this.vertexSize / 2)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(vertex.label.toString(), vertex.x, vertex.y);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GraphCreator();
}); 