// 渲染进程使用的文章类型定义

export interface HistoryItem {
  datetime: string              // 保存时间
  content: string               // 历史内容
}

export interface Post {
  id: string                    // 文件名（不含扩展名）作为唯一标识
  title: string                 // 文件名（不含扩展名）
  content: string               // 文件内容
  createDatetime: Date          // 文件创建时间（来自文件系统）
  updateDatetime: Date          // 文件修改时间（来自文件系统）
  history?: HistoryItem[]       // 历史记录（从 .history.json 加载）
}
