# Hello World Demo Guide

## Overview

The **Hello World Demo** demonstrates a complete, realistic data flow through your SoC architecture:

```
ARM CPU → NoC Bus → DDR Memory
```

The ARM component generates the string "Hello World", which is routed through the Network-on-Chip (NoC) bus and stored in DDR memory at address `0x80001000`.

## What This Demonstrates

This demo shows:
- ✅ **Real data transfer** - Actual string data flows through the system
- ✅ **Component communication** - How ARM, NoC, and DDR interact
- ✅ **Transaction routing** - Automatic path finding through the NoC
- ✅ **Memory storage** - Data is stored at a specific memory address
- ✅ **Timing simulation** - Realistic delays (1ms routing through NoC)
- ✅ **Event logging** - Each step is logged in real-time

## Prerequisites

Before running the demo, you need:

### 1. Required Components
- ✅ At least **one ARM CPU** component
- ✅ At least **one DDR Memory** component
- ✅ At least **one NoC Bus** component (recommended)

### 2. Required Connections
Components must be connected to create a path from ARM to DDR:

**Option A: Direct Connection** (works but not realistic)
```
ARM ──────→ DDR
```

**Option B: Through NoC** (recommended - realistic SoC architecture)
```
ARM ──────→ NoC ──────→ DDR
```

### 3. Simulation Must Be Running
- Click **▶️ Start Simulation** before running the demo
- The "Hello World Demo" button is only enabled when simulation is running

## How to Run the Demo

### Step 1: Set Up Your SoC

1. **Add Components:**
   - Click "🔲 ARM CPU" to add ARM
   - Click "🔀 NoC Bus" to add NoC
   - Click "💾 DDR Memory" to add DDR

2. **Create Connections:**
   - Drag from ARM's handle → NoC's handle
   - Drag from NoC's handle → DDR's handle

Your canvas should look like:
```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  ARM    │─────→│   NoC   │─────→│   DDR   │
│  CPU    │      │   Bus   │      │ Memory  │
└─────────┘      └─────────┘      └─────────┘
```

### Step 2: Start Simulation

Click **▶️ Start Simulation**

You should see logs like:
```
🚀 Simulation started
✅ ARM CPU started...
✅ DDR Memory initialized...
✅ NoC Bus ready...
```

### Step 3: Run Hello World Demo

Click **👋 Hello World Demo**

### Step 4: Watch the Logs!

The Logs Panel will show the complete transaction flow:

```
📝 Created write transaction: 'Hello World' → 0x80001000 (via arm-1 → noc-1 → ddr-1)
🔀 Routing transaction from arm-1 to ddr-1 (11 bytes)
✅ Received transaction: 'Hello World' at 0x80001000
💾 Stored 'Hello World' at address 0x80001000 (11 bytes)
```

## What Happens Under the Hood

### 1. Transaction Creation (ARM)
```python
# ARM creates a write transaction
Transaction {
  id: "trans-1234567890",
  type: "write",
  source: "arm-1",
  destination: "ddr-1",
  address: 0x80001000,
  data: "Hello World" (11 bytes),
  route: ["arm-1", "noc-1", "ddr-1"]
}
```

### 2. Route Discovery
The simulator automatically finds the path:
- Checks connections from ARM
- Finds NoC in the middle
- Finds connection from NoC to DDR
- Returns route: `[arm-1 → noc-1 → ddr-1]`

### 3. Transaction Queuing
- Transaction added to simulator's queue
- Logged: "📝 Created write transaction..."

### 4. NoC Routing (1ms delay)
- Transaction moved to active queue
- NoC simulates routing delay
- Logged: "🔀 Routing transaction..."

### 5. DDR Storage
After 1ms:
- DDR receives transaction
- Stores data in memory map at `0x80001000`
- Logged: "💾 Stored 'Hello World'..."

## Transaction Timeline

```
Time    Event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms     User clicks "Hello World Demo"

1ms     Transaction created in ARM
        └─ Logged: "📝 Created write transaction..."

2ms     Transaction enters NoC queue
        └─ Logged: "🔀 Routing transaction..."

3ms     NoC routing simulation (delay)

4ms     Transaction delivered to DDR
        └─ Logged: "✅ Received transaction..."

5ms     Data stored in DDR memory
        └─ Logged: "💾 Stored 'Hello World'..."
```

## Memory Map

After the demo runs, DDR's internal memory map contains:

```javascript
memory_map[0x80001000] = {
  data: "Hello World",
  size: 11,
  timestamp: 5000000,  // 5ms in nanoseconds
  source: "arm-1"
}
```

## Error Messages

### "❌ Need at least one ARM and one DDR component"
**Solution:** Add missing components using the toolbar buttons.

### "❌ No connection between arm-1 and ddr-1. Connect them via NoC!"
**Solution:** Create connections between your components:
1. Hover over ARM to see connection handles
2. Drag from ARM handle to NoC handle
3. Drag from NoC handle to DDR handle

### "Failed to run Hello World demo. Make sure components are connected!"
**Solutions:**
- Check that simulation is running (click ▶️ Start)
- Verify backend is connected (green dot in toolbar)
- Ensure components are properly connected

## Viewing the Results

### In the Logs Panel:
- Every step is logged with emoji indicators
- Timestamps show when each event occurred
- Details include addresses, data sizes, and routes

### In the Browser Console (F12):
```javascript
{
  status: "success",
  message: "✅ Hello World transaction created: arm-1 → noc-1 → ddr-1",
  transaction: {
    id: "trans-1234567890",
    route: ["arm-1", "noc-1", "ddr-1"],
    data: "Hello World",
    address: "0x80001000"
  }
}
```

## Advanced: Customizing the Demo

You can modify the demo in `backend/main.py`:

```python
# Change the message
message = "Hello SoC!"  # Instead of "Hello World"

# Change the memory address
address = 0x80002000  # Different address

# Add multiple transactions
await simulator.create_transaction(arm_id, ddr_id, 0x80001000, "Message 1")
await simulator.create_transaction(arm_id, ddr_id, 0x80002000, "Message 2")
```

## Educational Value

This demo teaches:

1. **SoC Architecture Basics**
   - How components are interconnected
   - Role of NoC in routing data

2. **Memory-Mapped I/O**
   - Data stored at specific addresses
   - ARM can write to DDR memory space

3. **Transaction-Based Communication**
   - Packets travel through the system
   - Routing delays are simulated

4. **Real-Time Monitoring**
   - See data flow as it happens
   - Understand timing and latency

## Next Steps

After running the Hello World demo:

1. **Try Different Architectures:**
   - Add multiple ARM CPUs
   - Add multiple DDR banks
   - Create complex routing through NoC

2. **Observe Performance:**
   - Watch how routing affects latency
   - See how NoC handles multiple transactions

3. **Extend the Demo:**
   - Modify backend to send larger data
   - Add read transactions (DDR → ARM)
   - Implement cache simulation

## Technical Details

### Transaction Model
```python
class Transaction(BaseModel):
    id: str                          # Unique identifier
    type: TransactionType            # read/write/invalidate
    source_id: str                   # Source component
    destination_id: str              # Destination component
    address: int                     # Memory address
    data: Optional[bytes]            # Binary data
    data_str: Optional[str]          # String representation
    size: int                        # Size in bytes
    timestamp_created: int           # Creation time (ns)
    timestamp_completed: Optional[int]  # Completion time (ns)
    route: List[str]                 # Path through components
```

### Routing Algorithm
```python
def find_route(source, destination):
    # 1. Check direct connection
    if has_connection(source, destination):
        return [source, destination]

    # 2. Find intermediate NoC
    for intermediate in connections_from(source):
        if is_noc(intermediate):
            if has_connection(intermediate, destination):
                return [source, intermediate, destination]

    # 3. No route found
    return []
```

## FAQ

**Q: Can I run the demo multiple times?**
A: Yes! Each run creates a new transaction with a new ID.

**Q: Where is the data actually stored?**
A: In the DDR simulator's `memory_map` dictionary in Python memory (not persisted).

**Q: Can I have multiple simultaneous transactions?**
A: Yes! The simulator has a transaction queue and can handle multiple in-flight transactions.

**Q: What's the difference between this and random memory operations?**
A: Random operations are simulated background activity. This demo creates an explicit, traceable transaction with real data.

**Q: Can I read the data back from memory?**
A: Currently, the demo only implements write transactions. Read transactions could be added as an enhancement!

## Troubleshooting

### Demo button is disabled
- ✅ Ensure simulation is running
- ✅ Check backend connection (green dot)

### No logs appear
- ✅ Check the Logs Panel is visible
- ✅ Verify WebSocket connection
- ✅ Look at browser console for errors

### Transaction fails
- ✅ Verify all components exist
- ✅ Check connections are properly made
- ✅ Ensure components are the right type

## Conclusion

The Hello World Demo is more than just a test - it's a complete demonstration of how modern SoC architectures move data between components. By following the logs, you can see exactly how your design would behave in real hardware!

---

**Happy Simulating!** 🚀

For questions or issues, check the main README.md or open a GitHub issue.
