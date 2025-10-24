/**
 * Main Application Component
 * Integrates React Flow canvas, toolbar, properties panel, and logs.
 */

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import useStore from './store';
import { nodeTypes } from './components/CustomNodes';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import LogsPanel from './components/LogsPanel';
import { WS_URL } from './config';

function App() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
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

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Sync store nodes/edges with React Flow
  useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);

  useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  /**
   * Initialize WebSocket connection to backend
   */
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      console.log('🔌 Connecting to backend WebSocket...');
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setWebSocket(ws);
        setConnected(true);
        addLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'Frontend',
          message: '🔗 Connected to backend successfully',
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        addLog({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'Frontend',
          message: '❌ WebSocket connection error',
        });
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnected(false);
        setWebSocket(null);

        // Attempt to reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          addLog({
            timestamp: new Date().toISOString(),
            level: 'warning',
            component: 'Frontend',
            message: '🔄 Attempting to reconnect to backend...',
          });
          connect();
        }, 3000);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [setWebSocket, setConnected, addLog]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = (message) => {
    const { type, payload } = message;

    switch (type) {
      case 'log':
        addLog(payload);
        break;

      case 'simulation_event':
        // Convert event to log for display
        addLog({
          timestamp: payload.timestamp_ns ? new Date(payload.timestamp_ns / 1e6).toISOString() : new Date().toISOString(),
          level: 'info',
          component: payload.component_id,
          message: payload.message,
        });
        break;

      case 'state_update':
        // Update simulation time and component states
        if (payload.simulation_time_ms !== undefined) {
          setSimulationTime(payload.simulation_time_ns || 0);
        }
        if (payload.is_running !== undefined) {
          setSimulationRunning(payload.is_running);
        }
        if (payload.components) {
          // Update component states in nodes
          Object.entries(payload.components).forEach(([componentId, componentState]) => {
            updateComponentState(componentId, componentState);
            updateNode(componentId, {
              state: componentState.state,
              metrics: componentState.metrics,
            });
          });
        }
        break;

      case 'simulation_started':
        setSimulationRunning(true);
        break;

      case 'simulation_stopped':
        setSimulationRunning(false);
        break;

      case 'simulation_reset':
        setSimulationTime(0);
        setSimulationRunning(false);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  };

  /**
   * Handle new connections between nodes
   */
  const onConnect = useCallback(
    async (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
      };

      // Add to React Flow
      setReactFlowEdges((eds) => addEdge(newEdge, eds));

      // Add to store
      addStoreEdge(newEdge);

      // Send to backend
      await createConnection({
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        source_handle: newEdge.sourceHandle,
        target_handle: newEdge.targetHandle,
      });
    },
    [setReactFlowEdges, addStoreEdge, createConnection]
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
   * Update node positions when dragged
   */
  const onNodeDragStop = useCallback(
    (event, node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  return (
    <div className="w-screen h-screen flex flex-col bg-soc-bg">
      {/* Top Toolbar */}
      <div className="p-4 pb-0">
        <Toolbar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left: React Flow Canvas */}
        <div className="flex-1 panel overflow-hidden">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            fitView
            attributionPosition="bottom-left"
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
          >
            <Background color="#0f3460" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'arm':
                    return '#667eea';
                  case 'ddr':
                    return '#f093fb';
                  case 'noc':
                    return '#4facfe';
                  default:
                    return '#ccc';
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

      {/* Footer */}
      <div className="px-4 py-2 border-t border-soc-accent">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>SoC Simulator v1.0.0</span>
          <span>
            Components: {reactFlowNodes.length} | Connections: {reactFlowEdges.length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
