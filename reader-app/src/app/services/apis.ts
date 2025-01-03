export {}

interface ElectronAPI {
  ipcCall<TReq, TRes>(channel: string, requst: TReq): Promise<TRes>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}