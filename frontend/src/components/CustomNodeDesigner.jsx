import React, { useState } from 'react';
import { Plus, X, Square, Triangle, Circle } from 'lucide-react';

function CustomNodeDesigner({ onClose, onCreate }) {
  const [config, setConfig] = useState({
    type: 'rectangle',
    label: 'Custom Node',
    description: 'User-defined component',
    width: 150,
    height: 80,
    backgroundColor: '#667eea',
    borderColor: '#4c51bf',
  });

  const nodeTypes = [
    { value: 'rectangle', icon: <Square size={18} /> },
    { value: 'triangle', icon: <Triangle size={18} /> },
    { value: 'circle', icon: <Circle size={18} /> },
  ];

  const handleCreate = () => {
    onCreate({
      type: config.type,
      data: config,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[400px] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-bold">Create Custom Node</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Type selector (icons only) */}
        <div className="space-y-3">
          <label className="block text-gray-300 text-sm">Type</label>
          <div className="flex gap-3">
            {nodeTypes.map((node) => (
              <button
                key={node.value}
                onClick={() => setConfig({ ...config, type: node.value })}
                className={`p-2 rounded-lg border ${
                  config.type === node.value
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-600 bg-gray-700/50'
                } hover:border-blue-400 transition`}
              >
                <div className="text-white flex items-center justify-center">
                  {node.icon}
                </div>
              </button>
            ))}
          </div>

          {/* Label input */}
          <label className="block text-gray-300 text-sm mt-3">Label</label>
          <input
            type="text"
            value={config.label}
            onChange={(e) => setConfig({ ...config, label: e.target.value })}
            className="w-full px-2 py-1 rounded bg-gray-700 text-white"
          />

          {/* Description input */}
          <label className="block text-gray-300 text-sm mt-2">Description</label>
          <input
            type="text"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="w-full px-2 py-1 rounded bg-gray-700 text-white"
          />

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-gray-300 text-sm">Background</label>
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) =>
                  setConfig({ ...config, backgroundColor: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm">Border</label>
              <input
                type="color"
                value={config.borderColor}
                onChange={(e) =>
                  setConfig({ ...config, borderColor: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded text-white">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomNodeDesigner;
