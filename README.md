# SoC Simulator - Visual System-on-Chip Architecture Editor

A complete, modular simulator that visually represents System-on-Chip (SoC) architectures with ARM CPU, DDR memory, and NoC (Network-on-Chip) components. Built with Electron, React Flow, and Python FastAPI for real-time simulation.

![SoC Simulator](docs/screenshot.png)

## Features

- **Visual Drag-and-Drop Interface**: Create SoC architectures using intuitive drag-and-drop
- **Multiple Component Types**: ARM CPU, DDR Memory, and NoC Bus components
- **Real-time Simulation**: Live simulation with WebSocket-based updates
- **Editable Properties**: Configure base addresses, clock speeds, memory sizes, and more
- **Live Logs**: Real-time visualization of simulation events and component activity
- **Component State Monitoring**: Track CPU cycles, memory operations, and network traffic
- **Extensible Architecture**: Easy to add new component types and features

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Shell                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         React + React Flow Frontend                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Canvas    │  │  Properties  │  │    Logs     │ │  │
│  │  │  (Nodes &   │  │    Panel     │  │    Panel    │ │  │
│  │  │ Connections)│  │              │  │             │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Python FastAPI Backend                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            SoC Simulator Engine                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │    ARM     │  │    DDR     │  │    NoC     │     │  │
│  │  │ Simulator  │  │ Simulator  │  │ Simulator  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Electron**: Desktop application framework
- **React**: UI library
- **React Flow**: Visual node editor
- **Zustand**: State management
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling

### Backend
- **Python 3.8+**: Runtime
- **FastAPI**: REST API framework
- **WebSockets**: Real-time communication
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher**
  ```bash
  python3 --version
  ```

- **Node.js 16 or higher**
  ```bash
  node --version
  npm --version
  ```

- **Git** (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd soc-simulator
```

### 2. Install Backend Dependencies

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt

cd ..
```

### 3. Install Frontend Dependencies

```bash
cd frontend

# Install npm packages
npm install

cd ..
```

## Running the Application

You need to run both the backend and frontend simultaneously.

### Option 1: Using Helper Scripts (Recommended)

**Terminal 1 - Start Backend:**
```bash
./run-backend.sh
```

**Terminal 2 - Start Frontend:**
```bash
./run-frontend.sh
```

### Option 2: Manual Start

**Terminal 1 - Start Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

The backend will start on `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- WebSocket Endpoint: `ws://localhost:8000/ws`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run electron:dev
```

The Electron application will launch automatically.

## Usage Guide

### 1. Adding Components

Click the component buttons in the toolbar to add:
- **ARM CPU**: Processing unit with configurable cores and clock speed
- **DDR Memory**: Memory module with size and speed settings
- **NoC Bus**: Network-on-Chip for connecting components

### 2. Creating Connections

- Drag from a connection handle (circle) on one component
- Connect to a handle on another component
- Connections are automatically sent to the backend simulation

### 3. Editing Properties

- Click on any component to select it
- The Properties Panel displays all configurable settings
- Edit values like:
  - Base addresses
  - Clock speeds
  - Memory sizes
  - Bandwidth/latency
- Click "Save Changes" to update the simulation

### 4. Running Simulation

1. Add at least one component
2. Click "▶️ Start Simulation"
3. Watch the Logs Panel for real-time activity:
   - ARM instruction execution
   - Memory read/write operations
   - NoC packet routing
4. Click "⏸️ Stop Simulation" to pause
5. Click "🔄 Reset" to clear simulation state

### 5. Monitoring Activity

The Logs Panel shows:
- **Timestamp**: When the event occurred
- **Component**: Which component generated the event
- **Level**: Info, Warning, Error, or Debug
- **Message**: Detailed event description

Components display their current state:
- **Idle**: No activity
- **Active**: Processing
- **Busy**: High load
- **Error**: Fault condition

## Project Structure

```
soc-simulator/
│
├── backend/                    # Python FastAPI backend
│   ├── main.py                # FastAPI application & WebSocket
│   ├── models.py              # Pydantic data models
│   ├── simulator.py           # SoC simulation engine
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # Electron + React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── CustomNodes.jsx      # ARM, DDR, NoC nodes
│   │   │   ├── Toolbar.jsx          # Component toolbar
│   │   │   ├── PropertiesPanel.jsx  # Property editor
│   │   │   └── LogsPanel.jsx        # Logs display
│   │   ├── App.jsx            # Main application
│   │   ├── store.js           # Zustand state management
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── electron/
│   │   └── main.js            # Electron main process
│   ├── index.html             # HTML entry point
│   ├── package.json           # npm dependencies
│   ├── vite.config.js         # Vite configuration
│   └── tailwind.config.js     # Tailwind CSS config
│
├── shared/                     # Shared type definitions
│   └── types.ts               # TypeScript interfaces
│
├── run-backend.sh             # Backend start script
├── run-frontend.sh            # Frontend start script
├── package.json               # Root package config
└── README.md                  # This file
```

## API Documentation

### REST Endpoints

- `GET /` - Health check
- `GET /api/simulation/status` - Get simulation state
- `POST /api/components` - Create component
- `PUT /api/components/{id}` - Update component
- `DELETE /api/components/{id}` - Delete component
- `POST /api/connections` - Create connection
- `DELETE /api/connections/{id}` - Delete connection
- `POST /api/simulation/start` - Start simulation
- `POST /api/simulation/stop` - Stop simulation
- `POST /api/simulation/reset` - Reset simulation

### WebSocket Messages

**From Backend to Frontend:**
- `log`: Log message
- `simulation_event`: Component event
- `state_update`: Simulation state update
- `component_added/updated/removed`: Component changes
- `connection_added/removed`: Connection changes
- `simulation_started/stopped/reset`: Simulation control

**From Frontend to Backend:**
- `ping`: Keep-alive
- `request_state`: Request current state

## Component Details

### ARM CPU Component

Properties:
- **Clock Speed**: MHz (default: 1000)
- **Cores**: Number of cores (default: 4)
- **Instruction Set**: ARMv7, ARMv8, etc. (default: ARMv8)
- **Cache Size**: KB (default: 256)
- **Base Address**: Memory-mapped register address

Simulation:
- Executes instructions based on clock speed
- Generates memory access requests
- Reports cache hit/miss statistics
- Tracks cycles executed

### DDR Memory Component

Properties:
- **Size**: MB (default: 4096)
- **Speed**: MHz (default: 2400)
- **Data Width**: bits (default: 64)
- **ECC Enabled**: Error correction (default: false)
- **Base Address**: Memory region start

Simulation:
- Handles read/write operations
- Calculates access latency
- Tracks bandwidth utilization
- Reports memory operations

### NoC (Network-on-Chip) Component

Properties:
- **Bandwidth**: Gbps (default: 100)
- **Latency**: nanoseconds (default: 10)
- **Topology**: mesh, ring, star, etc. (default: mesh)
- **Routing Algorithm**: xy-routing, adaptive, etc.

Simulation:
- Routes packets between components
- Calculates transmission latency
- Tracks packet count and throughput
- Reports network performance

## Building for Production

### Build Frontend for Web

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`

### Build Electron Application

```bash
cd frontend
npm run electron:build
```

Output: `frontend/dist-electron/`

The packaged application will be created for your current platform (Windows, macOS, or Linux).

## Extending the Simulator

### Adding a New Component Type

1. **Define Model** (`backend/models.py`):
```python
class CacheComponent(ComponentProperties):
    type: ComponentType = ComponentType.CACHE
    size_kb: int = 512
    associativity: int = 8
```

2. **Create Simulator** (`backend/simulator.py`):
```python
class CacheSimulator(ComponentSimulator):
    async def simulate_step(self, delta_time_ns: int):
        # Simulation logic here
        return events
```

3. **Create React Component** (`frontend/src/components/CustomNodes.jsx`):
```jsx
export const CacheNode = memo(({ data, selected }) => {
    // Component JSX here
});
```

4. **Add to Node Types**:
```jsx
export const nodeTypes = {
    arm: ARMNode,
    ddr: DDRNode,
    noc: NoCNode,
    cache: CacheNode,  // Add here
};
```

## Troubleshooting

### Backend Won't Start

- **Issue**: `ModuleNotFoundError`
  - **Solution**: Make sure virtual environment is activated and dependencies installed
  ```bash
  source backend/venv/bin/activate
  pip install -r backend/requirements.txt
  ```

- **Issue**: `Port 8000 already in use`
  - **Solution**: Change port in `backend/main.py` or kill existing process

### Frontend Won't Connect

- **Issue**: "Not connected to backend"
  - **Solution**: Ensure backend is running on port 8000
  - Check WebSocket URL in `frontend/src/App.jsx`

### Electron Window Blank

- **Issue**: White/blank window
  - **Solution**: Check browser console for errors (View → Toggle Developer Tools)
  - Ensure Vite dev server is running on port 5173

### Components Not Appearing

- **Issue**: Added components don't show
  - **Solution**: Check browser console and backend logs
  - Verify WebSocket connection is established

## Performance Tips

- **Simulation Speed**: Adjust `time_step_ns` in `simulator.py` for faster/slower simulation
- **Log Limit**: Modify `maxLogs` in `store.js` to control memory usage
- **Update Rate**: Change sleep duration in `main.py` WebSocket loop

## Development Tips

### Hot Reload

- Backend: Uses `uvicorn --reload` for automatic restart
- Frontend: Vite provides instant HMR (Hot Module Replacement)

### Debugging

- **Backend**: Add print statements or use Python debugger
  ```python
  import pdb; pdb.set_trace()
  ```

- **Frontend**: Use browser DevTools (F12 in Electron)
  - Console for logs
  - React DevTools for component inspection
  - Network tab for WebSocket messages

### Testing WebSocket

Use the FastAPI docs to test REST endpoints:
```
http://localhost:8000/docs
```

For WebSocket testing, use a tool like:
- [Postman](https://www.postman.com/)
- [WebSocket King](https://websocketking.com/)

## License

MIT License - feel free to use and modify for your projects.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments

## Roadmap

Future enhancements:
- [ ] Save/load architecture designs
- [ ] Export simulation data (CSV, JSON)
- [ ] More component types (GPU, Cache, DMA, etc.)
- [ ] Performance metrics dashboard
- [ ] Trace visualization
- [ ] Multi-core simulation
- [ ] Power consumption modeling
- [ ] Thermal simulation
- [ ] Auto-layout for components

## Authors

SoC Simulator Team - Building the future of chip design visualization

---

**Built with ❤️ using Electron, React Flow, and FastAPI**
