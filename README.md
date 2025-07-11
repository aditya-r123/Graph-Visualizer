# Graph Creator Pro

A modern, interactive web application for creating, visualizing, and analyzing graphs with an intuitive interface.

## ✨ Features

### 🎯 Core Functionality
- **Interactive Graph Creation**: Click to add vertices, drag to reposition
- **Edge Management**: Create edges between vertices with various types and weights
- **Real-time Editing**: Edit vertex labels and sizes with immediate visual feedback
- **Search Algorithms**: BFS and DFS with visual animations
- **Distance Calculator**: Measure shortest path distances between vertices

### 💾 Save & Load System
- **Auto-Save**: Automatic graph saving with toggle control
- **Manual Save**: Save graphs with custom timestamps
- **Load Graphs**: Browse and load previously saved graphs
- **Recent Graphs**: Quick access to last 10 saved graphs
- **Screenshot Capture**: High-quality graph screenshots

### 🎨 User Interface
- **Dark/Light Theme**: Toggle between themes with animated sun/moon icons
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Collapsible Sections**: Organized control panels
- **Status Bar**: Real-time updates and system information

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/aditya-r123/Graph-Visualizer.git
   cd Graph-Visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3002`

## 📖 Quick Usage Guide

### Creating Graphs
1. **Add Vertices**: Left-click anywhere on the canvas
2. **Move Vertices**: Drag vertices to reposition them
3. **Create Edges**: Double-click two vertices to connect them
4. **Edit Vertices**: Hold left-click on a vertex for 2 seconds to enter edit mode

### Graph Controls
- **Vertex Size**: Use the slider to adjust vertex size (15-60px)
- **Vertex Labels**: Type custom labels or leave empty for auto-labeling
- **Edge Weight**: Enter numerical weights for edges
- **Edge Type**: Choose between straight and curved edges
- **Edge Direction**: Select undirected or directed edges

### Search Algorithms
1. **Select Target**: Click the target vertex display to select a vertex
2. **Run Search**: Click "Run BFS" or "Run DFS" to start visualization
3. **Watch Animation**: Observe the search process with color-coded vertices

### Saving & Loading
- **Auto-Save**: Toggle on/off in the Save & Load section
- **Manual Save**: Click "Save Graph" to save with timestamp
- **Load Graph**: Click "Load Graph" to browse saved graphs
- **Recent Graphs**: Click on any recent graph to load it instantly

## 🛠️ Technical Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript with HTML5 Canvas
- **Build Tool**: Webpack
- **Styling**: CSS3 with CSS Grid and Flexbox
- **Icons**: Font Awesome

## 🎯 Key Features

### Edit Mode
- Hold left-click on vertex for 2 seconds to enter edit mode
- Edit label and size with real-time updates
- Save or cancel changes

### Search Visualization
- Color-coded vertices (visited: blue, path: green)
- Step-by-step animation with delays
- Shows shortest path when target is found

### Auto-Save System
- Silent operation with no status messages
- Only saves when modifications are made
- Toggle control available

## 🔧 Development

### Available Scripts
- `npm start`: Start the development server
- `npm run build`: Build for production

## 👨‍💻 Author

**Aditya Rao** - [GitHub](https://github.com/aditya-r123)

## 📄 License

This project is licensed under the MIT License. 