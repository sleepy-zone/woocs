// 主进程使用的类型定义

export interface FileInfo {
  name: string                  // 文件名（含扩展名）
  path: string                  // 完整路径
  createTime: Date              // 创建时间
  modifyTime: Date              // 修改时间
}

export interface HistoryItem {
  datetime: string              // 保存时间
  content: string               // 历史内容
}

export interface PostHistory {
  items: HistoryItem[]
}
