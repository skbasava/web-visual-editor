/**
 * Logs Panel Component
 * Displays real-time simulation logs and events.
 */

import React, { useRef, useEffect } from 'react';
import useStore from '../store';

const LogsPanel = () => {
  const { logs, clearLogs, simulationTime } = useStore();
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'debug':
        return '🔍';
      default:
        return '📝';
    }
  };

  return (
    <div className="panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600">
        <div>
          <h3 className="font-bold text-lg text-white">Simulation Logs</h3>
          <p className="text-xs text-gray-400">
            Simulation time: {(simulationTime / 1_000_000).toFixed(2)} ms
          </p>
        </div>
        <button
          onClick={clearLogs}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto bg-black bg-opacity-30 rounded p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <p>No logs yet. Start the simulation to see activity.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`log-entry ${log.level}`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">{getLevelIcon(log.level)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 text-[10px]">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="font-semibold text-soc-secondary">
                        {log.component}
                      </span>
                      <span className="text-gray-500 text-[10px] uppercase">
                        {log.level}
                      </span>
                    </div>
                    <div className="text-white break-words">
                      {log.message}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between text-xs text-gray-400">
        <span>Total logs: {logs.length}</span>
        <span>
          {logs.filter(l => l.level === 'error').length} errors •{' '}
          {logs.filter(l => l.level === 'warning').length} warnings
        </span>
      </div>
    </div>
  );
};

export default LogsPanel;
