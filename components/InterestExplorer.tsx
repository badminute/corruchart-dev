"use client";

import Link from "next/link";
import {
    ChevronDown,
    ChevronRight,
    LocateFixed,
    Maximize2,
    Minus,
    PanelLeftClose,
    PanelLeftOpen,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DESCRIPTIONS } from "@/data/descriptions";
import { OPTIONS } from "@/data/options";
import {
    INTEREST_BRANCHES,
    INTEREST_ROOTS,
    type InterestBranch,
} from "@/data/interestBranches";

const CARD_WIDTH = 214;
const CARD_HEIGHT = 108;
const COLUMN_GAP = 34;
const ROW_GAP = 92;
const CONTENT_PADDING = 46;
const MAX_SEARCH_RESULTS = 8;
const MOTION_DURATION = 560;
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
    x: number;
    y: number;
    hasChildren: boolean;
};

type ExitingNode = PositionedNode & {
    exitX: number;
    exitY: number;
};

type GraphEdge = {
    id: string;
    parent: PositionedNode;
    child: PositionedNode;
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

function layoutGraph(expanded: Set<string>) {
    const positions: PositionedNode[] = [];
    const edges: GraphEdge[] = [];
    const widthCache = new Map<string, number>();

    function subtreeWidth(id: string, path: Set<string>): number {
        if (path.has(id)) return CARD_WIDTH;

        const cached = widthCache.get(id);
        if (cached) return cached;

        const node = getNode(id);
        const children = expanded.has(id)
            ? childIds(node).filter((childId) => !path.has(childId))
            : [];

        if (!children.length) {
            widthCache.set(id, CARD_WIDTH);
            return CARD_WIDTH;
        }

        const childrenWidth = children.reduce(
            (total, childId) => total + subtreeWidth(childId, new Set(path).add(id)),
            0,
        );
        const width = Math.max(
            CARD_WIDTH,
            childrenWidth + COLUMN_GAP * (children.length - 1),
        );
        widthCache.set(id, width);
        return width;
    }

    function place(
        id: string,
        depth: number,
        left: number,
        parentId: string | undefined,
        path: Set<string>,
    ) {
        const node = getNode(id);
        const width = subtreeWidth(id, path);
        const x = left + (width - CARD_WIDTH) / 2;
        const positioned: PositionedNode = {
            ...node,
            parentId,
            depth,
            x,
            y: CONTENT_PADDING + depth * (CARD_HEIGHT + ROW_GAP),
            hasChildren: childIds(node).length > 0,
        };

        positions.push(positioned);

        const children = expanded.has(id)
            ? childIds(node).filter((childId) => !path.has(childId))
            : [];
        let childLeft = left;

        for (const childId of children) {
            const childWidth = subtreeWidth(childId, new Set(path).add(id));
            const childPositionIndex = positions.length;
            place(childId, depth + 1, childLeft, id, new Set(path).add(id));
            const child = positions[childPositionIndex];
            edges.push({
                id: `${id}-${childId}`,
                parent: positioned,
                child,
            });
            childLeft += childWidth + COLUMN_GAP;
        }
    }

    const rootsWidth = INTEREST_ROOTS.reduce(
        (total, rootId) => total + subtreeWidth(rootId, new Set()),
        0,
    ) + COLUMN_GAP * (INTEREST_ROOTS.length - 1);
    let rootLeft = Math.max(CONTENT_PADDING, (rootsWidth - rootsWidth) / 2);

    for (const rootId of INTEREST_ROOTS) {
        const rootWidth = subtreeWidth(rootId, new Set());
        place(rootId, 0, rootLeft, undefined, new Set());
        rootLeft += rootWidth + COLUMN_GAP;
    }

    const positionsById = new Map<string, PositionedNode>();
    for (const position of positions) {
        if (!positionsById.has(position.id)) positionsById.set(position.id, position);
    }

    const visiblePositions = [...positionsById.values()];
    const visibleEdges: GraphEdge[] = [];
    const edgeIds = new Set<string>();

    for (const edge of edges) {
        const parent = positionsById.get(edge.parent.id);
        const child = positionsById.get(edge.child.id);
        if (!parent || !child) continue;

        const edgeId = `${parent.id}-${child.id}`;
        if (edgeIds.has(edgeId)) continue;

        edgeIds.add(edgeId);
        visibleEdges.push({ id: edgeId, parent, child });
    }

    const maxX = visiblePositions.reduce(
        (max, node) => Math.max(max, node.x + CARD_WIDTH),
        CONTENT_PADDING,
    );
    const maxY = visiblePositions.reduce(
        (max, node) => Math.max(max, node.y + CARD_HEIGHT),
        CONTENT_PADDING,
    );

    return {
        positions: visiblePositions,
        edges: visibleEdges,
        width: Math.max(maxX + CONTENT_PADDING, 760),
        height: maxY + CONTENT_PADDING,
    };
}

function edgePath(edge: GraphEdge) {
    const startX = edge.parent.x + CARD_WIDTH / 2;
    const startY = edge.parent.y + CARD_HEIGHT;
    const endX = edge.child.x + CARD_WIDTH / 2;
    const endY = edge.child.y;
    const bend = Math.max((endY - startY) * 0.45, 28);

    return `M ${startX} ${startY} C ${startX} ${startY + bend}, ${endX} ${endY - bend}, ${endX} ${endY}`;
}

export default function InterestExplorer() {
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(INTEREST_ROOTS),
    );
    const [selectedId, setSelectedId] = useState("vanilla");
    const [query, setQuery] = useState("");
    const [zoom, setZoom] = useState(0.86);
    const [pan, setPan] = useState({ x: 20, y: 18 });
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [currentBranchVisible, setCurrentBranchVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [exitingNodes, setExitingNodes] = useState<ExitingNode[]>([]);
    const [enteringNodeIds, setEnteringNodeIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [autoPanEnabled, setAutoPanEnabled] = useState(true);
    const [descriptionVisibleId, setDescriptionVisibleId] = useState<string | null>(null);
    const [motionFast, setMotionFast] = useState(false);
    const fastMotionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previousVisibleIds = useRef<Set<string> | null>(null);
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

    const graph = useMemo(() => layoutGraph(expanded), [expanded]);
    useEffect(() => {
        const currentIds = new Set(graph.positions.map((node) => node.id));
        const previousIds = previousVisibleIds.current;
        const newlyVisibleIds = previousIds
            ? [...currentIds].filter((id) => !previousIds.has(id))
            : [...currentIds];

        previousVisibleIds.current = currentIds;
        setEnteringNodeIds(
            animationsEnabled ? new Set(newlyVisibleIds) : new Set(),
        );
    }, [animationsEnabled, graph.positions]);
    useEffect(() => () => {
        if (fastMotionTimeout.current) clearTimeout(fastMotionTimeout.current);
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
    const selectedNode = getNode(selectedId);
    const selectedDescription = selectedNode.description ?? DESCRIPTIONS[selectedId];
    const searchResults = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return [];

        return OPTIONS.filter((option) => {
            const haystack = [option.label, option.id, ...(option.aka ?? []), ...option.tags]
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        }).slice(0, MAX_SEARCH_RESULTS);
    }, [query]);

    const panToNodes = (nodes: PositionedNode[]) => {
        const viewport = graphViewportRef.current;
        if (!viewport || !nodes.length) return;

        const focusX = nodes.reduce(
            (total, node) => total + node.x + CARD_WIDTH / 2,
            0,
        ) / nodes.length;
        const focusY = nodes.reduce(
            (total, node) => total + node.y + CARD_HEIGHT / 2,
            0,
        ) / nodes.length;
        setPan({
            x: viewport.clientWidth / 2 - focusX * zoom,
            y: viewport.clientHeight / 2 - focusY * zoom,
        });
    };

    const toggleNode = (id: string) => {
        if (animationsEnabled && (enteringNodeIds.size || exitingNodes.length)) {
            setMotionFast(true);
            if (fastMotionTimeout.current) clearTimeout(fastMotionTimeout.current);
            fastMotionTimeout.current = setTimeout(() => {
                setMotionFast(false);
                fastMotionTimeout.current = null;
            }, FAST_MOTION_DURATION + 40);
        }

        setSelectedId(id);
        setDescriptionVisibleId(id);
        const next = new Set(expanded);

        if (next.has(id)) {
            next.delete(id);
            const nextGraph = layoutGraph(next);
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
                const contractedNode = nextGraph.positions.find((node) => node.id === id);
                if (contractedNode) panToNodes([contractedNode]);
            }
        } else if (getNode(id).children.length) {
            next.add(id);
            const nextGraph = layoutGraph(next);
            const nextIds = new Set(nextGraph.positions.map((node) => node.id));
            setExitingNodes((current) => current.filter((node) => !nextIds.has(node.id)));

            if (autoPanEnabled) {
                const currentIds = new Set(graph.positions.map((node) => node.id));
                const childIdsToFocus = new Set(childIds(getNode(id)));
                const focusNodes = nextGraph.positions.filter(
                    (node) => !currentIds.has(node.id) || childIdsToFocus.has(node.id),
                );
                panToNodes(focusNodes);
            }
        }

        setExpanded(next);
    };

    const resetView = () => {
        setExpanded(new Set(INTEREST_ROOTS));
        setSelectedId("vanilla");
        setDescriptionVisibleId(null);
        setMotionFast(false);
        if (fastMotionTimeout.current) clearTimeout(fastMotionTimeout.current);
        fastMotionTimeout.current = null;
        setZoom(0.86);
        setPan({ x: 20, y: 18 });
        setExitingNodes([]);
    };

    const selectSearchResult = (id: string) => {
        setSelectedId(id);
        setDescriptionVisibleId(null);
        setQuery("");
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
        setPan({
            x: dragStart.current.panX + event.clientX - dragStart.current.x,
            y: dragStart.current.panY + event.clientY - dragStart.current.y,
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        setZoom((current) =>
            Math.min(1.25, Math.max(0.5, current - event.deltaY * 0.0008)),
        );
    };

    return (
        <main className={`min-h-screen overflow-hidden bg-[#191B1C] text-neutral-100 ${animationsEnabled ? "" : "animations-disabled"}`}>
            <div className={`grid min-h-screen w-full grid-cols-1 ${sidebarVisible ? "lg:grid-cols-[238px_minmax(0,1fr)]" : ""}`}>
                {sidebarVisible && (
                    <aside className="border-b border-white/[0.07] bg-[#1D1E21] p-3 lg:border-b-0 lg:border-r lg:p-4">
                    <Link
                        href="/"
                        className="mb-4 block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-100 transition hover:text-violet-200"
                        aria-label="Go to Corruchart home"
                    >
                        CORRUCHART
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                                Navigation
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {!currentBranchVisible && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentBranchVisible(true)}
                                    className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                    aria-label="Show current branch"
                                    title="Show current branch"
                                >
                                    <SlidersHorizontal className="size-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setSidebarVisible(false)}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Hide navigation sidebar"
                                title="Hide navigation sidebar"
                            >
                                <PanelLeftClose className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search 1,616 interests"
                            className="h-10 w-full border border-white/10 bg-[#17181A] pl-9 pr-9 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-violet-400/70"
                            aria-label="Search interests"
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
                        <div className="mt-2 border border-white/10 bg-[#17181A] p-1">
                            {searchResults.length ? (
                                searchResults.map((result) => (
                                    <button
                                        type="button"
                                        key={result.id}
                                        onClick={() => selectSearchResult(result.id)}
                                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-violet-400/10"
                                    >
                                        <span className="min-w-0 truncate text-xs font-semibold text-neutral-200">
                                            {result.label}
                                        </span>
                                        <span className="shrink-0 text-[9px] uppercase tracking-wider text-neutral-600">
                                            {result.tags[0] ?? "catalog"}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <p className="px-3 py-3 text-xs text-neutral-500">No interests found.</p>
                            )}
                        </div>
                    )}

                    <div className="mt-4 space-y-1.5">
                        {INTEREST_ROOTS.map((rootId) => {
                            const root = getNode(rootId);
                            const isSelected = selectedId === rootId;
                            return (
                                <button
                                    type="button"
                                    key={rootId}
                                    onClick={() => toggleNode(rootId)}
                                    className={`group flex w-full cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition ${isSelected
                                        ? "border-violet-400/50 bg-violet-400/10"
                                        : "border-white/[0.07] bg-white/[0.025] hover:border-violet-400/30 hover:bg-violet-400/[0.06]"
                                        }`}
                                >
                                    <span className="flex size-7 shrink-0 items-center justify-center border border-violet-300/30 bg-violet-400/10 text-[10px] font-bold text-violet-200">
                                        {root.label.slice(0, 1)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold tracking-wide text-neutral-200">
                                            {root.label}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] text-neutral-500">
                                            {root.children.length} authored branches
                                        </span>
                                    </span>
                                    {expanded.has(rootId) ? (
                                        <ChevronDown className="size-3.5 text-violet-300" />
                                    ) : (
                                        <ChevronRight className="size-3.5 text-neutral-600 transition group-hover:text-violet-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                        {currentBranchVisible && (
                            <div className="mt-4 border-t border-white/[0.07] pt-4">
                            <div className="flex items-center justify-between gap-2 text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="size-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Current branch</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentBranchVisible(false)}
                                    className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                    aria-label="Hide current branch"
                                    title="Hide current branch"
                                >
                                    <ChevronDown className="size-3.5" />
                                </button>
                            </div>
                            <div className="mt-3 border border-white/[0.07] bg-[#17181A] p-3">
                                <p className="text-sm font-bold text-violet-200">{selectedNode.label}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-600">
                                    {selectedNode.eyebrow ?? "CATALOG INTEREST"}
                                </p>
                                {descriptionVisibleId === selectedId && selectedDescription && (
                                    <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                                        {selectedDescription}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {selectedNode.tags.slice(0, 4).map((tag) => (
                                        <span key={tag} className="border border-violet-300/15 bg-violet-300/[0.06] px-1.5 py-1 text-[9px] uppercase tracking-wider text-violet-200/70">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            </div>
                        )}
                    </aside>
                )}

                <section className="relative flex min-h-[620px] min-w-0 flex-col bg-[#191B1C]">
                    {!sidebarVisible && (
                        <button
                            type="button"
                            onClick={() => setSidebarVisible(true)}
                            className="absolute left-0 top-3 z-20 flex size-9 cursor-pointer items-center justify-center border border-white/10 bg-[#1D1E21] text-neutral-400 transition hover:border-violet-400/50 hover:bg-violet-400/10 hover:text-violet-200"
                            aria-label="Show navigation sidebar"
                            title="Show navigation sidebar"
                        >
                            <PanelLeftOpen className="size-4" />
                        </button>
                    )}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] py-3 ${sidebarVisible ? "px-5 sm:px-7" : "pl-12 pr-5 sm:pl-12 sm:pr-7"}`}>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                            <span className="text-violet-300">{graph.positions.length}</span> visible nodes
                            <span className="text-neutral-700">/</span>
                            <span>{graph.edges.length} connections</span>
                            <span className="text-neutral-700">/</span>
                            <span>{OPTIONS.length.toLocaleString()} interests</span>
                        </div>
                        <div className="flex items-center gap-1 border border-white/[0.07] bg-[#17181A] p-1">
                            <button
                                type="button"
                                onClick={() => setZoom((current) => Math.max(0.5, current - 0.1))}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Zoom out"
                            >
                                <Minus className="size-3.5" />
                            </button>
                            <span className="w-12 text-center text-[10px] font-bold text-neutral-400">{Math.round(zoom * 100)}%</span>
                            <button
                                type="button"
                                onClick={() => setZoom((current) => Math.min(1.25, current + 0.1))}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Zoom in"
                            >
                                <Plus className="size-3.5" />
                            </button>
                            <span className="mx-1 h-4 w-px bg-white/10" />
                            <button
                                type="button"
                                onClick={resetView}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Reset interest web"
                            >
                                <RotateCcw className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom(0.72)}
                                className="flex size-7 cursor-pointer items-center justify-center text-neutral-500 transition hover:bg-violet-400/10 hover:text-violet-200"
                                aria-label="Fit interest web"
                            >
                                <Maximize2 className="size-3.5" />
                            </button>
                            <span className="mx-1 h-4 w-px bg-white/10" />
                            <button
                                type="button"
                                onClick={() => setAnimationsEnabled((current) => !current)}
                                className={`flex size-7 cursor-pointer items-center justify-center transition hover:bg-violet-400/10 hover:text-violet-200 ${animationsEnabled ? "text-neutral-500" : "bg-violet-400/10 text-violet-200"}`}
                                aria-label={animationsEnabled ? "Disable animations" : "Enable animations"}
                                title={animationsEnabled ? "Disable animations" : "Enable animations"}
                                aria-pressed={!animationsEnabled}
                            >
                                {animationsEnabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setAutoPanEnabled((current) => !current)}
                                className={`flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap border px-2 text-[9px] font-bold uppercase tracking-[0.12em] transition ${autoPanEnabled ? "border-violet-300/35 bg-violet-400/10 text-violet-100 hover:border-violet-300/60" : "border-white/10 bg-transparent text-neutral-500 hover:border-violet-400/40 hover:text-violet-200"}`}
                                aria-label={autoPanEnabled ? "Disable auto-pan" : "Enable auto-pan"}
                                title={autoPanEnabled ? "Disable auto-pan" : "Enable auto-pan"}
                                aria-pressed={autoPanEnabled}
                            >
                                <LocateFixed className="size-3.5" />
                                <span>Auto-pan</span>
                                <span className="text-[8px] tracking-[0.08em]">{autoPanEnabled ? "ON" : "OFF"}</span>
                            </button>
                        </div>
                    </div>

                    <div
                        className={`relative flex-1 overflow-hidden bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:28px_28px] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                        ref={graphViewportRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onWheel={handleWheel}
                    >
                        <div
                            className="absolute left-0 top-0 will-change-transform"
                            style={{
                                width: graph.width,
                                height: graph.height,
                                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                                transformOrigin: "0 0",
                                transition: isDragging || !animationsEnabled ? "none" : `transform ${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                            }}
                        >
                            <svg
                                className="pointer-events-none absolute inset-0 overflow-visible"
                                width={graph.width}
                                height={graph.height}
                                aria-hidden="true"
                            >
                                <defs>
                                    <linearGradient id="branch-line" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.72" />
                                        <stop offset="100%" stopColor="#6D5CA8" stopOpacity="0.18" />
                                    </linearGradient>
                                </defs>
                                {graph.edges.map((edge) => (
                                    <path
                                        key={edge.id}
                                        className="interest-edge"
                                        d={edgePath(edge)}
                                        fill="none"
                                        stroke="url(#branch-line)"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 7"
                                        style={{
                                            animationDelay: `${motionFast ? 0 : Math.min(edge.child.depth * MOTION_STAGGER, MAX_MOTION_STAGGER)}ms`,
                                            animationDuration: `${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms`,
                                        }}
                                    />
                                ))}
                            </svg>

                            {renderedPositions.map((node) => {
                                const exitingNode = "exitX" in node
                                    ? (node as ExitingNode)
                                    : undefined;
                                const isExiting = Boolean(exitingNode);
                                const isEntering = enteringNodeIds.has(node.id) && !isExiting;
                                const isSelected = selectedId === node.id;
                                const isExpanded = expanded.has(node.id);
                                const parent = !isExiting && node.parentId
                                    ? visiblePositionsById.get(node.parentId)
                                    : undefined;
                                return (
                                    <button
                                        type="button"
                                        key={node.id}
                                        onPointerDown={isExiting ? undefined : (event) => event.stopPropagation()}
                                        onPointerUp={isExiting ? undefined : (event) => {
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
                                            : isEntering
                                                ? () => setEnteringNodeIds((current) => {
                                                    if (!current.has(node.id)) return current;
                                                    const next = new Set(current);
                                                    next.delete(node.id);
                                                    return next;
                                                })
                                                : undefined}
                                        aria-hidden={isExiting}
                                        tabIndex={isExiting ? -1 : undefined}
                                        className={`interest-node absolute flex cursor-pointer flex-col border p-3 text-center ${isEntering ? "interest-node-enter" : ""} ${isExiting
                                            ? "interest-node-exit pointer-events-none border-white/10 bg-[#1F2023]"
                                            : isSelected
                                                ? "border-violet-300/80 bg-[#29233A]"
                                                : "border-white/10 bg-[#1F2023] hover:border-violet-300/45 hover:bg-[#292A2D]"
                                            }`}
                                        style={{
                                            width: CARD_WIDTH,
                                            height: CARD_HEIGHT,
                                            transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                                            transitionDuration: `${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms`,
                                            animationDuration: `${motionFast ? FAST_MOTION_DURATION : MOTION_DURATION}ms`,
                                            animationDelay: `${isExiting
                                                ? motionFast ? 0 : Math.max(0, maxExitingDepth - node.depth) * MOTION_STAGGER
                                                : node.parentId
                                                    ? motionFast ? 0 : Math.min(node.depth * MOTION_STAGGER, MAX_MOTION_STAGGER)
                                                    : 0}ms`,
                                            "--node-x": `${node.x}px`,
                                            "--node-y": `${node.y}px`,
                                            "--reveal-x": `${isExiting ? node.x : parent?.x ?? node.x}px`,
                                            "--reveal-y": `${isExiting ? node.y : parent?.y ?? node.y}px`,
                                            "--exit-x": `${exitingNode?.exitX ?? node.x}px`,
                                            "--exit-y": `${exitingNode?.exitY ?? node.y}px`,
                                        } as CSSProperties}
                                    >
                                        <span className="flex shrink-0 items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300/75">
                                            <span className="truncate">{node.eyebrow ?? "CATALOG"}</span>
                                            {node.hasChildren && (isExpanded ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />)}
                                        </span>
                                        <span className="flex min-h-0 flex-1 items-center justify-center text-center text-base font-bold leading-tight tracking-wide text-neutral-100">
                                            {node.label}
                                        </span>
                                        <span className="flex shrink-0 items-center justify-center gap-2 text-[9px] text-neutral-500">
                                            {node.hasChildren ? (
                                                <span className="text-sm font-bold leading-none text-violet-200">
                                                    {node.children.length}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                                                    END
                                                </span>
                                            )}
                                            <span className={`size-1.5 rounded-full ${node.source === "authored" ? "bg-violet-300" : "bg-neutral-600"}`} />
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
                    transition: transform ${MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), border-color 120ms ease, background-color 120ms ease;
                    will-change: transform;
                }

                .interest-node-enter {
                    animation: interest-node-in ${MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .interest-node-exit {
                    animation: interest-node-out ${MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .interest-edge {
                    animation: interest-edge-in ${MOTION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .animations-disabled .interest-node,
                .animations-disabled .interest-edge {
                    animation: none !important;
                    transition: none !important;
                }

                @keyframes interest-node-in {
                    from {
                        opacity: 0;
                        transform: translate3d(var(--reveal-x), var(--reveal-y), 0) scale(0.82);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(var(--node-x), var(--node-y), 0) scale(1);
                    }
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

                @keyframes interest-edge-in {
                    from {
                        opacity: 0.1;
                        stroke-dashoffset: 11;
                    }
                    to {
                        opacity: 1;
                        stroke-dashoffset: 0;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .interest-node,
                    .interest-edge {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </main>
    );
}