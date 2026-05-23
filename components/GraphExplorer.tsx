'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import dagre from 'dagre';
import { OPTIONS } from '@/data/options';
import { ROLES } from '@/data/roles';
import { GROUPS } from '@/data/groups';
import { GRAPH_CONNECTIONS } from '@/lib/graphConnections';

interface GraphNode {
  id: string;
  label: string;
  type: 'option' | 'role' | 'group';
  x: number;
  y: number;
  visible: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
}

const GraphExplorer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  
  const nodesRef = useRef<Map<string, GraphNode>>(new Map());
  const edgesRef = useRef<GraphEdge[]>([]);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const labelsRef = useRef<Map<string, CSS2DObject>>(new Map());
  const edgeLinesRef = useRef<THREE.LineSegments | null>(null);
  
  const expandedNodesRef = useRef<Set<string>>(new Set());
  
  // Camera state
  const cameraTargetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [nodeCount, setNodeCount] = useState(0);

  const getNodeColor = (type: string) => {
    switch(type) {
      case 'option': return '#4a9eff';
      case 'role': return '#ff6b4a';
      case 'group': return '#4aff9e';
      default: return '#4a9eff';
    }
  };

  const getTextColor = (type: string) => {
    switch(type) {
      case 'group': return '#1a1a1a';
      default: return '#ffffff';
    }
  };

  const updateCamera = useCallback(() => {
    if (!cameraRef.current || !containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const zoom = zoomRef.current;
    
    cameraRef.current.left = -width / zoom / 2;
    cameraRef.current.right = width / zoom / 2;
    cameraRef.current.top = height / zoom / 2;
    cameraRef.current.bottom = -height / zoom / 2;
    cameraRef.current.position.x = cameraTargetRef.current.x;
    cameraRef.current.position.y = cameraTargetRef.current.y;
    
    cameraRef.current.updateProjectionMatrix();
    
    if (labelRendererRef.current) {
      labelRendererRef.current.setSize(width, height);
    }
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    rendererRef.current.setSize(width, height);
    if (labelRendererRef.current) labelRendererRef.current.setSize(width, height);
    updateCamera();
  }, [updateCamera]);

  const fitToView = useCallback(() => {
    let visibleNodes = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    nodesRef.current.forEach((node) => {
      if (node.visible) {
        visibleNodes++;
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
    });

    if (visibleNodes === 0) return;

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 100;

    if (containerRef.current && width > 0 && height > 0) {
      const zoomX = containerRef.current.clientWidth / (width + padding);
      const zoomY = containerRef.current.clientHeight / (height + padding);
      zoomRef.current = Math.max(0.1, Math.min(5, Math.min(zoomX, zoomY)));
      cameraTargetRef.current = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      updateCamera();
    }
  }, [updateCamera]);

  const findRootNodes = useCallback((): string[] => {
    const hasIncoming = new Set<string>();
    edgesRef.current.forEach(edge => hasIncoming.add(edge.target));
    
    const roots: string[] = [];
    nodesRef.current.forEach((_, id) => {
      if (!hasIncoming.has(id)) roots.push(id);
    });
    return roots;
  }, []);

  const updateVisibility = useCallback(() => {
    // Calculate visible nodes
    const roots = findRootNodes();
    const visibleNodes = new Set<string>();
    roots.forEach(root => visibleNodes.add(root));
    
    expandedNodesRef.current.forEach(nodeId => {
      // Add immediate children
      edgesRef.current.forEach(edge => {
        if (edge.source === nodeId) {
          visibleNodes.add(edge.target);
        }
      });
    });
    
    // Update all nodes visibility
    nodesRef.current.forEach((node, id) => {
      const shouldBeVisible = visibleNodes.has(id);
      node.visible = shouldBeVisible;
      
      // Update mesh
      const mesh = meshesRef.current.get(id);
      if (mesh) mesh.visible = shouldBeVisible;
      
      // Update label
      const label = labelsRef.current.get(id);
      if (label) label.visible = shouldBeVisible;
    });
    
    // Update edges
    const edgePositions: number[] = [];
    visibleNodes.forEach(nodeId => {
      edgesRef.current.forEach(edge => {
        if (edge.source === nodeId && visibleNodes.has(edge.target)) {
          const sourceNode = nodesRef.current.get(edge.source);
          const targetNode = nodesRef.current.get(edge.target);
          if (sourceNode && targetNode) {
            edgePositions.push(sourceNode.x, sourceNode.y, 0);
            edgePositions.push(targetNode.x, targetNode.y, 0);
          }
        }
      });
    });
    
    if (edgeLinesRef.current) {
      const geometry = edgeLinesRef.current.geometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePositions), 3));
      geometry.setDrawRange(0, edgePositions.length / 3);
    }
  }, [findRootNodes]);

  const expandNode = useCallback((nodeId: string) => {
    if (expandedNodesRef.current.has(nodeId)) {
      expandedNodesRef.current.delete(nodeId);
    } else {
      expandedNodesRef.current.add(nodeId);
    }
    updateVisibility();
    setTimeout(() => fitToView(), 50);
  }, [updateVisibility, fitToView]);

  const resetToRoots = useCallback(() => {
    expandedNodesRef.current.clear();
    updateVisibility();
    setTimeout(() => fitToView(), 50);
  }, [updateVisibility, fitToView]);

  const showAllNodes = useCallback(() => {
    nodesRef.current.forEach((_, id) => {
      expandedNodesRef.current.add(id);
    });
    updateVisibility();
    setTimeout(() => fitToView(), 50);
  }, [updateVisibility, fitToView]);

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    // Clear refs
    meshesRef.current.clear();
    labelsRef.current.clear();
    nodesRef.current.clear();
    edgesRef.current = [];
    expandedNodesRef.current.clear();
    
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;
    
    // Setup camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000);
    camera.position.z = 100;
    cameraRef.current = camera;
    
    // Setup renderers
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    labelRenderer.domElement.style.pointerEvents = 'auto';
    containerRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;
    
    // Load nodes
    OPTIONS.forEach(opt => {
      nodesRef.current.set(opt.id, {
        id: opt.id,
        label: opt.label,
        type: 'option',
        x: 0, y: 0,
        visible: false
      });
    });
    
    ROLES.forEach(role => {
      nodesRef.current.set(role.id, {
        id: role.id,
        label: role.label,
        type: 'role',
        x: 0, y: 0,
        visible: false
      });
    });
    
    GROUPS.forEach(group => {
      nodesRef.current.set(group.id, {
        id: group.id,
        label: group.name,
        type: 'group',
        x: 0, y: 0,
        visible: false
      });
    });
    
    // Load edges
    edgesRef.current = GRAPH_CONNECTIONS
      .filter(conn => nodesRef.current.has(conn.source) && nodesRef.current.has(conn.target))
      .map(conn => ({ source: conn.source, target: conn.target }));
    
    setNodeCount(nodesRef.current.size);
    
    // Layout with dagre
    const g = new dagre.graphlib.Graph({ directed: true });
    g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));
    
    nodesRef.current.forEach((node, id) => {
      g.setNode(id, { width: 150, height: 60 });
    });
    
    edgesRef.current.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(g);
    
    // Position nodes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const positions = new Map<string, { x: number, y: number }>();
    
    g.nodes().forEach(id => {
      const node = g.node(id);
      positions.set(id, { x: node.x, y: node.y });
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });
    
    const scale = 600 / Math.max(maxX - minX, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Create meshes and labels
    nodesRef.current.forEach((node, id) => {
      const pos = positions.get(id);
      if (pos) {
        node.x = (pos.x - centerX) * scale;
        node.y = (pos.y - centerY) * scale;
      }
      
      // Create circle mesh
      const geometry = new THREE.CircleGeometry(14, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: getNodeColor(node.type),
        side: THREE.DoubleSide
      });
      const circle = new THREE.Mesh(geometry, material);
      circle.position.set(node.x, node.y, 0);
      circle.visible = false;
      scene.add(circle);
      meshesRef.current.set(id, circle);
      
      // Create label
      const div = document.createElement('div');
      div.textContent = node.label;
      div.style.backgroundColor = getNodeColor(node.type);
      div.style.color = getTextColor(node.type);
      div.style.padding = '5px 10px';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      div.style.fontWeight = 'bold';
      div.style.fontFamily = 'system-ui, sans-serif';
      div.style.whiteSpace = 'nowrap';
      div.style.border = '1px solid rgba(255,255,255,0.2)';
      div.style.cursor = 'pointer';
      div.style.pointerEvents = 'auto';
      
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        expandNode(id);
      });
      
      const label = new CSS2DObject(div);
      label.position.set(node.x, node.y - 18, 0);
      label.visible = false;
      scene.add(label);
      labelsRef.current.set(id, label);
    });
    
    // Create edges line segments
    const edgeGeometry = new THREE.BufferGeometry();
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    const lineSegments = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    scene.add(lineSegments);
    edgeLinesRef.current = lineSegments;
    
    // Initial visibility
    resetToRoots();
    
    // Animation loop
    let frameId: number;
    const animate = () => {
      if (rendererRef.current && labelRendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current) {
        if (renderer.domElement) containerRef.current.removeChild(renderer.domElement);
        if (labelRenderer.domElement) containerRef.current.removeChild(labelRenderer.domElement);
      }
      renderer.dispose();
    };
  }, [handleResize, resetToRoots, expandNode]);

  // Pan and zoom handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.1, Math.min(5, zoomRef.current * delta));
      updateCamera();
    };
    
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      cameraTargetRef.current.x -= dx / zoomRef.current;
      cameraTargetRef.current.y += dy / zoomRef.current;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    
    const onMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = 'grab';
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.style.cursor = 'grab';
    
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateCamera]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') showAllNodes();
      else if (e.key === 'r' || e.key === 'R') resetToRoots();
      else if (e.key === 'f' || e.key === 'F') fitToView();
      else if (e.key === 'Escape') {
        setSearchQuery('');
        resetToRoots();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAllNodes, resetToRoots, fitToView]);
  
  // Search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      resetToRoots();
      return;
    }
    
    const matchedNode = Array.from(nodesRef.current.values()).find(
      node => node.label.toLowerCase().includes(lowerQuery)
    );
    
    if (matchedNode) {
      resetToRoots();
      // Find and expand path to matched node
      const findPath = (targetId: string, currentId: string, visited: Set<string>): string[] | null => {
        if (currentId === targetId) return [currentId];
        visited.add(currentId);
        
        const children = edgesRef.current.filter(e => e.source === currentId).map(e => e.target);
        for (const child of children) {
          if (!visited.has(child)) {
            const path = findPath(targetId, child, visited);
            if (path) return [currentId, ...path];
          }
        }
        return null;
      };
      
      const roots = findRootNodes();
      for (const root of roots) {
        const path = findPath(matchedNode.id, root, new Set());
        if (path) {
          path.forEach(nodeId => expandedNodesRef.current.add(nodeId));
          updateVisibility();
          setTimeout(() => fitToView(), 100);
          break;
        }
      }
    }
  }, [resetToRoots, findRootNodes, updateVisibility, fitToView]);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-900 text-white p-4 flex gap-4 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
        />
        <button onClick={showAllNodes} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">Show All</button>
        <button onClick={resetToRoots} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition">Reset to Roots</button>
        <button onClick={fitToView} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">Fit View</button>
        <button onClick={() => { zoomRef.current = Math.max(0.1, zoomRef.current * 1.1); updateCamera(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">Zoom In</button>
        <button onClick={() => { zoomRef.current = Math.min(5, zoomRef.current * 0.9); updateCamera(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">Zoom Out</button>
      </div>
      
      <div ref={containerRef} className="flex-1 w-full relative" style={{ minHeight: 'calc(100vh - 120px)', background: '#1a1a1a' }} />
      
      <div className="bg-gray-900 text-gray-400 text-sm p-2 text-center">
        Nodes: {nodeCount} | Scroll: Zoom | Drag: Pan | Click: Expand/Collapse | A=All, R=Roots, F=Fit, ESC=Reset
      </div>
    </div>
  );
};

export default GraphExplorer;