"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import * as d3 from "d3";
import Sigma from "sigma";
import Graph from "graphology";
import { Search, X } from "lucide-react";
import { OPTIONS } from "@/data/options";
import { GROUPS } from "@/data/groups";

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

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

  // Build graph (without positions - forces will determine positions)
  // Build graph (with temporary random positions - forces will determine final positions)
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

  // Add broad nodes with random positions
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

  // Add narrow nodes
  const validNarrowTags = narrowGroups.filter((n) => narrowTagCount[n.id] > 0);
  
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

  // Add option nodes
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

  // Add edges
  broadGroups.forEach((broad) => {
    validNarrowTags.forEach((narrow) => {
      g.addEdge(`broad-${broad.id}`, `narrow-${narrow.id}`, { edgeType: "broad-narrow" });
    });
  });

  validNarrowTags.forEach((narrow) => {
    const options = narrowToOptions[narrow.id] || [];
    options.forEach((optionId) => {
      if (!g.hasEdge(`narrow-${narrow.id}`, `option-${optionId}`)) {
        g.addEdge(`narrow-${narrow.id}`, `option-${optionId}`, { edgeType: "narrow-option" });
      }
    });
  });

  graphRef.current = g;
  setNodeStats({ broad: broadCount, narrow: narrowCount, option: optionCount });
  return g;
}, [broadGroups, narrowGroups]);

  // Run force-directed simulation (Obsidian-style)
  const runForceSimulation = useCallback((graph: Graph, sigma: Sigma) => {
    // Extract nodes and links for D3
    const nodes: any[] = [];
    const nodeMap = new Map();
    
    graph.forEachNode((node, attrs) => {
      nodes.push({
        id: node,
        ...attrs,
        x: Math.random() * 500 - 250,  // Random initial positions
        y: Math.random() * 500 - 250,
      });
      nodeMap.set(node, nodes[nodes.length - 1]);
    });

    const links: any[] = [];
    graph.forEachEdge((edge, attrs, source, target) => {
      links.push({
        source: nodeMap.get(source),
        target: nodeMap.get(target),
        ...attrs,
      });
    });

    // Create D3 force simulation (similar to Obsidian's physics)
    const simulation = d3.forceSimulation(nodes)
      // Link force - pulls connected nodes together (Obsidian's "Link Force")
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          // Different distances based on edge type
          if (d.edgeType === "broad-narrow") return 150;
          if (d.edgeType === "narrow-option") return 100;
          return 120;
        })
        .strength(0.3)  // Link force strength
      )
      // Many-body force - repels all nodes (Obsidian's "Repel Force")
      .force("charge", d3.forceManyBody()
        .strength((d: any) => {
          // Larger nodes repel more strongly
          if (d.nodeType === "broad") return -300;
          if (d.nodeType === "narrow") return -200;
          return -100;
        })
        .distanceMin(30)
        .distanceMax(300)
      )
      // Center force - pulls toward center (Obsidian's "Center Force")
      .force("center", d3.forceCenter(0, 0).strength(0.1))
      // Collision force - prevents overlap
      .force("collision", d3.forceCollide()
        .radius((d: any) => d.size * 1.5)
        .strength(0.5)
      )
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    // Update Sigma positions on each tick
    simulation.on("tick", () => {
      nodes.forEach((node) => {
        if (graph.hasNode(node.id)) {
          graph.setNodeAttribute(node.id, "x", node.x);
          graph.setNodeAttribute(node.id, "y", node.y);
        }
      });
      sigma.refresh();
    });

    // Stop simulation after it stabilizes (optional)
    setTimeout(() => {
      if (simulation.alpha() > 0) {
        simulation.alpha(0.1);
      }
    }, 3000);

    return simulation;
  }, []);

  // Initialize Sigma with force-directed layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graph = buildGraph();

    const sigma = new Sigma(graph, container, {
      renderLabels: true,
      labelDensity: 0.1,
      labelFont: "Arial",
      defaultNodeColor: "#6366f1",
      defaultEdgeColor: "#d1d5db",
      enableEdgeClickEvents: true,
      enableEdgeHoverEvents: true,
      edgeReducer: (edge, data) => {
        const type = graph.getEdgeAttribute(edge, "edgeType");
        const hidden = graph.getEdgeAttribute(edge, "hidden");
        return {
          ...data,
          color: type === "broad-narrow" ? "#9ca3af" : "#d1d5db",
          size: type === "broad-narrow" ? 2 : 1,
          hidden: hidden || false,
        };
      },
      nodeReducer: (node, data) => {
        const hidden = graph.getNodeAttribute(node, "hidden");
        return {
          ...data,
          hidden: hidden || false,
          label: hidden ? "" : data.label,
        };
      },
    });

    sigmaRef.current = sigma;

    // Start force simulation
    runForceSimulation(graph, sigma);

    // Handle node clicks for expand/collapse
    sigma.on("clickNode", ({ node }) => {
      const nodeType = graph.getNodeAttribute(node, "nodeType");
      if (nodeType === "narrow") {
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          if (next.has(node)) next.delete(node);
          else next.add(node);
          return next;
        });
      }
    });

    // Hover effects
    sigma.on("enterNode", ({ node }) => {
      sigma.setSetting("nodeReducer", (n: string, data: any) => {
        const hidden = graph.getNodeAttribute(n, "hidden");
        if (n === node) {
          return { ...data, highlighted: true, zIndex: 2, hidden: false, size: (data.size || 5) * 1.5 };
        }
        const neighbors = graph.neighbors(node);
        if (neighbors.includes(n)) {
          return { ...data, highlighted: true, color: "#60a5fa", size: (data.size || 5) * 1.2, zIndex: 1, hidden: hidden || false };
        }
        return { ...data, color: "#4b5563", size: (data.size || 5) * 0.7, hidden: hidden || false };
      });
    });

    sigma.on("leaveNode", () => {
      sigma.setSetting("nodeReducer", undefined);
    });

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
      sigma.kill();
    };
  }, [buildGraph, runForceSimulation]);

  // Apply search filter
  const applySearchFilter = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;

    const lowercaseQuery = searchQuery.toLowerCase();

    graph.forEachNode((node) => {
      const label = graph.getNodeAttribute(node, "label")?.toLowerCase() || "";
      const nodeType = graph.getNodeAttribute(node, "nodeType");
      const isExpanded = nodeType === "narrow" ? expandedNodes.has(node) : true;
      
      let matchesSearch = true;
      if (lowercaseQuery) {
        matchesSearch = label.includes(lowercaseQuery);
        if (!matchesSearch && nodeType === "option") {
          matchesSearch = graph.neighbors(node).some((neighbor: string) => {
            const neighborLabel = graph.getNodeAttribute(neighbor, "label")?.toLowerCase() || "";
            return neighborLabel.includes(lowercaseQuery);
          });
        }
      }
      
      const isVisible = matchesSearch && isExpanded;
      
      if (nodeType === "narrow") {
        graph.setNodeAttribute(node, "hidden", !matchesSearch);
        graph.neighbors(node).forEach((neighbor: string) => {
          if (graph.getNodeAttribute(neighbor, "nodeType") === "option") {
            graph.setNodeAttribute(neighbor, "hidden", !expandedNodes.has(node) || (lowercaseQuery && !matchesSearch));
          }
        });
      } else {
        graph.setNodeAttribute(node, "hidden", !isVisible);
      }
    });

    graph.forEachEdge((edge) => {
      const source = graph.source(edge);
      const target = graph.target(edge);
      graph.setEdgeAttribute(edge, "hidden", 
        (graph.getNodeAttribute(source, "hidden") || false) || 
        (graph.getNodeAttribute(target, "hidden") || false)
      );
    });

    sigma.refresh();
  }, [searchQuery, expandedNodes]);

  useEffect(() => {
    if (sigmaRef.current && graphRef.current) {
      applySearchFilter();
    }
  }, [searchQuery, expandedNodes, applySearchFilter]);

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const resetFilters = () => { setSearchQuery(""); setExpandedNodes(new Set()); };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Tag Hierarchy Graph</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Force-directed layout (Obsidian-style) • Explore tag relationships dynamically
          </p>
        </div>
        <Link href="/results">
          <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors">
            ← Back to Results
          </button>
        </Link>
      </div>

      {/* Controls */}
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
            <strong>Obsidian-style physics:</strong> Nodes arrange themselves based on connections • 
            Click narrow tags to expand/collapse • Drag nodes to reposition • Hover to highlight
          </p>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Footer Stats */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-4">
        <div className="flex gap-8 text-sm justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-indigo-500"></div><span>Broad Tags ({nodeStats.broad})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span>Narrow Tags ({nodeStats.narrow})</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span>Options ({nodeStats.option})</span></div>
          </div>
          <div className="text-neutral-400 text-xs">Total nodes: {nodeStats.broad + nodeStats.narrow + nodeStats.option}</div>
        </div>
      </div>
    </div>
  );
}