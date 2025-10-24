/**
 * Toolbar Component
 * Provides controls for adding components and managing simulation.
 */

import React from 'react';
import useStore from '../store';

const Toolbar = () => {
  const {
    isSimulationRunning,
    isConnected,
    startSimulation,
    stopSimulation,
    resetSimulation,
    addNode,
    nodes,
    createComponent,
  } = useStore();

  /**
   * Add a new ARM component to the canvas
   */
  const addARMComponent = async () => {
    const id = `arm-${Date.now()}`;
    const armCount = nodes.filter(n => n.type === 'arm').length;
    const componentData = {
      id,
      type: 'arm',
      label: `ARM CPU ${armCount + 1}`,
      position: {
        x: 100 + (armCount * 300),
        y: 100
      },
      base_address: '0x00000000',
      clock_speed_mhz: 1000,
      cores: 4,
      instruction_set: 'ARMv8',
      cache_size_kb: 256,
    };

    // Add to backend
    await createComponent(componentData);

    // Add to React Flow
    addNode({
      id,
      type: 'arm',
      position: componentData.position,
      data: componentData,
      draggable: true,
    });
  };

  /**
   * Add a new DDR component to the canvas
   */
  const addDDRComponent = async () => {
    const id = `ddr-${Date.now()}`;
    const ddrCount = nodes.filter(n => n.type === 'ddr').length;
    const componentData = {
      id,
      type: 'ddr',
      label: `DDR Memory ${ddrCount + 1}`,
      position: {
        x: 100 + (ddrCount * 300),
        y: 300
      },
      base_address: '0x80000000',
      size_mb: 4096,
      speed_mhz: 2400,
      data_width: 64,
      ecc_enabled: false,
    };

    // Add to backend
    await createComponent(componentData);

    // Add to React Flow
    addNode({
      id,
      type: 'ddr',
      position: componentData.position,
      data: componentData,
      draggable: true,
    });
  };

  /**
   * Add a new NoC component to the canvas
   */
  const addNoCComponent = async () => {
    const id = `noc-${Date.now()}`;
    const nocCount = nodes.filter(n => n.type === 'noc').length;
    const componentData = {
      id,
      type: 'noc',
      label: `NoC Bus ${nocCount + 1}`,
      position: {
        x: 100 + (nocCount * 300),
        y: 500
      },
      bandwidth_gbps: 100.0,
      latency_ns: 10,
      topology: 'mesh',
      routing_algorithm: 'xy-routing',
    };

    // Add to backend
    await createComponent(componentData);

    // Add to React Flow
    addNode({
      id,
      type: 'noc',
      position: componentData.position,
      data: componentData,
      draggable: true,
    });
  };

  return (
    <div className="panel p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Component Addition Section */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-300 mr-2">Add Component:</span>
          <button
            onClick={addARMComponent}
            className="btn btn-secondary text-sm flex items-center gap-2"
            disabled={!isConnected}
          >
            <span>🔲</span>
            <span>ARM CPU</span>
          </button>
          <button
            onClick={addDDRComponent}
            className="btn btn-secondary text-sm flex items-center gap-2"
            disabled={!isConnected}
          >
            <span>💾</span>
            <span>DDR Memory</span>
          </button>
          <button
            onClick={addNoCComponent}
            className="btn btn-secondary text-sm flex items-center gap-2"
            disabled={!isConnected}
          >
            <span>🔀</span>
            <span>NoC Bus</span>
          </button>
        </div>

        {/* Simulation Control Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 pulse-slow' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {!isSimulationRunning ? (
            <button
              onClick={startSimulation}
              className="btn btn-primary text-sm flex items-center gap-2"
              disabled={!isConnected || nodes.length === 0}
            >
              <span>▶️</span>
              <span>Start Simulation</span>
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="btn btn-danger text-sm flex items-center gap-2"
              disabled={!isConnected}
            >
              <span>⏸️</span>
              <span>Stop Simulation</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            className="btn btn-secondary text-sm flex items-center gap-2"
            disabled={!isConnected}
          >
            <span>🔄</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="mt-3 p-2 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded text-xs text-yellow-300">
          ⚠️ Not connected to backend. Make sure the backend server is running on port 8000.
        </div>
      )}
    </div>
  );
};

export default Toolbar;
