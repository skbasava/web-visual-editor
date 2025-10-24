# DDR Register Configuration Demo

## Overview

The **DDR Register Configuration Demo** demonstrates realistic hardware initialization in SoC systems. It shows how an ARM CPU configures a DDR memory controller through memory-mapped registers, simulating the actual boot sequence of real hardware.

```
ARM CPU → NoC Bus → DDR Controller Registers
```

The ARM writes to configuration registers to:
1. Enable the clock
2. Set the operating frequency
3. Enable the controller

The DDR controller responds by updating status registers to reflect its current state.

## What This Demonstrates

This demo teaches:
- ✅ **Memory-Mapped I/O** - Registers accessed like memory locations
- ✅ **Hardware Initialization** - Proper boot-up sequence for peripherals
- ✅ **Configuration Registers** - Software writes to control hardware
- ✅ **Status Registers** - Hardware updates to report state
- ✅ **Register Dependencies** - Must enable clock before setting frequency
- ✅ **Bit-Field Operations** - Individual bits control different features

## DDR Controller Register Map

### Configuration Registers (Write by ARM)

| Offset | Name | Description | Bit Fields |
|--------|------|-------------|------------|
| 0x00 | CTRL_REG | Control Register | [0]: Reset<br>[1]: Enable |
| 0x04 | CLK_CTRL_REG | Clock Control | [0]: CLK_EN<br>[1]: CLK_SRC<br>[7-4]: DIV |
| 0x08 | FREQ_REG | Frequency Setting | [31-0]: Frequency in MHz |
| 0x0C | MODE_REG | Operating Mode | 0: DDR3<br>1: DDR4<br>2: DDR5 |

### Status Registers (Read-Only, Updated by DDR)

| Offset | Name | Description | Bit Fields |
|--------|------|-------------|------------|
| 0x10 | STATUS_REG | Controller Status | [0]: READY<br>[1]: BUSY<br>[2]: ERROR<br>[3]: LOCKED |
| 0x14 | CLK_STATUS_REG | Clock Status | [0]: CLK_ACTIVE<br>[1]: PLL_LOCKED |
| 0x18 | FREQ_STATUS_REG | Actual Frequency | [31-0]: Current frequency |
| 0x1C | ERROR_REG | Error Status | [31-0]: Error codes |

## Prerequisites

Same as Hello World demo:
- ✅ At least one ARM CPU
- ✅ At least one DDR Memory
- ✅ At least one NoC Bus (recommended)
- ✅ Components must be connected: ARM → NoC → DDR
- ✅ Simulation must be running

## How to Run the Demo

### Step 1: Set Up Your SoC

If you haven't already:
1. Add ARM, NoC, and DDR components
2. Connect them: ARM → NoC → DDR
3. Start simulation (▶️ Start Simulation)

### Step 2: Run DDR Configuration Demo

Click **⚙️ DDR Config**

### Step 3: Watch the Configuration Sequence

The Logs Panel will show the complete configuration flow:

```
🎛️ Created register write: CLK_CTRL_REG = 0x00000001 (via arm-1 → noc-1 → ddr-1)
🔀 Routing transaction from arm-1 to ddr-1 (4 bytes)
✅ Received transaction

🕐 CLK_CTRL_REG = 0x00000001 [CLK_EN=1, DIV=0]
🕐 Clock ENABLED - Status: ACTIVE & PLL LOCKED
✅ STATUS UPDATE: READY=0, CLK_ACTIVE=1, FREQ=0MHz

🎛️ Created register write: FREQ_REG = 3200 MHz
🔀 Routing transaction...
📊 FREQ_REG = 3200 (requested frequency)
⚡ Frequency locked at 3200 MHz
✅ STATUS UPDATE: READY=0, CLK_ACTIVE=1, FREQ=3200MHz

🎛️ Created register write: CTRL_REG = 0x00000002
🔀 Routing transaction...
⚙️ CTRL_REG = 0x00000002 [Reset=0, Enable=1]
✅ DDR Controller ENABLED - Status: READY
✅ STATUS UPDATE: READY=1, CLK_ACTIVE=1, FREQ=3200MHz
```

## Configuration Sequence Details

### Step 1: Enable Clock (CLK_CTRL_REG)

```python
# ARM writes:
CLK_CTRL_REG (offset 0x04) = 0x00000001
# Bit 0 (CLK_EN) = 1

# DDR responds:
CLK_STATUS_REG |= 0x00000001  # CLK_ACTIVE bit
CLK_STATUS_REG |= 0x00000002  # PLL_LOCKED bit
STATUS_REG |= 0x00000008      # LOCKED bit
```

**Result:** Clock is running and PLL is locked

### Step 2: Set Frequency (FREQ_REG)

```python
# ARM writes:
FREQ_REG (offset 0x08) = 3200  # 3200 MHz

# DDR checks:
if CLK_STATUS_REG & 0x1:  # Clock must be enabled
    FREQ_STATUS_REG = 3200  # Update actual frequency
    component.speed_mhz = 3200  # Update component
```

**Result:** DDR running at 3200 MHz

### Step 3: Enable Controller (CTRL_REG)

```python
# ARM writes:
CTRL_REG (offset 0x00) = 0x00000002
# Bit 1 (Enable) = 1

# DDR responds:
STATUS_REG |= 0x00000001  # READY bit
```

**Result:** DDR controller is fully initialized and ready

## Register State After Configuration

```
Configuration Registers (set by ARM):
├─ CTRL_REG      = 0x00000002  [Enable=1]
├─ CLK_CTRL_REG  = 0x00000001  [CLK_EN=1]
├─ FREQ_REG      = 3200 MHz
└─ MODE_REG      = 0x00000001  [DDR4]

Status Registers (auto-updated by DDR):
├─ STATUS_REG       = 0x00000009  [READY=1, LOCKED=1]
├─ CLK_STATUS_REG   = 0x00000003  [CLK_ACTIVE=1, PLL_LOCKED=1]
├─ FREQ_STATUS_REG  = 3200 MHz
└─ ERROR_REG        = 0x00000000  [No errors]
```

## Transaction Timeline

```
Time    Event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms     User clicks "DDR Config" button

1ms     Transaction 1: Write CLK_CTRL_REG
        └─ Value: 0x00000001 (CLK_EN=1)

2ms     NoC routes transaction

3ms     DDR receives, processes clock config
        └─ Enables clock
        └─ Sets CLK_ACTIVE=1, PLL_LOCKED=1

4ms     Transaction 2: Write FREQ_REG
        └─ Value: 3200 (MHz)

5ms     NoC routes transaction

6ms     DDR receives, processes frequency
        └─ Locks frequency at 3200 MHz
        └─ Updates FREQ_STATUS_REG

7ms     Transaction 3: Write CTRL_REG
        └─ Value: 0x00000002 (Enable=1)

8ms     NoC routes transaction

9ms     DDR receives, enables controller
        └─ Sets READY=1
        └─ Controller fully operational
```

## Why This Matters

This demo mirrors real SoC initialization:

### Real Hardware Example (Simplified)

```c
// Real ARM code initializing DDR controller
volatile uint32_t *ddr_base = (uint32_t*)0x40000000;

// Step 1: Enable clock
ddr_base[0x04/4] = 0x00000001;  // CLK_CTRL_REG
while (!(ddr_base[0x14/4] & 0x02));  // Wait for PLL lock

// Step 2: Set frequency
ddr_base[0x08/4] = 3200;  // FREQ_REG

// Step 3: Enable controller
ddr_base[0x00/4] = 0x00000002;  // CTRL_REG
while (!(ddr_base[0x10/4] & 0x01));  // Wait for READY
```

Our simulator demonstrates **exactly this sequence**!

## Register Dependencies

The configuration order matters:

```
❌ Wrong Order:
1. Enable controller first
2. Enable clock
3. Set frequency
→ Controller won't work (clock not ready)

✅ Correct Order:
1. Enable clock first
2. Set frequency (after clock is stable)
3. Enable controller
→ Everything works!
```

Our simulator enforces these dependencies:
- Setting FREQ_REG when clock is disabled logs a warning
- STATUS_REG only sets READY when clock is active AND frequency is set

## Bit Field Operations

### CLK_CTRL_REG Example

```
Bit Layout: [31-8: Reserved] [7-4: DIV] [1: CLK_SRC] [0: CLK_EN]

Value 0x00000001:
├─ Bit 0 (CLK_EN) = 1   → Clock enabled
├─ Bit 1 (CLK_SRC) = 0  → Internal source
└─ Bits 7-4 (DIV) = 0   → No division

Value 0x00000031:
├─ Bit 0 (CLK_EN) = 1   → Clock enabled
├─ Bit 1 (CLK_SRC) = 0  → Internal source
└─ Bits 7-4 (DIV) = 3   → Divide by 8
```

## Extending the Demo

You can modify `/api/simulation/configure-ddr` to:

### Change Frequency

```python
# Different frequency
freq_value = 2666  # MHz instead of 3200
```

### Add Clock Divider

```python
# Enable clock with divider
clk_ctrl_value = 0x00000031  # CLK_EN=1, DIV=3
```

### Read Status Registers

```python
# Add register reads
trans4 = await simulator.create_register_transaction(
    source_id=arm_id,
    dest_id=ddr_id,
    reg_offset=reg_map.STATUS_REG,
    value=0,  # Read operations don't use value
    register_name="STATUS_REG",
    trans_type=TransactionType.REGISTER_READ
)
```

### Multiple DDR Controllers

```python
# Configure two DDR controllers with different speeds
for ddr_id in [ddr1_id, ddr2_id]:
    await configure_ddr(arm_id, ddr_id, freq=2400)
```

## Comparison with Hello World Demo

| Aspect | Hello World | DDR Config |
|--------|-------------|------------|
| Purpose | Data transfer | Hardware configuration |
| Data Size | Variable (11 bytes) | Fixed (4 bytes per register) |
| Transaction Type | WRITE | REGISTER_WRITE |
| Address | Memory address (0x80001000) | Register offset (0x00-0x1C) |
| Response | Storage confirmation | Status register updates |
| Side Effects | None | Clock enable, frequency change |
| Sequence | Single transaction | Multiple ordered transactions |

## Educational Value

Learn about:

1. **Memory-Mapped I/O**
   - Registers accessed through memory addresses
   - Write to control, read to monitor

2. **Hardware Initialization**
   - Proper power-on sequence
   - Dependencies between configuration steps

3. **Register Programming**
   - Setting individual control bits
   - Reading status bits

4. **State Machines**
   - Controller transitions: Off → Clock On → Configured → Ready

5. **Real-World SoC**
   - Exactly how bootloaders initialize hardware
   - Same sequence used in ARM TrustZone, U-Boot, etc.

## Debugging Tips

### Check Register Values

Look in logs for register writes:
```
🕐 CLK_CTRL_REG = 0x00000001 [CLK_EN=1, DIV=0]
```

Verify the bit fields are what you expect.

### Verify Status Updates

After configuration, status should show:
```
✅ STATUS UPDATE: READY=1, CLK_ACTIVE=1, FREQ=3200MHz
```

If READY=0, check if:
- Clock is enabled (CLK_ACTIVE=1)
- Frequency is set (FREQ_STATUS > 0)

### Check Transaction Flow

Each configuration step should show:
1. Transaction created
2. NoC routing
3. DDR receives
4. Register processed
5. Status updated

## Error Scenarios

### Scenario 1: Clock Not Enabled

```python
# ARM tries to set frequency without enabling clock
FREQ_REG = 3200

# DDR logs:
⚠️ Cannot set frequency - clock not enabled
```

### Scenario 2: Reset During Operation

```python
# ARM sets reset bit while controller is running
CTRL_REG = 0x00000001  # Reset=1

# DDR logs:
🔄 DDR Controller RESET
# Status registers cleared
```

## Practical Applications

This demo teaches skills directly applicable to:

- **Embedded Systems Programming**: Initializing peripherals
- **Device Drivers**: Writing Linux kernel drivers
- **Firmware Development**: Bootloader and BIOS code
- **Hardware Verification**: Understanding expected behavior
- **SoC Integration**: Configuring IP blocks

## Next Steps

After mastering register configuration:

1. **Add More Registers**
   - Timing parameters
   - Power management
   - Interrupt enables

2. **Implement Read-Modify-Write**
   - Read register
   - Modify specific bits
   - Write back

3. **Add Error Handling**
   - Timeout detection
   - Configuration validation
   - Error reporting

4. **Create Driver Abstraction**
   - Helper functions for common operations
   - Automated initialization sequences

## FAQ

**Q: Why can't I set frequency before enabling the clock?**
A: This simulates real hardware! The PLL needs a clock source to lock to a frequency. Enable clock first, then configure frequency.

**Q: What happens if I write to a status register?**
A: In real hardware, status registers are read-only. Our simulator currently allows writes but doesn't process them (registers are auto-updated).

**Q: Can I read the registers to verify configuration?**
A: Yes! Extend the demo to add REGISTER_READ transactions. The DDR will return current values.

**Q: Why 32-bit registers?**
A: This is the standard size in ARM-based SoCs. 32 bits provide enough space for multiple control/status fields while being efficiently accessed by the CPU.

**Q: How is this different from normal memory writes?**
A: Register writes trigger configuration logic (side effects), while memory writes just store data. Registers control hardware behavior.

## Summary

The DDR Register Configuration Demo shows how software initializes hardware in real SoC systems. By programming control registers and monitoring status registers, you're learning the exact techniques used in:

- ARM TrustZone firmware
- U-Boot bootloader
- Linux device drivers
- Bare-metal embedded systems

This is **production-level SoC programming** in a visual, educational format!

---

**Happy Configuring!** ⚙️

For questions about implementation details, check `backend/simulator.py` (DDRSimulator class) or `backend/models.py` (register definitions).
