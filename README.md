# Graph Creator Pro

[![Version](https://img.shields.io/badge/version-v1.1.0--stable-brightgreen.svg)](https://github.com/aditya-r123/Graph-Visualizer/releases/tag/v1.1.0-stable)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful, interactive web application for creating, visualizing, and analyzing graphs with an intuitive drag-and-drop interface.

## 🎉 Stable Version v1.1.0

This release includes all core features for graph creation and analysis, plus enhanced sharing and UI improvements:
- ✅ **Complete graph creation and editing system**
- ✅ **BFS/DFS search algorithms with animations**
- ✅ **Connectivity checks and path finding**
- ✅ **Waterfall effect animations**
- ✅ **Save/load functionality with graph renaming**
- ✅ **Screenshot and sharing capabilities**
- ✅ **Modern UI with theme switching**
- ✅ **Interactive time display (digital/analog)**
- ✅ **Enhanced recent graphs management**

*Note: Custom appearance editing for edges and vertices is planned for future releases.*

## 📋 Changelog

### v1.1.0-stable (Current Release)
- **📤 Share Functionality**: Native sharing via Web Share API with custom messaging
- **⏰ Interactive Time Display**: Toggle between digital and analog clock formats
- **✏️ Graph Renaming**: Rename graphs from both sidebar and load modal
- **📱 Enhanced Recent Graphs**: Show up to 5 recent graphs with improved UI
- **🎨 UI Refinements**: Unified footer design, better spacing, and modern aesthetics
- **🔧 Improved Help System**: Reliable help button functionality
- **📊 Better Statistics**: Combined status and statistics panel

### v1.0.0-stable (Previous Release)
- **🎯 Core Features Complete**: All essential graph creation and analysis features implemented
- **🔍 Search Algorithms**: BFS and DFS with animated traversal and path highlighting
- **🌊 Waterfall Effects**: Directional edge traversal animations that follow actual paths
- **🔗 Connectivity Checks**: Prevents unnecessary animations when vertices are unreachable
- **💾 Data Persistence**: Auto-save, manual save/load, and file import/export
- **📸 Screenshot System**: High-quality graph captures in multiple formats
- **🎨 Modern UI**: Dark/light theme switching with responsive design
- **⚡ Performance**: Optimized animations and efficient graph rendering
- **🛡️ Error Handling**: Comprehensive error handling and user feedback

### Planned for Future Releases
- **🎨 Custom Appearance**: Advanced styling options for vertices and edges
- **📊 Advanced Analytics**: More graph algorithms and analysis tools
- **🌐 Collaboration**: Real-time collaborative graph editing
- **📱 Mobile Support**: Enhanced mobile and tablet experience

## 🌟 Features

### Core Functionality
- **Interactive Graph Creation**: Click to add vertices, drag to move them, and create edges between vertices
- **Smart Interaction System**: 
  - **Drag Threshold**: 5-pixel movement threshold to distinguish dragging from clicking
  - **Edit Mode**: Hold vertex for 2.5 seconds to enter edit mode (red glow appears at 1 second)
  - **Edge Creation**: Left-click two different vertices consecutively to create an edge
  - **Self-Loop Creation**: Left-click the same vertex twice in a row (within 1 second) to create a self-loop
  - **Right Click**: Right click on a vertex to set it as the target for search/pathfinding
  - **All other mouse-vertex interactions (dragging, edit mode, right click) are unaffected by this logic**
- **Real-time Visualization**: Smooth animations and visual feedback for all interactions
- **Multiple Edge Types**: Support for straight and curved edges, directed and undirected graphs
- **Edge Weights**: Add numerical weights to edges for weighted graph analysis
- **Vertex Labels**: Custom labels or auto-generated labels for vertices

### Advanced Editing
- **Edit Mode**: Hold vertex for 2.5 seconds to enter edit mode with comprehensive controls
- **Visual Hold Feedback**: Red glow appears after 1 second of holding, gradually expanding until edit mode activates
- **Smart State Management**: Dragging prevents both edge creation and edit mode activation
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
- **Recent Graphs**: Quick access to up to 5 recently saved graphs with click-to-load
- **Graph Renaming**: Rename graphs from both the sidebar and load modal
- **Graph Management**: Delete individual graphs or all saved graphs
- **File Import/Export**: Load graphs from JSON files and export current graphs

### Screenshot & Sharing
- **High-Quality Screenshots**: Capture graphs in JPG or PNG format
- **Native Sharing**: Share graphs directly via Web Share API (iMessage, Email, etc.)
- **Custom Share Text**: "Hey, check out this cool graph I made with Graph Visualizer Pro"
- **Fallback Support**: Download option when Web Share API is not available
- **Full Graph Data**: Screenshots include all vertex and edge information

### User Interface
- **Modern Design**: Clean, responsive interface with unified footer design
- **Dark/Light Theme**: Toggle between themes with animated sun/moon icons
- **Interactive Time Display**: Click to toggle between digital and analog clock formats
- **Eye Tracking**: Interactive sun/moon icons that follow your mouse
- **Collapsible Sections**: Expandable search algorithms panel
- **Smart Scroll Indicator**: "More options" indicator that disappears after 150px of scrolling
- **Unified Status Panel**: Combined statistics and status messages in footer
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
   git clone https://github.com/aditya-r123/Graph-Visualizer.git
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
- **Move Vertex**: Drag vertices to reposition them (5-pixel movement threshold)
- **Create Edge**: Left-click two different vertices consecutively to connect them
- **Create Self-Loop**: Left-click the same vertex twice in a row (within 1 second)
- **Edit Vertex**: Hold vertex for 2.5 seconds to enter edit mode (red glow appears at 1 second)
- **Delete Vertex**: Use edit mode or dedicated delete mode

### Interaction Timing
- **Quick Click** (< 1 second): Normal edge creation behavior
- **Short Hold** (1-1.25 seconds): Red glow appears, edge creation still works
- **Medium Hold** (1.25-2.5 seconds): Red glow continues, edge creation prevented
- **Long Hold** (2.5+ seconds): Edit mode activated
- **Dragging**: Prevents both edge creation and edit mode activation

### Edit Mode Features
- **Hold to Enter**: Hold vertex for 2.5 seconds to enter edit mode
- **Visual Feedback**: Red glow appears after 1 second, expanding until edit mode activates
- **Label Editing**: Change vertex labels with immediate visual feedback
- **Size Adjustment**: Modify vertex size with live preview
- **Apply to All**: Check the "Apply to All Vertices" option to modify all vertices
- **Pending Deletion**: Mark vertices for deletion with visual preview
- **Save/Cancel**: Confirm changes or revert to original state

### Search Algorithms
- **Select Target**: Click the target selection area to choose a vertex
- **Run BFS/DFS**: Click the respective buttons to start animated traversal
- **Stop Search**: Interrupt ongoing searches at any time

### Save & Load
- **Auto-Save**: Toggle automatic saving in the Save & Load section
- **Manual Save**: Click "Save Graph" to save with custom name
- **Load Graph**: Click "Load Or Rename Graph" or click on recent graphs
- **Rename Graphs**: Click the edit icon next to any graph name to rename it
- **Screenshot**: Capture current graph state in your preferred format
- **Share Graph**: Share your graph directly to other apps using the share button

### Time Display
- **Digital/Analog Toggle**: Click the time display to switch between formats
- **Real-time Updates**: Time updates automatically every second
- **Interactive Clock**: Analog clock with smooth hand movements

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
- **Share System**: Web Share API integration with fallback support

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