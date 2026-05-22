"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Graph from "graphology";
import Sigma from "sigma";
import { Search, X } from "lucide-react";
import { OPTIONS } from "@/data/options";
import { GROUPS } from "@/data/groups";

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

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

  // Build graph with radial hierarchy
  const buildGraph = useCallback(() => {
    const g = new Graph();
    let broadCount = 0,
      narrowCount = 0,
      optionCount = 0;

    // Map narrow tags to their options
    const narrowToOptions: Record<string, string[]> = {};
    const narrowTagCount: Record<string, number> = {};

    narrowGroups.forEach((narrow) => {
      narrowToOptions[narrow.id] = [];
      narrowTagCount[narrow.id] = 0;
    });

    // Populate narrowToOptions and count
    OPTIONS.forEach((option) => {
      option.tags?.forEach((tag) => {
        if (narrowToOptions.hasOwnProperty(tag)) {
          narrowToOptions[tag].push(option.id);
          narrowTagCount[tag]++;
        }
      });
    });

    // Add broad nodes (center layer)
    broadGroups.forEach((group, idx) => {
      // Position broad nodes in a circle around the center
      const angle = (idx / broadGroups.length) * Math.PI * 2;
      const radius = 80;
      g.addNode(`broad-${group.id}`, {
        label: group.name,
        nodeType: "broad",
        size: 20,
        color: "#6366f1",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
      broadCount++;
    });

    // Add narrow nodes (middle layer) - only if they have options
    const validNarrowTags = narrowGroups.filter(
      (n) => narrowTagCount[n.id] > 0
    );

    validNarrowTags.forEach((narrow, idx) => {
      const angle = (idx / validNarrowTags.length) * Math.PI * 2;
      const radius = 200;
      g.addNode(`narrow-${narrow.id}`, {
        label: narrow.name,
        nodeType: "narrow",
        size: Math.max(8, Math.min(16, 8 + narrowTagCount[narrow.id] / 15)),
        color: "#ec4899",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        connectionCount: narrowTagCount[narrow.id],
      });

      // Connect to all broad nodes (or you can implement specific connections)
      // Since there's no relationship data, I'm connecting to the nearest broad node
      // based on angle to make the graph look organized
      const nearestBroadIdx = Math.round((angle / (Math.PI * 2)) * broadGroups.length) % broadGroups.length;
      const nearestBroad = broadGroups[nearestBroadIdx];
      if (nearestBroad) {
        g.addEdge(`broad-${nearestBroad.id}`, `narrow-${narrow.id}`, {
          edgeType: "broad-narrow",
        });
      }
      
      narrowCount++;
    });

    // Add option nodes (outer layer) - collect unique options first
    const addedOptions = new Set<string>();
    
    validNarrowTags.forEach((narrow, narrowIdx) => {
      const narrowAngle = (narrowIdx / validNarrowTags.length) * Math.PI * 2;
      const options = narrowToOptions[narrow.id] || [];

      options.forEach((optionId, optIdx) => {
        // Only add node if it doesn't already exist
        if (!addedOptions.has(optionId)) {
          const offset = (optIdx - (options.length - 1) / 2) * 0.3;
          const optionAngle = narrowAngle + offset;
          const optionRadius = 350;

          g.addNode(`option-${optionId}`, {
            label: OPTIONS.find((o) => o.id === optionId)?.label || optionId,
            nodeType: "option",
            size: 5,
            color: "#f59e0b",
            x: Math.cos(optionAngle) * optionRadius,
            y: Math.sin(optionAngle) * optionRadius,
            parentNarrow: `narrow-${narrow.id}`,
          });

          addedOptions.add(optionId);
          optionCount++;
        }

        // Always add the edge (even if node was already added)
        if (!g.hasEdge(`narrow-${narrow.id}`, `option-${optionId}`)) {
          g.addEdge(`narrow-${narrow.id}`, `option-${optionId}`, {
            edgeType: "narrow-option",
          });
        }
      });
    });

    graphRef.current = g;

    setNodeStats({
      broad: broadCount,
      narrow: narrowCount,
      option: optionCount,
    });

    return g;
  }, [broadGroups, narrowGroups]);

  // Apply search filter
  const applySearchFilter = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;

    if (!sigma || !graph) return;

    const lowercaseQuery = searchQuery.toLowerCase();

    graph.forEachNode((node) => {
      const label = graph.getNodeAttribute(node, "label")?.toLowerCase() || "";
      const nodeType = graph.getNodeAttribute(node, "nodeType");
      
      // Check if node is a narrow node that should be collapsed
      const isExpanded = nodeType === "narrow" ? expandedNodes.has(node) : true;
      
      // Check search query
      let matchesSearch = true;
      if (lowercaseQuery) {
        matchesSearch = label.includes(lowercaseQuery);
        
        // For options, also check if any connected narrow tag matches
        if (!matchesSearch && nodeType === "option") {
          matchesSearch = graph.neighbors(node).some((neighbor: string) => {
            const neighborLabel = graph
              .getNodeAttribute(neighbor, "label")
              ?.toLowerCase() || "";
            return neighborLabel.includes(lowercaseQuery);
          });
        }
        
        // For narrow nodes, also check if any connected option matches
        if (!matchesSearch && nodeType === "narrow") {
          matchesSearch = graph.neighbors(node).some((neighbor: string) => {
            const neighborLabel = graph
              .getNodeAttribute(neighbor, "label")
              ?.toLowerCase() || "";
            return neighborLabel.includes(lowercaseQuery);
          });
        }
      }
      
      const isVisible = matchesSearch && isExpanded;
      
      // Handle visibility based on expansion and search
      if (nodeType === "narrow") {
        graph.setNodeAttribute(node, "hidden", !matchesSearch);
        
        // Hide or show option children based on expansion state
        graph.neighbors(node).forEach((neighbor: string) => {
          if (graph.getNodeAttribute(neighbor, "nodeType") === "option") {
            const shouldHide = !expandedNodes.has(node) || (lowercaseQuery && !matchesSearch);
            graph.setNodeAttribute(neighbor, "hidden", shouldHide);
          }
        });
      } else {
        graph.setNodeAttribute(node, "hidden", !isVisible);
      }
    });

    // Hide edges connected to hidden nodes
    graph.forEachEdge((edge) => {
      const source = graph.source(edge);
      const target = graph.target(edge);
      const sourceHidden = graph.getNodeAttribute(source, "hidden") || false;
      const targetHidden = graph.getNodeAttribute(target, "hidden") || false;

      graph.setEdgeAttribute(edge, "hidden", sourceHidden || targetHidden);
    });

    sigma.refresh();
  }, [searchQuery, expandedNodes]);

  // Initialize Sigma
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

    // Handle node clicks for expand/collapse
    sigma.on("clickNode", ({ node }) => {
      const nodeType = graph.getNodeAttribute(node, "nodeType");

      if (nodeType === "narrow") {
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          if (next.has(node)) {
            next.delete(node);
          } else {
            next.add(node);
          }
          return next;
        });
      }
    });

    // Hover effects
    sigma.on("enterNode", ({ node }) => {
      sigma.setSetting(
        "nodeReducer",
        (n: string, data: any) => {
          const hidden = graph.getNodeAttribute(n, "hidden");
          
          if (n === node) {
            return { ...data, highlighted: true, zIndex: 2, hidden: false, size: (data.size || 5) * 1.5 };
          }

          const neighbors = graph.neighbors(node);
          if (neighbors.includes(n)) {
            return {
              ...data,
              highlighted: true,
              color: "#60a5fa",
              size: (data.size || 5) * 1.2,
              zIndex: 1,
              hidden: hidden || false,
            };
          }

          return { 
            ...data, 
            color: "#4b5563", 
            size: (data.size || 5) * 0.7,
            hidden: hidden || false,
          };
        }
      );
    });

    sigma.on("leaveNode", () => {
      sigma.setSetting("nodeReducer", undefined);
    });

    // Fit graph to view
    setTimeout(() => {
      sigma.refresh();
      sigma.getCamera().animate(
        { x: 0, y: 0, ratio: 0.8 },
        { duration: 500 }
      );
    }, 100);

    return () => {
      sigma.kill();
    };
  }, [buildGraph]);

  // Apply search when it changes
  useEffect(() => {
    if (sigmaRef.current && graphRef.current) {
      applySearchFilter();
    }
  }, [searchQuery, expandedNodes, applySearchFilter]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setExpandedNodes(new Set());
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Tag Hierarchy Graph</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Explore relationships: Broad Tags → Narrow Tags → Options
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
        {/* Search Row */}
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
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {(searchQuery || expandedNodes.size > 0) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Info Text */}
        <div className="text-xs text-neutral-400">
          <p>
            <strong>Interact:</strong> Click narrow tags to expand/collapse
            options • Hover to highlight connections • Larger nodes = more
            connections • Drag to pan • Scroll to zoom
          </p>
          <p className="mt-1">
            <strong>Search:</strong> Type to filter nodes by name • Matching
            nodes and their connections will remain visible
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
              <span>Broad Tags ({nodeStats.broad})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>Narrow Tags ({nodeStats.narrow})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Options ({nodeStats.option})</span>
            </div>
          </div>
          <div className="text-neutral-400 text-xs">
            Total nodes: {nodeStats.broad + nodeStats.narrow + nodeStats.option}
          </div>
        </div>
      </div>
    </div>
  );
}