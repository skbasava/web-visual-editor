"""
Data models for SoC components and simulation state.
These models define the structure of ARM, DDR, NoC, and other SoC components.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class ComponentType(str, Enum):
    """Types of SoC components that can be simulated."""
    ARM = "arm"
    DDR = "ddr"
    NOC = "noc"
    BUS = "bus"


class ComponentState(str, Enum):
    """Possible states of a component during simulation."""
    IDLE = "idle"
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"


class NodePosition(BaseModel):
    """Position of a node in the visual editor."""
    x: float
    y: float


class ComponentProperties(BaseModel):
    """Common properties shared by all SoC components."""
    id: str
    type: ComponentType
    label: str
    position: NodePosition
    # Component-specific configuration
    base_address: Optional[str] = "0x00000000"
    acl: Optional[List[str]] = Field(default_factory=list)  # Access Control List
    custom_properties: Dict[str, Any] = Field(default_factory=dict)


class ARMComponent(ComponentProperties):
    """ARM CPU component with specific properties."""
    type: ComponentType = ComponentType.ARM
    clock_speed_mhz: int = 1000
    cores: int = 4
    instruction_set: str = "ARMv8"
    cache_size_kb: int = 256

    class Config:
        json_schema_extra = {
            "example": {
                "id": "arm-1",
                "type": "arm",
                "label": "ARM Cortex-A53",
                "position": {"x": 100, "y": 100},
                "base_address": "0x00000000",
                "clock_speed_mhz": 1000,
                "cores": 4,
                "instruction_set": "ARMv8",
                "cache_size_kb": 256
            }
        }


class DDRComponent(ComponentProperties):
    """DDR memory component with specific properties."""
    type: ComponentType = ComponentType.DDR
    size_mb: int = 4096
    speed_mhz: int = 2400
    data_width: int = 64
    ecc_enabled: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ddr-1",
                "type": "ddr",
                "label": "DDR4 Memory",
                "position": {"x": 400, "y": 100},
                "base_address": "0x80000000",
                "size_mb": 4096,
                "speed_mhz": 2400,
                "data_width": 64,
                "ecc_enabled": False
            }
        }


class NoCComponent(ComponentProperties):
    """Network-on-Chip component with routing properties."""
    type: ComponentType = ComponentType.NOC
    bandwidth_gbps: float = 100.0
    latency_ns: int = 10
    topology: str = "mesh"
    routing_algorithm: str = "xy-routing"

    class Config:
        json_schema_extra = {
            "example": {
                "id": "noc-1",
                "type": "noc",
                "label": "NoC Bus",
                "position": {"x": 250, "y": 250},
                "bandwidth_gbps": 100.0,
                "latency_ns": 10,
                "topology": "mesh",
                "routing_algorithm": "xy-routing"
            }
        }


class Connection(BaseModel):
    """Represents a connection between two components."""
    id: str
    source: str  # Source component ID
    target: str  # Target component ID
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None


class SimulationState(BaseModel):
    """Complete state of the SoC simulation."""
    components: Dict[str, ComponentProperties] = Field(default_factory=dict)
    connections: List[Connection] = Field(default_factory=list)
    is_running: bool = False
    simulation_time_ns: int = 0


class SimulationEvent(BaseModel):
    """Events generated during simulation."""
    timestamp_ns: int
    component_id: str
    event_type: str
    message: str
    data: Optional[Dict[str, Any]] = None


class LogMessage(BaseModel):
    """Log message sent to frontend."""
    timestamp: str
    level: str  # info, warning, error, debug
    component: str
    message: str


class WebSocketMessage(BaseModel):
    """Generic WebSocket message structure."""
    type: str  # log, state_update, simulation_event, etc.
    payload: Dict[str, Any]


class TransactionType(str, Enum):
    """Types of transactions in the SoC."""
    READ = "read"
    WRITE = "write"
    INVALIDATE = "invalidate"


class Transaction(BaseModel):
    """Represents a transaction/packet traveling through the SoC."""
    id: str
    type: TransactionType
    source_id: str
    destination_id: str
    address: int  # Memory address
    data: Optional[bytes] = None  # Actual data payload
    data_str: Optional[str] = None  # String representation for display
    size: int  # Size in bytes
    timestamp_created: int  # When transaction was created (ns)
    timestamp_completed: Optional[int] = None  # When completed (ns)
    route: List[str] = Field(default_factory=list)  # Path through NoC

    class Config:
        arbitrary_types_allowed = True
