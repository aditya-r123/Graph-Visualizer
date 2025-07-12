# Bug: Vertex Cloning Occurs When Dragging Near Window Edges

## Description
When dragging vertices near the bottom and right borders of the white editing box (around coordinates 1450+), vertices appear to clone or "paint" and subsequently prevent new vertex creation.

## Steps to Reproduce
1. Create a vertex in the graph
2. Drag the vertex towards the right edge of the white editing box (around x-coordinate 1450+)
3. Drag the vertex towards the bottom edge of the white editing box (around y-coordinate 1450+)
4. Observe that the vertex appears to clone or create multiple instances
5. Try to create a new vertex - it may be prevented or behave unexpectedly

## Expected Behavior
- Vertices should drag smoothly without cloning
- New vertices should be able to be created normally after dragging
- No visual artifacts or duplicate vertices should appear

## Actual Behavior
- Vertices appear to clone when dragged near window edges
- Multiple vertex instances may appear visually
- New vertex creation may be blocked after this occurs
- The `hasDragged` flag may not reset properly, preventing subsequent interactions

## Technical Details
- **Location**: Near coordinates (1450, 1450) and beyond
- **Trigger**: Dragging vertices near the edge of the 1800×1800 editing zone
- **Related Code**: Mouse position calculation and drag state management in `graphCreator.js`
- **Affected Functions**: `handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `getMousePos`

## Environment
- **Browser**: All browsers
- **OS**: All operating systems
- **Canvas Size**: 1800×1800 pixels
- **Editing Zone**: White bordered area

## Potential Root Causes
1. **Mouse Position Calculation**: The `getMousePos` function may have issues with scroll offset calculations near edges
2. **Drag State Management**: The `hasDragged` flag may not reset properly after edge dragging
3. **Canvas Boundary Handling**: Mouse events may not be captured correctly when dragging outside the visible canvas area
4. **Coordinate System**: Issues with coordinate transformation when vertices are near the editing zone boundaries

## Related Issues
- This bug was partially addressed in previous fixes for drag state management
- May be related to the horizontal scrollbar visibility improvements
- Could be connected to the mouse event capture improvements for dragging outside canvas

## Priority
**Medium** - Affects user experience when working with large graphs near the editing zone boundaries

## Labels
- `bug`
- `drag-and-drop`
- `mouse-interaction`
- `canvas`
- `user-experience`

## Additional Notes
This issue was discovered during testing of the scrollbar visibility improvements and vertex interaction model changes. The bug appears to be related to how mouse coordinates are calculated and how drag state is managed when vertices are positioned near the edges of the editing zone. 