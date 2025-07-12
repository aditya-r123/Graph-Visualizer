# Graph Creator Pro

A powerful, interactive web application for creating, visualizing, and analyzing graphs with an intuitive drag-and-drop interface.

## 🌟 Features

### Core Functionality
- **Interactive Graph Creation**: Click to add vertices, drag to move them, and create edges between vertices
- **Real-time Visualization**: Smooth animations and visual feedback for all interactions
- **Multiple Edge Types**: Support for straight and curved edges, directed and undirected graphs
- **Edge Weights**: Add numerical weights to edges for weighted graph analysis
- **Vertex Labels**: Custom labels or auto-generated labels for vertices

### Advanced Editing
- **Edit Mode**: Click and hold vertices to enter edit mode with comprehensive controls
- **Apply to All**: Apply changes to all vertices simultaneously (size, label, etc.)
- **Pending Deletion**: Mark vertices for deletion with visual preview before confirming
- **Delete Mode**: Dedicated deletion mode with red X buttons on vertices
- **Visual Feedback**: Fade effects and color changes for pending deletions

### Search & Analysis
- **Breadth-First Search (BFS)**: Animated BFS traversal with visual path highlighting
- **Depth-First Search (DFS)**: Animated DFS traversal with step-by-step visualization
- **Distance Calculation**: Calculate shortest path distances between any two vertices
- **Target Selection**: Interactive target vertex selection with visual indicators
- **Collapsible Search Panel**: Expandable search algorithms section

### Save & Load System
- **Auto-Save**: Automatic saving when adding vertices/edges (toggleable)
- **Manual Save/Load**: Save graphs with custom names and timestamps
- **Recent Graphs**: Quick access to recently saved graphs with click-to-load
- **Graph Management**: Delete individual graphs or all saved graphs
- **File Import/Export**: Load graphs from JSON files and export current graphs

### Screenshot & Export
- **High-Quality Screenshots**: Capture graphs in JPG or PNG format
- **Full Graph Data**: Screenshots include all vertex and edge information
- **Custom Format Selection**: Choose between smaller JPG files or higher quality PNG

### User Interface
- **Modern Design**: Clean, responsive interface with Bootstrap styling
- **Dark/Light Theme**: Toggle between themes with animated sun/moon icons
- **Eye Tracking**: Interactive sun/moon icons that follow your mouse
- **Collapsible Sections**: Expandable search algorithms panel
- **Smart Scroll Indicator**: "More options" indicator that disappears after 150px of scrolling
- **Status Bar**: Real-time status updates, local time, and contact information
- **Contact Modal**: Built-in contact form for feedback and support

### Accessibility & UX
- **Keyboard Navigation**: Full keyboard support for all operations
- **Visual Feedback**: Shake animations, color changes, and hover effects
- **Responsive Design**: Works on desktop and tablet devices
- **Intuitive Controls**: Clear visual cues and helpful tooltips
- **Error Handling**: Graceful error handling with user-friendly messages

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/graph-creator.git
   cd graph-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3002`

### Building for Production

```bash
npm run build
```

## 🎯 How to Use

### Basic Operations
- **Add Vertex**: Left-click anywhere on the canvas
- **Move Vertex**: Drag vertices to reposition them
- **Create Edge**: Double-click two vertices to connect them
- **Edit Vertex**: Click and hold a vertex to enter edit mode
- **Delete Vertex**: Use edit mode or dedicated delete mode

### Edit Mode Features
- **Label Editing**: Change vertex labels with immediate visual feedback
- **Size Adjustment**: Modify vertex size with live preview
- **Apply to All**: Check the "Apply to All Vertices" option to modify all vertices
- **Pending Deletion**: Mark vertices for deletion with visual preview
- **Save/Cancel**: Confirm changes or revert to original state

### Search Algorithms
- **Select Target**: Click the target selection area to choose a vertex
- **Run BFS/DFS**: Click the respective buttons to start animated traversal
- **Stop Search**: Interrupt ongoing searches at any time
- **Calculate Distance**: Measure shortest path between two vertices

### Save & Load
- **Auto-Save**: Toggle automatic saving in the Save & Load section
- **Manual Save**: Click "Save Graph" to save with custom name
- **Load Graph**: Click "Load Graph" or click on recent graphs
- **Screenshot**: Capture current graph state in your preferred format

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with ES6 modules
- **Build System**: Webpack with production optimization
- **Styling**: CSS3 with custom properties for theming
- **Server**: Express.js for development and production serving

### Key Components
- **GraphCreator Class**: Main application logic and canvas management
- **Event System**: Comprehensive event handling for user interactions
- **Animation Engine**: Smooth animations for search algorithms and UI feedback
- **Storage System**: Local storage for graph persistence
- **Theme System**: Dynamic theme switching with CSS custom properties

### Performance Features
- **Canvas Optimization**: Efficient rendering with requestAnimationFrame
- **Event Delegation**: Optimized event handling for large graphs
- **Memory Management**: Proper cleanup of animations and event listeners
- **Lazy Loading**: On-demand loading of non-critical features

## 🎨 Customization

### Themes
The application supports dynamic theme switching with custom CSS properties:
- Dark theme: Modern dark interface with high contrast
- Light theme: Clean light interface with subtle shadows

### Styling
All visual elements can be customized through CSS:
- Vertex colors, sizes, and fonts
- Edge styles, colors, and thickness
- UI component styling and animations
- Responsive breakpoints and layouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aditya Rao**
- LinkedIn: [Aditya Rao](https://www.linkedin.com/in/-aditya-rao/)
- Contact: Available through the in-app contact form

## 🙏 Acknowledgments

- Bootstrap for the responsive UI framework
- Font Awesome for the comprehensive icon library
- The graph theory community for inspiration and algorithms
- All contributors and users who provided feedback and suggestions

---

**Graph Creator Pro** - Where creativity meets graph theory! 🚀 