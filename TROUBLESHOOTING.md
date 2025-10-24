# Troubleshooting Guide

This guide addresses common issues with drag and drop, connections, and demo functionality.

## Issues Fixed

### Issue 1: Nodes Not Draggable

**Problem**: Components were added to the canvas but couldn't be dragged or moved.

**Root Cause**: The `draggable` property was not being preserved when nodes were updated through the store. When WebSocket updates or state changes occurred, the `updateNode` function would only update the `data` property, losing the `draggable: true` flag.

**Fix Applied**:

1. **store.js** (Line 52-60): Modified `updateNode` to always preserve `draggable: true`:
```javascript
updateNode: (nodeId, data) => set((state) => ({
  nodes: state.nodes.map((node) =>
    node.id === nodeId ? {
      ...node,
      draggable: true,  // Ensure draggable is always preserved
      data: { ...node.data, ...data }
    } : node
  ),
})),
```

2. **App.jsx** (Line 46-52): Ensured all nodes synced from store have `draggable: true`:
```javascript
useEffect(() => {
  const draggableNodes = nodes.map(node => ({
    ...node,
    draggable: true,  // Ensure all nodes are draggable
  }));
  setReactFlowNodes(draggableNodes);
}, [nodes, setReactFlowNodes]);
```

3. **App.jsx** (Line 238-250): Updated `onNodeDragStop` to properly persist position changes:
```javascript
const onNodeDragStop = useCallback(
  (event, node) => {
    // Update position in the store to persist the change
    setNodes(
      reactFlowNodes.map((n) =>
        n.id === node.id
          ? { ...n, position: node.position, draggable: true }
          : n
      )
    );
  },
  [reactFlowNodes, setNodes]
);
```

**How to Verify**:
1. Add a component (ARM, DDR, or NoC) using the toolbar buttons
2. Click and drag the component - it should move smoothly
3. Release the mouse - the position should be persisted
4. The component should remain draggable even after simulation starts/stops

---

### Issue 2: Cannot Connect Components

**Problem**: Unable to create connections between components (ARM → NoC → DDR).

**Possible Causes**:

1. **Handles Not Configured Correctly**: The CustomNodes.jsx already has proper handle configuration with both source and target handles on all sides (top, bottom, left, right).

2. **ReactFlow Props Not Enabled**: The App.jsx already has the correct props:
   - `nodesDraggable={true}` (Line 262)
   - `nodesConnectable={true}` (Line 263)
   - `elementsSelectable={true}` (Line 264)

3. **User Not Connecting Properly**: Make sure you're connecting from a handle to another handle, not from the node body.

**How to Connect Components**:

1. **Add Components** in this order:
   - Click "ARM CPU" button → ARM appears on canvas
   - Click "NoC Bus" button → NoC appears on canvas
   - Click "DDR Memory" button → DDR appears on canvas

2. **Create Connections**:
   - **Method 1: Drag from handle**
     - Hover over ARM component
     - Find a handle (small circle on edge)
     - Click and drag from ARM's handle
     - Drag to NoC's handle
     - Release to create connection

   - **Method 2: Click handles**
     - Click on ARM's handle (it should highlight)
     - Click on NoC's handle
     - Connection should be created

3. **Required Connections**:
   ```
   ARM → NoC
   NoC → DDR
   ```

4. **Visual Confirmation**:
   - You should see animated blue/cyan lines connecting the components
   - The lines should have arrows showing direction
   - Check the footer: "Connections: 2" (for ARM→NoC→DDR)

**Troubleshooting Connection Issues**:

- **Can't see handles**: Handles are small circles (3x3px) on each side of the component. They appear on:
  - Top edge
  - Bottom edge
  - Left edge
  - Right edge

- **Connection not appearing**:
  - Make sure you're in a connected state (green dot in toolbar shows "Connected")
  - Check browser console for errors (F12 → Console tab)
  - Try refreshing the page and reconnecting

- **Connection disappears**:
  - Check that backend is running (`python backend/main.py` or `docker-compose up`)
  - Check WebSocket connection status in toolbar

---

### Issue 3: Hello World Demo "Goes Infinite"

**Problem**: User reports that the Hello World demo appears to go into an infinite loop.

**Root Cause Analysis**:

After analyzing the backend code, there is **NO infinite loop** in the Hello World demo. The demo creates a **single transaction** that:
1. Creates one "Hello World" message from ARM
2. Routes it through NoC (if connected)
3. Stores it in DDR memory at address 0x80001000

**Why It Might Appear Infinite**:

1. **Simulation Running**: The simulation loop runs continuously at 50ms intervals, generating random events for each component. This is **expected behavior** and not related to the Hello World demo.

2. **No Connections**: If components are not properly connected, the demo will fail with an error message:
   ```
   ❌ No connection between arm-xxx and ddr-xxx. Connect them via NoC!
   ```
   The error might not be visible if you're not checking the logs panel.

3. **Simulation Not Running**: The Hello World button is **disabled** unless:
   - Backend is connected (green dot)
   - Simulation is running (click "Start Simulation" first)

**Proper Demo Workflow**:

1. **Setup Components**:
   ```
   [ARM] -----> [NoC] -----> [DDR]
   ```

2. **Start Simulation**:
   - Click "▶️ Start Simulation" button
   - Wait for simulation state to show "running"
   - You'll see periodic events in the logs panel

3. **Run Hello World Demo**:
   - Click "👋 Hello World" button in the Demos section
   - Watch the logs panel for these messages:
     ```
     📝 Created WRITE transaction: 'Hello World' → 0x80001000
     🔀 Routing transaction from arm-xxx to ddr-xxx
     💾 Stored 'Hello World' at address 0x80001000
     ```

4. **Expected Behavior**:
   - The demo runs **once** per button click
   - It takes ~1-2 seconds to complete (simulated routing delay)
   - You should see 3-4 log messages confirming the transaction
   - The demo does NOT loop

**If Demo Appears to Loop**:

- **Check Logs Panel**: Look for error messages
- **Check Backend Console**: Run backend in terminal and watch for errors
- **Verify Connections**: Make sure ARM → NoC → DDR path exists
- **Browser Console**: Open DevTools (F12) and check for JavaScript errors

**Backend Transaction Flow** (for reference):

```python
# main.py:264-306
@app.post("/api/simulation/hello-world")
async def hello_world_demo():
    # 1. Find components
    arm_id = <first ARM component>
    ddr_id = <first DDR component>

    # 2. Check route exists
    route = simulator.find_route(arm_id, ddr_id)
    if not route:
        return error

    # 3. Create SINGLE transaction
    transaction = await simulator.create_transaction(
        source_id=arm_id,
        dest_id=ddr_id,
        address=0x80001000,
        data_str="Hello World"
    )

    # 4. Broadcast event (once)
    # 5. Return success
```

**Transaction Processing** (simulator.py:647-680):
- Transactions are moved from `transaction_queue` to `active_transactions`
- After 1ms simulated time, they're delivered to destination
- Each transaction is processed **exactly once**
- Completed transactions are removed from active list

---

## Common Workflows

### Workflow 1: Basic Setup

```bash
# Terminal 1: Start Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

Access: http://localhost:5173

### Workflow 2: Docker Setup

```bash
# Build and start
docker-compose up --build

# Access
# Frontend: http://localhost
# Backend: http://localhost:8000/docs
```

### Workflow 3: Using Electron

```bash
cd frontend
npm install
npm run electron:dev
```

---

## Verification Checklist

Before running demos, verify:

- [ ] Backend is running (check terminal or Docker logs)
- [ ] Frontend is connected (green dot in toolbar)
- [ ] Components are added to canvas (ARM, NoC, DDR)
- [ ] Components are connected: ARM → NoC → DDR
- [ ] Check footer shows: "Components: 3 | Connections: 2"
- [ ] Simulation is started (▶️ button clicked)
- [ ] Logs panel is visible and updating

---

## Debug Mode

To enable detailed logging:

### Backend Debug (main.py)

Add logging before demo:
```python
@app.post("/api/simulation/hello-world")
async def hello_world_demo():
    print(f"Components: {list(simulator.components.keys())}")
    print(f"Connections: {[(c.source, c.target) for c in simulator.connections]}")
    # ... rest of function
```

### Frontend Debug (Browser Console)

```javascript
// Check store state
window.store = useStore.getState();
console.log('Nodes:', store.nodes);
console.log('Edges:', store.edges);
console.log('Connected:', store.isConnected);
console.log('Running:', store.isSimulationRunning);
```

---

## Known Limitations

1. **Single Route**: The simulator currently finds only the first valid route (ARM → NoC → DDR). Multi-path routing is not supported.

2. **Handle Visibility**: Handles are small (3x3px). They can be hard to see on some monitors. Consider zooming in (Ctrl/Cmd + mouse wheel).

3. **WebSocket Reconnection**: If backend restarts, frontend will reconnect after 3 seconds. Components and connections are lost on backend restart.

4. **No Persistence**: State is not saved. Refreshing the page or restarting backend clears all components and connections.

---

## Getting Help

If issues persist:

1. **Check Logs**: Both backend terminal and browser console (F12)
2. **Check Network Tab**: Verify API calls succeed (F12 → Network)
3. **Check WebSocket**: Look for ws:// connection in Network tab
4. **Restart Everything**: Stop backend/frontend, clear browser cache, restart
5. **Try Docker**: Docker setup has proven configuration

**Report Issues**: Include:
- Error messages from backend terminal
- Error messages from browser console
- Screenshot of the UI showing the issue
- Steps to reproduce
