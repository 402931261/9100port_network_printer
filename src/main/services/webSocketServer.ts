import * as WebSocket from 'ws'
import { WebSocketRequest, WebSocketResponse } from '../types'
import { Printer } from '../types'

export class WebSocketServer {
  private wss: WebSocket.Server | null = null
  private defaultPrinter: Printer | null = null
  private onPrintRequest: ((urls: string[]) => Promise<WebSocketResponse>) | null = null

  start(port: number = 13555): void {
    if (this.wss) {
      this.wss.close()
    }

    this.wss = new WebSocket.Server({ port })

    this.wss.on('connection', (ws) => {
      ws.on('message', async (data) => {
        try {
          const request: WebSocketRequest = JSON.parse(data.toString())
          const response = await this.handleRequest(request)
          ws.send(JSON.stringify(response))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '请求格式错误'
          ws.send(JSON.stringify({ code: -1, msg: errorMsg }))
        }
      })

      ws.on('error', () => {})
    })

    console.log(`WebSocket server started on port ${port}`)
  }

  setDefaultPrinter(printer: Printer | null): void {
    this.defaultPrinter = printer
  }

  setOnPrintRequestHandler(handler: (urls: string[]) => Promise<WebSocketResponse>): void {
    this.onPrintRequest = handler
  }

  private async handleRequest(request: WebSocketRequest): Promise<WebSocketResponse> {
    if (!this.defaultPrinter) {
      return { code: -1, msg: '未设置默认打印机' }
    }

    if (!request.printUrl || !Array.isArray(request.printUrl) || request.printUrl.length === 0) {
      return { code: -1, msg: 'printUrl参数无效' }
    }

    if (!this.onPrintRequest) {
      return { code: -1, msg: '打印服务未就绪' }
    }

    return this.onPrintRequest(request.printUrl)
  }

  stop(): void {
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
  }
}