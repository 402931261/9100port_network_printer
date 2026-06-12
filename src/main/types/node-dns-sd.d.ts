declare module 'node-dns-sd' {
  interface DnsSdDevice {
    address: string
    fqdn: string
    name: string
    port?: number
  }

  interface DnsSdOptions {
    name: string
    port?: number
  }

  export function discover(options: DnsSdOptions): Promise<DnsSdDevice[]>

  const _default: {
    discover: (options: DnsSdOptions) => Promise<DnsSdDevice[]>
  }
  export default _default
}
