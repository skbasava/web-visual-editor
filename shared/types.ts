/**
 * Shared Type Definitions
 * Common interfaces used between frontend and backend.
 */

export type ComponentType = 'arm' | 'ddr' | 'noc' | 'bus';
export type ComponentState = 'idle' | 'active' | 'busy' | 'error';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface NodePosition {
  x: number;
  y: number;
}

export interface ComponentProperties {
  id: string;
  type: ComponentType;
  label: string;
  position: NodePosition;
  base_address?: string;
  acl?: string[];
  custom_properties?: Record<string, any>;
}

export interface ARMComponent extends ComponentProperties {
  type: 'arm';
  clock_speed_mhz: number;
  cores: number;
  instruction_set: string;
  cache_size_kb: number;
}

export interface DDRComponent extends ComponentProperties {
  type: 'ddr';
  size_mb: number;
  speed_mhz: number;
  data_width: number;
  ecc_enabled: boolean;
}

export interface NoCComponent extends ComponentProperties {
  type: 'noc';
  bandwidth_gbps: number;
  latency_ns: number;
  topology: string;
  routing_algorithm: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  source_handle?: string;
  target_handle?: string;
}

export interface SimulationState {
  components: Record<string, ComponentProperties>;
  connections: Connection[];
  is_running: boolean;
  simulation_time_ns: number;
}

export interface SimulationEvent {
  timestamp_ns: number;
  component_id: string;
  event_type: string;
  message: string;
  data?: Record<string, any>;
}

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
}

export interface WebSocketMessage {
  type: 'log' | 'state_update' | 'simulation_event' | 'component_added' | 'component_updated' | 'component_removed' | 'connection_added' | 'connection_removed' | 'simulation_started' | 'simulation_stopped' | 'simulation_reset';
  payload: Record<string, any>;
}
