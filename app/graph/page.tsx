"use client";

import { useState, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { GraphNode, GraphEdge } from "reagraph";
import { OPTIONS } from "@/data/options";
import { GROUPS } from "@/data/groups";
import { NARROW_TAGS } from "@/data/narrowTags";
import dynamic from "next/dynamic";

const GraphCanvas = dynamic(
  () => import("reagraph").then(mod => mod.GraphCanvas),
  { ssr: false }
);

// Type definitions for nodes
type NodeType = "broad" | "narrow" | "option";

interface CustomNode extends GraphNode {
  type?: NodeType;
  connectionCount?: number;
}

const PAGE_BACKGROUND_COLOR = "#1F2023";

export default function GraphPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Build graph data structure
  const graphData = useMemo(() => {
    const nodes: CustomNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, CustomNode>();
    const connectionCount = new Map<string, number>();

    // Step 1: Create broad tag nodes
    const broadGroups = GROUPS.filter(g => g.scope === "broad");
    broadGroups.forEach(group => {
      const nodeId = `broad-${group.id}`;
      const node: CustomNode = {
        id: nodeId,
        label: group.name,
        type: "broad",
        connectionCount: 0,
        size: 50,
        fill: "#3b82f6", // blue
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);
      connectionCount.set(nodeId, 0);
    });

    // Step 2: Create narrow tag nodes and connect to broad tags
    const narrowTagSet = new Set<string>();
    const narrowToBroad = new Map<string, string>();

    OPTIONS.forEach(option => {
      if (!option.tags) return;
      option.tags.forEach(tag => {
        if (NARROW_TAGS.includes(tag as any)) {
          if (!narrowTagSet.has(tag)) {
            narrowTagSet.add(tag);
            
            // Find the broad tag this narrow tag is associated with
            const broadTag = option.tags.find(t => 
              GROUPS.some(g => g.scope === "broad" && g.id === t)
            );
            
            if (broadTag && !narrowToBroad.has(tag)) {
              narrowToBroad.set(tag, broadTag);
            }
          }
        }
      });
    });

    narrowTagSet.forEach(narrowTag => {
      const narrowNodeId = `narrow-${narrowTag}`;
      const node: CustomNode = {
        id: narrowNodeId,
        label: narrowTag,
        type: "narrow",
        connectionCount: 0,
        size: 35,
        fill: "#8b5cf6", // purple
      };
      nodes.push(node);
      nodeMap.set(narrowNodeId, node);
      connectionCount.set(narrowNodeId, 0);

      // Create edge from broad to narrow
      const relatedBroad = narrowToBroad.get(narrowTag);
      if (relatedBroad) {
        const broadNodeId = `broad-${relatedBroad}`;
        if (nodeMap.has(broadNodeId)) {
          edges.push({
            id: `${broadNodeId}-${narrowNodeId}`,
            source: broadNodeId,
            target: narrowNodeId,
          });
          connectionCount.set(broadNodeId, (connectionCount.get(broadNodeId) || 0) + 1);
          connectionCount.set(narrowNodeId, (connectionCount.get(narrowNodeId) || 0) + 1);
        }
      }
    });

    // Step 3: Create option nodes and connect to narrow tags
    OPTIONS.forEach(option => {
      const optionNodeId = `option-${option.id}`;
      const node: CustomNode = {
        id: optionNodeId,
        label: option.label,
        type: "option",
        connectionCount: 0,
        size: 20,
        fill: "#06b6d4", // cyan
      };
      nodes.push(node);
      nodeMap.set(optionNodeId, node);
      connectionCount.set(optionNodeId, 0);

      // Connect options to their narrow tags
      if (option.tags) {
        option.tags.forEach(tag => {
          if (NARROW_TAGS.includes(tag as any)) {
            const narrowNodeId = `narrow-${tag}`;
            if (nodeMap.has(narrowNodeId)) {
              edges.push({
                id: `${narrowNodeId}-${optionNodeId}`,
                source: narrowNodeId,
                target: optionNodeId,
              });
              connectionCount.set(narrowNodeId, (connectionCount.get(narrowNodeId) || 0) + 1);
              connectionCount.set(optionNodeId, (connectionCount.get(optionNodeId) || 0) + 1);
            }
          }
        });
      }
    });

    // Update node sizes and connection count based on actual counts
    nodes.forEach(node => {
      const count = connectionCount.get(node.id) || 0;
      node.connectionCount = count;
      
      const baseSize = node.type === "broad" ? 50 : node.type === "narrow" ? 35 : 20;
      const sizeIncrease = Math.min(count * 2, baseSize);
      node.size = baseSize + sizeIncrease;
    });

    return { nodes, edges };
  }, []);

  // Filter nodes and edges based on search and selected filter
  const filteredData = useMemo(() => {
    let filteredNodes = graphData.nodes;
    let filteredEdges = graphData.edges;

    const searchLower = searchQuery.toLowerCase();
    
    if (searchLower) {
      filteredNodes = graphData.nodes.filter(node => {
        const label = node.label?.toLowerCase() || "";
        return label.includes(searchLower);
      });

      const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = graphData.edges.filter(
        edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );
    }

    if (selectedFilter) {
      filteredNodes = filteredNodes.filter(node => node.type === selectedFilter);

      const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(
        edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );
    }

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, searchQuery, selectedFilter]);

  const handleNodeClick = useCallback((node: CustomNode) => {
    setSelectedNode(node.id);
  }, []);

  const resetView = useCallback(() => {
    setSearchQuery("");
    setSelectedFilter(null);
    setSelectedNode(null);
  }, []);

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ backgroundColor: PAGE_BACKGROUND_COLOR }}
    >
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/results" className="px-3 py-2 rounded bg-neutral-800 text-white text-sm hover:bg-neutral-700 transition-colors">
            ← Back to Results
          </Link>
          <h1 className="text-2xl font-bold text-white">Tag & Option Graph</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-neutral-800 border-b border-neutral-700 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search tags and options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-neutral-700 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={resetView}
            className="px-3 py-2 rounded bg-neutral-700 text-white text-sm hover:bg-neutral-600 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter(null)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedFilter === null
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedFilter("broad")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedFilter === "broad"
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            Broad Tags
          </button>
          <button
            onClick={() => setSelectedFilter("narrow")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedFilter === "narrow"
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            Narrow Tags
          </button>
          <button
            onClick={() => setSelectedFilter("option")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedFilter === "option"
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            Options
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Nodes: {filteredData.nodes.length}</span>
          <span>•</span>
          <span>Edges: {filteredData.edges.length}</span>
          <span className="ml-auto">
            <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#3b82f6" }}></span>
            Broad •
            <span className="inline-block w-3 h-3 rounded-full mr-1 ml-2" style={{ backgroundColor: "#8b5cf6" }}></span>
            Narrow •
            <span className="inline-block w-3 h-3 rounded-full mr-1 ml-2" style={{ backgroundColor: "#06b6d4" }}></span>
            Options
          </span>
        </div>
      </div>

      {/* Graph Container */}
            <div
            className="flex-1 relative"
            style={{ backgroundColor: "#1F2023" }}
            >
            {filteredData.nodes.length > 0 ? (
                <Suspense
                fallback={
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Loading graph...
                    </div>
                }
                >
                <GraphCanvas
                    nodes={filteredData.nodes}
                    edges={filteredData.edges}

                    layoutType="forceDirected2d"

                    labelType="none"

                    animated={false}
                    onNodeClick={handleNodeClick}
                />
                </Suspense>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                No nodes match your filters
                </div>
            )}
            </div>

      {/* Info Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-neutral-800 border border-neutral-700 rounded p-4 max-w-xs shadow-lg z-10">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">
                {filteredData.nodes.find(n => n.id === selectedNode)?.label || "Unknown"}
              </h3>
              <p className="text-neutral-400 text-xs mt-2">
                <span className="font-semibold">Type:</span> {filteredData.nodes.find(n => n.id === selectedNode)?.type}
              </p>
              <p className="text-neutral-400 text-xs mt-1">
                <span className="font-semibold">Connections:</span> {filteredData.nodes.find(n => n.id === selectedNode)?.connectionCount || 0}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-neutral-400 hover:text-white flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    <style jsx global>{`
    canvas {
        background: #1F2023 !important;
    }
    `}</style>
    </div>
  );
}
