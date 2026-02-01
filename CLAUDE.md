# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MeshCentral is a web-based remote computer management server built with Node.js. It provides remote desktop, terminal, file access, and Intel AMT management through a browser interface.

- **Version**: 1.1.56
- **License**: Apache-2.0
- **Node.js**: >= 16.0.0

## Running the Server

```bash
# Install dependencies
npm install

# Start server
node meshcentral.js

# With custom config
node meshcentral.js --config myconfig.json

# With MongoDB
node meshcentral.js --mongodb mongodb://localhost
```

## CLI Administration (meshctrl.js)

```bash
node meshctrl.js --help                          # Show commands
node meshctrl.js --listusers                     # List users
node meshctrl.js --listdevicegroups              # List device groups
```

## Documentation Server

```bash
cd docs
python -m venv env
.\env\Scripts\activate  # Windows
pip install -r requirements.txt
mkdocs serve  # http://localhost:8000
```

## Architecture

### Three-Component Design

1. **Server (Node.js)** - Main application, web server, agent management
2. **Agent (C + DukTape JS)** - Lightweight agent on managed devices
3. **Web App (JS/HTML/CSS)** - Browser UI with WebSocket communication

### Core Modules

| File | Purpose |
|------|---------|
| `meshcentral.js` | Main entry point, server initialization |
| `webserver.js` | HTTP/HTTPS server, routing, WebSocket setup |
| `meshuser.js` | User WebSocket connections, authentication, permissions |
| `meshrelay.js` | Browser-to-device relay (desktop, terminal, files) |
| `meshagent.js` | Agent connection handling |
| `db.js` | Database abstraction (NeDB, MongoDB, MySQL, PostgreSQL, SQLite) |
| `common.js` | Utility functions, binary encoding/decoding |
| `amtmanager.js` | Intel AMT device management |
| `mpsserver.js` | Management Presence Server for Intel AMT CIRA |

### Module Pattern

All major modules use this factory pattern:

```javascript
module.exports.CreateModuleName = function(parent, db, ...) {
    var obj = {};
    obj.start = function() { ... };
    obj.stop = function() { ... };
    return obj;
};
```

### Communication

- **Protocol**: JSON over WebSocket (bidirectional, async)
- **Message format**: `{ action: 'msg', type: 'console', nodeId: '...', value: '...' }`
- **Transport**: TLS/HTTPS

### Permission System

- **Mesh Rights**: Permissions on device groups (desktop, terminal, files, etc.)
- **Site Rights**: Global administrator permissions
- Uses bitmask-based permission checks

## Key Directories

- `views/` - Handlebars HTML templates (default.handlebars is main UI)
- `agents/` - Agent binaries and agent-side JavaScript
- `public/` - Static assets, noVNC viewer
- `emails/` - Email templates
- `translate/` - Translation system
- `amt/` - Intel AMT modules
- `docs/` - MkDocs documentation

## Configuration

Server configuration via `config.json`. Schema in `meshcentral-config-schema.json`.

Key sections: `settings`, `domains`, `databases`, `mail`, `letsencrypt`, `amtmanager`

Example minimal config:
```json
{
  "domains": {
    "": {
      "title": "MeshCentral",
      "minify": true
    }
  }
}
```

## Code Style

- ES6 JavaScript with JSHint directives (`/*jshint node: true, esversion: 6*/`)
- Callback-based async (no Promises/async-await)
- CamelCase naming
- Event-driven architecture with central event dispatcher

## Testing

- Agent tests: `node agents/testsuite.js`
- No automated test framework; manual testing workflow
- Debug with `node --inspect meshcentral.js`
