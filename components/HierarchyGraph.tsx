"use client";

import { useEffect, useRef, useState } from "react";

import Graph from "graphology";
import { NODE_MAP, SCALE } from "data/graphData";
import type { NodeData as GraphNodeData } from "data/graphData";

type NodeData = {
  id: string;
  label: string;
  x: number;
  y: number;
  children?: string[];
};


export default function HierarchyGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ROOTS = ["lowerBody", "upperBody"];
  const graphRef = useRef<Graph | null>(null);
  const rendererRef = useRef<any>(null);

  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["lowerBody"])
  );

  // INITIALIZE ONCE
  useEffect(() => {
  if (!containerRef.current) return;

  let renderer: any;

  async function init() {
    const Sigma = (await import("sigma")).default;

    const graph = new Graph();

    ROOTS.forEach((rootId, i) => {
    const node = NODE_MAP[rootId];

    graph.addNode(rootId, {
        label: node.label,
        x: node.x * SCALE,
        y: node.y * SCALE,
        size: 20,
        color: "#ffffff",
    });
    });

    renderer = new Sigma(graph, containerRef.current!, {
      renderLabels: true,

      labelFont: "Inter, sans-serif",
      labelSize: 14,
      labelWeight: "600",

      defaultEdgeColor: "#333",

      minCameraRatio: 0.2,
      maxCameraRatio: 2,

      allowInvalidContainer: true,

      autoRescale: false,
    });


    renderer.on("clickNode", ({ node }: any) => {
      setExpanded((prev) => {
        const next = new Set(prev);

        if (next.has(node)) {
          next.delete(node);
        } else {
          next.add(node);
        }

        return next;
      });
    });


    graphRef.current = graph;
    rendererRef.current = renderer;
  }

        init();
        const centerOnce = () => {
        const graph = graphRef.current;
        const renderer = rendererRef.current;

        if (!graph || !renderer) return;

        const camera = renderer.getCamera();

        renderer.refresh();

        const nodes = graph.nodes();
        if (!nodes.length) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const n of nodes) {
            const x = graph.getNodeAttribute(n, "x");
            const y = graph.getNodeAttribute(n, "y");

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        camera.setState({
            x: centerX,
            y: centerY,
            ratio: 1.4,
        });
        };

        // wait for real Sigma WebGL frame (NOT just React or RAF)
        setTimeout(() => {
        requestAnimationFrame(centerOnce);
        }, 0);
        return () => {
            renderer?.kill();
        };
        }, []);

  // HANDLE EXPANSIONS
  useEffect(() => {
    const graph = graphRef.current;
    const renderer = rendererRef.current;

    if (!graph || !renderer) return;

    function showChildren(parentId: string) {
      const parent = NODE_MAP[parentId];

      if (!parent.children) return;

      const parentX = graph.getNodeAttribute(parentId, "x");
      const parentY = graph.getNodeAttribute(parentId, "y");

      parent.children.forEach((childId) => {
        const child = NODE_MAP[childId];

        // ADD NODE
        if (!graph.hasNode(childId)) {
          graph.addNode(childId, {
            label: child.label,

            // START AT PARENT POSITION
            x: parentX,
            y: parentY,

            size: 0,
            color: "#ffffff",
          });
        }

        // ADD EDGE
        const edgeId = `${parentId}-${childId}`;

        if (!graph.hasEdge(edgeId)) {
          graph.addEdgeWithKey(edgeId, parentId, childId, {
            size: 2,
            color: "#444",
          });
        }

        animateNode(
        childId,
        {
            x: child.x * SCALE,
            y: child.y * SCALE,
            size: 18,
        },
        "in"
        );

        if (expanded.has(childId)) {
          showChildren(childId);
        }
      });
    }

function hideChildren(parentId: string) {
  const parent = NODE_MAP[parentId];
  if (!parent.children) return;

  const graph = graphRef.current!;

  const parentX = graph.getNodeAttribute(parentId, "x");
  const parentY = graph.getNodeAttribute(parentId, "y");

  parent.children.forEach((childId) => {
    if (!graph.hasNode(childId)) return;

    // animate OUT using SAME system
    animateNode(
      childId,
      {
        x: parentX,
        y: parentY,
        size: 0,
      },
      "out"
    );

    // remove AFTER animation
    setTimeout(() => {
      if (graph.hasNode(childId)) {
        graph.dropNode(childId);
      }
    }, 300);
  });
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;

function animateNode(
  nodeId: string,
  target: {
    x: number;
    y: number;
    size: number;
  },
  direction: "in" | "out" = "in"
) {
  const graph = graphRef.current!;
  const renderer = rendererRef.current!;

  if (!graph.hasNode(nodeId)) return;

  const duration = 300;

  const startX = graph.getNodeAttribute(nodeId, "x");
  const startY = graph.getNodeAttribute(nodeId, "y");
  const startSize = graph.getNodeAttribute(nodeId, "size");

  const start = performance.now();

  const ease =
    direction === "in"
      ? (t: number) => 1 - Math.pow(1 - t, 3) // easeOut
      : (t: number) => t * t * t; // easeIn

  function tick(now: number) {
    if (!graph.hasNode(nodeId)) return;

    const t = Math.min((now - start) / duration, 1);
    const eased = ease(t);

    graph.setNodeAttribute(nodeId, "x", startX + (target.x - startX) * eased);
    graph.setNodeAttribute(nodeId, "y", startY + (target.y - startY) * eased);
    graph.setNodeAttribute(
      nodeId,
      "size",
      startSize + (target.size - startSize) * eased
    );

    renderer.refresh();

    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

    // APPLY VISIBILITY
Object.values(NODE_MAP).forEach((node) => {
  const graph = graphRef.current!;
  const renderer = rendererRef.current!;

  if (!graph.hasNode(node.id)) return;

  if (expanded.has(node.id)) {
    showChildren(node.id);
  } else {
    // ❗ only collapse if it currently exists
    if (graph.hasNode(node.id)) {
      hideChildren(node.id);
    }
  }
});

    renderer.refresh();
  }, [expanded]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}