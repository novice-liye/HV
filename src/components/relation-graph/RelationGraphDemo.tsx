// ============================================================
// RelationGraphDemo - 关系图模块（完整版）
// Canvas 力导向图 + 节点详情面板 + 势力筛选 + 跨模块跳转
// ============================================================

// 人物名称 → 拼音映射（全拼 + 首字母缩写）
const PERSON_PINYIN: Record<string, string> = {
  '曹操': 'caocao', '刘备': 'liubei', '孙权': 'sunquan', '诸葛亮': 'zhugeliang',
  '关羽': 'guanyu', '张飞': 'zhangfei', '周瑜': 'zhouyu', '赵云': 'zhaoyun',
  '吕布': 'lvbu', '董卓': 'dongzhuo', '司马懿': 'simayi', '陆逊': 'luxun',
  '姜维': 'jiangwei', '袁绍': 'yuanshao', '曹丕': 'caopi', '吕蒙': 'lvmeng',
  '孙策': 'sunce', '许褚': 'xuchu', '典韦': 'dianwei', '黄忠': 'huangzhong',
  '张角': 'zhangjiao', '刘璋': 'liuzhang', '司马师': 'simashi', '司马昭': 'simazhao',
  '司马炎': 'simayan', '刘禅': 'liushan', '邓艾': 'dengai', '钟会': 'zhonghui',
  '孙皓': 'sunhao', '王濬': 'wangjun', '王允': 'wangyun', '马超': 'machao',
  '庞统': 'pangtong', '张辽': 'zhangliao', '荀彧': 'xunyu', '郭嘉': 'guojia',
  '黄盖': 'huanggai', '鲁肃': 'lusu', '孙坚': 'sunjian', '魏延': 'weiyan',
  '马谡': 'masu', '太史慈': 'taishici', '甘宁': 'ganning', '凌统': 'lingtong',
  '诸葛瑾': 'zhugejin', '大乔': 'daqiao', '小乔': 'xiaoqiao', '刘协': 'liuxie',
  '何进': 'hejin', '貂蝉': 'diaochan', '袁术': 'yuanshu', '刘表': 'liubiao',
  '张鲁': 'zhanglu', '华佗': 'huatuo', '李傕': 'lijue', '张绣': 'zhangxiu',
  '蒋琬': 'jiangwan', '王凌': 'wangling', '毌丘俭': 'guanqiujian', '文钦': 'wenqin',
  '诸葛诞': 'zhugedan', '羊祜': 'yanghu',
  '曹植': 'caozhi', '陈宫': 'chengong', '法正': 'fazheng', '费祎': 'feiyi',
  '贾诩': 'jiaxu', '陆抗': 'lukang', '庞德': 'pangde', '孙尚香': 'sunshangxiang',
  '夏侯惇': 'xiahoudun', '夏侯渊': 'xiahouyuan', '徐庶': 'xushu',
};

// 预计算：人物ID → 全拼 + 首字母缩写
function getPersonPinyin(name: string): { full: string; abbr: string } {
  const full = PERSON_PINYIN[name] || '';
  const abbr = full.replace(/([a-z])[a-z]+/g, '$1');
  return { full, abbr };
}

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { RelationNode, RelationEdge } from '../../types';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { relationNodes, relationEdges, persons } from '../../data/persons';
import { events } from '../../data/events';
import { factions } from '../../data/factions';
import type { FactionId } from '../../types';

interface GraphNode extends RelationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isHighlighted: boolean;
  isFocused: boolean;
}

interface GraphEdge extends RelationEdge {
  highlighted: boolean;
}

const EDGE_COLORS: Record<string, string> = {
  ally: '#4AD97A',
  enemy: '#D94A4A',
  family: '#D9A84A',
  subordinate: '#4A90D9',
  rival: '#D97AD9',
  other: '#999',
};

const EDGE_LABELS: Record<string, string> = {
  ally: '联盟',
  enemy: '敌对',
  family: '亲属',
  subordinate: '从属',
  rival: '对手',
  other: '其他',
};

const ALL_FACTIONS: FactionId[] = ['wei', 'shu', 'wu', 'han', 'other'];

export const RelationGraphDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterFaction, setFilterFaction] = useState<FactionId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string; name: string; faction?: FactionId}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showDetail, setShowDetail] = useState(false); // 详情面板显隐
  const animRef = useRef<number>(0);
  const isComposingRef = useRef(false); // IME 组合状态
  const dragRef = useRef<{ nodeId: string | null; startX: number; startY: number; moved: boolean }>({
    nodeId: null, startX: 0, startY: 0, moved: false,
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (isComposingRef.current) return; // IME 组合期间不搜索
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const q = query.trim().toLowerCase();
    const results = persons
      .filter(p => {
        // 中文名匹配
        if (p.name.toLowerCase().includes(q)) return true;
        // 头衔匹配
        if (p.title && p.title.toLowerCase().includes(q)) return true;
        // 拼音匹配（全拼或首字母缩写）
        const py = getPersonPinyin(p.name);
        if (py.full && py.full.includes(q)) return true;
        if (py.abbr && py.abbr.includes(q)) return true;
        return false;
      })
      .slice(0, 8)
      .map(p => ({ id: p.id, name: p.name, faction: p.faction }));
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, []);

  const focusOnNode = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setShowDetail(false); // 选中后默认折叠详情
    setShowSearchResults(false);
    setSearchQuery('');
    // 直接同步修改 ref，确保下一帧立即生效
    nodesRef.current.forEach(n => {
      n.isFocused = n.id === nodeId;
      n.isHighlighted = false;
    });
    edgesRef.current.forEach(e => {
      e.highlighted = e.source === nodeId || e.target === nodeId;
      if (e.highlighted) {
        const otherId = e.source === nodeId ? e.target : e.source;
        const other = nodesRef.current.find(n => n.id === otherId);
        if (other) other.isHighlighted = true;
      }
    });
    // Reset pan and zoom for clean view
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // 根据筛选条件过滤可见节点
  const visibleNodeIds = useCallback((): Set<string> => {
    if (filterFaction === 'all') return new Set(relationNodes.map(n => n.id));
    return new Set(relationNodes.filter(n => {
      if (n.type === 'faction') return n.id === `f_${filterFaction}`;
      return n.faction === filterFaction;
    }).map(n => n.id));
  }, [filterFaction]);

  // 初始化节点
  const initNodes = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.3;
    const nodes: GraphNode[] = relationNodes.map((n, i) => {
      const angle = (i / relationNodes.length) * Math.PI * 2;
      const r = n.type === 'faction' ? maxR * 0.4 : maxR * 0.6 + Math.random() * maxR * 0.4;
      return {
        ...n,
        x: cx + Math.cos(angle) * r - cx,
        y: cy + Math.sin(angle) * r - cy,
        vx: 0,
        vy: 0,
        radius: n.type === 'faction' ? 30 : 18,
        isHighlighted: false,
        isFocused: false,
      };
    });
    nodesRef.current = nodes;
    edgesRef.current = relationEdges.map(e => ({ ...e, highlighted: false }));
  }, []);

  // 力导向模拟
  const simulate = useCallback((w: number, h: number) => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const visible = visibleNodeIds();
    if (nodes.length === 0) return;
    const halfW = w / 2;
    const halfH = h / 2;
    const maxExtent = Math.min(halfW, halfH) - 40; // 边界留 40px

    // 斥力（仅可见节点间）- 增强斥力让节点更分散
    for (let i = 0; i < nodes.length; i++) {
      if (!visible.has(nodes[i].id)) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (!visible.has(nodes[j].id)) continue;
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = 3000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // 引力（边）
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;
      if (!visible.has(source.id) || !visible.has(target.id)) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idealDist = source.type === 'faction' || target.type === 'faction' ? 160 : 120;
      const force = (dist - idealDist) * 0.005;
      const fx = (dx / Math.max(1, dist)) * force;
      const fy = (dy / Math.max(1, dist)) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // 中心引力（减弱，让节点更自由地分散）
    nodes.forEach(n => {
      if (!visible.has(n.id)) return;
      n.vx -= n.x * 0.001;
      n.vy -= n.y * 0.001;
    });

    // 更新位置 + 边界约束 + 碰撞检测
    nodes.forEach(n => {
      if (dragRef.current.nodeId === n.id) return;
      if (!visible.has(n.id)) return;
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      // 边界约束
      const extent = n.type === 'faction' ? maxExtent * 0.6 : maxExtent;
      n.x = Math.max(-extent, Math.min(extent, n.x));
      n.y = Math.max(-extent, Math.min(extent, n.y));
    });

    // 碰撞检测 - 防止节点重叠
    for (let i = 0; i < nodes.length; i++) {
      if (!visible.has(nodes[i].id)) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (!visible.has(nodes[j].id)) continue;
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const minDist = nodes[i].radius + nodes[j].radius + 8;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const fx = (dx / dist) * overlap * 0.5;
          const fy = (dy / dist) * overlap * 0.5;
          nodes[i].x -= fx;
          nodes[i].y -= fy;
          nodes[j].x += fx;
          nodes[j].y += fy;
        }
      }
    }
  }, [visibleNodeIds]);

  // 绘制
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const visible = visibleNodeIds();

    // Apply zoom and pan
    ctx.save();
    ctx.translate(cx + pan.x, cy + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // 绘制边
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;
      if (!visible.has(source.id) || !visible.has(target.id)) return;

      const sx = cx + source.x;
      const sy = cy + source.y;
      const tx = cx + target.x;
      const ty = cy + target.y;

      const isHighlighted = edge.highlighted || source.isHighlighted || target.isHighlighted;
      const isHovered = hoveredNode === edge.source || hoveredNode === edge.target;
      const isSelected = selectedNode === edge.source || selectedNode === edge.target;
      const isActive = isHighlighted || isHovered || isSelected;

      // Dim edges not connected to selected node
      const edgeDimmed = selectedNode && !isActive;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = EDGE_COLORS[edge.type] || '#999';
      ctx.globalAlpha = edgeDimmed ? 0.05 : (isActive ? 0.8 : 0.15);
      ctx.lineWidth = isActive ? 2.5 : 1;
      if (edge.type === 'enemy') {
        ctx.setLineDash([5, 4]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 边标签
      if (isActive) {
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        // 背景
        const labelText = edge.label || EDGE_LABELS[edge.type] || '';
        ctx.font = '12px "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(labelText).width;
        ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
        ctx.fillRect(mx - tw / 2 - 3, my - 12, tw + 6, 14);
        ctx.fillStyle = EDGE_COLORS[edge.type] || '#999';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, mx, my - 1);
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      if (!visible.has(node.id)) return;

      const nx = cx + node.x;
      const ny = cy + node.y;
      const isHovered = hoveredNode === node.id;
      const isActive = node.isHighlighted || node.isFocused;
      const isSelected = selectedNode === node.id;

      // When a node is selected, dim unrelated nodes
      const isRelated = selectedNode && (
        node.id === selectedNode ||
        node.isHighlighted ||
        node.isFocused ||
        edgesRef.current.some(e =>
          (e.source === selectedNode && e.target === node.id) ||
          (e.target === selectedNode && e.source === node.id)
        )
      );
      const dimmed = selectedNode && !isRelated;

      // 选中脉冲
      if (isSelected) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.strokeStyle = node.faction ? (factions[node.faction]?.color || '#c9a96e') : '#999';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + pulse * 0.4;
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + 6 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 光晕
      if (isActive || isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + 6, 0, Math.PI * 2);
        const fColor = node.faction ? (factions[node.faction]?.color || '#c9a96e') : '#999';
        ctx.fillStyle = `rgba(${parseInt(fColor.slice(1, 3), 16)}, ${parseInt(fColor.slice(3, 5), 16)}, ${parseInt(fColor.slice(5, 7), 16)}, 0.12)`;
        ctx.fill();
      }

      // 节点圆
      ctx.globalAlpha = dimmed ? 0.15 : 1;
      ctx.beginPath();
      ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
      const nodeFaction = node.faction ? factions[node.faction] : undefined;
      if (node.type === 'faction') {
        ctx.fillStyle = nodeFaction?.bgColor || 'rgba(153,153,153,0.15)';
        ctx.fill();
        ctx.strokeStyle = nodeFaction?.color || '#999';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = isActive || isHovered || isSelected
          ? (nodeFaction?.color || '#999')
          : (nodeFaction?.bgColor || 'rgba(153,153,153,0.15)');
        ctx.fill();
        ctx.strokeStyle = nodeFaction?.color || '#999';
        ctx.lineWidth = isActive || isHovered || isSelected ? 2.5 : 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 标签
      ctx.font = node.type === 'faction'
        ? 'bold 16px "Noto Serif SC", serif'
        : `${isActive || isHovered || isSelected ? '15px' : '13px'} "Noto Sans SC", sans-serif`;
      ctx.fillStyle = isActive || isHovered || isSelected ? '#e8e0d0' : 'rgba(232, 224, 208, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, nx, ny);
    });
    ctx.restore();
  }, [hoveredNode, selectedNode, visibleNodeIds, zoom, pan]);

  // 动画循环（使用 ref 避免回调变化导致动画重启）
  const simulateRef = useRef(simulate);
  const drawRef = useRef(draw);
  const initializedRef = useRef(false);
  useEffect(() => { simulateRef.current = simulate; }, [simulate]);
  useEffect(() => { drawRef.current = draw; }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 等待布局完成后再初始化
    const initTimer = setTimeout(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && !initializedRef.current) {
        initNodes(rect.width, rect.height);
        initializedRef.current = true;
      }
    }, 100);

    let running = true;
    const animate = () => {
      if (!running) return;
      const r = canvas.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      // 仅在尺寸变化时重设 canvas
      if (canvas.width !== Math.floor(r.width * dpr) || canvas.height !== Math.floor(r.height * dpr)) {
        canvas.width = r.width * dpr;
        canvas.height = r.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 如果节点未初始化，使用当前尺寸初始化
      if (!initializedRef.current) {
        initNodes(r.width, r.height);
        initializedRef.current = true;
      }
      simulateRef.current(r.width, r.height);
      drawRef.current(ctx, r.width, r.height);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      clearTimeout(initTimer);
      cancelAnimationFrame(animRef.current);
      initializedRef.current = false;
    };
  }, [initNodes]);

  // ---- EventBus 监听 ----
  useEffect(() => {
    const unsubs = [
      eventBus.on('relation:focusNode', (payload) => {
        const nodeId = payload as string;
        setSelectedNode(nodeId);
        nodesRef.current.forEach(n => {
          n.isFocused = n.id === nodeId;
          n.isHighlighted = false;
        });
        edgesRef.current.forEach(e => {
          e.highlighted = e.source === nodeId || e.target === nodeId;
          if (e.highlighted) {
            const otherId = e.source === nodeId ? e.target : e.source;
            const other = nodesRef.current.find(n => n.id === otherId);
            if (other) other.isHighlighted = true;
          }
        });
      }, 'relation-graph'),

      eventBus.on('relation:highlightNodes', (payload) => {
        const nodeIds = payload as string[];
        nodesRef.current.forEach(n => {
          n.isHighlighted = nodeIds.includes(n.id);
        });
        edgesRef.current.forEach(e => {
          e.highlighted = nodeIds.includes(e.source) || nodeIds.includes(e.target);
        });
      }, 'relation-graph'),

      eventBus.on('event:selected', () => {
        nodesRef.current.forEach(n => { n.isHighlighted = false; n.isFocused = false; });
        edgesRef.current.forEach(e => { e.highlighted = false; });
        setSelectedNode(null);
      }, 'relation-graph'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // 鼠标交互
  const getNodeAtPos = useCallback((mx: number, my: number, w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    // Reverse the zoom/pan transform
    const rx = (mx - cx - pan.x) / zoom + cx;
    const ry = (my - cy - pan.y) / zoom + cy;
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const dx = rx - (cx + n.x);
      const dy = ry - (cy + n.y);
      if (dx * dx + dy * dy < (n.radius + 4) * (n.radius + 4)) return n;
    }
    return null;
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragRef.current.nodeId) {
      const node = nodesRef.current.find(n => n.id === dragRef.current.nodeId);
      if (node) {
        node.x = mx - rect.width / 2;
        node.y = my - rect.height / 2;
        node.vx = 0;
        node.vy = 0;
        const dx = mx - dragRef.current.startX;
        const dy = my - dragRef.current.startY;
        if (dx * dx + dy * dy > 25) dragRef.current.moved = true;
      }
      return;
    }
    const node = getNodeAtPos(mx, my, rect.width, rect.height);
    setHoveredNode(node?.id || null);
  }, [getNodeAtPos]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const node = getNodeAtPos(mx, my, rect.width, rect.height);
    if (node) {
      dragRef.current = { nodeId: node.id, startX: mx, startY: my, moved: false };
    }
  }, [getNodeAtPos]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.nodeId && !dragRef.current.moved) {
      // 点击（非拖拽）→ 聚焦节点
      const nodeId = dragRef.current.nodeId;
      setSelectedNode(nodeId);
      setShowDetail(false); // 点击后默认折叠详情
      eventBus.emit('relation:focusNode', nodeId, 'relation-graph');
    }
    dragRef.current = { nodeId: null, startX: 0, startY: 0, moved: false };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  // 获取选中节点的详细信息
  const selectedPerson = selectedNode ? persons.find(p => p.id === selectedNode) : null;
  const selectedFaction = selectedNode?.startsWith('f_') ? factions[selectedNode.replace('f_', '') as FactionId] : null;

  const selectedNodeRelations = useMemo(() => {
    if (!selectedNode) return [];
    return relationEdges.filter(e => e.source === selectedNode || e.target === selectedNode);
  }, [selectedNode]);

  const selectedNodeEvents = useMemo(() => {
    if (!selectedPerson) return [];
    return events.filter(e => e.persons.includes(selectedPerson.id));
  }, [selectedPerson]);

  // 跳转到人物图鉴
  const handleGoToPersonGallery = useCallback((personId: string) => {
    eventBus.emit('relation:focusNode', personId, 'relation-graph');
    navigateToModule('person-gallery', 'relation-graph');
  }, []);

  // 跳转到时间线（查看相关事件）
  const handleGoToTimeline = useCallback((evtId: string) => {
    const evt = events.find(e => e.id === evtId);
    if (evt) eventBus.emit('event:selected', evt, 'relation-graph');
    navigateToModule('timeline', 'relation-graph');
  }, []);

  const hoveredPerson = hoveredNode ? persons.find(p => p.id === hoveredNode) : null;

  return (
    <div className="relation-graph-demo">
      <div className="relation-graph-demo__header">
        <h2 className="relation-graph-demo__title">🕸️ 人物关系图</h2>
        <p className="relation-graph-demo__subtitle">
          {selectedNode
            ? `${selectedPerson?.name || selectedFaction?.name || selectedNode} · ${selectedNodeRelations.length} 条关系`
            : `${relationNodes.length} 个节点 · ${relationEdges.length} 条关系 · 点击节点聚焦 · 拖拽移动`}
        </p>
      {/* 搜索框 */}
      <div className="relation-graph-demo__search" style={{ position: 'relative', display: 'inline-block', marginLeft: '16px' }}>
        <input
          type="text"
          placeholder="🔍 搜索人物..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={(e) => { isComposingRef.current = false; handleSearch((e.target as HTMLInputElement).value); }}
          onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 300)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: '6px',
            padding: '5px 12px',
            color: '#e8e0d0',
            fontSize: '13px',
            width: '180px',
            outline: 'none',
          }}
        />
        {showSearchResults && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: '6px', marginTop: '4px', zIndex: 100, maxHeight: '240px', overflowY: 'auto',
          }}>
            {searchResults.map(r => (
              <div
                key={r.id}
                style={{
                  padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseDown={() => focusOnNode(r.id)}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: r.faction ? (factions[r.faction]?.color || '#999') : '#999',
                }} />
                <span style={{ color: '#e8e0d0', fontSize: '13px' }}>{r.name}</span>
                {r.faction && <span style={{ color: 'rgba(232,224,208,0.4)', fontSize: '11px', marginLeft: 'auto' }}>{factions[r.faction]?.name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* 势力筛选 */}
      <div className="relation-graph-demo__filter">
        <button
          className={`relation-graph-demo__filter-btn ${filterFaction === 'all' ? 'relation-graph-demo__filter-btn--active' : ''}`}
          onClick={() => setFilterFaction('all')}
        >
          全部
        </button>
        {ALL_FACTIONS.map(f => {
          const fac = factions[f];
          if (!fac || fac.id === 'other') return null;
          return (
            <button
              key={f}
              className={`relation-graph-demo__filter-btn ${filterFaction === f ? 'relation-graph-demo__filter-btn--active' : ''}`}
              style={{ '--fc': fac.color, '--fb': fac.bgColor } as React.CSSProperties}
              onClick={() => setFilterFaction(f)}
            >
              {fac.name}
            </button>
          );
        })}
        <button
          className="relation-graph-demo__filter-btn"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedNode(null); setShowDetail(false); nodesRef.current.forEach(n => { n.isFocused = false; n.isHighlighted = false; }); edgesRef.current.forEach(e => { e.highlighted = false; }); }}
          title="重置视图"
        >
          🔄 重置
        </button>
      </div>

      <div className="relation-graph-demo__main">
        <canvas
          ref={canvasRef}
          className="relation-graph-demo__canvas"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredNode(null); dragRef.current = { nodeId: null, startX: 0, startY: 0, moved: false }; }}
          onWheel={handleWheel}
        />

        {/* 悬浮提示 */}
        {hoveredPerson && (
          <div className="relation-graph-demo__tooltip">
            <div className="relation-graph-demo__tooltip-name" style={{ color: factions[hoveredPerson.faction]?.color }}>
              {hoveredPerson.name}
            </div>
            <div className="relation-graph-demo__tooltip-title">{hoveredPerson.title}</div>
            <div className="relation-graph-demo__tooltip-faction">{factions[hoveredPerson.faction]?.name}</div>
            <div className="relation-graph-demo__tooltip-years">
              {hoveredPerson.birthYear || '?'}—{hoveredPerson.deathYear || '?'}年
            </div>
          </div>
        )}
      </div>

      {/* 选中节点提示按钮 + 详情面板 */}
      {selectedNode && !showDetail && (
        <div
          style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setShowDetail(true)}
            style={{
              background: 'rgba(201,169,110,0.15)',
              border: '1px solid rgba(201,169,110,0.4)',
              borderRadius: '8px',
              padding: '8px 20px',
              color: '#c9a96e',
              fontSize: '14px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            查看「{selectedPerson?.name || selectedFaction?.name || selectedNode}」的详情
            <span style={{ fontSize: '12px', opacity: 0.6 }}>点击展开</span>
          </button>
        </div>
      )}
      {selectedNode && showDetail && (
        <div className="relation-graph-demo__detail">
          <div className="relation-graph-demo__detail-header">
            {selectedPerson ? (
              <>
                <div
                  className="relation-graph-demo__detail-avatar"
                  style={{ borderColor: factions[selectedPerson.faction]?.color, color: factions[selectedPerson.faction]?.color }}
                >
                  {selectedPerson.name.charAt(0)}
                </div>
                <div className="relation-graph-demo__detail-meta">
                  <h3 className="relation-graph-demo__detail-name">{selectedPerson.name}</h3>
                  <div className="relation-graph-demo__detail-title">{selectedPerson.title}</div>
                  <div className="relation-graph-demo__detail-faction">{factions[selectedPerson.faction]?.name}</div>
                  <div className="relation-graph-demo__detail-years">
                    {selectedPerson.birthYear || '?'}—{selectedPerson.deathYear || '?'}年
                    {selectedPerson.birthYear && selectedPerson.deathYear && (
                      <span> · 享年{selectedPerson.deathYear - selectedPerson.birthYear}岁</span>
                    )}
                  </div>
                </div>
                <button
                  className="relation-graph-demo__detail-nav-btn"
                  onClick={() => handleGoToPersonGallery(selectedPerson.id)}
                >
                  👤 人物图鉴
                </button>
              </>
            ) : selectedFaction ? (
              <>
                <div
                  className="relation-graph-demo__detail-avatar"
                  style={{ borderColor: selectedFaction.color, color: selectedFaction.color, background: selectedFaction.bgColor }}
                >
                  {selectedFaction.name.charAt(0)}
                </div>
                <div className="relation-graph-demo__detail-meta">
                  <h3 className="relation-graph-demo__detail-name">{selectedFaction.name}</h3>
                  <div className="relation-graph-demo__detail-faction">势力节点</div>
                </div>
              </>
            ) : null}
            <button className="relation-graph-demo__detail-close" onClick={() => {
              setShowDetail(false);
            }}>✕</button>
          </div>

          {/* 关系列表 */}
          {selectedNodeRelations.length > 0 && (
            <div className="relation-graph-demo__detail-relations">
              <div className="relation-graph-demo__section-label">人物关系</div>
              {selectedNodeRelations.map((rel, i) => {
                const otherId = rel.source === selectedNode ? rel.target : rel.source;
                const otherPerson = persons.find(p => p.id === otherId);
                const otherFaction = otherId.startsWith('f_')
                  ? factions[otherId.replace('f_', '') as FactionId]
                  : otherPerson ? factions[otherPerson.faction] : null;
                const otherName = otherPerson?.name
                  || (otherId.startsWith('f_') ? otherFaction?.name : null)
                  || otherId;
                return (
                  <div key={i} className="relation-graph-demo__relation-item">
                    <span
                      className="relation-graph-demo__relation-type"
                      style={{ borderColor: EDGE_COLORS[rel.type], color: EDGE_COLORS[rel.type] }}
                    >
                      {EDGE_LABELS[rel.type] || rel.type}
                    </span>
                    <span className="relation-graph-demo__relation-label">{rel.label || ''}</span>
                    <span
                      className="relation-graph-demo__relation-name"
                      style={{ color: otherFaction?.color }}
                    >
                      {otherName}
                    </span>
                    {rel.startYear && (
                      <span className="relation-graph-demo__relation-years">
                        {rel.startYear}{rel.endYear ? `—${rel.endYear}` : '起'}
                      </span>
                    )}
                    {otherPerson && (
                      <button
                        className="relation-graph-demo__relation-goto"
                        onClick={() => handleGoToPersonGallery(otherPerson.id)}
                      >
                        →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 相关事件 */}
          {selectedNodeEvents.length > 0 && (
            <div className="relation-graph-demo__detail-events">
              <div className="relation-graph-demo__section-label">相关事件</div>
              {selectedNodeEvents.map(evt => (
                <div
                  key={evt.id}
                  className="relation-graph-demo__event-item"
                  onClick={() => handleGoToTimeline(evt.id)}
                >
                  <span className="relation-graph-demo__event-year">{evt.startYear}</span>
                  <span className="relation-graph-demo__event-title">{evt.title}</span>
                  <span className="relation-graph-demo__event-goto">📜</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 图例 */}
      <div className="relation-graph-demo__legend">
        <div className="relation-graph-demo__legend-title">关系类型</div>
        {Object.entries(EDGE_LABELS).map(([type, label]) => (
          <span key={type} className="relation-graph-demo__legend-item">
            <span className="relation-graph-demo__legend-line" style={{ borderColor: EDGE_COLORS[type] }} />
            {label}
          </span>
        ))}
      </div>

      {/* 势力图例 */}
      <div className="relation-graph-demo__factions">
        <div className="relation-graph-demo__legend-title">势力</div>
        {Object.values(factions).filter(f => f.id !== 'other').map(f => (
          <span key={f.id} className="relation-graph-demo__faction-tag" style={{ color: f.color, borderColor: f.color }}>
            {f.name}
          </span>
        ))}
      </div>

      {/* 统计 */}
      <div className="relation-graph-demo__stats">
        <span>节点: {relationNodes.length}</span>
        <span>关系: {relationEdges.length}</span>
        <span>人物: {persons.length}</span>
      </div>
    </div>
  );
};
