# GraphExplorer - High-Performance Graph Visualization

A WebGL-based graph visualization component for rendering 2000+ nodes with real-time interaction. Built with React, Three.js, and dagre layout engine.

## Installation

1. **Install dependencies:**
```bash
npm install three dagre @types/three @types/dagre
```

2. **Import the component:**
```tsx
import GraphExplorer from '@/components/GraphExplorer';

export default function GraphPage() {
  return <GraphExplorer />;
}
```

## Features

### Performance Optimizations
- **GPU Rendering**: Uses `InstancedMesh` for 2000+ nodes with 2 draw calls total
  - Nodes: Single InstancedMesh (BoxGeometry)
  - Edges: Single LineSegments
- **Efficient Layout**: Dagre hierarchical layout algorithm
- **Level-of-Detail (LOD)**: Labels hidden when zoomed out
- **Viewport Culling**: Only visible nodes rendered

### Interaction Modes

#### 1. **Show All Nodes**
- Displays complete graph
- Press `A` or click "Show All" button
- Fit-to-view automatically centers

#### 2. **Expand from Node**
- Click a node to see only that node + direct connections
- Useful for exploring relationships
- Breadcrumb navigation planned

#### 3. **Search & Highlight**
- Real-time search by label or node ID
- Highlights matching nodes
- Case-insensitive matching

### Controls

| Action | Input |
|--------|-------|
| Zoom In | Scroll Up / Click "Zoom In" |
| Zoom Out | Scroll Down / Click "Zoom Out" |
| Fit View | Press `F` / Click "Fit View" |
| Show All | Press `A` / Click "Show All" |
| Search | Type in search box |
| Reset | Press `Esc` |

### Keyboard Shortcuts
- `A` - Show all nodes
- `F` - Fit to view
- `Esc` - Clear search and show all

## Configuration

### Adding Node Connections

Edit `lib/graphConnections.ts` to define graph relationships:

```typescript
export const GRAPH_CONNECTIONS: GraphConnection[] = [
  // Group to Option connections
  { source: 'feet', target: 'foot-job' },
  { source: 'feet', target: 'foot-worship' },
  
  // Role to Role connections
  { source: 'dominant', target: 'submissive' },
  
  // Option to Group connections
  { source: 'bondage', target: 'bdsm' },
];
```

### Node Types

Nodes automatically come from three sources:

1. **OPTIONS** (`data/options.ts`)
   - Type: `'option'`
   - Color: Blue by default
   - Count: 500+

2. **ROLES** (`data/roles.ts`)
   - Type: `'role'`
   - Color: Can be customized per role
   - Count: 30+

3. **GROUPS** (`data/groups.ts`)
   - Type: `'group'`
   - Color: Can be customized per group
   - Count: 40+

## Customization

### Change Node Colors

In `GraphExplorer.tsx`, modify the material colors:

```typescript
// By type
if (node.type === 'option') {
  material.color.setHex(0x4a9eff); // Blue
} else if (node.type === 'role') {
  material.color.setHex(0xff6b9d); // Pink
} else if (node.type === 'group') {
  material.color.setHex(0x26a65b); // Green
}
```

### Customize Layout Algorithm

Change layout by modifying `calculateLayout()`:

```typescript
// Current: Hierarchical (TB = Top-to-Bottom)
g.setGraph({ rankdir: 'TB' });

// Options:
// 'TB' - Top to Bottom
// 'LR' - Left to Right
// 'RL' - Right to Left
// 'BT' - Bottom to Top
```

### Adjust Node/Edge Sizes

```typescript
// Node size (BoxGeometry dimensions)
const geometry = new THREE.BoxGeometry(20, 20, 20);

// Edge thickness
const material = new THREE.LineBasicMaterial({ 
  color: 0x666666, 
  linewidth: 1 // Some platforms don't support > 1
});
```

## Performance Tips

1. **Limit Connections Per Node**
   - Keep average connections < 10
   - Prevents visual clutter
   - Improves search performance

2. **Use Level-of-Detail**
   - Current: Always show labels
   - Improvement: Hide labels when `zoom < 0.5`

3. **Batch Updates**
   - Update node visibility in batches
   - Use `updateVisibility()` once after multiple changes

4. **Web Worker Layout** (Future Enhancement)
   - Move layout calculation to Web Worker
   - Prevents frame drops during layout

## Known Limitations

1. **Labels**: Currently not rendered
   - Use node hover tooltip in future version
   - Would require Canvas/Text rendering

2. **Right-Click Context Menu**: Not implemented
   - Future: Add context menu for expand/hide/branch

3. **Pan Controls**: Not yet implemented
   - Future: Mouse drag to pan

4. **View Export**: Not implemented
   - Future: Export current view as PNG

## Future Enhancements

- [ ] Implement Web Worker for layout calculations
- [ ] Add node labels (2D text overlay)
- [ ] Add right-click context menu
- [ ] Pan controls (click-drag)
- [ ] View save/load functionality
- [ ] Export as PNG
- [ ] Double-click to expand
- [ ] Breadcrumb navigation
- [ ] Animation when switching modes
- [ ] Custom edge weights
- [ ] Force-directed layout option
- [ ] Node clustering/communities
- [ ] Search history
- [ ] Multiple selection

## Troubleshooting

### Component not appearing
- Check that Three.js is installed: `npm list three`
- Verify container has valid height
- Open browser console for WebGL errors

### Nodes all in one place
- Ensure `GRAPH_CONNECTIONS` has connections
- Layout needs edges to work properly

### Poor performance with many nodes
- Reduce node count by filtering in `loadGraphData()`
- Increase zoom threshold for label hiding
- Profile with DevTools Performance tab

### Search not working
- Check node IDs match connection IDs
- Verify `handleSearch()` is being called
- Check browser console for errors

## Architecture

```
GraphExplorer.tsx
├── Scene Setup (Three.js)
├── Data Loading (OPTIONS, ROLES, GROUPS, CONNECTIONS)
├── Layout Calculation (dagre)
├── Rendering (InstancedMesh + LineSegments)
├── Interaction (zoom, pan, search, expand)
└── Render Loop (60 FPS)

lib/graphConnections.ts
└── Manual edge definitions
```

## Example: Complete Integration

```tsx
// app/graph/page.tsx
import GraphExplorer from '@/components/GraphExplorer';

export default function GraphPage() {
  return (
    <div className="w-full h-screen bg-gray-950">
      <GraphExplorer />
    </div>
  );
}
```

## Debug Mode

To enable debug logging, add at the top of `GraphExplorer.tsx`:

```typescript
const DEBUG = true;

const log = (msg: string, data?: any) => {
  if (DEBUG) console.log(`[GraphExplorer] ${msg}`, data);
};
```

Then use `log('message', data)` throughout the component.

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Dagre Layout Engine](https://dagrejs.github.io/)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - Alternative approach
- [WebGL Performance Tips](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

## License

Same as your corruchart project.
