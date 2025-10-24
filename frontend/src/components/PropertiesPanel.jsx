/**
 * Properties Panel Component
 * Displays and allows editing of selected node properties.
 */

import React, { useState, useEffect } from 'react';
import useStore from '../store';

const PropertiesPanel = () => {
  const { selectedNode, updateNode, updateComponent, deleteComponent } = useStore();
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    if (selectedNode) {
      setEditedData({ ...selectedNode.data });
    } else {
      setEditedData(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !editedData) {
    return (
      <div className="panel p-4 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">Select a component to view properties</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSave = async () => {
    // Update in local state
    updateNode(selectedNode.id, editedData);

    // Update in backend
    await updateComponent(selectedNode.id, editedData);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete ${editedData.label}?`)) {
      await deleteComponent(selectedNode.id);
    }
  };

  const renderField = (label, field, type = 'text') => {
    const value = editedData[field];

    return (
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-300 mb-1">
          {label}
        </label>
        {type === 'number' ? (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-soc-accent border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-soc-secondary"
          />
        ) : type === 'boolean' ? (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(field, e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 bg-soc-accent border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-soc-secondary"
          />
        )}
      </div>
    );
  };

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-600">
        <h3 className="font-bold text-lg text-white">Properties</h3>
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 text-sm"
          title="Delete component"
        >
          🗑️ Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Common Properties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            General
          </h4>
          {renderField('Label', 'label')}
          {renderField('Component ID', 'id')}
          {renderField('Type', 'type')}
          {renderField('Base Address', 'base_address')}
        </div>

        {/* Type-Specific Properties */}
        {editedData.type === 'arm' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              ARM CPU Settings
            </h4>
            {renderField('Clock Speed (MHz)', 'clock_speed_mhz', 'number')}
            {renderField('Number of Cores', 'cores', 'number')}
            {renderField('Instruction Set', 'instruction_set')}
            {renderField('Cache Size (KB)', 'cache_size_kb', 'number')}
          </div>
        )}

        {editedData.type === 'ddr' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              DDR Memory Settings
            </h4>
            {renderField('Size (MB)', 'size_mb', 'number')}
            {renderField('Speed (MHz)', 'speed_mhz', 'number')}
            {renderField('Data Width (bits)', 'data_width', 'number')}
            {renderField('ECC Enabled', 'ecc_enabled', 'boolean')}
          </div>
        )}

        {editedData.type === 'noc' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              NoC Settings
            </h4>
            {renderField('Bandwidth (Gbps)', 'bandwidth_gbps', 'number')}
            {renderField('Latency (ns)', 'latency_ns', 'number')}
            {renderField('Topology', 'topology')}
            {renderField('Routing Algorithm', 'routing_algorithm')}
          </div>
        )}

        {/* Runtime State */}
        {editedData.state && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Runtime State
            </h4>
            <div className="bg-soc-accent p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-300">Status:</span>
                <span className={`text-sm font-medium uppercase ${
                  editedData.state === 'active' ? 'text-green-400' :
                  editedData.state === 'busy' ? 'text-yellow-400' :
                  editedData.state === 'error' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {editedData.state}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <button
          onClick={handleSave}
          className="btn btn-primary w-full"
        >
          💾 Save Changes
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Changes will be applied to the simulation
        </p>
      </div>
    </div>
  );
};

export default PropertiesPanel;
