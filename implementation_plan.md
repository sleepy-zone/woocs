# Implementation Plan

## [Overview]

将 woocs 项目的内容管理从 localStorage 完全迁移到本地文件系统，实现真正的文件系统驱动的内容管理。

本次重构的核心目标是消除当前双重存储（localStorage + 文件系统）带来的数据不一致问题，将所有文章内容及其历史记录完全托管到文件系统。应用启动时从文件系统加载文章列表，所有 CRUD 操作直接操作文件，用户可通过刷新按钮重新加载文章目录。

关键改动包括：
- 移除 Pinia Store 中 posts 的 localStorage 持久化
- 简化为扁平文件结构（移除树形结构支持）
- 历史记录存储为独立的 `.history.json` 文件
- 区分开发环境（woocs_dev）和生产环境（woocs）目录
- 复用现有的 IPC 文件操作接口

## [Types]

定义文件系统驱动的数据结构和接口类型。

```typescript
// src/renderer/src/types/post.ts
export interface Post {
  id: string                    // 文件名（不含扩展名）作为唯一标识
  title: string                 // 文件名（不含扩展名）
  content: string               // 文件内容
  createDatetime: Date          // 文件创建时间（来自文件系统）
  updateDatetime: Date          // 文件修改时间（来自文件系统）
  history?: HistoryItem[]       // 历史记录（从 .history.json 加载）
}

export interface HistoryItem {
  datetime: string              // 保存时间
  content: string               // 历史内容
}

// src/main/types.ts
export interface FileInfo {
  name: string                  // 文件名（含扩展名）
  path: string                  // 完整路径
  createTime: Date              // 创建时间
  modifyTime: Date              // 修改时间
}

export interface PostHistory {
  items: HistoryItem[]
}
```

## [Files]

详细说明需要创建、修改和删除的文件。

### 新建文件

1. **src/renderer/src/types/post.ts**
   - 定义 Post、HistoryItem 接口
   - 导出类型供全局使用

2. **src/main/types.ts**
   - 定义主进程使用的类型
   - FileInfo、PostHistory 等

### 修改文件

1. **src/main/local.ts**
   - 添加环境判断逻辑（dev/prod 目录）
   - 添加 `listAllMarkdownFiles()` 函数
   - 添加 `getFileStats()` 函数
   - 添加 `readHistoryFile()` 函数
   - 添加 `writeHistoryFile()` 函数
   - 修改 `defaultAppDir` 为动态计算

2. **src/main/ipc.ts**
   - 添加 `list-posts` handler
   - 添加 `get-post-history` handler
   - 添加 `save-post-history` handler
   - 保留现有的 CRUD handlers

3. **src/preload/index.ts**
   - 添加 `listPosts` API
   - 添加 `getPostHistory` API
   - 添加 `savePostHistory` API

4. **src/preload/index.d.ts**
   - 更新类型定义

5. **src/renderer/src/stores/index.ts**
   - 移除 `posts` 的 `useStorage` 包装
   - 改为普通 `ref<Post[]>([])`
   - 移除 `parentId`、`collapsed` 相关字段和逻辑
   - 添加 `loadPostsFromFileSystem()` 方法
   - 添加 `refreshPosts()` 方法
   - 修改 `addPost()` 调用文件系统 API
   - 修改 `renamePost()` 调用文件系统 API
   - 修改 `delPost()` 调用文件系统 API
   - 修改历史记录保存逻辑
   - 移除 `updatePostParentId()`、`collapseAllPosts()`、`expandAllPosts()`

6. **src/renderer/src/components/editor/post-slider/index.vue**
   - 添加刷新按钮（在顶部工具栏）
   - 移除树形结构相关代码
   - 移除折叠/展开按钮
   - 移除拖拽到子文章的逻辑
   - 简化为扁平列表展示

7. **src/renderer/src/components/editor/post-slider/PostItem.vue**
   - 移除递归渲染逻辑
   - 移除 `parentId` 相关 props
   - 移除折叠/展开功能
   - 移除子文章缩进样式
   - 简化拖拽逻辑（仅用于排序）

8. **src/renderer/src/views/CodemirrorEditor.vue**
   - 修改历史记录定时器逻辑，调用文件系统 API

9. **src/main/index.ts**
   - 确保 `initDocumentDir()` 使用正确的目录

### 删除内容

- 移除所有 `parentId` 相关的代码
- 移除所有 `collapsed` 相关的代码
- 移除树形结构渲染逻辑
- 移除 `updatePostParentId()`、`collapseAllPosts()`、`expandAllPosts()` 方法

## [Functions]

详细说明需要新增、修改和删除的函数。

### 新增函数

**src/main/local.ts**

```typescript
// 获取应用目录（根据环境）
export function getAppDir(): string {
  const isDev = process.env.NODE_ENV === 'development'
  const dirName = isDev ? 'woocs_dev' : 'woocs'
  return path.join(app.getPath('documents'), dirName)
}

// 列出所有 markdown 文件
export async function listAllMarkdownFiles(dirname: string): Promise<FileInfo[]> {
  const files = await promiseFs.readdir(dirname)
  const mdFiles = files.filter(f => f.endsWith('.md'))
  
  const fileInfos = await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(dirname, filename)
      const stats = await promiseFs.stat(filePath)
      return {
        name: filename,
        path: filePath,
        createTime: stats.birthtime,
        modifyTime: stats.mtime,
      }
    })
  )
  
  return fileInfos
}

// 读取历史记录文件
export async function readHistoryFile(dirname: string, filename: string): Promise<PostHistory | null> {
  try {
    const historyPath = path.join(dirname, `${filename}.history.json`)
    const content = await promiseFs.readFile(historyPath, { encoding: 'utf-8' })
    return JSON.parse(content)
  } catch (e) {
    return null
  }
}

// 写入历史记录文件
export async function writeHistoryFile(dirname: string, filename: string, history: PostHistory): Promise<boolean> {
  try {
    const historyPath = path.join(dirname, `${filename}.history.json`)
    await promiseFs.writeFile(historyPath, JSON.stringify(history, null, 2), { encoding: 'utf-8' })
    return true
  } catch (e) {
    console.error('writeHistoryFile error', e)
    return false
  }
}
```

**src/main/ipc.ts**

```typescript
ipcMain.handle('list-posts', async () => {
  const appDir = getAppDir()
  return await listAllMarkdownFiles(appDir)
})

ipcMain.handle('get-post-history', async (_, { filename }) => {
  const appDir = getAppDir()
  return await readHistoryFile(appDir, filename)
})

ipcMain.handle('save-post-history', async (_, { filename, history }) => {
  const appDir = getAppDir()
  return await writeHistoryFile(appDir, filename, history)
})
```

**src/renderer/src/stores/index.ts**

```typescript
// 从文件系统加载所有文章
async function loadPostsFromFileSystem() {
  try {
    const fileInfos = await window.$api.listPosts()
    
    const loadedPosts = await Promise.all(
      fileInfos.map(async (fileInfo) => {
        const filename = fileInfo.name.replace('.md', '')
        const content = await window.$api.getPost(filename)
        const historyData = await window.$api.getPostHistory(filename)
        
        return {
          id: filename,
          title: filename,
          content: content || '',
          createDatetime: new Date(fileInfo.createTime),
          updateDatetime: new Date(fileInfo.modifyTime),
          history: historyData?.items || [],
        }
      })
    )
    
    posts.value = loadedPosts
    
    // 如果当前选中的文章不存在，选中第一篇
    if (!posts.value.some(p => p.id === currentPostId.value)) {
      currentPostId.value = posts.value[0]?.id || ''
    }
  } catch (error) {
    console.error('Failed to load posts from file system:', error)
    toast.error('加载文章列表失败')
  }
}

// 刷新文章列表
async function refreshPosts() {
  await loadPostsFromFileSystem()
  toast.success('文章列表已刷新')
}
```

### 修改函数

**src/renderer/src/stores/index.ts**

```typescript
// 修改 addPost - 调用文件系统 API
const addPost = async (title: string) => {
  if (posts.value.some(p => p.title === title)) {
    toast.error('文章标题已存在')
    return
  }
  
  const content = `# ${title}`
  const filePath = await window.$api.addPost2Local(title, content)
  
  if (filePath) {
    await loadPostsFromFileSystem()
    currentPostId.value = title
    toast.success('文章创建成功')
  } else {
    toast.error('文章创建失败')
  }
}

// 修改 renamePost - 调用文件系统 API
const renamePost = async (id: string, newTitle: string) => {
  const post = getPostById(id)
  if (!post) return
  
  const filePath = await window.$api.renamePost(post.title, newTitle)
  
  if (filePath) {
    await loadPostsFromFileSystem()
    currentPostId.value = newTitle
    toast.success('重命名成功')
  } else {
    toast.error('重命名失败')
  }
}

// 修改 delPost - 调用文件系统 API
const delPost = async (id: string) => {
  const post = getPostById(id)
  if (!post) return
  
  const filePath = await window.$api.removePost(post.title)
  
  if (filePath) {
    await loadPostsFromFileSystem()
    toast.success('删除成功')
  } else {
    toast.error('删除失败')
  }
}

// 修改内容保存逻辑
watch(currentPostId, async () => {
  const post = getPostById(currentPostId.value)
  if (post && editor.value) {
    // 从文件系统读取最新内容
    const content = await window.$api.getPost(post.title)
    editor.value.dispatch({
      changes: { from: 0, to: editor.value.state.doc.length, insert: content },
    })
  }
})
```

### 删除函数

- `updatePostParentId()`
- `collapseAllPosts()`
- `expandAllPosts()`

## [Classes]

本项目主要使用函数式编程和 Composition API，不涉及类的修改。

## [Dependencies]

无需添加新的依赖包，完全使用现有依赖。

现有依赖已满足需求：
- `electron` - 文件系统操作
- `pinia` - 状态管理
- `vue` - 响应式系统

## [Testing]

测试策略和验证方法。

### 手动测试清单

1. **文件系统初始化**
   - [ ] 开发环境创建 `~/Documents/woocs_dev/` 目录
   - [ ] 生产环境创建 `~/Documents/woocs/` 目录
   - [ ] 首次启动创建默认文章

2. **文章列表加载**
   - [ ] 启动应用，验证从文件系统加载所有 `.md` 文件
   - [ ] 验证文章按排序模式正确显示
   - [ ] 验证文件创建/修改时间正确显示

3. **文章 CRUD 操作**
   - [ ] 新建文章，验证 `.md` 文件创建
   - [ ] 重命名文章，验证文件重命名
   - [ ] 删除文章，验证文件删除
   - [ ] 编辑文章内容，验证文件内容更新

4. **历史记录功能**
   - [ ] 编辑文章，等待 30 秒，验证 `.history.json` 文件创建
   - [ ] 打开历史记录对话框，验证历史列表显示
   - [ ] 恢复历史记录，验证内容正确恢复

5. **刷新功能**
   - [ ] 点击刷新按钮，验证文章列表重新加载
   - [ ] 在文件系统中手动添加 `.md` 文件，刷新后验证显示

6. **边界情况**
   - [ ] 文件系统中无文章时的处理
   - [ ] 文件名包含特殊字符的处理
   - [ ] 并发编辑同一文章的处理
   - [ ] 文件系统权限错误的处理

### 回归测试

- [ ] 验证现有的导出功能（HTML、PDF、MD）
- [ ] 验证图片上传功能
- [ ] 验证主题切换功能
- [ ] 验证 CSS 自定义功能
- [ ] 验证 AI 工具箱功能

## [Implementation Order]

按照依赖关系和风险程度排序的实施步骤。

### 第一阶段：主进程文件系统 API（低风险）

1. **创建类型定义文件**
   - 创建 `src/main/types.ts`
   - 创建 `src/renderer/src/types/post.ts`
   - 定义所有接口类型

2. **修改 src/main/local.ts**
   - 添加 `getAppDir()` 函数
   - 添加 `listAllMarkdownFiles()` 函数
   - 添加 `readHistoryFile()` 函数
   - 添加 `writeHistoryFile()` 函数
   - 修改 `defaultAppDir` 使用 `getAppDir()`

3. **修改 src/main/ipc.ts**
   - 添加 `list-posts` handler
   - 添加 `get-post-history` handler
   - 添加 `save-post-history` handler
   - 导入 `getAppDir` 和新增的函数

4. **修改 src/preload/index.ts**
   - 添加 `listPosts` API
   - 添加 `getPostHistory` API
   - 添加 `savePostHistory` API

5. **修改 src/preload/index.d.ts**
   - 更新 `$api` 接口类型定义

### 第二阶段：渲染进程 Store 重构（中风险）

6. **修改 src/renderer/src/stores/index.ts**
   - 移除 `posts` 的 `useStorage` 包装
   - 移除 `parentId`、`collapsed` 相关字段
   - 添加 `loadPostsFromFileSystem()` 函数
   - 添加 `refreshPosts()` 函数
   - 修改 `addPost()` 为异步，调用文件系统 API
   - 修改 `renamePost()` 为异步，调用文件系统 API
   - 修改 `delPost()` 为异步，调用文件系统 API
   - 移除 `updatePostParentId()`
   - 移除 `collapseAllPosts()`
   - 移除 `expandAllPosts()`
   - 修改 `currentPostId` 的 watch 逻辑

7. **在 App.vue 或 main.ts 中添加初始化逻辑**
   - 应用启动时调用 `loadPostsFromFileSystem()`

### 第三阶段：UI 组件简化（中风险）

8. **修改 src/renderer/src/components/editor/post-slider/index.vue**
   - 添加刷新按钮（RefreshCw 图标）
   - 移除折叠/展开按钮（ChevronsDownUp、ChevronsUpDown）
   - 移除 `openAddPostDialog` 中的 `parentId` 参数
   - 移除拖拽相关的 `parentId` 检查逻辑
   - 简化 `addPost()` 函数，移除 `parentId` 参数
   - 更新 `addPost()` 为异步调用

9. **修改 src/renderer/src/components/editor/post-slider/PostItem.vue**
   - 移除 `parentId` prop
   - 移除递归渲染的 `<PostItem>` 组件
   - 移除折叠/展开图标和逻辑
   - 移除子文章缩进样式
   - 移除 `isHasChild()` 函数
   - 移除 `togglePostExpanded()` 函数
   - 移除 `openAddPostDialog` 菜单项（或移除 parentId 参数）
   - 简化拖拽逻辑

### 第四阶段：历史记录集成（低风险）

10. **修改 src/renderer/src/views/CodemirrorEditor.vue**
    - 修改历史记录定时器逻辑
    - 调用 `window.$api.savePostHistory()` 保存历史
    - 确保历史记录格式符合 `PostHistory` 接口

11. **修改历史记录对话框**
    - 在 `post-slider/index.vue` 中更新历史记录加载逻辑
    - 从 `post.history` 读取而非直接访问 store

### 第五阶段：测试和优化（低风险）

12. **集成测试**
    - 执行手动测试清单
    - 修复发现的 bug
    - 优化性能（如文件列表缓存）

13. **清理代码**
    - 移除未使用的导入
    - 移除注释掉的代码
    - 更新相关文档

14. **数据迁移（可选）**
    - 提供工具将 localStorage 中的 posts 导出为文件
    - 帮助用户迁移现有数据

## [Notes]

### 重要注意事项

1. **数据备份**
   - 实施前提醒用户备份 localStorage 数据
   - 提供导出功能将现有文章导出为 `.md` 文件

2. **向后兼容**
   - 首次运行时检测 localStorage 中的 posts
   - 自动迁移到文件系统
   - 迁移完成后清空 localStorage

3. **错误处理**
   - 所有文件系统操作都需要 try-catch
   - 提供友好的错误提示
   - 记录详细的错误日志

4. **性能优化**
   - 文章列表加载时显示 loading 状态
   - 考虑实现文件监听（chokidar）自动刷新
   - 大量文章时考虑分页或虚拟滚动

5. **文件名限制**
   - 验证文件名不包含非法字符（`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`）
   - 限制文件名长度（建议最大 255 字符）
   - 处理文件名冲突

### 开发建议

- 每完成一个阶段都进行测试
- 使用 Git 分支管理，每个阶段一个 commit
- 保留原有代码的注释，标记为 `// TODO: Remove after migration`
- 在开发环境充分测试后再构建生产版本
