// src/nodes/RectangleNode.jsx
import { Handle, Position, NodeResizer } from 'reactflow';
import 'reactflow/dist/style.css';

export default function RectangleNode({ data, selected }) {
  return (
    <div
      style={{
        position: 'relative',
        background: data.backgroundColor || '#667eea',
        border: `2px solid ${data.borderColor || '#4c51bf'}`,
        color: 'white',
        borderRadius: '8px',
        width: data.width || 150,
        height: data.height || 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <NodeResizer
        color="#2563eb"
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        lineStyle={{ borderWidth: 2 }}
      />

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      {data.label || 'Rectangle'}
    </div>
  );
}
