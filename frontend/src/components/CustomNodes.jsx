/**
 * Custom Node Components for React Flow
 * Defines visual representation of ARM, DDR, and NoC components.
 */

import React, { memo } from "react";
import { Handle, Position } from "reactflow";

export const ARMNode = memo(({ id, data, selected }) => (
  <div
    className={`px-6 py-4 rounded-lg min-w-[200px] ${
      selected ? "border-2 border-yellow-400" : "border-2 border-white"
    }`}
    style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      position: "relative",
    }}
  >
    {["Top", "Bottom", "Left", "Right"].map((pos) => {
      const cssPos = pos.toLowerCase();

      const type = pos === "Top" || pos === "Bottom" ? "source" : "target";

      return (
        <Handle
          key={pos}
          type={type}
          position={Position[pos]}
          id={`${id}-${cssPos}-${type}`}
          style={{
            background: type === "source" ? "#4facfe" : "#f093fb",
            width: 10,
            height: 10,
            zIndex: 20,
          }}
        />
      );
    })}

    <div className="font-bold text-white text-lg">{data.label}</div>
    <div className="text-xs text-gray-200 opacity-80">ARM CPU</div>
    <div className="mt-3 space-y-1 text-xs text-white">
      <div className="flex justify-between">
        <span className="opacity-70">Cores:</span>
        <span className="font-medium">{data.cores || 4}</span>
      </div>
      <div className="flex justify-between">
        <span className="opacity-70">Clock:</span>
        <span className="font-medium">{data.clock_speed_mhz || 1000} MHz</span>
      </div>
      <div className="flex justify-between">
        <span className="opacity-70">ISA:</span>
        <span className="font-medium">{data.instruction_set || "ARMv8"}</span>
      </div>
      <div className="flex justify-between">
        <span className="opacity-70">Base:</span>
        <span className="font-mono text-[10px]">
          {data.base_address || "0x00000000"}
        </span>
      </div>
      {data.state && (
        <div className="flex justify-between pt-1 border-t border-white border-opacity-20">
          <span className="opacity-70">State:</span>
          <span
            className={`font-medium uppercase ${
              data.state === "active" ? "text-green-300" : "text-gray-300"
            }`}
          >
            {data.state}
          </span>
        </div>
      )}
    </div>
  </div>
));

ARMNode.displayName = "ARMNode";

/**
 * DDR Memory Node Component
 */
export const DDRNode = memo(({ id, data, selected }) => {
  return (
    <div
      className={`px-6 py-4 rounded-lg min-w-[200px] ${
        selected ? "border-2 border-yellow-400" : "border-2 ring-white"
      }`}
      style={{
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      }}
    >
      {["Top", "Bottom", "Left", "Right"].map((pos) => {
        const cssPos = pos.toLowerCase();

        const type = pos === "Top" || pos === "Bottom" ? "source" : "target";

        return (
          <Handle
            key={pos}
            type={type}
            position={Position[pos]}
            id={`${id}-${cssPos}-${type}`}
            style={{
              background: type === "source" ? "#4facfe" : "#f093fb",
              width: 10,
              height: 10,
              zIndex: 20,
            }}
          />
        );
      })}

      <div className="flex items-center mb-2">
        <div className="text-2xl mr-2">💾</div>
        <div>
          <div className="font-bold text-white text-lg">{data.label}</div>
          <div className="text-xs text-gray-200 opacity-80">DDR Memory</div>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs text-white">
        <div className="flex justify-between">
          <span className="opacity-70">Size:</span>
          <span className="font-medium">{data.size_mb || 4096} MB</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">Speed:</span>
          <span className="font-medium">{data.speed_mhz || 2400} MHz</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">Width:</span>
          <span className="font-medium">{data.data_width || 64} bit</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">Base:</span>
          <span className="font-mono text-[10px]">
            {data.base_address || "0x80000000"}
          </span>
        </div>
        {data.state && (
          <div className="flex justify-between pt-1 border-t border-white border-opacity-20">
            <span className="opacity-70">State:</span>
            <span
              className={`font-medium uppercase ${
                data.state === "busy"
                  ? "text-yellow-300"
                  : data.state === "active"
                  ? "text-green-300"
                  : "text-gray-300"
              }`}
            >
              {data.state}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

DDRNode.displayName = "DDRNode";

/**
 * NoC (Network-on-Chip) Node Component
 */
export const NoCNode = memo(({ id, data, selected }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10">
        {["Top", "Bottom", "Left", "Right"].map((pos) => {
          const cssPos = pos.toLowerCase();

          const type = pos === "Top" || pos === "Bottom" ? "source" : "target";

          return (
            <Handle
              key={pos}
              type={type}
              position={Position[pos]}
              id={`${id}-${cssPos}-${type}`}
              style={{
                background: type === "source" ? "#4facfe" : "#f093fb",
                width: 10,
                height: 10,
                zIndex: 20,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          background: selected ? "#facc15" : "#ffffff",
          padding: selected ? "2px" : "2px",
          clipPath:
            "polygon(0% 50%, 10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%)",
          display: "inline-block",
        }}
      >
        <div
          className="px-6 py-4 min-w-[220px] text-white"
          style={{
            background: "#4facfe",
            clipPath:
              "polygon(0% 50%, 10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-2 text-center">
            <div className="text-2xl mr-2">🔀</div>
            <div>
              <div className="font-bold text-white text-lg">{data.label}</div>
              <div className="text-xs text-gray-200 opacity-80">
                Network-on-Chip
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs text-white">
            <div className="flex justify-between">
              <span className="opacity-70">Bandwidth:</span>
              <span className="font-medium">
                {data.bandwidth_gbps || 100} Gbps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Latency:</span>
              <span className="font-medium">{data.latency_ns || 10} ns</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Topology:</span>
              <span className="font-medium">{data.topology || "mesh"}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Routing:</span>
              <span className="font-medium text-[10px]">
                {data.routing_algorithm || "xy-routing"}
              </span>
            </div>
            {data.state && (
              <div className="flex justify-between pt-1 border-t border-white border-opacity-20">
                <span className="opacity-70">State:</span>
                <span
                  className={`font-medium uppercase ${
                    data.state === "active" ? "text-green-300" : "text-gray-300"
                  }`}
                >
                  {data.state}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

NoCNode.displayName = "NoCNode";

/**
 * Node types mapping for React Flow
 */
export const nodeTypes = {
  arm: ARMNode,
  ddr: DDRNode,
  noc: NoCNode,
};
