# Graph Creator Pro

A modern, interactive web application for creating and manipulating graphs (vertices and edges) with a beautiful, intuitive interface built with Node.js and modern web technologies.

## ✨ Features

### 🎯 Core Functionality
- **Add Vertices**: Left-click anywhere on the canvas to add vertices (automatically labeled in order)
- **Drag Vertices**: Click and drag vertices to move them around the canvas
- **Create Edges**: Right-click two vertices consecutively to create edges between them
- **Visual Feedback**: Color-coded vertex states with smooth animations

### 🎨 Customization Options
- **Vertex Size**: Adjustable slider (15-60 pixels) to change vertex size
- **Edge Types**: Choose between straight lines or curved edges
- **Edge Weights**: Optional weight labels for edges (default: no weights)
- **Real-time Updates**: All changes are reflected immediately

### 🛠️ Utilities
- **Distance Calculator**: Calculate the Euclidean distance between any two vertices
- **Graph Statistics**: Real-time display of vertex and edge counts
- **Clear Graph**: Reset the entire graph with one click
- **Status Updates**: Live status messages and current time display

### 🎨 Modern UI/UX
- **Dark Theme**: Beautiful dark mode with glass-morphism effects
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Smooth Animations**: Fluid transitions and hover effects
- **Color Coding**: Different colors for selected, distance mode, and dragged vertices
- **Interactive Instructions**: Built-in help overlay for new users

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation
1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd graph-creater
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (Recommended)
```bash
npm run dev
```
This will start both the webpack build process and the development server.

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3001`

## 🎮 How to Use

### Getting Started
1. Open the application in your web browser
2. The interface will show an instructions overlay for first-time users
3. Click "Got it!" to start creating your graph

### Creating a Graph
1. **Add Vertices**: Left-click anywhere on the dark canvas area to add vertices
2. **Create Edges**: 
   - Right-click on one vertex (it will turn blue to show selection)
   - Right-click on another vertex to create an edge between them
3. **Move Vertices**: Click and drag any vertex to reposition it

### Customizing Your Graph
- **Vertex Size**: Use the slider in the sidebar to make vertices larger or smaller
- **Edge Type**: Select "Straight Line" or "Curved" from the dropdown
- **Edge Weights**: Enter a number in the "Edge Weight" field before creating edges

### Using the Distance Calculator
1. Click the "Calculate Distance" button (it will turn active)
2. Click on two vertices in sequence
3. The distance will be displayed in the statistics panel

### Vertex States & Colors
- **Default**: Dark gray vertices
- **Selected**: Blue vertices (for edge creation)
- **Distance Mode**: Orange vertices (when calculating distance)
- **Dragging**: Green vertices (when being moved)

## 📁 Project Structure

```
graph-creater/
├── src/
│   ├── index.html          # Main HTML template
│   ├── index.js            # Application entry point
│   ├── graphCreator.js     # Main graph logic and interactions
│   └── styles.css          # Modern CSS styling
├── public/                 # Built files (generated)
├── server.js               # Express server
├── webpack.config.js       # Webpack configuration
├── package.json            # Dependencies and scripts
└── README.md              # This documentation
```

## 🛠️ Technical Details

### Built With
- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
- **Backend**: Node.js, Express.js
- **Build Tool**: Webpack 5
- **Styling**: Modern CSS with CSS Variables and Flexbox/Grid
- **Fonts**: Inter (Google Fonts)
- **Icons**: Font Awesome 6

### Key Features
- **Responsive Canvas**: Automatically resizes with the window
- **Precise Positioning**: Fixed mouse position calculation for accurate vertex placement
- **Smooth Interactions**: Optimized event handling and rendering
- **Modern Architecture**: ES6 modules and modern JavaScript patterns
- **Performance Optimized**: Efficient canvas rendering and memory management

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with touch support

## 🎨 Design Features

### Color Scheme
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Cyan (#06b6d4)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

### UI Elements
- Glass-morphism effects with backdrop blur
- Smooth gradients and shadows
- Interactive hover states
- Responsive grid layouts
- Modern typography with Inter font

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development with watch mode
- `npm start` - Start production server

### Code Structure
- **Modular Design**: Separated concerns with ES6 modules
- **Event-Driven**: Clean event handling architecture
- **Canvas Optimization**: Efficient rendering with proper cleanup
- **Responsive Design**: Mobile-first approach with breakpoints

## 🚀 Future Enhancements

Potential features for future versions:
- Save/load graph functionality (JSON export/import)
- Different vertex shapes and colors
- Graph algorithms (shortest path, minimum spanning tree, etc.)
- Export to various formats (PNG, SVG, PDF)
- Undo/redo functionality
- Multiple graph layers
- Collaboration features
- Graph templates and examples

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Graph Creator Pro** - Create beautiful graphs with ease! 🎨✨ 