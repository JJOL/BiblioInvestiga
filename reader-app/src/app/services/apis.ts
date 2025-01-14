export {}

interface ElectronAPI {
  ipcCall<TReq, TRes>(channel: string, request: TReq): Promise<TRes>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}