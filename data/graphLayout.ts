import Graph from "graphology";

export function applyTreeLayout(graph: Graph, roots: string[]) {
  const LEVEL_GAP = 6;
  const SIBLING_GAP = 3;

  const visited = new Set<string>();

  function layoutNode(nodeId: string, depth: number, index: number) {
    if (!graph.hasNode(nodeId)) return;
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const children = graph.getNodeAttribute(nodeId, "children") || [];

    graph.setNodeAttribute(nodeId, "x", index * SIBLING_GAP);
    graph.setNodeAttribute(nodeId, "y", depth * LEVEL_GAP);

    children.forEach((childId: string, i: number) => {
      layoutNode(childId, depth + 1, index + i - children.length / 2);
    });
  }

  roots.forEach((rootId, i) => {
    layoutNode(rootId, 0, i * 4);
  });
}