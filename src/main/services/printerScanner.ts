import { Printer } from "../types";
import {
  getLocalIpAddress,
  getSubnet,
  checkPort,
  getSnmpInfo,
  discoverPrintersViaMdns,
} from "../utils/network";

export class PrinterScanner {
  private scanning = false;

  /**
   * 执行完整扫描流程：
   * 1. mDNS 发现局域网打印机（快速定位）
   * 2. 对发现的设备 + 网段全量扫描 9100 端口
   * 3. 对开放 9100 的设备通过 SNMP 获取名称和型号
   */
  async scanPrinters(customSubnet?: string): Promise<Printer[]> {
    if (this.scanning) {
      throw new Error("正在扫描中");
    }

    this.scanning = true;
    try {
      const subnet =
        customSubnet || getSubnet(getLocalIpAddress() || "192.168.1.1");

      // 并行执行：mDNS 发现 + 网段端口扫描
      const [mdnsDevices, portOpenIps] = await Promise.all([
        discoverPrintersViaMdns(),
        this.scanSubnetPorts(subnet),
      ]);
      console.log("mdnsDevices", mdnsDevices);
      console.log("portOpenIps", portOpenIps);

      // 合并去重：mDNS 设备 + 端口扫描结果
      const allIps = new Set(portOpenIps);
      for (const dev of mdnsDevices) {
        if (dev.address) {
          allIps.add(dev.address);
        }
      }

      // 对每个 IP 并行获取 SNMP 信息（名称 + 型号）
      // 过滤规则：只保留能通过 SNMP 识别出设备信息的 IP
      const snmpResults = await Promise.all(
        [...allIps].map((ip) => getSnmpInfo(ip)),
      );

      const printers: Printer[] = [];
      let idx = 0;
      for (const ip of allIps) {
        const snmp = snmpResults[idx++];
        // SNMP 无法识别 → 不是打印机或非打印设备（如路由器、NAS 等），跳过
        if (snmp.name === "SNMP Disabled" || snmp.model === "Unknown Model") {
          console.log(`[scan filter] ${ip} - SNMP not recognized, skipped`);
          continue;
        }
        printers.push({
          id: `${ip}:${9100}`,
          ip,
          port: 9100,
          name: snmp.name,
          model: snmp.model,
          isDefault: false,
          status: "online",
        });
      }

      return printers;
    } finally {
      this.scanning = false;
    }
  }

  /** 扫描网段内所有 IP 的 9100 端口（兜底扫描） */
  private async scanSubnetPorts(subnet: string): Promise<string[]> {
    const promises: Promise<{ ip: string; open: boolean }>[] = [];

    for (let i = 1; i <= 254; i++) {
      const ip = `${subnet}.${i}`;
      promises.push(
        checkPort(ip, 9100).then((isOpen) => ({ ip, open: isOpen })),
      );
    }

    const results = await Promise.all(promises);
    return results.filter((r) => r.open).map((r) => r.ip);
  }

  /** 刷新单个打印机的 SNMP 名称信息 */
  async updatePrinterInfo(
    printer: Printer,
  ): Promise<{ name: string; model: string }> {
    const snmp = await getSnmpInfo(printer.ip);
    return { name: snmp.name, model: snmp.model };
  }

  /** 检测打印机是否在线 */
  async checkPrinterStatus(printer: Printer): Promise<"online" | "offline"> {
    const isOpen = await checkPort(printer.ip, printer.port, 2000);
    return isOpen ? "online" : "offline";
  }
}
