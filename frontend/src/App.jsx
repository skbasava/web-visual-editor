import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import useStore from "./store";
import Toolbar from "./components/Toolbar";
import PropertiesPanel from "./components/PropertiesPanel";
import LogsPanel from "./components/LogsPanel";
import { WS_URL } from "./config";
import { nodeTypes } from "./nodes"; // NEW (imports all shapes)
import CustomNodeDesigner from "./components/CustomNodeDesigner";

function App() {
  const [designerOpen, setDesignerOpen] = useState(false); // NEW

  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    addEdge: addStoreEdge,
    setWebSocket,
    setConnected,
    addLog,
    setSimulationTime,
    setSimulationRunning,
    updateComponentState,
    updateNode,
    setSelectedNode,
    createConnection,
  } = useStore();

  // Use React Flow's built-in state management (single source of truth)
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges || []);

  // Track if this is the initial mount to prevent sync loops
  const isInitialMount = useRef(true);

  // DEBUG: Log store nodes to see if they exist
  useEffect(() => {
    console.log("Store Nodes:", storeNodes);
    console.log("Store Edges:", storeEdges);
  }, [storeNodes, storeEdges]);

  // Sync FROM store TO React Flow (always sync when store changes)
  useEffect(() => {
    console.log("Syncing nodes to React Flow:", storeNodes.length, "nodes");
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  /**
   * Handle incoming WebSocket messages
   * Moved outside useEffect to properly manage dependencies
   */
  const handleWebSocketMessage = useCallback(
    (message) => {
      const { type, payload } = message;

      switch (type) {
        case "log":
          addLog(payload);
          break;

        case "simulation_event":
          // Convert event to log for display
          // FIXED: Proper nanosecond to millisecond conversion (ns / 1e6 = ms)
          addLog({
            timestamp: payload.timestamp_ns
              ? new Date(payload.timestamp_ns / 1e6).toISOString()
              : new Date().toISOString(),
            level: "info",
            component: payload.component_id,
            message: payload.message,
          });
          break;

        case "state_update":
          // Update simulation time and component states
          if (payload.simulation_time_ns !== undefined) {
            setSimulationTime(payload.simulation_time_ns);
          }
          if (payload.is_running !== undefined) {
            setSimulationRunning(payload.is_running);
          }
          if (payload.components) {
            // Update component states in nodes
            Object.entries(payload.components).forEach(
              ([componentId, componentState]) => {
                updateComponentState(componentId, componentState);
                updateNode(componentId, {
                  state: componentState.state,
                  metrics: componentState.metrics,
                });
              }
            );
          }
          break;

        case "simulation_started":
          setSimulationRunning(true);
          break;

        case "simulation_stopped":
          setSimulationRunning(false);
          break;

        case "simulation_reset":
          setSimulationTime(0);
          setSimulationRunning(false);
          break;

        default:
          console.log("Unknown message type:", type);
      }
    },
    [
      addLog,
      setSimulationTime,
      setSimulationRunning,
      updateComponentState,
      updateNode,
    ]
  );

  /**
   * Initialize WebSocket connection to backend
   */
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      console.log("🔌 Connecting to backend WebSocket...");
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setWebSocket(ws);
        setConnected(true);
        addLog({
          timestamp: new Date().toISOString(),
          level: "info",
          component: "Frontend",
          message: "Connected to backend successfully",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          addLog({
            timestamp: new Date().toISOString(),
            level: "error",
            component: "Frontend",
            message: `Failed to parse WebSocket message: ${error.message}`,
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        addLog({
          timestamp: new Date().toISOString(),
          level: "error",
          component: "Frontend",
          message: "WebSocket connection error",
        });
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        setWebSocket(null);

        // Attempt to reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          addLog({
            timestamp: new Date().toISOString(),
            level: "warning",
            component: "Frontend",
            message: "Attempting to reconnect to backend...",
          });
          connect();
        }, 3000);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [setWebSocket, setConnected, addLog, handleWebSocketMessage]);

  /**
   * Handle new connections between nodes
   */
  const onConnect = useCallback(
    async (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: "smoothstep",
        animated: true,
      };

      // Add to React Flow (this updates the UI immediately)
      setEdges((eds) => addEdge(newEdge, eds));

      // Add to store (for persistence)
      addStoreEdge(newEdge);

      // Send to backend (asynchronously)
      try {
        await createConnection({
          id: newEdge.id,
          source: newEdge.source,
          target: newEdge.target,
          source_handle: newEdge.sourceHandle,
          target_handle: newEdge.targetHandle,
        });
      } catch (error) {
        console.error("Failed to create connection on backend:", error);
        addLog({
          timestamp: new Date().toISOString(),
          level: "error",
          component: "Frontend",
          message: `Failed to create connection: ${error.message}`,
        });
      }
    },
    [setEdges, addStoreEdge, createConnection, addLog]
  );

  /**
   * Handle node selection
   */
  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  /**
   * Handle canvas click (deselect)
   */
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  /**
   * Sync node changes back to store
   * This handles position updates from dragging automatically
   */
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Detect node dimension updates (resize)
      let resized = false;
      setNodes((nds) => {
        const updated = nds.map((node) => {
          const change = changes.find(
            (c) => c.type === "dimensions" && c.id === node.id
          );
          if (change && change.dimensions) {
            resized = true;
            return {
              ...node,
              data: {
                ...node.data,
                width: change.dimensions.width,
                height: change.dimensions.height,
              },
            };
          }
          return node;
        });

        // ✅ Sync updated state to store immediately
        if (resized) setStoreNodes(updated);
        return updated;
      });
    },
    [onNodesChange, setNodes, setStoreNodes]
  );

  // Add new node from designer
  const addCustomNode = (newNodeConfig) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: newNodeConfig.type, // e.g., "rectangle" or "triangle"
      position: { x: 200, y: 200 },
      data: newNodeConfig.data,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-soc-bg">
      {/* Top Toolbar */}
      <div className="p-4 pb-0">
        <Toolbar />
        <button
          onClick={() => setDesignerOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Custom Component
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left: React Flow Canvas */}
        <div className="flex-1 panel overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
            }}
          >
            <Background color="#0f3460" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "arm":
                    return "#667eea";
                  case "ddr":
                    return "#f093fb";
                  case "noc":
                    return "#4facfe";
                  default:
                    return "#ccc";
                }
              }}
              maskColor="rgba(26, 26, 46, 0.8)"
            />
          </ReactFlow>
        </div>

        {/* Right: Properties and Logs */}
        <div className="w-80 flex flex-col gap-4">
          {/* Properties Panel */}
          <div className="h-1/2">
            <PropertiesPanel />
          </div>

          {/* Logs Panel */}
          <div className="h-1/2">
            <LogsPanel />
          </div>
        </div>
      </div>

      {/* Designer Modal */}
      {designerOpen && (
        <CustomNodeDesigner
          onClose={() => setDesignerOpen(false)}
          onCreate={addCustomNode}
        />
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-soc-accent">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>SoC Simulator v1.0.0</span>
          <span>
            Components: {nodes.length} | Connections: {edges.length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
