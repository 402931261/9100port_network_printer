import * as net from "net";
import * as os from "os";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const snmp = require("net-snmp");

// ==================== 配置 ====================
const PRINT_PORT = 9100;
const SNMP_TIMEOUT = 1200;
const PORT_TIMEOUT = 300;
// ==============================================

export interface SnmpInfo {
  name: string;
  model: string;
}

/** 获取本机局域网 IP */
export function getLocalIpAddress(): string | null {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === "IPv4" && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return null;
}

/** 从 IP 提取网段前缀，如 192.168.1.100 -> 192.168.1 */
export function getSubnet(ip: string): string {
  const parts = ip.split(".");
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * 检测目标 IP 的指定端口是否开放（核心扫描方法）
 * 使用 TCP 三次握手探测，超时时间短以提升扫描速度
 */
export function checkPort(
  ip: string,
  port: number,
  timeout: number = PORT_TIMEOUT,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

/**
 * 通过 SNMP 协议获取打印机名称和型号信息
 * 安全封装：超时/异常均返回默认值，不会抛出错误
 */
export function getSnmpInfo(ip: string): Promise<SnmpInfo> {
  return new Promise((resolve) => {
    let done = false;

    try {
      const session = snmp.createSession(ip, "public", {
        timeout: SNMP_TIMEOUT,
        retries: 0,
      });

      // 超时兜底：防止 session 回调永远不触发
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        try {
          session.close();
        } catch (_) {
          /* ignore */
        }
        resolve({ name: "SNMP禁用", model: "未知型号" });
      }, SNMP_TIMEOUT + 200);

      // sysName (1.3.6.1.2.1.1.5.0) + sysDescr (1.3.6.1.2.1.1.1.0)
      session.get(
        ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.1.0"],
        (err: Error | null, vb: any[]) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          try {
            session.close();
          } catch (_) {
            /* ignore */
          }

          if (err || !vb || vb.length < 2) {
            resolve({ name: "SNMP禁用", model: "未知型号" });
            return;
          }

          resolve({
            name: vb[0]?.value?.toString().trim() || "未知名称",
            model: vb[1]?.value?.toString().trim() || "未知型号",
          });
        },
      );
    } catch (_) {
      resolve({ name: "SNMP禁用", model: "未知型号" });
    }
  });
}

/**
 * mDNS 发现局域网打印机（类似手机自动发现）
 * 返回通过 _printer._tcp.local 服务发现的设备列表
 */
export async function discoverPrintersViaMdns(): Promise<MdnsDevice[]> {
  try {
    // node-dns-sd 是 CJS 包，导出的是单例实例，必须用 require 导入
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dnsSd = require("node-dns-sd");
    const devices = await dnsSd.discover({
      name: "_printer._tcp.local",
    });

    return (devices || []).map((dev: any) => ({
      address: dev.address,
      fqdn: dev.fqdn || "",
      name: (dev.fqdn || "")
        .replace("._printer._tcp.local", "")
        .replace(".local", "")
        .trim(),
    }));
  } catch (err) {
    console.warn("mDNS 发现失败:", err instanceof Error ? err.message : err);
    return [];
  }
}

export interface MdnsDevice {
  address: string;
  fqdn: string;
  name: string;
}
