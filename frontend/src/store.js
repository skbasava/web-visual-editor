/**
 * Zustand Store for Application State Management
 * Manages components, connections, logs, and simulation state.
 */

import { create } from 'zustand';
import { API_URL } from './config';

const useStore = create((set, get) => ({
  // WebSocket connection
  ws: null,
  isConnected: false,

  // Simulation state
  isSimulationRunning: false,
  simulationTime: 0,

  // React Flow state
  nodes: [],
  edges: [],

  // Logs
  logs: [],
  maxLogs: 500, // Keep last 500 logs

  // Component state
  selectedNode: null,
  componentStates: {}, // Maps component ID to its runtime state

  /**
   * WebSocket Actions
   */
  setWebSocket: (ws) => set({ ws }),
  setConnected: (isConnected) => set({ isConnected }),

  /**
   * Simulation Actions
   */
  setSimulationRunning: (isRunning) => set({ isSimulationRunning: isRunning }),
  setSimulationTime: (time) => set({ simulationTime: time }),

  /**
   * React Flow Actions
   */
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ),
  })),

  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== nodeId),
    edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  })),

  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge],
  })),

  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter((edge) => edge.id !== edgeId),
  })),

  /**
   * Selection Actions
   */
  setSelectedNode: (node) => set({ selectedNode: node }),

  /**
   * Log Actions
   */
  addLog: (log) => set((state) => {
    const newLogs = [...state.logs, { ...log, id: Date.now() + Math.random() }];
    // Keep only the last maxLogs entries
    if (newLogs.length > state.maxLogs) {
      return { logs: newLogs.slice(-state.maxLogs) };
    }
    return { logs: newLogs };
  }),

  clearLogs: () => set({ logs: [] }),

  /**
   * Component State Actions
   */
  updateComponentState: (componentId, state) => set((prevState) => ({
    componentStates: {
      ...prevState.componentStates,
      [componentId]: state,
    },
  })),

  /**
   * Backend Communication Actions
   */
  sendMessage: (message) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  },

  /**
   * API Actions - These interact with the backend REST API
   */
  createComponent: async (componentData) => {
    try {
      const response = await fetch(`${API_URL}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(componentData),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating component:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to create component: ${error.message}`,
      });
    }
  },

  updateComponent: async (componentId, properties) => {
    try {
      const response = await fetch(`${API_URL}/components/${componentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(properties),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating component:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to update component: ${error.message}`,
      });
    }
  },

  deleteComponent: async (componentId) => {
    try {
      const response = await fetch(`${API_URL}/components/${componentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      get().removeNode(componentId);
      return result;
    } catch (error) {
      console.error('Error deleting component:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to delete component: ${error.message}`,
      });
    }
  },

  createConnection: async (connectionData) => {
    try {
      const response = await fetch(`${API_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionData),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating connection:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to create connection: ${error.message}`,
      });
    }
  },

  startSimulation: async () => {
    try {
      const response = await fetch(`${API_URL}/simulation/start`, {
        method: 'POST',
      });
      const result = await response.json();
      get().setSimulationRunning(true);
      return result;
    } catch (error) {
      console.error('Error starting simulation:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to start simulation: ${error.message}`,
      });
    }
  },

  stopSimulation: async () => {
    try {
      const response = await fetch(`${API_URL}/simulation/stop`, {
        method: 'POST',
      });
      const result = await response.json();
      get().setSimulationRunning(false);
      return result;
    } catch (error) {
      console.error('Error stopping simulation:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to stop simulation: ${error.message}`,
      });
    }
  },

  resetSimulation: async () => {
    try {
      const response = await fetch(`${API_URL}/simulation/reset`, {
        method: 'POST',
      });
      const result = await response.json();
      get().setSimulationTime(0);
      get().setSimulationRunning(false);
      return result;
    } catch (error) {
      console.error('Error resetting simulation:', error);
      get().addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'Frontend',
        message: `Failed to reset simulation: ${error.message}`,
      });
    }
  },
}));

export default useStore;
