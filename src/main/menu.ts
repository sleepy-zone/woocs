import { app, Menu, BrowserWindow, shell } from 'electron';

const isMac = process.platform === 'darwin'

const send2Render = (data: any = null) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.send('message-to-renderer', data);
  }
}

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          // {
          //   label: 'About Woocs',
          //   click: () => {
          //     send2Render({
          //       action: 'about'
          //     })
          //   }
          // },
          // { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              send2Render({
                action: 'settings'
              })
            }
          },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  { role: 'fileMenu' },
  // {
  //   label: 'File',
  //   submenu: [
  //     {
  //       label: '新建',
  //       accelerator: 'CmdOrCtrl+N',
  //       click: () => {
  //         send2Render({
  //           action: 'new-file'
  //         })
  //       }
  //     },
  //     {
  //       label: '导入 .md',
  //       accelerator: 'Shift+CmdOrCtrl+I',
  //       click: () => {
  //         send2Render({
  //           action: 'import-md'
  //         })
  //       }
  //     },
  //     { type: 'separator' },
  //     {
  //       label: '导出 .md',
  //       accelerator: 'CmdOrCtrl+E',
  //       click: () => {
  //         send2Render({
  //           action: 'export-md'
  //         })
  //       }
  //     },
  //     {
  //       label: '导出 .html',
  //       accelerator: 'CmdOrCtrl+Shift+E',
  //       click: () => {
  //         send2Render({
  //           action: 'export-html'
  //         })
  //       }
  //     },
  //     {
  //       label: '导出 .html（无样式）',
  //       click: () => {
  //         send2Render({
  //           action: 'export-pure-html'
  //         })
  //       }
  //     },
  //     {
  //       label: '导出 .pdf',
  //       accelerator: 'CmdOrCtrl+P',
  //       click: () => {
  //         send2Render({
  //           action: 'export-pdf'
  //         })
  //       }
  //     },
  //     {
  //       label: '导出 .png',
  //       click: () => {
  //         send2Render({
  //           action: 'export-png'
  //         })
  //       }
  //      },
  //     { type: 'separator' },
  //     {
  //       label: '导入/导出项目配置',
  //       click: () => {
  //         send2Render({
  //           action: 'editor-state'
  //         })
  //       }
  //     },
  //     { type: 'separator' },
  //     isMac ? { role: 'close' } : { role: 'quit' },
  //     ...(
  //       isMac ?
  //       [] :
  //       [{
  //         label: '偏好设置',
  //         click: () => {
  //           send2Render({
  //             action: 'settings'
  //           })
  //         }
  //       },]
  //     )
  //   ]
  // },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  },
  // { role: 'formatMenu' }

  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [
            { role: 'close' }
          ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          await shell.openExternal('https://github.com/sleepy-zone/woocs')
        }
      }
    ]
  }
]

// @ts-ignore
export const menu = Menu.buildFromTemplate(template);
