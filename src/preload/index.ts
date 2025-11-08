import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { defaultDocumentName, defaultDocumentPath } from '../main/local'

// Custom APIs for renderer
const api = {
  onMessage: (callback) => ipcRenderer.on('message-to-renderer', (_, ...args) => callback(...args)),
  listPosts: () => ipcRenderer.invoke('list-posts'),
  getPostHistory: (filename) => ipcRenderer.invoke('get-post-history', { filename }),
  savePostHistory: (filename, history) => ipcRenderer.invoke('save-post-history', { filename, history }),
  addPost2Local: (title, content) => ipcRenderer.invoke('add-post', { title, content }),
  renamePost: (originTitle, newTitle) => ipcRenderer.invoke('rename-post', { originTitle, newTitle }),
  removePost: (title) => ipcRenderer.invoke('remove-post', { title }),
  updatePost: (title, content) => ipcRenderer.invoke('update-post', { title, content }),
  getPost: (title) => ipcRenderer.invoke('get-post', { title }),
  importPost: () => ipcRenderer.invoke('import-post')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('$api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.$api = api
}
