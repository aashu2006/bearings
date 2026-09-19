import { useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { GraphNode } from '@dune/shared/types';

/** Per-kind colours for the node badge and the map legend, in the desert dusk palette. */
export const KIND_STYLES: Record<GraphNode['kind'], { badge: string; swatch: string; legend: string }> = {
  entry: {
    badge: 'text-rose-300 border-rose-500/40 bg-rose-950/40',
    swatch: 'border-rose-500/50 bg-rose-950/50',
    legend: 'entry',
  },
  route: {
    badge: 'text-[#F0DFB4] border-[#C89B6B]/50 bg-[#241C2E]/80',
    swatch: 'border-[#C89B6B]/50 bg-[#241C2E]',
    legend: 'routes',
  },
  service: {
    badge: 'text-purple-300 border-purple-500/40 bg-purple-950/40',
    swatch: 'border-purple-500/50 bg-purple-950/50',
    legend: 'services',
  },
  model: {
    badge: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40',
    swatch: 'border-emerald-500/50 bg-emerald-950/50',
    legend: 'models',
  },
  util: {
    badge: 'text-teal-300 border-teal-500/40 bg-teal-950/40',
    swatch: 'border-teal-500/50 bg-teal-950/50',
    legend: 'utils',
  },
};

export type GraphNodeViewData = {
  node: GraphNode;
  isRecommended: boolean;
  isAffected: boolean;
  isDimmed: boolean;
  isSelected: boolean;
  onSelectNode: (path: string) => void;
};

export function CustomGraphNode({ data }: NodeProps<Node<GraphNodeViewData>>) {
  const [isHovered, setIsHovered] = useState(false);

  const { node, isRecommended, isAffected, isDimmed, isSelected } = data;

  // Node container styling
  let containerClasses = 'border bg-[#0A0B14] px-3 py-2 text-left font-mono-dune cursor-pointer transition-all duration-150 min-w-[170px] max-w-[220px] shadow-sm select-none rounded-lg text-[#EAE2D4]';

  if (isRecommended) {
    containerClasses += ' border-[#F0DFB4] ring-2 ring-[#C89B6B]/80 bg-[#241C2E] scale-105 z-30 shadow-[0_0_18px_rgba(240,223,180,0.35)]';
  } else if (isAffected) {
    containerClasses += ' border-[#C89B6B] ring-1 ring-[#C89B6B]/60 bg-[#171833] z-20 shadow-[0_0_12px_rgba(200,155,107,0.25)]';
  } else if (isSelected) {
    containerClasses += ' border-[#F0DFB4] ring-1 ring-[#F0DFB4]/80 bg-[#171833] z-20';
  } else if (isDimmed) {
    containerClasses += ' border-[#3A2B33]/50 opacity-30 bg-[#0A0B14] hover:opacity-100 hover:border-[#57392C]';
  } else if (node.entryPoint) {
    containerClasses += ' border-[#C89B6B]/80 hover:border-[#F0DFB4] hover:bg-[#171833]/60';
  } else {
    containerClasses += ' border-[#3A2B33] hover:border-[#C89B6B]/70 hover:bg-[#171833]/60';
  }

  return (
    <div
      id={`node-${node.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => data.onSelectNode(node.id)}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#C89B6B] !border-[#0A0B14] !-left-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#C89B6B] !border-[#0A0B14] !-right-1"
      />

      <div className={containerClasses}>
        {/* Recommended / Affected tag */}
        {isRecommended && (
          <div className="text-[9px] font-bold font-mono-dune text-[#F0DFB4] tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0DFB4] shadow-[0_0_6px_#F0DFB4]" />
            RECOMMENDED ATTACH
          </div>
        )}
        {isAffected && !isRecommended && (
          <div className="text-[9px] font-semibold font-mono-dune text-[#C89B6B] tracking-wider uppercase mb-1">
            RELATED TO ANSWER
          </div>
        )}

        {/* File Name */}
        <div className="text-xs font-semibold font-mono-dune text-[#EAE2D4] truncate tracking-tight">
          {node.label}
        </div>

        {/* Kind badge and inbound count */}
        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <span
            className={`text-[10px] px-1.5 border uppercase tracking-wider font-mono-dune rounded ${KIND_STYLES[node.kind].badge}`}
          >
            {node.entryPoint && node.kind !== 'entry' ? `${node.kind} · entry` : node.kind}
          </span>
          <span className="text-[10px] text-[#C89B6B]/80 font-mono-dune" title="Imported by">
            ← {node.importedByCount}
          </span>
        </div>
      </div>

      {/* Hover Tooltip - path, imports in, imports out */}
      {isHovered && (
        <div className="absolute z-50 bottom-full left-0 mb-2 p-2.5 bg-[#0A0B14] border border-[#3A2B33] shadow-2xl font-mono-dune text-[11px] text-[#EAE2D4] min-w-[210px] pointer-events-none rounded-lg">
          <div className="text-[#F0DFB4] font-semibold text-xs border-b border-[#3A2B33] pb-1 mb-1.5 break-all">
            {node.id}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="bg-[#171833]/60 p-1 border border-[#3A2B33] rounded">
              <span className="text-[#C89B6B] block text-[9px] uppercase">IMPORTS</span>
              <span className="font-bold text-[#EAE2D4]">{node.importsCount}</span>
            </div>
            <div className="bg-[#171833]/60 p-1 border border-[#3A2B33] rounded">
              <span className="text-[#C89B6B] block text-[9px] uppercase">IMPORTED BY</span>
              <span className="font-bold text-[#EAE2D4]">{node.importedByCount}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[#C89B6B]/80">
            Cluster: <span className="text-[#EAE2D4]">{node.cluster}</span>
          </div>
        </div>
      )}
    </div>
  );
}
