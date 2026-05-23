"use client";

import { useEffect, useRef, useState } from "react";

import Graph from "graphology";

type NodeData = {
  id: string;
  label: string;
  x: number;
  y: number;
  children?: string[];
};

const SCALE = 100;

const NODE_MAP: Record<string, NodeData> = {
  lowerBody: {
    id: "lowerBody",
    label: "Lower Body",
    x: 0,
    y: 0,
    children: ["feet", "legs", "thighs"],
  },

  feet: {
    id: "feet",
    label: "Feet",
    x: 0,
    y: 3,
    children: [
      "footWorship",
      "dirtyFeet",
      "heels",
      "socks",
      "shoeSniffing",
    ],
  },

  legs: {
    id: "legs",
    label: "Legs",
    x: -2,
    y: 2,
  },

  thighs: {
    id: "thighs",
    label: "Thighs",
    x: -4,
    y: 2,
  },

  footWorship: {
    id: "footWorship",
    label: "Foot Worship",
    x: -3,
    y: 6,
  },

  dirtyFeet: {
    id: "dirtyFeet",
    label: "Dirty Feet",
    x: -1,
    y: 6,
  },

  heels: {
    id: "heels",
    label: "Heels",
    x: 1,
    y: 6,
  },

  socks: {
    id: "socks",
    label: "Socks",
    x: 3,
    y: 6,
  },

  shoeSniffing: {
    id: "shoeSniffing",
    label: "Shoe Sniffing",
    x: 5,
    y: 6,
  },
};

export default function HierarchyGraph() {
  const containerRef = useRef<HTMLDivElement>(null);

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

    graph.addNode("lowerBody", {
      label: NODE_MAP.lowerBody.label,
      x: NODE_MAP.lowerBody.x * SCALE,
      y: NODE_MAP.lowerBody.y * SCALE,
      size: 20,
      color: "#ffffff",
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

        animateNode(childId, {
          x: child.x * SCALE,
          y: child.y * SCALE,
          size: 18,
        });

        if (expanded.has(childId)) {
          showChildren(childId);
        }
      });
    }

    function hideChildren(parentId: string) {
      const parent = NODE_MAP[parentId];

      if (!parent.children) return;

      parent.children.forEach((childId) => {
        if (graph.hasNode(childId)) {
          graph.dropNode(childId);
        }
      });
    }

    function animateNode(
      nodeId: string,
      target: {
        x: number;
        y: number;
        size: number;
      }
    ) {
      const duration = 300;

      const startX = graph.getNodeAttribute(nodeId, "x");
      const startY = graph.getNodeAttribute(nodeId, "y");
      const startSize = graph.getNodeAttribute(nodeId, "size");

      const start = performance.now();

      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1);

        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);

        graph.setNodeAttribute(
          nodeId,
          "x",
          startX + (target.x - startX) * eased
        );

        graph.setNodeAttribute(
          nodeId,
          "y",
          startY + (target.y - startY) * eased
        );

        graph.setNodeAttribute(
          nodeId,
          "size",
          startSize + (target.size - startSize) * eased
        );

        renderer.refresh();

        if (t < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }

    // APPLY VISIBILITY
    Object.values(NODE_MAP).forEach((node) => {
      if (expanded.has(node.id)) {
        showChildren(node.id);
      } else {
        hideChildren(node.id);
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