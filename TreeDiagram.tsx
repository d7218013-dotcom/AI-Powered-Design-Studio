
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ProjectTreeNode, NodePosition } from '../types';

interface TreeDiagramProps {
  data: ProjectTreeNode;
  nodePositions: Record<string, NodePosition>;
  onPositionsUpdate: (positions: Record<string, NodePosition>) => void;
  selectedNodeId?: string;
  onSelectNode: (node: ProjectTreeNode) => void;
}

export const TreeDiagram: React.FC<TreeDiagramProps> = ({ 
  data, 
  nodePositions, 
  onPositionsUpdate, 
  selectedNodeId, 
  onSelectNode 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);

    // ネオンフィルター
    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
      const glow = defs.append('filter').attr('id', 'neonGlow').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
      glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      glow.append('feFlood').attr('flood-color', 'currentColor').attr('flood-opacity', '0.8');
      glow.append('feComposite').attr('in2', 'blur').attr('operator', 'in');
      glow.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);
    }

    let g = svg.select<SVGGElement>('g.main-container');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-container');
      const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom as any);
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));
    }

    const root = d3.hierarchy(JSON.parse(JSON.stringify(data)));
    const nodesData = root.descendants();
    const linksData = root.links();

    const categoryColors = { strategy: '#fbbf24', design: '#ec4899', implementation: '#06b6d4', root: '#ffffff' };

    // 初期配置の計算と「完全固定」
    nodesData.forEach((d: any) => {
      d.radius = d.depth === 0 ? 85 : (d.depth === 1 ? 65 : 50);
      d.color = d.depth === 0 ? categoryColors.root : ((categoryColors as any)[d.data.category] || categoryColors.design);

      const saved = nodePositions[d.data.id];
      if (saved) {
        d.x = saved.x;
        d.y = saved.y;
      } else {
        const siblingIndex = d.parent ? d.parent.children?.indexOf(d) || 0 : 0;
        const totalSiblings = d.parent ? d.parent.children?.length || 1 : 1;
        d.x = d.parent ? d.parent.x + (siblingIndex - (totalSiblings - 1) / 2) * 250 : 0;
        d.y = d.depth * 200;
      }
      
      // 最初から fx, fy を設定して固定する
      d.fx = d.x;
      d.fy = d.y;
    });

    const hexPoints = (radius: number) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - (Math.PI / 2);
        points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
      }
      return d3.line()([points[0], points[1], points[2], points[3], points[4], points[5]]) + "Z";
    };

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation(nodesData as any)
        .force("link", d3.forceLink(linksData).id((d: any) => d.data.id).distance(160).strength(1))
        .stop(); // 物理演算を停止しておく
    } else {
      simulationRef.current.nodes(nodesData as any);
      (simulationRef.current.force("link") as d3.ForceLink<any, any>).links(linksData);
    }

    const link = g.selectAll<SVGLineElement, any>('.link').data(linksData, (d: any) => `${d.source.data.id}-${d.target.data.id}`);
    link.exit().remove();
    const linkEnter = link.enter().append('line').attr('class', 'link').attr('stroke-width', 2.5).style('pointer-events', 'none');
    const linkMerged = linkEnter.merge(link);
    linkMerged.attr('stroke', (d: any) => d.target.color).attr('stroke-opacity', 0.2).attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);

    const node = g.selectAll<SVGGElement, any>('.node').data(nodesData, (d: any) => d.data.id);
    node.exit().remove();
    const nodeEnter = node.enter().append('g').attr('class', 'node').style('cursor', 'grab').on('click', (event, d) => { event.stopPropagation(); onSelectNode(d.data); });
    nodeEnter.append('path').attr('class', 'hex-base').style('fill', '#000').style('fill-opacity', 0.95);
    nodeEnter.append('path').attr('class', 'hex-neon').style('fill', 'none');
    nodeEnter.append('text').attr('class', 'node-label').attr('dy', '0.35em').attr('text-anchor', 'middle');

    const nodeMerged = nodeEnter.merge(node);
    nodeMerged.each(function(d: any) {
      const group = d3.select(this);
      const isSelected = d.data.id === selectedNodeId;
      group.select('.hex-base').attr('d', hexPoints(d.radius));
      group.select('.hex-neon').attr('d', hexPoints(d.radius)).attr('stroke', d.color).attr('stroke-width', isSelected || d.depth === 0 ? 4 : 2).style('filter', 'url(#neonGlow)').style('color', d.color);
      group.select('.node-label').text(d.data.name).attr('fill', '#fff').style('font-weight', d.depth === 0 ? '900' : '700').style('font-size', `${d.radius * (d.depth === 0 ? 0.18 : 0.22)}px`).style('letter-spacing', '0.12em').style('text-transform', 'uppercase').style('pointer-events', 'none');
      group.attr("transform", `translate(${d.x},${d.y})`);
    });

    nodeMerged.call(d3.drag<any, any>()
      .on("start", (event, d) => { d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; nodeMerged.filter(n => n === d).attr("transform", `translate(${event.x},${event.y})`); linkMerged.filter(l => l.source === d || l.target === d).attr("x1", l => l.source.x).attr("y1", l => l.source.y).attr("x2", l => l.target.x).attr("y2", l => l.target.y); })
      .on("end", (event, d) => { d.fx = d.x; d.fy = d.y; onPositionsUpdate({ [d.data.id]: { x: d.x, y: d.y } }); })
    );

  }, [data, selectedNodeId, nodePositions]); 

  return (
    <div ref={containerRef} className="w-full h-full bg-[#010101] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <svg ref={svgRef} className="w-full h-full relative z-10" />
      <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2">
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2"><div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" /><span className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em]">Project Hub</span></div>
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            {[{ color: '#fbbf24', label: 'Strategy' }, { color: '#ec4899', label: 'Design' }, { color: '#06b6d4', label: 'Implementation' }].map(cat => (
              <div key={cat.label} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{cat.label}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
