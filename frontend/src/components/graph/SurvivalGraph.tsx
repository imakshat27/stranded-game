import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Focus, Maximize2, GitBranch } from "lucide-react";
import type { GraphNode, GraphEdge } from "../../types/graph";

type CircleData = GraphNode & {
  selectedHere: boolean;
  inspect: () => void;
  [key: string]: unknown;
};
function CircleNode({ data }: NodeProps<Node<CircleData>>) {
  const summary = `${data.action_name || data.label}. ${data.provenance === "actual" ? "Your recorded move" : "Hypothetical state"}. Health ${data.vitals?.health ?? "unknown"}, water ${data.vitals?.water ?? "unknown"}.`;
  return (
    <div
      className={`circle-state ${data.provenance} ${data.traversal || ""} ${data.selectedHere ? "pinned" : ""} ${data.is_goal ? "goal" : ""}`}
      title={summary}
      role="button"
      tabIndex={0}
      aria-label={summary}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          data.inspect();
        }
      }}
    >
      <Handle type="target" position={Position.Left} />
      <span>
        {data.is_goal
          ? "✓"
          : data.provenance === "actual"
            ? (data.turn ?? "●")
            : data.traversal === "current"
              ? "◎"
              : "○"}
      </span>
      <small>{data.action_name || data.label}</small>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { circle: CircleNode };
export function SurvivalGraph(props: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentId?: string;
  onSelect?: (node: GraphNode) => void;
  onFocusCurrent?: () => void;
  title?: string;
}) {
  return (
    <ReactFlowProvider>
      <GraphContent {...props} />
    </ReactFlowProvider>
  );
}
function GraphContent({
  nodes,
  edges,
  currentId,
  onSelect,
  onFocusCurrent,
  title = "Survival state graph",
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentId?: string;
  onSelect?: (node: GraphNode) => void;
  onFocusCurrent?: () => void;
  title?: string;
}) {
  const [pinned, setPinned] = useState<string | null>(null);
  const [pinnedAt, setPinnedAt] = useState(currentId);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const flow = useReactFlow();
  const selectedId =
    pinned && pinnedAt === currentId && nodes.some((n) => n.id === pinned)
      ? pinned
      : currentId || nodes[0]?.id;
  const selected = nodes.find((n) => n.id === (hovered || selectedId));
  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const parents = new Map(edges.map((e) => [e.target, e.source]));
    const children = new Map<string, string[]>();
    edges.forEach((e) =>
      children.set(e.source, [...(children.get(e.source) || []), e.target]),
    );
    const ancestry = new Set<string>();
    let ancestor: string | undefined = selectedId;
    while (ancestor && !ancestry.has(ancestor)) {
      ancestry.add(ancestor);
      ancestor = parents.get(ancestor);
    }
    const visible = nodes.filter((n) => {
      let p = parents.get(n.id);
      const seen = new Set<string>();
      while (p && !seen.has(p)) {
        if (collapsed.has(p) && n.provenance !== "actual") return false;
        seen.add(p);
        p = parents.get(p);
      }
      return (
        !focused ||
        n.provenance === "actual" ||
        ancestry.has(n.id) ||
        parents.get(n.id) === selectedId ||
        (parents.get(n.id) === parents.get(selectedId || "") &&
          n.depth === byId.get(selectedId || "")?.depth)
      );
    });
    const ids = new Set(visible.map((n) => n.id));
    const positions = new Map<string, { x: number; y: number }>();
    let row = 0;
    const walk = (id: string, depth: number) => {
      if (positions.has(id)) return;
      positions.set(id, { x: depth * 165, y: 0 });
      const kids = (children.get(id) || []).filter((k) => ids.has(k));
      const start = row;
      if (!kids.length) row++;
      else kids.forEach((k) => walk(k, depth + 1));
      positions.set(id, { x: depth * 165, y: (start + row - 1) * 55 });
    };
    visible
      .filter((n) => !ids.has(parents.get(n.id) || ""))
      .forEach((n) => walk(n.id, 0));
    if (focused) {
      const alternatives = visible.filter(
        (n) => parents.get(n.id) === selectedId && n.provenance !== "actual",
      );
      if (alternatives.length > 3) {
        const anchor = positions.get(selectedId || "") || { x: 0, y: 0 };
        const rows = Math.ceil(alternatives.length / 3);
        const middle = (rows - 1) * 60;
        visible
          .filter((n) => n.provenance === "actual" || ancestry.has(n.id))
          .forEach((n) => {
            const old = positions.get(n.id)!;
            positions.set(n.id, { x: old.x, y: middle });
          });
        alternatives.forEach((n, i) =>
          positions.set(n.id, {
            x: anchor.x + 180 + (i % 3) * 155,
            y: Math.floor(i / 3) * 120,
          }),
        );
      }
    }
    return {
      nodes: visible.map((n) => ({
        id: n.id,
        type: "circle",
        position: positions.get(n.id) || { x: 0, y: 0 },
        data: {
          ...n,
          selectedHere: n.id === selectedId,
          inspect: () => {
            setPinned(n.id);
            setPinnedAt(currentId);
            onSelect?.(n);
          },
        },
        ariaLabel: `${n.provenance === "actual" ? "Recorded" : "Simulated"}: ${n.action_name || n.label}`,
        width: 64,
        height: 64,
      })),
      edges: edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .map((e) => ({
          ...e,
          style: {
            stroke:
              byId.get(e.target)?.provenance === "actual"
                ? "#64c9b0"
                : "#6f90ad",
            strokeWidth: 2,
            strokeDasharray:
              byId.get(e.target)?.provenance === "actual" ? undefined : "5 5",
          },
        })),
      total: visible.length,
    };
  }, [nodes, edges, selectedId, focused, collapsed, onSelect, currentId]);
  const viewRef = useRef({ nodes: layout.nodes, edges, currentId, focused });
  viewRef.current = { nodes: layout.nodes, edges, currentId, focused };
  const viewKey = `${layout.total}:${focused}:${currentId}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const view = viewRef.current;
      const nearby = view.focused && view.currentId
        ? view.nodes.filter(n => n.id === view.currentId || view.edges.some(e => e.source === view.currentId && e.target === n.id))
        : view.nodes;
      void flow.fitView({ nodes: nearby, padding: .3, maxZoom: 1.05, minZoom: view.focused ? .65 : .08, duration: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [viewKey, flow]);
  return (
    <section className="survival-graph" aria-label={title}>
      <div className="graph-toolbar">
        <span>
          {layout.total} / {nodes.length} states
        </span>
        <button
          onClick={() => {
            setPinned(null);
            setFocused(true);
            setCollapsed(new Set());
            onFocusCurrent?.();
            const nearby = layout.nodes.filter(n => n.id === currentId || edges.some(e => e.source === currentId && e.target === n.id));
            void flow.fitView({ nodes: nearby, padding: .3, maxZoom: 1.05, minZoom: .65 });
          }}
        >
          <Focus size={15} /> Focus current turn
        </button>
        <button
          onClick={() => {
            setFocused(!focused);
            setCollapsed(new Set());
          }}
        >
          <GitBranch size={15} />{" "}
          {focused ? "All recorded nodes" : "Focus branch"}
        </button>
        <button
          onClick={() => {
            void flow.fitView({ padding: 0.25, maxZoom: 1.05 });
          }}
        >
          <Maximize2 size={15} /> Fit
        </button>
        <button
          onClick={() => {
            setPinned(null);
            setFocused(true);
            setCollapsed(new Set());
          }}
        >
          Reset
        </button>
      </div>
      <div className="graph-canvas">
        <ReactFlow
          nodes={layout.nodes}
          edges={layout.edges}
          nodeTypes={nodeTypes}
          minZoom={0.08}
          maxZoom={2}
          fitView
          fitViewOptions={{ maxZoom: 1.05 }}
          nodesDraggable={false}
          onNodeMouseEnter={(_, n) => setHovered(n.id)}
          onNodeMouseLeave={() => setHovered(null)}
          onNodeClick={(_, n) => {
            setPinned(n.id);
            setPinnedAt(currentId);
            const item = nodes.find((x) => x.id === n.id);
            if (item) onSelect?.(item);
          }}
        >
          <Background color="#324e54" gap={22} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="graph-legend">
        <span className="legend-actual">● Your moves</span>
        <span className="legend-simulated">◌ Possible states</span>
        <span className="legend-selected">● Selected / inspecting</span>
        <span>◎ Expanding</span>
        <span>✓ Escape-ready goal</span>
      </div>
      {selected && (
        <div className="node-details" aria-live="polite">
          <div>
            <strong>{selected.action_name || selected.label}</strong>
            <p>
              {selected.provenance === "actual"
                ? "Recorded expedition outcome"
                : "Simulation · real events may differ"}
              {selected.turn !== undefined ? ` · Turn ${selected.turn}` : ""}
            </p>
          </div>
          <div className="node-vitals">
            {selected.vitals &&
              Object.entries(selected.vitals).map(([key, value]) => (
                <span key={key}>
                  {key}
                  <b>{Math.round(value)}</b>
                </span>
              ))}
          </div>
          <button
            disabled={!edges.some(e => e.source === selected.id && nodes.some(n => n.id === e.target && n.provenance !== "actual"))}
            onClick={() =>
              setCollapsed((prev) => {
                const next = new Set(prev);
                if (next.has(selected.id)) next.delete(selected.id);
                else next.add(selected.id);
                return next;
              })
            }
          >
            {collapsed.has(selected.id) ? "Expand" : "Collapse"} branch
          </button>
          <details>
            <summary>State details & costs</summary>
            <p>{selected.ai_commentary}</p>
            <p>
              Path cost (g): {selected.g_cost ?? "—"} · Remaining estimate (h):{" "}
              {selected.h_cost ?? "—"} · Priority (f): {selected.f_cost ?? "—"}
            </p>
            <p>
              {selected.inventory &&
                Object.entries(selected.inventory)
                  .map(([k, v]) => `${k.replaceAll("_", " ")}: ${v}`)
                  .join(" · ")}
            </p>
            <p>
              Boat:{" "}
              {(selected.boat_parts &&
                Object.entries(selected.boat_parts)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(", ")) ||
                "No parts built"}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
