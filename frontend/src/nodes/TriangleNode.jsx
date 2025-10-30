import React, { memo, useEffect } from "react";
import { Handle, Position, NodeResizer, useNodeId, useReactFlow } from "reactflow";

const TriangleNode = memo(({ data, selected }) => {
  const nodeId = useNodeId();
  const { getNode } = useReactFlow();
  const node = getNode(nodeId);

  // Live debug logging
  useEffect(() => {
    if (node) {
      console.log("[DEBUG] Triangle node resized:", {
        id: node.id,
        width: node.width,
        height: node.height,
      });
    }
  }, [node?.width, node?.height]);

  // Use node width/height, or fallback
  const width = node?.width || data.size || 100;
  const height = node?.height || data.size || 100;

  return (
    <div
      style={{
        position: "relative",
        width, // Now the node has real dimensions
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* The resizer now works because this container has real width/height */}
      <NodeResizer
        color="#2563eb"
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        lineStyle={{ borderWidth: 2 }}
        keepAspectRatio={true}

      />

      {/* The triangle visual itself */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${width / 2}px solid transparent`,
          borderRight: `${width / 2}px solid transparent`,
          borderBottom: `${height}px solid ${data.backgroundColor || "#f093fb"}`,
          position: "absolute",
          top: 0,
        }}
      />

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      <div
        style={{
          position: "absolute",
          top: height / 2,
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        {data.label || "Triangle"}
      </div>
    </div>
  );
});

export default TriangleNode;
