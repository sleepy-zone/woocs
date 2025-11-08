import { ElectronAPI } from '@electron-toolkit/preload'

interface FileInfo {
  name: string
  path: string
  createTime: Date
  modifyTime: Date
}

interface HistoryItem {
  datetime: string
  content: string
}

interface PostHistory {
  items: HistoryItem[]
}

interface API {
  onMessage: (callback: (...args: any[]) => void) => void
  listPosts: () => Promise<FileInfo[]>
  getPostHistory: (filename: string) => Promise<PostHistory | null>
  savePostHistory: (filename: string, history: PostHistory) => Promise<boolean>
  addPost2Local: (title: string, content: string) => Promise<string>
  renamePost: (originTitle: string, newTitle: string) => Promise<string>
  removePost: (title: string) => Promise<string>
  updatePost: (title: string, content: string) => Promise<string>
  getPost: (title: string) => Promise<string>
  importPost: () => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    $api: API
  }
}
