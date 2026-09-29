"use client";

import Link from "next/link";
import {
    Eye,
    EyeOff,
    ListTree,
    LocateFixed,
    Maximize2,
    Minus,
    Network,
    PanelLeftClose,
    PanelTopClose,
    PanelTopOpen,
    Pause,
    Play,
    Plus,
    Search,
    Settings,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
    INTEREST_BRANCHES,
    INTEREST_ROOTS,
    type InterestBranch,
} from "@/data/interestBranches";
import { OPTIONS } from "@/data/options";

const NODE_WIDTH = 230;
const NODE_HEIGHT = 196;
const NODE_HITBOX_WIDTH = 190;
const NODE_HITBOX_HEIGHT = 166;
const NODE_COLLISION_GAP = 16;
const NODE_DIAMETER = 84;
const EYEBROW_FONT_SIZE = 8;
const EYEBROW_LINE_HEIGHT = 10;
const RADIAL_START_RADIUS = 190;
const RADIAL_RADIUS_STEP = 224;
const RADIAL_NODE_GAP = 300;
const CONTENT_PADDING = 112;
const MIN_ZOOM = 0.12;
const ROOT_COLORS = ["#287271", "#C17C74", "#6A994E", "#577590", "#B07D62", "#8E7DBE"];
const GRAVITY_ITERATIONS = 72;
const MAX_SEARCH_RESULTS = 8;
const MOTION_DURATION = 560;
const CAMERA_SETTLE_DELAY = 360;
const FAST_MOTION_DURATION = 160;
const MOTION_STAGGER = 70;
const MAX_MOTION_STAGGER = 280;

type ExplorerNode = InterestBranch & {
    tags: string[];
    source: "authored" | "catalog";
};

type PositionedNode = ExplorerNode & {
    depth: number;
    parentId?: string;
    rootId: string;
    color: string;
    x: number;
    y: number;
    hasChildren: boolean;
};

type GraphEdge = {
    id: string;
    source: PositionedNode;
    target: PositionedNode;
    color: string;
};

type ExitingNode = PositionedNode & {
    exitX: number;
    exitY: number;
};

const optionLookup = new Map(OPTIONS.map((option) => [option.id, option]));

function getNode(id: string): ExplorerNode {
    const authored = INTEREST_BRANCHES[id];
    const option = optionLookup.get(id);

    if (authored) {
        return {
            ...authored,
            tags: option?.tags ?? [],
            source: "authored",
        };
    }

    return {
        id,
        label: option?.label ?? id.replaceAll("-", " ").toUpperCase(),
        eyebrow: option?.tags.slice(0, 2).join(" / ").toUpperCase(),
        children: [],
        tags: option?.tags ?? [],
        source: "catalog",
    };
}

function childIds(node: ExplorerNode) {
    return node.children.filter((childId) => childId !== node.id);
}

function getNodeDiameter(node: PositionedNode) {
    const degree = node.children.length + (node.parentId ? 1 : 0);
    const rootBoost = node.parentId ? 0 : 10;
    return Math.min(112, 42 + Math.min(degree, 24) * 2.8 + rootBoost);
}

function isWithinNodeHitbox(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    return Math.abs(x) <= NODE_HITBOX_WIDTH / 2 && Math.abs(y) <= NODE_HITBOX_HEIGHT / 2;
}

function applyGravity(
    positions: PositionedNode[],
    nodeSpacing: number,
    centerX: number,
    centerY: number,
) {
    const settled = positions.map((node) => ({ ...node }));
    const velocities = positions.map(() => ({ x: 0, y: 0 }));
    const indexById = new Map(positions.map((node, index) => [node.id, index]));
    const desiredParentDistance = Math.max(NODE_DIAMETER * 2.8, 250 * nodeSpacing);
    const minimumDistance = NODE_WIDTH * 1.2 * nodeSpacing;

    for (let iteration = 0; iteration < GRAVITY_ITERATIONS; iteration += 1) {
        const forces = positions.map(() => ({ x: 0, y: 0 }));

        settled.forEach((node, index) => {
            const nodeCenterX = node.x + NODE_WIDTH / 2;
            const nodeCenterY = node.y + NODE_HEIGHT / 2;
            forces[index].x += (centerX - nodeCenterX) * 0.002;
            forces[index].y += (centerY - nodeCenterY) * 0.002;

            if (!node.parentId) return;
            const parentIndex = indexById.get(node.parentId);
            if (parentIndex === undefined) return;
            const parent = settled[parentIndex];
            const dx = nodeCenterX - (parent.x + NODE_WIDTH / 2);
            const dy = nodeCenterY - (parent.y + NODE_HEIGHT / 2);
            const distance = Math.max(Math.hypot(dx, dy), 1);
            const spring = (distance - desiredParentDistance) * 0.035;
            forces[index].x -= (dx / distance) * spring;
            forces[index].y -= (dy / distance) * spring;
            forces[parentIndex].x += (dx / distance) * spring * 0.35;
            forces[parentIndex].y += (dy / distance) * spring * 0.35;
        });

        if (settled.length <= 180) {
            for (let firstIndex = 0; firstIndex < settled.length; firstIndex += 1) {
                for (let secondIndex = firstIndex + 1; secondIndex < settled.length; secondIndex += 1) {
                const first = settled[firstIndex];
                const second = settled[secondIndex];
                const dx = (second.x + NODE_WIDTH / 2) - (first.x + NODE_WIDTH / 2);
                const dy = (second.y + NODE_HEIGHT / 2) - (first.y + NODE_HEIGHT / 2);
                const distance = Math.max(Math.hypot(dx, dy), 1);

                    if (distance >= minimumDistance) continue;

                    const repulsion = ((minimumDistance - distance) / minimumDistance) * 0.42;
                    forces[firstIndex].x -= (dx / distance) * repulsion;
                    forces[firstIndex].y -= (dy / distance) * repulsion;
                    forces[secondIndex].x += (dx / distance) * repulsion;
                    forces[secondIndex].y += (dy / distance) * repulsion;
                }
            }
        }

        settled.forEach((node, index) => {
            velocities[index].x = (velocities[index].x + forces[index].x) * 0.84;
            velocities[index].y = (velocities[index].y + forces[index].y) * 0.84;
            const speed = Math.hypot(velocities[index].x, velocities[index].y);
            if (speed > 12) {
                velocities[index].x = (velocities[index].x / speed) * 12;
                velocities[index].y = (velocities[index].y / speed) * 12;
            }
            node.x += velocities[index].x;
            node.y += velocities[index].y;
        });
    }

    for (let iteration = 0; iteration < 24; iteration += 1) {
        let resolvedCollision = false;

        for (let firstIndex = 0; firstIndex < settled.length; firstIndex += 1) {
            for (let secondIndex = firstIndex + 1; secondIndex < settled.length; secondIndex += 1) {
                const first = settled[firstIndex];
                const second = settled[secondIndex];
                const firstCenterX = first.x + NODE_WIDTH / 2;
                const firstCenterY = first.y + NODE_HEIGHT / 2;
                const secondCenterX = second.x + NODE_WIDTH / 2;
                const secondCenterY = second.y + NODE_HEIGHT / 2;
                const overlapX = NODE_WIDTH + NODE_COLLISION_GAP - Math.abs(secondCenterX - firstCenterX);
                const overlapY = NODE_HEIGHT + NODE_COLLISION_GAP - Math.abs(secondCenterY - firstCenterY);

                if (overlapX <= 0 || overlapY <= 0) continue;

                resolvedCollision = true;
                if (overlapX < overlapY) {
                    const direction = Math.sign(secondCenterX - firstCenterX) || (firstIndex % 2 ? -1 : 1);
                    const correction = overlapX / 2;
                    first.x -= direction * correction;
                    second.x += direction * correction;
                } else {
                    const direction = Math.sign(secondCenterY - firstCenterY) || (firstIndex % 2 ? -1 : 1);
                    const correction = overlapY / 2;
                    first.y -= direction * correction;
                    second.y += direction * correction;
                }
            }
        }

        if (!resolvedCollision) break;
    }

    return settled;
}

function layoutGraph(expanded: Set<string>, nodeSpacing: number, gravityEnabled: boolean) {
    const positions: PositionedNode[] = [];
    const leafCountCache = new Map<string, number>();
    const angleRanges = new Map<string, { center: number; span: number }>();
    const anglesByDepth = new Map<number, number[]>();

    function visibleChildren(id: string, path: Set<string>) {
        if (!expanded.has(id)) return [];
        return childIds(getNode(id)).filter((childId) => !path.has(childId));
    }

    function subtreeLeafCount(id: string, path: Set<string>): number {
        if (path.has(id)) return 1;

        const cached = leafCountCache.get(id);
        if (cached !== undefined) return cached;

        const children = visibleChildren(id, path);
        const leafCount = children.length
            ? children.reduce(
                (total, childId) => total + subtreeLeafCount(childId, new Set(path).add(id)),
                0,
            )
            : 1;
        leafCountCache.set(id, leafCount);
        return leafCount;
    }

    function assignAngles(
        id: string,
        depth: number,
        start: number,
        end: number,
        path: Set<string>,
    ) {
        const center = (start + end) / 2;
        angleRanges.set(id, { center, span: end - start });
        anglesByDepth.set(depth, [...(anglesByDepth.get(depth) ?? []), center]);

        const children = visibleChildren(id, path);
        if (!children.length) return;

        const childGap = Math.min(0.025, (end - start) / Math.max(children.length * 8, 1));
        const childTotal = children.reduce(
            (total, childId) => total + subtreeLeafCount(childId, new Set(path).add(id)),
            0,
        );
        const availableSpan = end - start - childGap * (children.length - 1);
        let childStart = start;

        for (const childId of children) {
            const childSpan = availableSpan * (
                subtreeLeafCount(childId, new Set(path).add(id)) / childTotal
            );
            assignAngles(
                childId,
                depth + 1,
                childStart,
                childStart + childSpan,
                new Set(path).add(id),
            );
            childStart += childSpan + childGap;
        }
    }

    const rootWeights = INTEREST_ROOTS.map((rootId) => Math.max(subtreeLeafCount(rootId, new Set()), 2));
    const rootWeightTotal = rootWeights.reduce((total, weight) => total + weight, 0);
    const rootGap = 0.08;
    const rootSpan = Math.PI * 2 - rootGap * Math.max(INTEREST_ROOTS.length - 1, 0);
    let rootStart = -Math.PI / 2 - rootSpan / 2;

    INTEREST_ROOTS.forEach((rootId, index) => {
        const span = rootSpan * (rootWeights[index] / rootWeightTotal);
        assignAngles(rootId, 0, rootStart, rootStart + span, new Set());
        rootStart += span + rootGap;
    });

    const depthRadii = new Map<number, number>();
    anglesByDepth.forEach((angles, depth) => {
        const sortedAngles = [...angles].sort((a, b) => a - b);
        let smallestAngle = Math.PI * 2;
        for (let index = 1; index < sortedAngles.length; index += 1) {
            smallestAngle = Math.min(smallestAngle, sortedAngles[index] - sortedAngles[index - 1]);
        }
        if (sortedAngles.length > 1) {
            smallestAngle = Math.min(
                smallestAngle,
                Math.PI * 2 - sortedAngles[sortedAngles.length - 1] + sortedAngles[0],
            );
        }

        const requiredRadius = sortedAngles.length > 1
            ? RADIAL_NODE_GAP * nodeSpacing / (2 * Math.sin(Math.min(smallestAngle, Math.PI) / 2))
            : 0;
        depthRadii.set(
            depth,
            Math.max(
                (RADIAL_START_RADIUS + depth * RADIAL_RADIUS_STEP) * nodeSpacing,
                requiredRadius,
            ),
        );
    });

    const maxRadius = Math.max(...depthRadii.values(), RADIAL_START_RADIUS);
    const centerX = CONTENT_PADDING + maxRadius;
    const centerY = CONTENT_PADDING + maxRadius;
    const placedById = new Map<string, PositionedNode>();

    function place(
        id: string,
        depth: number,
        parentId: string | undefined,
        rootId: string,
        color: string,
        path: Set<string>,
    ) {
        if (path.has(id) || placedById.has(id)) return;

        const angle = angleRanges.get(id);
        if (!angle) return;

        const radius = depthRadii.get(depth) ?? RADIAL_START_RADIUS;
        const node = getNode(id);
        const positioned: PositionedNode = {
            ...node,
            parentId,
            rootId,
            color,
            depth,
            x: centerX + Math.cos(angle.center) * radius - NODE_WIDTH / 2,
            y: centerY + Math.sin(angle.center) * radius - NODE_HEIGHT / 2,
            hasChildren: childIds(node).length > 0,
        };

        placedById.set(id, positioned);
        positions.push(positioned);

        for (const childId of visibleChildren(id, path)) {
            place(childId, depth + 1, id, rootId, color, new Set(path).add(id));
        }
    }

    INTEREST_ROOTS.forEach((rootId, index) => {
        place(
            rootId,
            0,
            undefined,
            rootId,
            ROOT_COLORS[index % ROOT_COLORS.length],
            new Set(),
        );
    });

    const positionsById = new Map<string, PositionedNode>();
    for (const position of positions) {
        if (!positionsById.has(position.id)) positionsById.set(position.id, position);
    }

    const radialPositions = [...positionsById.values()];
    const gravityPositions = gravityEnabled
        ? applyGravity(radialPositions, nodeSpacing, centerX, centerY)
        : radialPositions;
    const minX = Math.min(...gravityPositions.map((node) => node.x));
    const minY = Math.min(...gravityPositions.map((node) => node.y));
    const offsetX = Math.max(CONTENT_PADDING - minX, 0);
    const offsetY = Math.max(CONTENT_PADDING - minY, 0);
    const visiblePositions = gravityPositions.map((node) => ({
        ...node,
        x: node.x + offsetX,
        y: node.y + offsetY,
    }));
    const visiblePositionsById = new Map(visiblePositions.map((node) => [node.id, node]));
    const edges: GraphEdge[] = visiblePositions.flatMap((node) => {
        if (!node.parentId) return [];
        const parent = visiblePositionsById.get(node.parentId);
        if (!parent) return [];
        return [{
            id: `${parent.id}-${node.id}`,
            source: parent,
            target: node,
            color: node.color,
        }];
    });
    const maxX = visiblePositions.reduce(
        (max, node) => Math.max(max, node.x + NODE_WIDTH),
        CONTENT_PADDING,
    );
    const maxY = visiblePositions.reduce(
        (max, node) => Math.max(max, node.y + NODE_HEIGHT),
        CONTENT_PADDING,
    );

    return {
        positions: visiblePositions,
        edges,
        width: Math.max(maxX + CONTENT_PADDING, 760),
        height: Math.max(maxY + CONTENT_PADDING, 760),
    };
}

export default function InterestExplorer() {
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(INTEREST_ROOTS),
    );
    const [selectedId, setSelectedId] = useState("vanilla");
    const [query, setQuery] = useState("");
    const [zoom, setZoom] = useState(0.46);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [exitingNodes, setExitingNodes] = useState<ExitingNode[]>([]);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [gravityEnabled, setGravityEnabled] = useState(true);
    const [nodeSpacing, setNodeSpacing] = useState(1);
    const [autoPanEnabled, setAutoPanEnabled] = useState(true);
    const [linksVisible, setLinksVisible] = useState(true);
    const [eyebrowsVisible, setEyebrowsVisible] = useState(true);
    const [sidebarOpenIds, setSidebarOpenIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [topBarVisible, setTopBarVisible] = useState(true);
    const [searchVisible, setSearchVisible] = useState(false);
    const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
    const [motionFast, setMotionFast] = useState(false);
    const [cameraSettling, setCameraSettling] = useState(false);
    const fastMotionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const expansionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialFitRef = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const graphViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const savedAnimations = window.localStorage.getItem("interestAnimationsEnabled");
        if (savedAnimations === "false") setAnimationsEnabled(false);
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            "interestAnimationsEnabled",
            animationsEnabled ? "true" : "false",
        );
        if (!animationsEnabled) setExitingNodes([]);
    }, [animationsEnabled]);

    useEffect(() => {
        const savedAutoPan = window.localStorage.getItem("interestAutoPanOnExpand");
        if (savedAutoPan === "false") setAutoPanEnabled(false);
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            "interestAutoPanOnExpand",
            autoPanEnabled ? "true" : "false",
        );
    }, [autoPanEnabled]);

    const graph = useMemo(
        () => layoutGraph(expanded, nodeSpacing, gravityEnabled),
        [expanded, nodeSpacing, gravityEnabled],
    );
    useEffect(() => () => {
        if (fastMotionTimeout.current) clearTimeout(fastMotionTimeout.current);
        if (expansionTimeout.current) clearTimeout(expansionTimeout.current);
    }, []);
    const visiblePositionsById = useMemo(
        () => new Map(graph.positions.map((node) => [node.id, node])),
        [graph.positions],
    );
    const renderedPositions = [
        ...graph.positions,
        ...exitingNodes.filter((node) => !visiblePositionsById.has(node.id)),
    ];
    const maxExitingDepth = exitingNodes.reduce(
        (max, node) => Math.max(max, node.depth),
        0,
    );
    const labelScale = Math.min(3.4, Math.max(1, 1 / zoom));
    const focusId = hoveredId ?? selectedId;
    const focusNode = graph.positions.find((node) => node.id === focusId);
    const normalizedQuery = query.trim().toLowerCase();
    const searchMatchIds = useMemo(() => {
        if (!normalizedQuery) return new Set<string>();

        return new Set(
            graph.positions
                .filter((node) => [node.label, node.id, node.eyebrow ?? "", ...node.tags]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedQuery))
                .map((node) => node.id),
        );
    }, [graph.positions, normalizedQuery]);
    const isFocusNeighbor = (node: PositionedNode) => Boolean(
        hoveredId
            ? node.id === focusId
                || node.parentId === focusId
                || focusNode?.children.includes(node.id)
            : !searchMatchIds.size
                || searchMatchIds.has(node.id)
                || (node.parentId ? searchMatchIds.has(node.parentId) : false)
                || node.children.some((childId) => searchMatchIds.has(childId)),
    );
    const searchResults = useMemo(() => {
        if (!normalizedQuery) return [];

        return OPTIONS.filter((option) => {
            const haystack = [option.label, option.id, ...(option.aka ?? []), ...option.tags]
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        }).slice(0, MAX_SEARCH_RESULTS);
    }, [query]);
    const sortedRootIds = useMemo(
        () => [...INTEREST_ROOTS].sort((firstId, secondId) =>
            getNode(firstId).label.localeCompare(getNode(secondId).label)),
        [],
    );
    const toggleSidebarNode = (id: string) => {
        setSidebarOpenIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderSidebarNode = (id: string, depth = 0): React.ReactNode => {
        const node = getNode(id);
        const children = childIds(node).sort((firstId, secondId) =>
            getNode(firstId).label.localeCompare(getNode(secondId).label));
        const isOpen = sidebarOpenIds.has(id);
        const isSelected = selectedId === id;

        return (
            <div key={id}>
                <button
                    type="button"
                    onClick={() => {
                        revealSidebarBranch(id);
                        if (children.length) toggleSidebarNode(id);
                    }}
                    className={`group flex min-h-7 w-full items-center gap-1.5 border-b border-white/[0.05] text-left transition hover:bg-violet-400/[0.06] ${isSelected ? "bg-violet-400/10 text-violet-100" : "text-neutral-300"}`}
                    style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "6px" }}
                    aria-expanded={children.length ? isOpen : undefined}
                >
                    <span className="w-3 shrink-0 text-[9px] text-neutral-600">
                        {children.length ? (isOpen ? "-" : "+") : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                        {node.label}
                    </span>
                    <span className="shrink-0 text-[9px] tabular-nums text-neutral-600">
                        {children.length}
                    </span>
                </button>
                {isOpen && children.map((childId) => renderSidebarNode(childId, depth + 1))}
            </div>
        );
    };

    const fitGraph = (targetGraph: ReturnType<typeof layoutGraph> = graph) => {
        const viewport = graphViewportRef.current;
        if (!viewport) return;

        const nextZoom = Math.min(
            0.86,
            viewport.clientWidth / targetGraph.width,
            viewport.clientHeight / targetGraph.height,
        );
        const boundedZoom = Math.max(MIN_ZOOM, nextZoom);
        setZoom(boundedZoom);
        setPan({ x: 0, y: 0 });
    };

    const toggleGravityLayout = () => {
        const nextGravityEnabled = !gravityEnabled;
        setGravityEnabled(nextGravityEnabled);
        if (autoPanEnabled) {
            fitGraph(layoutGraph(expanded, nodeSpacing, nextGravityEnabled));
        }
    };

    const updateNodeSpacing = (nextSpacing: number) => {
        setNodeSpacing(nextSpacing);
        if (autoPanEnabled) {
            fitGraph(layoutGraph(expanded, nextSpacing, gravityEnabled));
        }
    };

    const commitExpandedGraph = (next: Set<string>) => {
        setExpanded(next);
    };

    useEffect(() => {
        if (initialFitRef.current) return;

        const frame = requestAnimationFrame(() => {
            fitGraph(graph);
            initialFitRef.current = true;
        });

        return () => cancelAnimationFrame(frame);
    }, [graph]);

    const toggleNode = (id: string) => {
        if (cameraSettling) return;

        if (animationsEnabled && exitingNodes.length) {
            setMotionFast(true);
            if (fastMotionTimeout.current) clearTimeout(fastMotionTimeout.current);
            fastMotionTimeout.current = setTimeout(() => {
                setMotionFast(false);
                fastMotionTimeout.current = null;
            }, FAST_MOTION_DURATION + 40);
        }

        setSelectedId(id);
        const next = new Set(expanded);

        if (next.has(id)) {
            next.delete(id);
            const nextGraph = layoutGraph(next, nodeSpacing, gravityEnabled);
            const nextIds = new Set(nextGraph.positions.map((node) => node.id));
            const currentPositionsById = new Map(
                graph.positions.map((node) => [node.id, node]),
            );
            const departingNodes = graph.positions
                .filter((node) => !nextIds.has(node.id))
                .map((node) => {
                    const parent = node.parentId
                        ? currentPositionsById.get(node.parentId)
                        : undefined;
                    return {
                        ...node,
                        exitX: parent?.x ?? node.x,
                        exitY: parent?.y ?? node.y,
                    };
                });

            if (animationsEnabled && departingNodes.length) {
                const departingIds = new Set(departingNodes.map((node) => node.id));
                setExitingNodes((current) => [
                    ...current.filter((node) => !departingIds.has(node.id)),
                    ...departingNodes,
                ]);
            } else {
                setExitingNodes([]);
            }

            if (autoPanEnabled) {
                fitGraph(nextGraph);
            }
        } else if (getNode(id).children.length) {
            next.add(id);
            const nextGraph = layoutGraph(next, nodeSpacing, gravityEnabled);
            const nextIds = new Set(nextGraph.positions.map((node) => node.id));
            setExitingNodes((current) => current.filter((node) => !nextIds.has(node.id)));

            if (autoPanEnabled && animationsEnabled) {
                fitGraph(nextGraph);
                setCameraSettling(true);
                expansionTimeout.current = setTimeout(() => {
                    commitExpandedGraph(next);
                    setCameraSettling(false);
                    expansionTimeout.current = null;
                }, CAMERA_SETTLE_DELAY);
                return;
            }

            if (autoPanEnabled) {
                fitGraph(nextGraph);
            }

            if (animationsEnabled) {
                commitExpandedGraph(next);
                return;
            }
        }

        setExpanded(next);
    };

    const revealSidebarBranch = (rootId: string) => {
        setSelectedId(rootId);

        if (!expanded.has(rootId)) {
            toggleNode(rootId);
            return;
        }

        if (autoPanEnabled) {
            fitGraph(graph);
        }
    };

    const selectSearchResult = (id: string) => {
        setSelectedId(id);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        setIsDragging(true);
        dragStart.current = {
            x: event.clientX,
            y: event.clientY,
            panX: pan.x,
            panY: pan.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const dragSensitivity = 0.75;
        setPan({
            x: dragStart.current.panX + ((event.clientX - dragStart.current.x) / zoom) * dragSensitivity,
            y: dragStart.current.panY + ((event.clientY - dragStart.current.y) / zoom) * dragSensitivity,
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        setZoom((current) =>
            Math.min(1.25, Math.max(MIN_ZOOM, current - event.deltaY * 0.0008)),
        );
    };

    return (
        <main className={`min-h-screen overflow-hidden bg-[#191B1C] text-neutral-100 ${animationsEnabled ? "" : "animations-disabled"}`}>
            <div className={`grid min-h-screen w-full grid-cols-1 ${sidebarVisible ? "lg:grid-cols-[238px_minmax(0,1fr)]" : ""}`}>
                {sidebarVisible && (
                    <aside aria-label="Root directory" className="cursor-pointer border-b border-white/[0.07] bg-[#1D1E21] p-3 lg:border-b-0 lg:border-r lg:p-4">
                        <div className="flex items-center justify-between">
                            <Link
                                href="/"
                                className="block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-100 transition hover:text-violet-200"
                                aria-label="Go to Corruchart home"
                            >
                                CORRUCHART
                            </Link>
                            <button
                                type="button"
                                onClick={() => setSidebarVisible(false)}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Close root directory"
                                title="Close root directory"
                            >
                                <PanelLeftClose className="size-3.5" />
                            </button>
                        </div>
                        <div className="hide-scrollbar mt-3 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
                            {sortedRootIds.map((rootId) => renderSidebarNode(rootId))}
                        </div>
                    </aside>
                )}

                <section className="relative flex min-h-[620px] min-w-0 flex-col bg-[#191B1C]">
                    {topBarVisible && (
                        <div className="relative z-30 border-b border-white/[0.07]">
                            <div className={`flex min-w-0 flex-wrap items-center justify-between gap-2 py-2 ${sidebarVisible ? "px-3 sm:px-7" : "px-3 sm:px-7"}`}>
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - 0.1))}
                                        className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                        aria-label="Zoom out"
                                        title="Zoom out"
                                    >
                                        <Minus className="size-3.5" />
                                    </button>
                                    <span className="w-9 text-center text-[9px] font-bold text-neutral-400">{Math.round(zoom * 100)}%</span>
                                    <button
                                        type="button"
                                        onClick={() => setZoom((current) => Math.min(1.25, current + 0.1))}
                                        className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                        aria-label="Zoom in"
                                        title="Zoom in"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fitGraph()}
                                        className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                        aria-label="Fit interest web"
                                        title="Fit interest web"
                                    >
                                        <Maximize2 className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEyebrowsVisible((current) => !current)}
                                        className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${eyebrowsVisible ? "text-neutral-500" : "bg-violet-400/10 text-violet-200"}`}
                                        aria-label={eyebrowsVisible ? "Hide node eyebrows" : "Show node eyebrows"}
                                        title={eyebrowsVisible ? "Hide node eyebrows" : "Show node eyebrows"}
                                        aria-pressed={eyebrowsVisible}
                                    >
                                        {eyebrowsVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLinksVisible((current) => !current)}
                                        className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${linksVisible ? "text-neutral-500" : "bg-violet-400/10 text-violet-200"}`}
                                        aria-label={linksVisible ? "Hide graph links" : "Show graph links"}
                                        title={linksVisible ? "Hide graph links" : "Show graph links"}
                                        aria-pressed={linksVisible}
                                    >
                                        <Network className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchVisible((current) => !current);
                                            setMoreOptionsVisible(false);
                                        }}
                                        className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${searchVisible ? "bg-violet-400/10 text-violet-200" : "text-neutral-500"}`}
                                        aria-label={searchVisible ? "Close search" : "Open search"}
                                        title={searchVisible ? "Close search" : "Open search"}
                                        aria-pressed={searchVisible}
                                    >
                                        <Search className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSidebarVisible((current) => !current);
                                            setMoreOptionsVisible(false);
                                        }}
                                        className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${sidebarVisible ? "bg-violet-400/10 text-violet-200" : "text-neutral-500"}`}
                                        aria-label={sidebarVisible ? "Close root directory" : "Open root directory"}
                                        title={sidebarVisible ? "Close root directory" : "Open root directory"}
                                        aria-pressed={sidebarVisible}
                                    >
                                        <ListTree className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMoreOptionsVisible((current) => !current)}
                                        className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${moreOptionsVisible ? "bg-violet-400/10 text-violet-200" : "text-neutral-500"}`}
                                        aria-label="Open more graph options"
                                        title="More graph options"
                                        aria-pressed={moreOptionsVisible}
                                    >
                                        <Settings className="size-3.5" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTopBarVisible(false)}
                                    className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                    aria-label="Hide graph controls"
                                    title="Hide graph controls"
                                >
                                    <PanelTopClose className="size-3.5" />
                                </button>
                            </div>
                            {searchVisible && (
                                <div className="border-t border-white/[0.07] bg-[#17181A] p-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Search interests"
                                            className="h-9 w-full border border-white/10 bg-[#1D1E21] pl-9 pr-9 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-violet-400/70"
                                            aria-label="Search interests"
                                            autoFocus
                                        />
                                        {query && (
                                            <button
                                                type="button"
                                                onClick={() => setQuery("")}
                                                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center text-neutral-500 transition hover:text-neutral-200"
                                                aria-label="Clear search"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {query && (
                                        <div className="mt-2 max-h-52 overflow-y-auto border border-white/10 bg-[#1D1E21] p-1">
                                            {searchResults.length ? searchResults.map((result) => (
                                                <button
                                                    type="button"
                                                    key={result.id}
                                                    onClick={() => selectSearchResult(result.id)}
                                                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-violet-400/10"
                                                >
                                                    <span className="min-w-0 truncate text-xs font-semibold text-neutral-200">{result.label}</span>
                                                    <span className="shrink-0 text-[9px] tabular-nums text-neutral-600">{childIds(getNode(result.id)).length}</span>
                                                </button>
                                            )) : <p className="px-3 py-3 text-xs text-neutral-500">No interests found.</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                            {moreOptionsVisible && (
                                <div className="absolute right-2 top-full mt-2 w-[min(290px,calc(100vw-1rem))] border border-white/10 bg-[#1D1E21] p-2 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={toggleGravityLayout}
                                        className={`flex h-8 w-full cursor-pointer items-center justify-between border px-2 text-left text-[9px] font-bold uppercase tracking-[0.12em] transition ${gravityEnabled ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100" : "border-white/10 text-neutral-500"}`}
                                        aria-label={gravityEnabled ? "Disable gravity layout" : "Enable gravity layout"}
                                        aria-pressed={gravityEnabled}
                                    >
                                        <span>Gravity</span>
                                        <span>{gravityEnabled ? "ON" : "OFF"}</span>
                                    </button>
                                    <label className="mt-2 flex h-8 items-center gap-2 border border-white/10 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                                        <span>Closeness</span>
                                        <input
                                            type="range"
                                            min="0.65"
                                            max="1.35"
                                            step="0.05"
                                            value={nodeSpacing}
                                            onChange={(event) => updateNodeSpacing(Number(event.target.value))}
                                            className="h-1 min-w-0 flex-1 cursor-pointer accent-emerald-300"
                                            aria-label="Adjust node closeness"
                                        />
                                        <span className="w-7 text-right text-[8px] tracking-[0.08em] text-neutral-400">{nodeSpacing.toFixed(2)}x</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setAutoPanEnabled((current) => !current)}
                                        className={`mt-2 flex h-8 w-full cursor-pointer items-center justify-between border px-2 text-[9px] font-bold uppercase tracking-[0.12em] transition ${autoPanEnabled ? "border-violet-300/35 bg-violet-400/10 text-violet-100" : "border-white/10 text-neutral-500"}`}
                                        aria-label={autoPanEnabled ? "Disable auto-pan" : "Enable auto-pan"}
                                        aria-pressed={autoPanEnabled}
                                    >
                                        <span className="flex items-center gap-1.5"><LocateFixed className="size-3.5" />Auto-pan</span>
                                        <span>{autoPanEnabled ? "ON" : "OFF"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAnimationsEnabled((current) => !current)}
                                        className={`mt-2 flex h-8 w-full cursor-pointer items-center justify-between border px-2 text-[9px] font-bold uppercase tracking-[0.12em] transition ${animationsEnabled ? "border-white/10 text-neutral-400" : "border-violet-300/35 bg-violet-400/10 text-violet-100"}`}
                                        aria-label={animationsEnabled ? "Disable animations" : "Enable animations"}
                                        aria-pressed={!animationsEnabled}
                                    >
                                        <span className="flex items-center gap-1.5">{animationsEnabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}Animations</span>
                                        <span>{animationsEnabled ? "ON" : "OFF"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {!topBarVisible && (
                        <button
                            type="button"
                            onClick={() => setTopBarVisible(true)}
                            className="absolute right-2 top-2 z-20 flex size-8 cursor-pointer items-center justify-center border border-white/10 bg-[#1D1E21] text-neutral-400 transition hover:border-violet-400/50 hover:bg-violet-400/10 hover:text-violet-200"
                            aria-label="Show graph controls"
                            title="Show graph controls"
                        >
                            <PanelTopOpen className="size-4" />
                        </button>
                    )}

                    <div
                        className={`relative flex-1 touch-none select-none overflow-hidden bg-[#151516] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                        ref={graphViewportRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onWheel={handleWheel}
                    >
                        <div
                            className="absolute left-1/2 top-1/2 will-change-transform"
                            style={{
                                width: graph.width,
                                height: graph.height,
                                marginLeft: -graph.width / 2,
                                marginTop: -graph.height / 2,
                                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                                transformOrigin: "50% 50%",
                                transition: isDragging || !animationsEnabled ? "none" : `transform ${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                            }}
                        >
                            {linksVisible && (
                                <svg
                                    className="pointer-events-none absolute left-0 top-0 overflow-visible"
                                    width={graph.width}
                                    height={graph.height}
                                    viewBox={`0 0 ${graph.width} ${graph.height}`}
                                    aria-hidden="true"
                                >
                                    {graph.edges.map((edge) => {
                                        const isConnected = focusId === edge.source.id || focusId === edge.target.id;
                                        return (
                                            <line
                                                key={edge.id}
                                                x1={edge.source.x + NODE_WIDTH / 2}
                                                y1={edge.source.y + NODE_HEIGHT / 2}
                                                x2={edge.target.x + NODE_WIDTH / 2}
                                                y2={edge.target.y + NODE_HEIGHT / 2}
                                                stroke={edge.color}
                                                strokeOpacity={hoveredId ? (isConnected ? 0.84 : 0.08) : (isConnected ? 0.7 : 0.28)}
                                                strokeWidth={isConnected ? 2 : 1.2}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        );
                                    })}
                                </svg>
                            )}
                            {renderedPositions.map((node) => {
                                const exitingNode = "exitX" in node
                                    ? (node as ExitingNode)
                                    : undefined;
                                const isExiting = Boolean(exitingNode);
                                const isSelected = selectedId === node.id;
                                const nodeDiameter = getNodeDiameter(node);
                                const discTop = (NODE_HEIGHT - nodeDiameter) / 2;
                                const eyebrowText = node.eyebrow ?? "CATALOG";
                                const eyebrowScale = Math.min(1.2, Math.max(1, nodeDiameter / 70));
                                const eyebrowFontSize = EYEBROW_FONT_SIZE * eyebrowScale;
                                const eyebrowLineHeight = EYEBROW_LINE_HEIGHT * eyebrowScale;
                                const eyebrowCharactersPerLine = Math.max(1, Math.floor(NODE_WIDTH / (eyebrowFontSize * labelScale * 0.58)));
                                const eyebrowLines = Math.ceil(eyebrowText.length / eyebrowCharactersPerLine)
                                    + (eyebrowText.length > eyebrowCharactersPerLine * 0.6 ? 1 : 0);
                                const eyebrowHeight = Math.max(16, eyebrowLines * eyebrowLineHeight * labelScale + 2);
                                const labelCharactersPerLine = Math.max(1, Math.floor(NODE_WIDTH / (11 * labelScale * 0.58)));
                                const labelLines = Math.ceil(node.label.length / labelCharactersPerLine)
                                    + (node.label.length > labelCharactersPerLine * 0.6 ? 1 : 0);
                                const labelHeight = Math.max(24, labelLines * 13 * labelScale + 4);
                                const animationDelay = `${isExiting
                                    ? motionFast ? 0 : Math.max(0, maxExitingDepth - node.depth) * MOTION_STAGGER
                                    : 0}ms`;
                                return (
                                    <button
                                        type="button"
                                        key={node.id}
                                        onPointerDown={isExiting ? undefined : (event) => {
                                            if (!isWithinNodeHitbox(event)) return;
                                            event.stopPropagation();
                                        }}
                                        onPointerEnter={isExiting ? undefined : (event) => {
                                            setHoveredId(isWithinNodeHitbox(event) ? node.id : null);
                                        }}
                                        onPointerMove={isExiting ? undefined : (event) => {
                                            setHoveredId(isWithinNodeHitbox(event) ? node.id : null);
                                        }}
                                        onPointerLeave={isExiting ? undefined : () => setHoveredId(null)}
                                        onPointerUp={isExiting ? undefined : (event) => {
                                            if (!isWithinNodeHitbox(event)) return;
                                            event.stopPropagation();
                                            toggleNode(node.id);
                                        }}
                                        onKeyDown={isExiting ? undefined : (event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                toggleNode(node.id);
                                            }
                                        }}
                                        onAnimationEnd={isExiting
                                            ? () => setExitingNodes((current) => current.filter((item) => item.id !== node.id))
                                            : undefined}
                                        aria-hidden={isExiting}
                                        aria-label={`${node.label}, ${node.eyebrow ?? "CATALOG"}`}
                                        tabIndex={isExiting ? -1 : undefined}
                                        className={`interest-node absolute cursor-pointer text-center ${isExiting ? "interest-node-exit pointer-events-none" : ""}`}
                                        style={{
                                            opacity: isFocusNeighbor(node) ? 1 : 0.3,
                                            width: NODE_WIDTH,
                                            height: NODE_HEIGHT,
                                            transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                                            animationDuration: `${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms`,
                                            animationDelay,
                                            "--node-x": `${node.x}px`,
                                            "--node-y": `${node.y}px`,
                                            "--exit-x": `${exitingNode?.exitX ?? node.x}px`,
                                            "--exit-y": `${exitingNode?.exitY ?? node.y}px`,
                                        } as CSSProperties}
                                    >
                                        <span className="interest-node-content">
                                            {eyebrowsVisible && (
                                                <span
                                                    className="w-full shrink-0 whitespace-normal break-words text-[9px] font-bold uppercase tracking-[0.1em] text-neutral-300 [text-shadow:0_1px_4px_#151516]"
                                                    style={{
                                                        position: "absolute",
                                                        left: 0,
                                                        top: `${discTop - eyebrowHeight - 8}px`,
                                                        width: NODE_WIDTH,
                                                        fontSize: `${eyebrowFontSize * labelScale}px`,
                                                        lineHeight: `${eyebrowLineHeight * labelScale}px`,
                                                        height: `${eyebrowHeight}px`,
                                                    }}
                                                >
                                                    {eyebrowText}
                                                </span>
                                            )}
                                            <span
                                                className={`interest-node-disc absolute flex items-center justify-center rounded-full border-2 text-center text-white transition-shadow ${isSelected ? "border-white shadow-[0_0_0_5px_rgba(255,255,255,0.16)]" : "border-black/25"}`}
                                                style={{
                                                    left: (NODE_WIDTH - nodeDiameter) / 2,
                                                    top: discTop,
                                                    width: nodeDiameter,
                                                    height: nodeDiameter,
                                                    backgroundColor: isExiting ? "#242629" : node.color,
                                                }}
                                            />
                                            <span
                                                className="absolute left-0 max-w-full whitespace-normal break-words px-1 text-[11px] font-bold leading-tight tracking-wide text-neutral-100 [text-shadow:0_1px_5px_#151516]"
                                                style={{
                                                    top: discTop + nodeDiameter + 8,
                                                    width: NODE_WIDTH,
                                                    height: labelHeight,
                                                    fontSize: `${11 * labelScale}px`,
                                                    lineHeight: `${13 * labelScale}px`,
                                                }}
                                            >
                                                {node.label}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .interest-node {
                    transition: border-color 120ms ease, background-color 120ms ease;
                }

                .interest-node-content {
                    position: absolute;
                    inset: 0;
                    display: block;
                }

                .interest-node-exit {
                    animation: interest-node-out ${MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .animations-disabled .interest-node {
                    animation: none !important;
                    transition: none !important;
                }

                @keyframes interest-node-out {
                    from {
                        opacity: 1;
                        transform: translate3d(var(--node-x), var(--node-y), 0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translate3d(var(--exit-x), var(--exit-y), 0) scale(0.82);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .interest-node {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </main>
    );
}