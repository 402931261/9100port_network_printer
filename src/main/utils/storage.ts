import * as fs from 'fs'
import * as path from 'path'
import { Printer, PrintTask } from '../types'

const APP_DATA_DIR = path.join(process.env.APPDATA || '', 'print-relay-app')
const PRINTERS_FILE = path.join(APP_DATA_DIR, 'printers.json')
const HISTORY_FILE = path.join(APP_DATA_DIR, 'history.json')
const SETTINGS_FILE = path.join(APP_DATA_DIR, 'settings.json')

function ensureDir() {
  if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true })
  }
}

export function savePrinters(printers: Printer[]): void {
  ensureDir()
  fs.writeFileSync(PRINTERS_FILE, JSON.stringify(printers, null, 2))
}

export function loadPrinters(): Printer[] {
  ensureDir()
  if (fs.existsSync(PRINTERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PRINTERS_FILE, 'utf-8'))
    } catch {
      return []
    }
  }
  return []
}

export function savePrintHistory(history: PrintTask[]): void {
  ensureDir()
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
}

export function loadPrintHistory(): PrintTask[] {
  ensureDir()
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    } catch {
      return []
    }
  }
  return []
}

export function saveDefaultPrinterId(id: string | null): void {
  ensureDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ defaultPrinterId: id }, null, 2))
}

export function loadDefaultPrinterId(): string | null {
  ensureDir()
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
      return settings.defaultPrinterId || null
    } catch {
      return null
    }
  }
  return null
}