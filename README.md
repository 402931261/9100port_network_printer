# Print Relay Program - Development Documentation

## 1. Project Introduction

Print Relay Program is a Windows desktop application built with **Electron + Vue3 + TypeScript**. Its main features include:

## Other Languages Document
- [中文文档](https://github.com/402931261/9100port_network_printer/blob/master/README_zh.md)

### Core Features

- **Printer Scanning**: Automatically scans the local network subnet for network printers with port 9100 open
- **Printer Management**: View printer status, name, IP address, and other information
- **Default Printer Setting**: Set a globally unique default printer
- **WebSocket Service**: Listens on port 13555, receives print jobs and forwards them to the default printer
- **Print History Records**: Records the status and results of all print tasks

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  PrinterScanner  │  │  PrintService    │  │WebSocket │ │
│  │  (Printer Scan)   │  │  (Print Service) │  │ Server    │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │ IPC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vue3 Renderer Process                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────┐    │
│  │PrinterTabs│  │PrinterInfo │  │ PrintHistory         │    │
│  │(PrinterTab)│  │(PrinterInfo)│  │ (Print History)      │    │
│  └──────────┘  └────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Setup

### 2.1 Install Node.js

- Required version: Node.js >= 20.0.0
- Download: https://nodejs.org/

### 2.2 Install pnpm

```bash
npm install -g pnpm
```

### 2.3 Windows Environment Configuration

Ensure the following components are installed on your Windows system:
- Windows Build Tools (for compiling native modules)

```bash
npm install -g windows-build-tools
```

---

## 3. Install Dependencies

```bash
pnpm install
```

---

## 4. Running in Development Mode

### 4.1 Start the Dev Server

```bash
pnpm dev
```

### 4.2 Start Electron

Run in another terminal window:

```bash
pnpm electron
```

### 4.3 Development Workflow

1. Renderer process code changes will trigger automatic hot reload
2. Main process code changes require restarting `pnpm electron`

---

## 5. Build & Package as exe Installer

### 5.1 Build Project

```bash
pnpm build
```

### 5.2 Package Installer

```bash
pnpm package
```

### 5.3 Output Directory

```
dist/
├── main/           # Main process build output
├── renderer/       # Renderer process build output
└── installer/      # Installer output directory
    └── print-relay-app Setup 1.0.0.exe
```

---

## 6. Usage Guide

### 6.1 Scanning Printers

1. After launching the app, click the "Rescan" button
2. The app automatically scans the local subnet (e.g., 192.168.1.x)
3. Once complete, all printers with port 9100 open are displayed

**Manual Scan**: Enter a custom subnet in the input field (e.g., `192.168.0`), then click scan

### 6.2 Setting Default Printer

1. Select the target printer from the printer tabs
2. Click the "Set as Default" button
3. Once set successfully, that printer will display a "Default" badge

### 6.3 WebSocket API Reference

#### Connection URL
```
ws://localhost:13555
```

#### Request Format
```json
{
  "printUrl": ["https://example.com/document.pdf", "https://example.com/file2.pdf"]
}
```

#### Success Response
```json
{
  "code": 0,
  "msg": "Print successful"
}
```

#### Error Response
```json
{
  "code": -1,
  "msg": "Error reason"
}
```

#### JavaScript Example
```javascript
const ws = new WebSocket('ws://localhost:13555')

ws.onopen = () => {
  ws.send(JSON.stringify({
    printUrl: ['https://example.com/test.pdf']
  }))
}

ws.onmessage = (event) => {
  const response = JSON.parse(event.data)
  console.log(response)
}
```

### 6.4 Print Status Explanation

| Status | Description |
|--------|-------------|
| Sending | PDF is being downloaded or being sent to printer |
| Success | Print task completed |
| Failed | Network error, printer offline, or other errors |

---

## 7. Troubleshooting

### 7.1 Port Already in Use

**Problem**: WebSocket service fails to start, reporting port already occupied

**Solution**:
1. Check if port 13555 is occupied by another program
2. Use this command to check:
   ```bash
   netstat -ano | findstr "13555"
   ```
3. Close the program occupying the port, or restart your computer

### 7.2 Printer Offline

**Problem**: Printer was found during scan but shows as offline

**Solution**:
1. Verify the printer is connected to the network properly
2. Confirm the correct IP address of the printer
3. Try accessing the printer's web interface via browser
4. Check if firewall is blocking port 9100

### 7.3 Print Failure

**Problem**: Print task failed

**Possible Causes**:
1. Default printer not configured
2. Printer offline or network disconnected
3. PDF URL inaccessible or download timeout
4. Printer does not support receiving raw PDF data directly

**Troubleshooting Steps**:
1. Check default printer settings
2. Confirm printer status shows online
3. Verify the PDF URL is accessible
4. Review error messages in print history

### 7.4 No Printers Found During Scan

**Problem**: No printers displayed after scanning completes

**Solution**:
1. Ensure the printer is powered on and connected to the same network
2. Verify the printer supports port 9100 (RAW printing protocol)
3. Try entering a custom subnet manually for scanning
4. Check if firewall is blocking port scanning

---

## 8. Project Structure

```
src/
├── main/                    # Main process code
│   ├── index.ts             # Electron entry point
│   ├── preload.ts           # Preload script
│   ├── services/            # Services
│   │   ├── printerScanner.ts # Printer scanner service
│   │   ├── printService.ts   # Print service
│   │   └── webSocketServer.ts # WebSocket server service
│   ├── types/               # Type definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       ├── network.ts        # Network utilities
│       └── storage.ts        # Local storage utilities
└── renderer/                # Renderer process code
    ├── App.vue              # Root component
    ├── main.ts              # Vue entry point
    ├── components/          # Components
    │   ├── PrinterTabs.vue   # Printer tab component
    │   ├── PrinterInfo.vue   # Printer info component
    │   └── PrintHistory.vue  # Print history component
    ├── composables/         # Composables
    │   └── usePrinter.ts     # Printer-related logic
    ├── types/               # Type definitions
    │   └── index.ts
    └── utils/               # Utility functions
        └── format.ts         # Formatting utilities
```

---

## 9. Configuration

### 9.1 Port Configuration

- **WebSocket Port**: 13555 (fixed)
- **Printer Port**: 9100 (fixed, standard network printer port)

### 9.2 Data Storage

Application data is stored at the following location:
```
%APPDATA%\print-relay-app\
├── printers.json    # Printer list
├── history.json     # Print history
└── settings.json    # Settings (default printer ID)
```

---

## 10. Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Electron | ^42.0.0 |
| Frontend | Vue3 | ^3.5.0 |
| Language | TypeScript | ^5.8.0 |
| Build Tool | Vite | ^6.3.0 |
| WebSocket | ws | ^8.21.0 |
| HTTP Client | axios | ^1.17.0 |
| Network Utils | ping | ^1.0.0 |
