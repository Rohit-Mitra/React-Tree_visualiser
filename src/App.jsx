import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Simple sample tree data
const sampleTree = {
  id: 'root',
  label: 'Root',
  children: [
    {
      id: 'a',
      label: 'Node A',
      children: [
        { id: 'a1', label: 'Node A1' },
        { id: 'a2', label: 'Node A2' },
      ]
    },
    {
      id: 'b',
      label: 'Node B',
      children: [
        { id: 'b1', label: 'Node B1' },
        { id: 'b2', label: 'Node B2' },
      ]
    },
    {
      id: 'c',
      label: 'Node C',
      children: [
        { id: 'c1', label: 'Node C1' },
        { id: 'c2', label: 'Node C2' },
        { id: 'c3', label: 'Node C3' },
      ]
    },
  ]
};

// Custom node component
const TreeNode = ({ data }) => {
  const hasChildren = data.hasChildren;
  const isCollapsed = data.collapsed;
  
  return (
    <div
      style={{
        padding: '12px 24px',
        background: 'white',
        borderRadius: '8px',
        border: '2px solid #60a5fa',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '100px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggle();
            }}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}
        <div style={{ fontWeight: '500', color: '#1f2937' }}>{data.label}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  treeNode: TreeNode,
};

function TreeVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Toggle node collapse/expand
  const toggleNode = useCallback((nodeId) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Calculate tree layout
  const calculateLayout = useCallback((treeData, collapsed) => {
    const nodes = [];
    const edges = [];
    const horizontalSpacing = 200;
    const verticalSpacing = 120;

    // Calculate how wide a subtree is
    const getSubtreeWidth = (node) => {
      if (collapsed.has(node.id) || !node.children || node.children.length === 0) {
        return 1;
      }
      return node.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
    };

    // Build the tree recursively
    const buildTree = (node, level, leftOffset, parentId = null) => {
      const subtreeWidth = getSubtreeWidth(node);
      const nodeX = leftOffset + (subtreeWidth * horizontalSpacing) / 2;
      const nodeY = level * verticalSpacing;

      const hasChildren = node.children && node.children.length > 0;
      const isCollapsed = collapsed.has(node.id);

      // Add node
      nodes.push({
        id: node.id,
        type: 'treeNode',
        position: { x: nodeX, y: nodeY },
        data: {
          label: node.label,
          hasChildren,
          collapsed: isCollapsed,
          onToggle: () => toggleNode(node.id),
        },
      });

      // Add edge from parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          style: { stroke: '#60a5fa', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#60a5fa',
          },
        });
      }

      // Add children if not collapsed
      if (hasChildren && !isCollapsed) {
        let childOffset = leftOffset;
        node.children.forEach(child => {
          const childWidth = getSubtreeWidth(child);
          buildTree(child, level + 1, childOffset, node.id);
          childOffset += childWidth * horizontalSpacing;
        });
      }

      return subtreeWidth;
    };

    buildTree(treeData, 0, 0);
    return { nodes, edges };
  }, [toggleNode, collapsedNodes]);

  // Update layout when collapsed nodes change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = calculateLayout(sampleTree, collapsedNodes);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [collapsedNodes, calculateLayout]);

  // Expand all nodes
  const expandAll = () => setCollapsedNodes(new Set());

  // Collapse all nodes (except root)
  const collapseAll = () => {
    const allIds = new Set();
    const collectIds = (node) => {
      if (node.children && node.children.length > 0) {
        allIds.add(node.id);
        node.children.forEach(collectIds);
      }
    };
    sampleTree.children?.forEach(collectIds);
    setCollapsedNodes(allIds);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Tree View Visualizer
          </h1>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={expandAll}
              style={{
                padding: '8px 20px',
                background: '#22c55e',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                padding: '8px 20px',
                background: '#f97316',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Instructions */}
      <div style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 24px', fontSize: '14px', color: '#4b5563' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <strong>How to use:</strong> Click the arrow icons (▶/▼) to expand or collapse nodes • 
          Drag to pan • Scroll to zoom • Use buttons above to expand/collapse all nodes
        </div>
      </div>
    </div>
  );
}

export default TreeVisualizer;