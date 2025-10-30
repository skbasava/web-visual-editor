import { Handle, Position, NodeResizer, useNodeId, useReactFlow } from "reactflow";

export default function CircleNode({ data, selected }) {
  const nodeId = useNodeId();
  const { getNode } = useReactFlow();
  const node = getNode(nodeId);

  return (
    <div
      style={{
        width: node?.width || data.size || 80,
        height: node?.height || data.size || 80,
        background: data.backgroundColor || "#4facfe",
        border: `3px solid ${data.borderColor || "#00c4cc"}`,
        borderRadius: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        textAlign: "center",
        transition: "width 0.2s, height 0.2s",
      }}
    >
      <NodeResizer
        color="#ca6c00ff"
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        lineStyle={{ borderWidth: 1 }}
        keepAspectRatio={true}
      />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="font-bold">{data.label || "Circle"}</div>
      <div className="text-xs opacity-80">{data.description}</div>
    </div>
  );
}
