"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import * as d3 from "d3";
import Sigma from "sigma";
import Graph from "graphology";
import { Search, X } from "lucide-react";
import { OPTIONS } from "@/data/options";
import { GROUPS } from "@/data/groups";
import { belongsToBroad } from "@/data/broadNarrowMapping";

// ===== CUSTOMIZE GRAPH COLORS =====
const GRAPH_STYLES = {
  // Graph background
  backgroundColor: "#1a1a1a",  // Dark background
  
  // Node label text colors
  labelColor: "#ffffff",        // Default white text for all labels
  
  // Edge colors
  broadNarrowEdgeColor: "#4b5563",
  narrowOptionEdgeColor: "#6b7280",
  
  // Hover highlight color
  highlightColor: "#60a5fa",
};
// =================================

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodeStats, setNodeStats] = useState({ broad: 0, narrow: 0, option: 0 });

  const broadGroups = useMemo(
    () => GROUPS.filter((g) => g.scope === "broad"),
    []
  );
  const narrowGroups = useMemo(
    () => GROUPS.filter((g) => g.scope === "narrow"),
    []
  );

  const buildGraph = useCallback(() => {
    const g = new Graph();
    let broadCount = 0, narrowCount = 0, optionCount = 0;

    const narrowToOptions: Record<string, string[]> = {};
    const narrowTagCount: Record<string, number> = {};

    narrowGroups.forEach((narrow) => {
      narrowToOptions[narrow.id] = [];
      narrowTagCount[narrow.id] = 0;
    });

    OPTIONS.forEach((option) => {
      option.tags?.forEach((tag) => {
        if (narrowToOptions.hasOwnProperty(tag)) {
          narrowToOptions[tag].push(option.id);
          narrowTagCount[tag]++;
        }
      });
    });

    broadGroups.forEach((group) => {
      g.addNode(`broad-${group.id}`, {
        label: group.name,
        nodeType: "broad",
        size: 20,
        color: "#6366f1",
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
      });
      broadCount++;
    });

    const validNarrowTags = narrowGroups.filter((n) => narrowTagCount[n.id] > 0);
    const unmappedNarrowTags: string[] = [];
    
    validNarrowTags.forEach((narrow) => {
      g.addNode(`narrow-${narrow.id}`, {
        label: narrow.name,
        nodeType: "narrow",
        size: Math.max(8, Math.min(16, 8 + narrowTagCount[narrow.id] / 15)),
        color: "#ec4899",
        connectionCount: narrowTagCount[narrow.id],
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
      });
      narrowCount++;
    });

    validNarrowTags.forEach((narrow) => {
      let hasConnections = false;
      
      broadGroups.forEach((broad) => {
        if (belongsToBroad(narrow.id, broad.id)) {
          g.addEdge(`broad-${broad.id}`, `narrow-${narrow.id}`, { 
            edgeType: "broad-narrow" 
          });
          hasConnections = true;
        }
      });
      
      if (!hasConnections) {
        unmappedNarrowTags.push(narrow.id);
      }
    });

    if (unmappedNarrowTags.length > 0) {
      console.warn("Unmapped narrow tags (add these to BROAD_NARROW_MAPPING):", unmappedNarrowTags);
    }

    const addedOptions = new Set<string>();
    
    validNarrowTags.forEach((narrow) => {
      const options = narrowToOptions[narrow.id] || [];
      options.forEach((optionId) => {
        if (!addedOptions.has(optionId)) {
          g.addNode(`option-${optionId}`, {
            label: OPTIONS.find((o) => o.id === optionId)?.label || optionId,
            nodeType: "option",
            size: 6,
            color: "#f59e0b",
            parentNarrow: `narrow-${narrow.id}`,
            x: Math.random() * 800 - 400,
            y: Math.random() * 600 - 300,
          });
          addedOptions.add(optionId);
          optionCount++;
        }
      });
    });

    validNarrowTags.forEach((narrow) => {
      const options = narrowToOptions[narrow.id] || [];
      options.forEach((optionId) => {
        if (!g.hasEdge(`narrow-${narrow.id}`, `option-${optionId}`)) {
          g.addEdge(`narrow-${narrow.id}`, `option-${optionId}`, { 
            edgeType: "narrow-option" 
          });
        }
      });
    });

    graphRef.current = g;
    setNodeStats({ broad: broadCount, narrow: narrowCount, option: optionCount });
    
    return g;
  }, [broadGroups, narrowGroups]);

  const runForceSimulation = useCallback((graph: Graph, sigma: Sigma) => {
    const nodes: any[] = [];
    const nodeMap = new Map();
    
    graph.forEachNode((node, attrs) => {
      nodes.push({
        id: node,
        ...attrs,
      });
      nodeMap.set(node, nodes[nodes.length - 1]);
    });

    const links: any[] = [];
    graph.forEachEdge((edge, attrs, source, target) => {
      const edgeType = graph.getEdgeAttribute(edge, "edgeType");
      links.push({
        source: nodeMap.get(source),
        target: nodeMap.get(target),
        ...attrs,
        edgeType: edgeType,
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          switch(d.edgeType) {
            case "broad-narrow":
              return 500;
            case "narrow-option":
              return 300;
            default:
              return 400;
          }
        })
        .strength((d: any) => {
          switch(d.edgeType) {
            case "broad-narrow":
              return 0.15;
            case "narrow-option":
              return 0.3;
            default:
              return 0.2;
          }
        })
      )
      .force("charge", d3.forceManyBody()
        .strength((d: any) => {
          switch(d.nodeType) {
            case "broad":
              return -1500;
            case "narrow":
              return -1000;
            case "option":
              return -300;
            default:
              return -500;
          }
        })
        .distanceMin(50)
        .distanceMax(600)
      )
      .force("center", d3.forceCenter(0, 0).strength(0.03))
      .force("collision", d3.forceCollide()
        .radius((d: any) => {
          switch(d.nodeType) {
            case "broad":
              return d.size * 2.5;
            case "narrow":
              return d.size * 2.0;
            case "option":
              return d.size * 1.8;
            default:
              return d.size * 1.5;
          }
        })
        .strength(0.9)
      )
      .force("radial", d3.forceRadial((d: any) => {
        switch(d.nodeType) {
          case "broad":
            return 200;
          case "narrow":
            return 450;
          case "option":
            return 700;
          default:
            return 350;
        }
      }, 0, 0).strength(0.02))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      nodes.forEach((node) => {
        if (graph.hasNode(node.id)) {
          graph.setNodeAttribute(node.id, "x", node.x);
          graph.setNodeAttribute(node.id, "y", node.y);
        }
      });
      sigma.refresh();
    });

    return simulation;
  }, []);

  const applyVisibility = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;

    const lowercaseQuery = searchQuery.toLowerCase();

    graph.forEachNode((node) => {
      const nodeType = graph.getNodeAttribute(node, "nodeType") as string;
      const label = (graph.getNodeAttribute(node, "label") as string)?.toLowerCase() || "";
      
      let matchesSearch = true;
      if (lowercaseQuery) {
        matchesSearch = label.includes(lowercaseQuery);
        if (!matchesSearch && nodeType === "option") {
          const parentNarrow = graph.getNodeAttribute(node, "parentNarrow") as string;
          if (parentNarrow) {
            const parentLabel = (graph.getNodeAttribute(parentNarrow, "label") as string)?.toLowerCase() || "";
            matchesSearch = parentLabel.includes(lowercaseQuery);
          }
        }
      }

      let isVisible = matchesSearch;
      
      if (nodeType === "narrow") {
        isVisible = matchesSearch;
      } else if (nodeType === "option") {
        const parentNarrow = graph.getNodeAttribute(node, "parentNarrow") as string;
        const isParentExpanded = parentNarrow ? expandedNodes.has(parentNarrow) : false;
        isVisible = matchesSearch && (isParentExpanded || lowercaseQuery);
      } else if (nodeType === "broad") {
        isVisible = matchesSearch;
      }
      
      graph.setNodeAttribute(node, "hidden", !isVisible);
    });

    graph.forEachEdge((edge) => {
      const source = graph.source(edge);
      const target = graph.target(edge);
      const sourceHidden = graph.getNodeAttribute(source, "hidden") as boolean;
      const targetHidden = graph.getNodeAttribute(target, "hidden") as boolean;
      graph.setEdgeAttribute(edge, "hidden", sourceHidden || targetHidden);
    });

    sigma.refresh();
    
    if (simulationRef.current) {
      const currentAlpha = simulationRef.current.alpha();
      if (currentAlpha < 0.05) {
        simulationRef.current.alpha(0.1).restart();
      }
    }
  }, [searchQuery, expandedNodes]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Function to update node appearances based on hover state
  const updateNodeAppearances = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;

    const hoveredNode = hoveredNodeRef.current;
    
    sigma.setSetting("nodeReducer", (node: string, data: any) => {
      const hidden = graph.getNodeAttribute(node, "hidden") as boolean;
      const nodeType = graph.getNodeAttribute(node, "nodeType") as string;
      const isExpanded = nodeType === "narrow" ? expandedNodes.has(node) : false;
      
      // If no node is hovered, return default styling
      if (!hoveredNode) {
        let extraStyles = {};
        if (nodeType === "narrow") {
          extraStyles = {
            borderColor: isExpanded ? "#22c55e" : "#ec4899",
            borderSize: isExpanded ? 2 : 0,
          };
        }
        return {
          ...data,
          hidden: hidden || false,
          label: hidden ? "" : data.label,
          labelColor: GRAPH_STYLES.labelColor,
          ...extraStyles,
        };
      }
      
      // Check if this is the hovered node
      if (node === hoveredNode) {
        let extraStyles = {};
        if (nodeType === "narrow") {
          extraStyles = {
            borderColor: isExpanded ? "#22c55e" : GRAPH_STYLES.highlightColor,
            borderSize: 2,
          };
        }
        return {
          ...data,
          hidden: false,
          label: data.label,
          color: GRAPH_STYLES.highlightColor,
          size: (data.size || 5) * 1.5,
          labelColor: "#000000", // Black text for contrast on blue
          zIndex: 2,
          ...extraStyles,
        };
      }
      
      // Check if this node is connected to the hovered node
      const neighbors = graph.neighbors(hoveredNode);
      if (neighbors.includes(node)) {
        let extraStyles = {};
        if (nodeType === "narrow") {
          extraStyles = {
            borderColor: isExpanded ? "#22c55e" : GRAPH_STYLES.highlightColor,
            borderSize: 1,
          };
        }
        return {
          ...data,
          hidden: hidden || false,
          label: hidden ? "" : data.label,
          color: GRAPH_STYLES.highlightColor,
          size: (data.size || 5) * 1.2,
          labelColor: GRAPH_STYLES.labelColor,
          zIndex: 1,
          ...extraStyles,
        };
      }
      
      // Dimmed nodes
      let extraStyles = {};
      if (nodeType === "narrow") {
        extraStyles = {
          borderColor: isExpanded ? "#22c55e" : "#ec4899",
          borderSize: isExpanded ? 2 : 0,
        };
      }
      return {
        ...data,
        hidden: hidden || false,
        label: hidden ? "" : data.label,
        color: "#4b5563",
        size: (data.size || 5) * 0.7,
        labelColor: GRAPH_STYLES.labelColor,
        ...extraStyles,
      };
    });
    
    sigma.refresh();
  }, [expandedNodes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set the graph container background color
    container.style.backgroundColor = GRAPH_STYLES.backgroundColor;

    const graph = buildGraph();

    const sigma = new Sigma(graph, container, {
      renderLabels: true,
      labelDensity: 0.1,
      labelFont: "Arial",
      defaultNodeColor: "#6366f1",
      defaultEdgeColor: "#d1d5db",
      enableEdgeClickEvents: true,
      enableEdgeHoverEvents: true,
      labelColor: {
        color: GRAPH_STYLES.labelColor
      },
      edgeReducer: (edge, data) => {
        const type = graph.getEdgeAttribute(edge, "edgeType") as string;
        const hidden = graph.getEdgeAttribute(edge, "hidden") as boolean;
        return {
          ...data,
          color: type === "broad-narrow" ? GRAPH_STYLES.broadNarrowEdgeColor : GRAPH_STYLES.narrowOptionEdgeColor,
          size: type === "broad-narrow" ? 2 : 1,
          hidden: hidden || false,
        };
      },
    });

    // Initialize node reducer
    updateNodeAppearances();

    sigmaRef.current = sigma;

    runForceSimulation(graph, sigma);

    sigma.on("clickNode", ({ node }) => {
      const nodeType = graph.getNodeAttribute(node, "nodeType") as string;
      if (nodeType === "narrow") {
        toggleNode(node);
      }
    });

    sigma.on("enterNode", ({ node }) => {
      hoveredNodeRef.current = node;
      updateNodeAppearances();
    });

    sigma.on("leaveNode", () => {
      hoveredNodeRef.current = null;
      updateNodeAppearances();
    });

    setTimeout(() => applyVisibility(), 100);

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
      sigma.kill();
    };
  }, [buildGraph, runForceSimulation, toggleNode, updateNodeAppearances, applyVisibility]);

  // Update when expanded nodes change
  useEffect(() => {
    if (sigmaRef.current && graphRef.current) {
      updateNodeAppearances();
    }
  }, [expandedNodes, updateNodeAppearances]);

  useEffect(() => {
    if (sigmaRef.current && graphRef.current) {
      applyVisibility();
    }
  }, [searchQuery, expandedNodes, applyVisibility]);

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const resetFilters = () => { 
    setSearchQuery(""); 
    setExpandedNodes(new Set()); 
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white">
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Tag Hierarchy Graph</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Force-directed layout • Click narrow nodes (pink) to expand/collapse their options
          </p>
        </div>
        <Link href="/results">
          <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors">
            ← Back to Results
          </button>
        </Link>
      </div>

      <div className="bg-neutral-900 border-b border-neutral-800 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tags, options..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-neutral-600"
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {(searchQuery || expandedNodes.size > 0) && (
            <button onClick={resetFilters} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors">
              Reset All
            </button>
          )}
        </div>

        <div className="text-xs text-neutral-400">
          <p>
            <strong>💡 How to use:</strong> Click on pink narrow nodes to expand/collapse their connected options • 
            Expanded nodes have a green border • Drag nodes to reposition • Hover to highlight connections
          </p>
        </div>
        
        {expandedNodes.size > 0 && (
          <div className="text-xs text-green-400">
            📂 {expandedNodes.size} narrow tag(s) expanded
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <div className="flex gap-8 text-sm justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-indigo-500"></div><span>Broad Tags ({nodeStats.broad})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span>Narrow Tags ({nodeStats.narrow})</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span>Options ({nodeStats.option})</span></div>
          </div>
          <div className="text-neutral-400 text-xs flex gap-4">
            <span>Total nodes: {nodeStats.broad + nodeStats.narrow + nodeStats.option}</span>
            <span className="text-green-400">💚 Green border = expanded</span>
          </div>
        </div>
      </div>
    </div>
  );
}