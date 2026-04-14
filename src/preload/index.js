import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  invoke: (channel) => ipcRenderer.invoke(channel),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
