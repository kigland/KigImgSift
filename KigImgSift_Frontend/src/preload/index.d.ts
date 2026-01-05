import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomAPI {
  selectFolder: () => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
