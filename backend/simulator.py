"""
SoC Simulator Engine
Implements the core simulation logic for ARM, DDR, and NoC components.
"""

import asyncio
import time
from typing import Dict, List, Callable, Optional
from datetime import datetime
import random

from models import (
    ComponentProperties,
    ARMComponent,
    DDRComponent,
    NoCComponent,
    ComponentState,
    ComponentType,
    SimulationEvent,
    LogMessage,
    Connection,
)


class ComponentSimulator:
    """Base class for component simulators."""

    def __init__(self, component: ComponentProperties):
        self.component = component
        self.state = ComponentState.IDLE
        self.last_activity_time = 0
        self.metrics = {
            "operations_count": 0,
            "active_time_ns": 0,
            "idle_time_ns": 0,
        }

    async def simulate_step(self, delta_time_ns: int) -> List[SimulationEvent]:
        """Execute one simulation step. Returns list of events."""
        raise NotImplementedError

    def get_state(self) -> ComponentState:
        """Get current component state."""
        return self.state

    def update_properties(self, properties: Dict):
        """Update component properties during runtime."""
        for key, value in properties.items():
            if hasattr(self.component, key):
                setattr(self.component, key, value)


class ARMSimulator(ComponentSimulator):
    """Simulates ARM CPU behavior."""

    def __init__(self, component: ARMComponent):
        super().__init__(component)
        self.instruction_queue = []
        self.current_instruction = None
        self.cycles_executed = 0

    async def simulate_step(self, delta_time_ns: int) -> List[SimulationEvent]:
        """Simulate ARM CPU execution for one time step."""
        events = []
        arm_component: ARMComponent = self.component  # Type hint

        # Calculate cycles based on clock speed and time delta
        clock_period_ns = 1_000_000_000 / (arm_component.clock_speed_mhz * 1_000_000)
        cycles_this_step = int(delta_time_ns / clock_period_ns)

        # Simulate instruction execution
        if cycles_this_step > 0:
            self.state = ComponentState.ACTIVE
            self.cycles_executed += cycles_this_step
            self.metrics["operations_count"] += cycles_this_step
            self.metrics["active_time_ns"] += delta_time_ns

            # Generate events periodically
            if self.cycles_executed % 1000 == 0:
                events.append(
                    SimulationEvent(
                        timestamp_ns=int(time.time() * 1e9),
                        component_id=self.component.id,
                        event_type="instruction_batch",
                        message=f"Executed 1000 instructions across {arm_component.cores} cores",
                        data={
                            "cycles": self.cycles_executed,
                            "ips": cycles_this_step / (delta_time_ns / 1e9),  # Instructions per second
                        },
                    )
                )

            # Simulate occasional memory access
            if random.random() < 0.1:  # 10% chance of memory access
                events.append(
                    SimulationEvent(
                        timestamp_ns=int(time.time() * 1e9),
                        component_id=self.component.id,
                        event_type="memory_access",
                        message=f"ARM requesting memory read from address 0x{random.randint(0, 0xFFFFFF):08X}",
                        data={"access_type": "read", "cache_hit": random.random() < 0.8},
                    )
                )
        else:
            self.state = ComponentState.IDLE
            self.metrics["idle_time_ns"] += delta_time_ns

        return events


class DDRSimulator(ComponentSimulator):
    """Simulates DDR memory behavior."""

    def __init__(self, component: DDRComponent):
        super().__init__(component)
        self.pending_operations = []
        self.bytes_read = 0
        self.bytes_written = 0
        self.memory_map = {}  # Simplified memory representation

    async def simulate_step(self, delta_time_ns: int) -> List[SimulationEvent]:
        """Simulate DDR memory operations for one time step."""
        events = []
        ddr_component: DDRComponent = self.component

        # Simulate random memory operations
        if random.random() < 0.15:  # 15% chance of memory operation
            operation_type = random.choice(["read", "write"])
            address = random.randint(0, ddr_component.size_mb * 1024 * 1024)
            size_bytes = random.choice([64, 128, 256, 512])  # Cache line sizes

            if operation_type == "read":
                self.bytes_read += size_bytes
                # Calculate access time based on DDR speed
                access_time_ns = (size_bytes * 8) / (ddr_component.speed_mhz * ddr_component.data_width / 1000)

                events.append(
                    SimulationEvent(
                        timestamp_ns=int(time.time() * 1e9),
                        component_id=self.component.id,
                        event_type="memory_read",
                        message=f"DDR read {size_bytes} bytes from 0x{address:08X} (latency: {access_time_ns:.2f}ns)",
                        data={
                            "address": hex(address),
                            "size": size_bytes,
                            "latency_ns": access_time_ns,
                            "total_reads": self.bytes_read,
                        },
                    )
                )
                self.state = ComponentState.BUSY
            else:
                self.bytes_written += size_bytes
                events.append(
                    SimulationEvent(
                        timestamp_ns=int(time.time() * 1e9),
                        component_id=self.component.id,
                        event_type="memory_write",
                        message=f"DDR write {size_bytes} bytes to 0x{address:08X}",
                        data={
                            "address": hex(address),
                            "size": size_bytes,
                            "total_writes": self.bytes_written,
                        },
                    )
                )
                self.state = ComponentState.BUSY

            self.metrics["operations_count"] += 1
            self.metrics["active_time_ns"] += delta_time_ns
        else:
            self.state = ComponentState.IDLE
            self.metrics["idle_time_ns"] += delta_time_ns

        # Periodic bandwidth report
        if self.metrics["operations_count"] % 50 == 0 and self.metrics["operations_count"] > 0:
            total_bytes = self.bytes_read + self.bytes_written
            events.append(
                SimulationEvent(
                    timestamp_ns=int(time.time() * 1e9),
                    component_id=self.component.id,
                    event_type="bandwidth_report",
                    message=f"DDR bandwidth: {total_bytes / (1024*1024):.2f} MB transferred",
                    data={
                        "bytes_read": self.bytes_read,
                        "bytes_written": self.bytes_written,
                        "operations": self.metrics["operations_count"],
                    },
                )
            )

        return events


class NoCSimulator(ComponentSimulator):
    """Simulates Network-on-Chip behavior."""

    def __init__(self, component: NoCComponent):
        super().__init__(component)
        self.packet_queue = []
        self.packets_routed = 0
        self.total_latency_ns = 0

    async def simulate_step(self, delta_time_ns: int) -> List[SimulationEvent]:
        """Simulate NoC packet routing for one time step."""
        events = []
        noc_component: NoCComponent = self.component

        # Simulate packet routing
        if random.random() < 0.2:  # 20% chance of packet routing
            packet_size_bytes = random.choice([64, 128, 256, 512])
            source = random.choice(["ARM", "DDR", "CACHE"])
            destination = random.choice(["ARM", "DDR", "CACHE"])

            # Calculate routing latency
            base_latency = noc_component.latency_ns
            transmission_time = (packet_size_bytes * 8) / (noc_component.bandwidth_gbps * 1e9) * 1e9
            total_latency = base_latency + transmission_time

            self.packets_routed += 1
            self.total_latency_ns += total_latency
            self.state = ComponentState.ACTIVE

            events.append(
                SimulationEvent(
                    timestamp_ns=int(time.time() * 1e9),
                    component_id=self.component.id,
                    event_type="packet_routed",
                    message=f"NoC routing {packet_size_bytes}B packet: {source} → {destination} (latency: {total_latency:.2f}ns)",
                    data={
                        "source": source,
                        "destination": destination,
                        "size": packet_size_bytes,
                        "latency_ns": total_latency,
                        "routing_algorithm": noc_component.routing_algorithm,
                        "packets_routed": self.packets_routed,
                    },
                )
            )

            self.metrics["operations_count"] += 1
            self.metrics["active_time_ns"] += delta_time_ns
        else:
            self.state = ComponentState.IDLE
            self.metrics["idle_time_ns"] += delta_time_ns

        # Periodic performance report
        if self.packets_routed % 30 == 0 and self.packets_routed > 0:
            avg_latency = self.total_latency_ns / self.packets_routed
            events.append(
                SimulationEvent(
                    timestamp_ns=int(time.time() * 1e9),
                    component_id=self.component.id,
                    event_type="performance_report",
                    message=f"NoC performance: {self.packets_routed} packets, avg latency: {avg_latency:.2f}ns",
                    data={
                        "packets_routed": self.packets_routed,
                        "average_latency_ns": avg_latency,
                        "topology": noc_component.topology,
                    },
                )
            )

        return events


class SoCSimulator:
    """Main SoC simulation engine coordinating all components."""

    def __init__(self):
        self.components: Dict[str, ComponentSimulator] = {}
        self.connections: List[Connection] = []
        self.simulation_time_ns = 0
        self.is_running = False
        self.event_callback: Optional[Callable] = None
        self.log_callback: Optional[Callable] = None
        self.time_step_ns = 1_000_000  # 1ms per step

    def add_component(self, component: ComponentProperties):
        """Add a component to the simulation."""
        if component.type == ComponentType.ARM:
            simulator = ARMSimulator(component)
        elif component.type == ComponentType.DDR:
            simulator = DDRSimulator(component)
        elif component.type == ComponentType.NOC:
            simulator = NoCSimulator(component)
        else:
            # Generic component
            simulator = ComponentSimulator(component)

        self.components[component.id] = simulator
        self._log("info", "Simulator", f"Added {component.type.value} component: {component.label}")

    def remove_component(self, component_id: str):
        """Remove a component from the simulation."""
        if component_id in self.components:
            component = self.components[component_id]
            del self.components[component_id]
            self._log("info", "Simulator", f"Removed component: {component_id}")

    def update_component(self, component_id: str, properties: Dict):
        """Update component properties during simulation."""
        if component_id in self.components:
            self.components[component_id].update_properties(properties)
            self._log("info", "Simulator", f"Updated component {component_id} properties")

    def add_connection(self, connection: Connection):
        """Add a connection between components."""
        self.connections.append(connection)
        self._log("info", "Simulator", f"Connected {connection.source} → {connection.target}")

    def remove_connection(self, connection_id: str):
        """Remove a connection."""
        self.connections = [c for c in self.connections if c.id != connection_id]
        self._log("info", "Simulator", f"Removed connection: {connection_id}")

    async def start(self):
        """Start the simulation."""
        if self.is_running:
            self._log("warning", "Simulator", "Simulation already running")
            return

        self.is_running = True
        self.simulation_time_ns = 0
        self._log("info", "Simulator", "🚀 Simulation started")

        # Run simulation loop
        while self.is_running:
            await self._simulation_step()
            await asyncio.sleep(0.05)  # 50ms real-time delay between steps

    async def stop(self):
        """Stop the simulation."""
        self.is_running = False
        self._log("info", "Simulator", "⏸️  Simulation stopped")

    async def reset(self):
        """Reset simulation state."""
        await self.stop()
        self.simulation_time_ns = 0
        for component in self.components.values():
            component.state = ComponentState.IDLE
            component.metrics = {
                "operations_count": 0,
                "active_time_ns": 0,
                "idle_time_ns": 0,
            }
        self._log("info", "Simulator", "🔄 Simulation reset")

    async def _simulation_step(self):
        """Execute one simulation step for all components."""
        all_events = []

        # Simulate each component
        for component_id, simulator in self.components.items():
            events = await simulator.simulate_step(self.time_step_ns)
            all_events.extend(events)

        # Advance simulation time
        self.simulation_time_ns += self.time_step_ns

        # Send events to callback
        for event in all_events:
            if self.event_callback:
                await self.event_callback(event)

    def set_event_callback(self, callback: Callable):
        """Set callback for simulation events."""
        self.event_callback = callback

    def set_log_callback(self, callback: Callable):
        """Set callback for log messages."""
        self.log_callback = callback

    def _log(self, level: str, component: str, message: str):
        """Internal logging method."""
        log_msg = LogMessage(
            timestamp=datetime.now().isoformat(),
            level=level,
            component=component,
            message=message,
        )
        if self.log_callback:
            asyncio.create_task(self.log_callback(log_msg))

    def get_state(self) -> Dict:
        """Get current simulation state."""
        return {
            "simulation_time_ns": self.simulation_time_ns,
            "simulation_time_ms": self.simulation_time_ns / 1_000_000,
            "is_running": self.is_running,
            "components": {
                comp_id: {
                    "state": sim.state.value,
                    "metrics": sim.metrics,
                }
                for comp_id, sim in self.components.items()
            },
        }
