# Graph Creator Pro

A modern, interactive web application for creating, visualizing, and analyzing graphs with an intuitive interface. Built with Node.js, Express, and modern web technologies, Graph Creator Pro offers powerful graph manipulation tools with real-time visual feedback.

## ✨ Features

### 🎯 Core Functionality
- **Interactive Graph Creation**: Click to add vertices, drag to reposition
- **Edge Management**: Create edges between vertices with various types and weights
- **Real-time Editing**: Edit vertex labels and sizes with immediate visual feedback
- **Visual Feedback**: Shake animations, hover effects, and status updates

### 🔧 Graph Controls
- **Vertex Customization**: Adjustable size (15-60px), custom labels, auto-labeling
- **Edge Types**: Straight lines, curved edges, directed/undirected arrows
- **Edge Weights**: Optional numerical weights with visual display
- **Edge Direction**: Undirected, forward-directed (→), backward-directed (←)

### 🔍 Search & Analysis
- **Breadth-First Search (BFS)**: Visualize BFS traversal with animations
- **Depth-First Search (DFS)**: Explore DFS algorithm with step-by-step visualization
- **Distance Calculator**: Measure shortest path distances between vertices
- **Target Selection**: Interactive vertex targeting for search algorithms

### 💾 Save & Load System
- **Auto-Save**: Automatic graph saving with toggle control
- **Manual Save**: Save graphs with custom timestamps
- **Load Graphs**: Browse and load previously saved graphs
- **Recent Graphs**: Quick access to last 10 saved graphs
- **Graph Management**: Rename and delete saved graphs

### 📸 Export & Sharing
- **Screenshot Capture**: High-quality graph screenshots
- **File Export**: Save graphs as JSON files
- **File Import**: Load graphs from JSON files

### 🎨 User Interface
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Collapsible Sections**: Organized control panels
- **Status Bar**: Real-time updates and system information
- **Contact System**: Built-in contact form for feedback

### 📱 Mobile Support
- **Touch Interactions**: Optimized for touch devices
- **Responsive Layout**: Adaptive sidebar and controls
- **Mobile-Friendly**: All features accessible on mobile

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

## 📖 Usage Guide

### Creating Graphs
1. **Add Vertices**: Left-click anywhere on the canvas
2. **Move Vertices**: Drag vertices to reposition them
3. **Create Edges**: Double-click two vertices to connect them
4. **Edit Vertices**: Hold left-click on a vertex for 2 seconds to enter edit mode

### Graph Controls
- **Vertex Size**: Use the slider to adjust vertex size
- **Vertex Labels**: Type custom labels or leave empty for auto-labeling
- **Edge Weight**: Enter numerical weights for edges
- **Edge Type**: Choose between straight and curved edges
- **Edge Direction**: Select undirected or directed edges

### Search Algorithms
1. **Select Target**: Click the target vertex display to select a vertex
2. **Choose Root**: Select a root node from the dropdown (or use auto-selection)
3. **Run Search**: Click "Run BFS" or "Run DFS" to start visualization
4. **Watch Animation**: Observe the search process with color-coded vertices

### Saving & Loading
- **Auto-Save**: Toggle on/off in the Save & Load section
- **Manual Save**: Click "Save Graph" to save with timestamp
- **Load Graph**: Click "Load Graph" to browse saved graphs
- **Recent Graphs**: Click on any recent graph to load it instantly

## 🛠️ Technical Details

### Architecture
- **Backend**: Node.js with Express.js server
- **Frontend**: Vanilla JavaScript with HTML5 Canvas
- **Build Tool**: Webpack for bundling and optimization
- **Styling**: CSS3 with CSS Grid and Flexbox
- **Icons**: Font Awesome for UI icons

### Key Technologies
- **Canvas API**: For graph rendering and interactions
- **Local Storage**: For saving graphs and user preferences
- **Bootstrap**: For responsive UI components
- **Webpack**: For module bundling and development

### File Structure
```
graph-creator/
├── src/
│   ├── graphCreator.js    # Main application logic
│   ├── index.html         # HTML structure
│   ├── index.js           # Entry point
│   └── styles.css         # Styling and themes
├── public/                # Static assets
├── server.js              # Express server
├── webpack.config.js      # Build configuration
└── package.json           # Dependencies and scripts
```

## 🎯 Key Features Explained

### Edit Mode
- **Activation**: Hold left-click on vertex for 2 seconds
- **Features**: Edit label and size with real-time updates
- **Validation**: Prevents duplicate labels and empty values
- **Save/Cancel**: Apply changes or revert to original values

### Search Visualization
- **Color Coding**: Visited vertices (blue), path vertices (green)
- **Animation**: Step-by-step visualization with delays
- **Path Reconstruction**: Shows shortest path when target is found
- **Status Updates**: Real-time feedback during search

### Auto-Save System
- **Silent Operation**: No status messages during auto-save
- **Change Detection**: Only saves when modifications are made
- **Background Process**: Uninterrupted user experience
- **Toggle Control**: Enable/disable as needed

## 🔧 Development

### Available Scripts
- `npm start`: Start the development server
- `npm run build`: Build for production
- `npm run dev`: Start in development mode

### Customization
- **Themes**: Modify CSS variables in `styles.css`
- **Features**: Extend functionality in `graphCreator.js`
- **Styling**: Update UI components in `index.html`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aditya Rao** - [GitHub](https://github.com/aditya-r123)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions, feedback, or support, use the contact form in the application or reach out through GitHub issues. 