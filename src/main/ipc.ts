import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeContent2File, updateContent2File, getAppDir, renameFile, removeFile, getFileContent, listAllMarkdownFiles, readHistoryFile, writeHistoryFile } from './local'

export const initIpcMain = () => {
  const appDir = getAppDir();

  ipcMain.handle('list-posts', async () => {
    return await listAllMarkdownFiles(appDir);
  })

  ipcMain.handle('get-post-history', async (_, { filename }) => {
    return await readHistoryFile(appDir, filename);
  })

  ipcMain.handle('save-post-history', async (_, { filename, history }) => {
    return await writeHistoryFile(appDir, filename, history);
  })

  ipcMain.handle('add-post', async (_, { title, content }) => {
    return writeContent2File(appDir, `${title}.md`, content);
  })

  ipcMain.handle('rename-post', async (_, { originTitle, newTitle }) => {
    return renameFile(appDir, `${originTitle}.md`, `${newTitle}.md`);
  })

  ipcMain.handle('remove-post', async (_, { title }) => {
    return removeFile(appDir, `${title}.md`);
  })

  ipcMain.handle('update-post', async (_, { title, content }) => {
    return updateContent2File(appDir, `${title}.md`, content);
  })

  ipcMain.handle('get-post', async (_, { title }) => {
    return getFileContent(appDir, `${title}.md`);
  })

  ipcMain.handle('import-post', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow() as BrowserWindow, {
      title: '选择 markdown 文件',
      filters: [{ name: 'Markdowns', extensions: ['md'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths.length) return ''
    const filePath = filePaths[0]
    return await getFileContent(filePath, '');
  })
}
