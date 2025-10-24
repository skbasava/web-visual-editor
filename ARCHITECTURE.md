# SoC Simulator - Architecture Documentation

This document provides a detailed explanation of the system architecture, data flow, and design decisions.

## System Overview

The SoC Simulator is built with a client-server architecture:
- **Frontend**: Electron application with React Flow for visual editing
- **Backend**: Python FastAPI server with simulation engine
- **Communication**: REST API for component CRUD, WebSocket for real-time updates

## Architecture Layers

### 1. Presentation Layer (Frontend)

```
┌─────────────────────────────────────────┐
│         Electron Window                 │
│  ┌───────────────────────────────────┐  │
│  │      React Application            │  │
│  │                                   │  │
│  │  ┌──────────┐  ┌──────────────┐  │  │
│  │  │ Toolbar  │  │ React Flow   │  │  │
│  │  └──────────┘  │   Canvas     │  │  │
│  │                └──────────────┘  │  │
│  │  ┌──────────┐  ┌──────────────┐  │  │
│  │  │Properties│  │     Logs     │  │  │
│  │  │  Panel   │  │    Panel     │  │  │
│  │  └──────────┘  └──────────────┘  │  │
│  │                                   │  │
│  │        Zustand Store              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### Components

**App.jsx** (main.jsx entry point)
- Initializes WebSocket connection
- Manages React Flow canvas
- Handles node/edge events
- Routes messages to store

**Toolbar.jsx**
- Component creation buttons
- Simulation control (start/stop/reset)
- Connection status indicator

**CustomNodes.jsx**
- ARMNode: Visual representation of ARM CPU
- DDRNode: Visual representation of DDR memory
- NoCNode: Visual representation of NoC bus
- Each displays properties and runtime state

**PropertiesPanel.jsx**
- Shows selected component properties
- Allows editing configuration
- Sends updates to backend

**LogsPanel.jsx**
- Displays real-time logs
- Auto-scrolls to latest
- Filters by level (info/warning/error)

**store.js** (Zustand)
- Global state management
- WebSocket message handling
- API calls to backend
- State updates trigger React re-renders

### 2. Application Layer (Backend)

```
┌─────────────────────────────────────────┐
│         FastAPI Application             │
│  ┌───────────────────────────────────┐  │
│  │        REST Endpoints             │  │
│  │  - Components CRUD                │  │
│  │  - Connections CRUD               │  │
│  │  - Simulation Control             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │    WebSocket Endpoint             │  │
│  │  - Real-time updates              │  │
│  │  - Bidirectional messaging        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │    Connection Manager             │  │
│  │  - Manages active connections     │  │
│  │  - Broadcasts to all clients      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**main.py**
- FastAPI application setup
- CORS middleware for cross-origin requests
- REST endpoint definitions
- WebSocket endpoint for real-time communication
- Connection manager for broadcasting

**models.py**
- Pydantic models for data validation
- ComponentProperties base class
- Component-specific models (ARM, DDR, NoC)
- Message types for WebSocket

**simulator.py**
- SoCSimulator: Main simulation coordinator
- ComponentSimulator: Base class for components
- ARMSimulator: CPU instruction simulation
- DDRSimulator: Memory operation simulation
- NoCSimulator: Network packet routing

### 3. Simulation Engine

```
┌─────────────────────────────────────────┐
│         SoC Simulator Engine            │
│  ┌───────────────────────────────────┐  │
│  │    Component Simulators           │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐│  │
│  │  │  ARM   │ │  DDR   │ │  NoC   ││  │
│  │  │Simulator│ │Simulator│ │Simulator││
│  │  └────────┘ └────────┘ └────────┘│  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │    Simulation Loop                │  │
│  │  - Time stepping (1ms per step)   │  │
│  │  - Component updates              │  │
│  │  - Event generation               │  │
│  │  - State synchronization          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Data Flow

### Component Creation Flow

```
User clicks "Add ARM"
    ↓
Toolbar.addARMComponent()
    ↓
POST /api/components
    ↓
Backend: simulator.add_component()
    ↓
Backend: Broadcast "component_added"
    ↓
Frontend: WebSocket receives message
    ↓
Frontend: store.addNode()
    ↓
React Flow: Renders ARMNode
```

### Property Update Flow

```
User edits property
    ↓
PropertiesPanel.handleSave()
    ↓
PUT /api/components/{id}
    ↓
Backend: simulator.update_component()
    ↓
Backend: Broadcast "component_updated"
    ↓
Frontend: WebSocket receives message
    ↓
Frontend: store.updateNode()
    ↓
React Flow: Re-renders node
```

### Simulation Flow

```
User clicks "Start Simulation"
    ↓
POST /api/simulation/start
    ↓
Backend: simulator.start()
    ↓
Backend: Simulation loop begins
    ↓
Every time step (1ms):
    ├─ ARM: Execute instructions
    ├─ DDR: Process memory ops
    └─ NoC: Route packets
    ↓
Generate SimulationEvents
    ↓
Send via WebSocket
    ↓
Frontend: Receives events
    ↓
Convert to logs
    ↓
Display in LogsPanel
    ↓
Update component states
    ↓
React Flow: Update node visuals
```

### Real-time Update Flow

```
Backend Simulation Loop
    ↓
Component.simulate_step()
    ↓
Returns SimulationEvent[]
    ↓
event_callback(event)
    ↓
WebSocket.send_json(event)
    ↓
Frontend: ws.onmessage
    ↓
handleWebSocketMessage()
    ↓
switch(message.type):
    ├─ log → addLog()
    ├─ simulation_event → addLog()
    ├─ state_update → updateComponentState()
    └─ component_added → addNode()
    ↓
Zustand updates state
    ↓
React re-renders components
```

## Key Design Decisions

### 1. Why Electron?

**Pros:**
- Cross-platform desktop application
- Access to Node.js APIs
- Better performance than web browser
- Can package as standalone app
- No CORS issues

**Alternatives considered:**
- Pure web app: Limited by browser security
- Native desktop: Harder to develop, platform-specific

### 2. Why React Flow?

**Pros:**
- Built specifically for node-based UIs
- Handles drag-drop, connections out of the box
- Performant with many nodes
- Extensible with custom nodes
- Active community

**Alternatives considered:**
- D3.js: Too low-level, more code
- Cytoscape.js: Graph-focused, not flow-oriented
- Custom implementation: Reinventing the wheel

### 3. Why FastAPI?

**Pros:**
- Modern, fast Python framework
- Built-in WebSocket support
- Auto-generated API docs
- Pydantic validation
- Async support for real-time updates

**Alternatives considered:**
- Flask: No native WebSocket, older
- Node.js/Express: Wanted Python for simulation
- Django: Too heavyweight for this use case

### 4. Why Zustand for State Management?

**Pros:**
- Minimal boilerplate
- No context provider hell
- Works well with hooks
- Simple API
- Good performance

**Alternatives considered:**
- Redux: Too much boilerplate
- Context API: Re-render issues
- MobX: More complex

### 5. Why WebSocket Instead of HTTP Polling?

**Pros:**
- True real-time updates
- Lower latency
- Less network overhead
- Bidirectional communication
- Server can push updates

**Alternatives considered:**
- HTTP polling: Higher latency, more requests
- Server-Sent Events: One-way only
- GraphQL subscriptions: More complex setup

## Simulation Algorithm

### Time-Stepped Simulation

The simulator uses a **discrete time-step** approach:

```python
time_step = 1ms  # 1 millisecond per step

while simulation_running:
    for component in components:
        events = component.simulate_step(time_step)
        broadcast_events(events)

    simulation_time += time_step
    await asyncio.sleep(0.05)  # Real-time delay
```

### ARM Simulation Logic

```python
cycles_per_step = (time_step_ns / clock_period_ns)

# Execute instructions
instructions_executed += cycles_per_step

# Occasionally generate memory access
if random() < 0.1:
    generate_memory_access_event()

# Track metrics
metrics.operations_count += cycles_per_step
metrics.active_time_ns += time_step_ns
```

### DDR Simulation Logic

```python
# Simulate random memory operations
if random() < 0.15:
    operation = random_choice(['read', 'write'])
    size = random_choice([64, 128, 256, 512])

    # Calculate latency
    latency = (size * 8) / (speed_mhz * data_width / 1000)

    generate_memory_event(operation, size, latency)
```

### NoC Simulation Logic

```python
# Simulate packet routing
if random() < 0.2:
    packet_size = random_choice([64, 128, 256, 512])

    # Calculate routing latency
    transmission_time = (packet_size * 8) / (bandwidth_gbps * 1e9)
    total_latency = base_latency + transmission_time

    generate_routing_event(packet_size, total_latency)
```

## WebSocket Message Format

### Message Structure

```json
{
  "type": "message_type",
  "payload": { /* type-specific data */ }
}
```

### Message Types

**log**
```json
{
  "type": "log",
  "payload": {
    "timestamp": "2024-01-15T10:30:45.123Z",
    "level": "info",
    "component": "ARM-1",
    "message": "Executed 1000 instructions"
  }
}
```

**simulation_event**
```json
{
  "type": "simulation_event",
  "payload": {
    "timestamp_ns": 1234567890,
    "component_id": "ddr-1",
    "event_type": "memory_read",
    "message": "Read 256 bytes from 0x80001000",
    "data": {
      "address": "0x80001000",
      "size": 256,
      "latency_ns": 12.5
    }
  }
}
```

**state_update**
```json
{
  "type": "state_update",
  "payload": {
    "simulation_time_ns": 5000000,
    "is_running": true,
    "components": {
      "arm-1": {
        "state": "active",
        "metrics": {
          "operations_count": 5000,
          "active_time_ns": 4500000
        }
      }
    }
  }
}
```

## Performance Considerations

### Frontend Optimization

1. **React.memo**: Prevents unnecessary re-renders of node components
2. **Selective Updates**: Only update changed nodes/edges
3. **Virtualization**: React Flow handles viewport culling
4. **Debouncing**: Property updates debounced to prevent spam

### Backend Optimization

1. **Async Operations**: Non-blocking simulation loop
2. **Batch Updates**: Send state updates periodically, not per-event
3. **Efficient Broadcasting**: Only send to active connections
4. **Lazy Evaluation**: Only simulate active components

### Scalability Limits

- **Frontend**: ~100 nodes before performance degrades
- **Backend**: ~50 components with current simulation complexity
- **WebSocket**: ~100 concurrent connections

**To scale further:**
- Use worker threads for simulation
- Implement viewport-based updates
- Add pagination for logs
- Use binary WebSocket protocol

## Error Handling

### Connection Errors

```javascript
ws.onerror = (error) => {
  addLog({ level: 'error', message: 'Connection error' });
  // Attempt reconnect after 3 seconds
  setTimeout(connect, 3000);
};
```

### API Errors

```javascript
try {
  await fetch('/api/components', { method: 'POST', body: data });
} catch (error) {
  addLog({ level: 'error', message: `API error: ${error}` });
}
```

### Simulation Errors

```python
try:
    events = await simulator.simulate_step(delta_time)
except Exception as e:
    self._log('error', 'Simulator', f'Step error: {e}')
    self.state = ComponentState.ERROR
```

## Extension Points

### Adding New Component Types

1. **Backend Model** (models.py):
   ```python
   class GPUComponent(ComponentProperties):
       type: ComponentType = ComponentType.GPU
       cuda_cores: int = 2048
       clock_speed_mhz: int = 1500
   ```

2. **Backend Simulator** (simulator.py):
   ```python
   class GPUSimulator(ComponentSimulator):
       async def simulate_step(self, delta_time_ns):
           # GPU simulation logic
           return events
   ```

3. **Frontend Node** (CustomNodes.jsx):
   ```jsx
   export const GPUNode = memo(({ data }) => {
       // GPU node JSX
   });
   ```

4. **Register Type**:
   ```python
   # Backend
   elif component.type == ComponentType.GPU:
       simulator = GPUSimulator(component)
   ```
   ```jsx
   // Frontend
   export const nodeTypes = {
       arm: ARMNode,
       ddr: DDRNode,
       noc: NoCNode,
       gpu: GPUNode,  // Add here
   };
   ```

### Adding Custom Events

1. Define event type in models.py
2. Generate in component simulator
3. Handle in WebSocket message handler
4. Display in frontend logs or UI

## Testing Strategy

### Backend Testing

```python
# Unit tests for simulators
def test_arm_simulator():
    arm = ARMComponent(id='test', ...)
    sim = ARMSimulator(arm)
    events = await sim.simulate_step(1000000)
    assert len(events) > 0

# Integration tests for API
def test_create_component():
    response = client.post('/api/components', json={...})
    assert response.status_code == 200
```

### Frontend Testing

```javascript
// Component tests with React Testing Library
test('renders ARM node', () => {
  render(<ARMNode data={mockData} />);
  expect(screen.getByText('ARM CPU')).toBeInTheDocument();
});

// Integration tests with Playwright
test('can add and connect components', async ({ page }) => {
  await page.click('button:has-text("ARM CPU")');
  await page.click('button:has-text("DDR Memory")');
  // Test connection creation
});
```

## Security Considerations

**Current State**: Development-focused, not production-ready

**For Production:**
1. Add authentication/authorization
2. Validate all user inputs
3. Rate limit API requests
4. Use WSS (WebSocket Secure)
5. Sanitize log messages
6. Implement CSRF protection
7. Add API key authentication

## Future Enhancements

1. **Persistence**: Save/load designs to/from files
2. **Export**: Generate reports, diagrams, data files
3. **Advanced Simulation**: Power, thermal, timing analysis
4. **Collaboration**: Multi-user editing
5. **Templates**: Pre-built SoC architectures
6. **Validation**: Check for design errors
7. **Optimization**: Auto-layout, performance suggestions

## Conclusion

The SoC Simulator demonstrates a clean, modular architecture that separates concerns:
- Frontend handles visualization and user interaction
- Backend manages simulation logic and state
- WebSocket provides real-time synchronization

This architecture is extensible, maintainable, and provides a solid foundation for future enhancements.
