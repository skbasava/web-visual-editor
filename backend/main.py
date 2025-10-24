"""
FastAPI Backend for SoC Simulator
Provides REST API and WebSocket endpoints for real-time simulation control.
"""

import asyncio
from typing import Dict, List, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime

from models import (
    ComponentProperties,
    ARMComponent,
    DDRComponent,
    NoCComponent,
    Connection,
    SimulationEvent,
    LogMessage,
    WebSocketMessage,
    ComponentType,
)
from simulator import SoCSimulator


# Initialize FastAPI app
app = FastAPI(
    title="SoC Simulator API",
    description="Backend API for System-on-Chip visual simulator",
    version="1.0.0",
)

# Configure CORS for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulator instance
simulator = SoCSimulator()

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections and broadcasts."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✅ Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        print(f"❌ Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict):
        """Broadcast message to all connected clients."""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "SoC Simulator Backend",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/simulation/status")
async def get_simulation_status():
    """Get current simulation status and metrics."""
    return {
        "status": "success",
        "data": simulator.get_state(),
    }


@app.post("/api/components")
async def create_component(component_data: Dict):
    """Create a new component in the simulation."""
    try:
        # Parse component based on type
        component_type = component_data.get("type")

        if component_type == ComponentType.ARM:
            component = ARMComponent(**component_data)
        elif component_type == ComponentType.DDR:
            component = DDRComponent(**component_data)
        elif component_type == ComponentType.NOC:
            component = NoCComponent(**component_data)
        else:
            component = ComponentProperties(**component_data)

        simulator.add_component(component)

        # Broadcast update to all clients
        await manager.broadcast({
            "type": "component_added",
            "payload": component_data,
        })

        return {"status": "success", "component": component.dict()}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/components/{component_id}")
async def update_component(component_id: str, properties: Dict):
    """Update component properties."""
    try:
        simulator.update_component(component_id, properties)

        # Broadcast update to all clients
        await manager.broadcast({
            "type": "component_updated",
            "payload": {"id": component_id, "properties": properties},
        })

        return {"status": "success", "component_id": component_id}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/components/{component_id}")
async def delete_component(component_id: str):
    """Remove a component from the simulation."""
    try:
        simulator.remove_component(component_id)

        # Broadcast update to all clients
        await manager.broadcast({
            "type": "component_removed",
            "payload": {"id": component_id},
        })

        return {"status": "success", "component_id": component_id}

    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/connections")
async def create_connection(connection: Connection):
    """Create a connection between components."""
    try:
        simulator.add_connection(connection)

        # Broadcast update to all clients
        await manager.broadcast({
            "type": "connection_added",
            "payload": connection.dict(),
        })

        return {"status": "success", "connection": connection.dict()}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/connections/{connection_id}")
async def delete_connection(connection_id: str):
    """Remove a connection."""
    try:
        simulator.remove_connection(connection_id)

        # Broadcast update to all clients
        await manager.broadcast({
            "type": "connection_removed",
            "payload": {"id": connection_id},
        })

        return {"status": "success", "connection_id": connection_id}

    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/simulation/start")
async def start_simulation():
    """Start the simulation."""
    try:
        # Start simulation in background
        asyncio.create_task(simulator.start())

        # Broadcast to all clients
        await manager.broadcast({
            "type": "simulation_started",
            "payload": {"timestamp": datetime.now().isoformat()},
        })

        return {"status": "success", "message": "Simulation started"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop the simulation."""
    try:
        await simulator.stop()

        # Broadcast to all clients
        await manager.broadcast({
            "type": "simulation_stopped",
            "payload": {"timestamp": datetime.now().isoformat()},
        })

        return {"status": "success", "message": "Simulation stopped"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulation/reset")
async def reset_simulation():
    """Reset the simulation."""
    try:
        await simulator.reset()

        # Broadcast to all clients
        await manager.broadcast({
            "type": "simulation_reset",
            "payload": {"timestamp": datetime.now().isoformat()},
        })

        return {"status": "success", "message": "Simulation reset"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time simulation updates.

    Message types:
    - log: Log messages from simulation
    - simulation_event: Events from component simulators
    - state_update: Periodic state updates
    - component_added/updated/removed: Component changes
    - connection_added/removed: Connection changes
    """
    await manager.connect(websocket)

    # Set up callbacks for simulator events
    async def send_log(log: LogMessage):
        """Send log message to this client."""
        try:
            await websocket.send_json({
                "type": "log",
                "payload": log.dict(),
            })
        except:
            pass  # Client disconnected

    async def send_event(event: SimulationEvent):
        """Send simulation event to this client."""
        try:
            await websocket.send_json({
                "type": "simulation_event",
                "payload": event.dict(),
            })
        except:
            pass  # Client disconnected

    # Register callbacks
    simulator.set_log_callback(send_log)
    simulator.set_event_callback(send_event)

    # Send initial state
    await websocket.send_json({
        "type": "state_update",
        "payload": simulator.get_state(),
    })

    # Send welcome message
    await websocket.send_json({
        "type": "log",
        "payload": {
            "timestamp": datetime.now().isoformat(),
            "level": "info",
            "component": "Backend",
            "message": "🔗 Connected to SoC Simulator backend",
        },
    })

    try:
        # Keep connection alive and handle incoming messages
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle client messages
            message_type = message.get("type")
            payload = message.get("payload", {})

            if message_type == "ping":
                # Respond to ping
                await websocket.send_json({
                    "type": "pong",
                    "payload": {"timestamp": datetime.now().isoformat()},
                })

            elif message_type == "request_state":
                # Send current state
                await websocket.send_json({
                    "type": "state_update",
                    "payload": simulator.get_state(),
                })

            # Periodic state updates (every 100ms)
            await asyncio.sleep(0.1)
            if simulator.is_running:
                await websocket.send_json({
                    "type": "state_update",
                    "payload": simulator.get_state(),
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    print("=" * 60)
    print("🚀 SoC Simulator Backend Starting...")
    print("=" * 60)
    print(f"📡 WebSocket endpoint: ws://localhost:8000/ws")
    print(f"🌐 API docs: http://localhost:8000/docs")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("\n🛑 Shutting down SoC Simulator Backend...")
    if simulator.is_running:
        await simulator.stop()


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
