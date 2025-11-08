/**
 * 本地文件处理
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getStore, setStore } from './store';
import DEFAULT_DOCUMENT_PATH from '../../resources/markdown.md?asset';
import type { FileInfo, PostHistory } from './types';

const promiseFs = fs.promises;

// 获取应用目录（根据环境）
export function getAppDir(): string {
  const isDev = process.env.NODE_ENV === 'development';
  const dirName = isDev ? 'woocs_dev' : 'woocs';
  return path.join(app.getPath('documents'), dirName);
}

export const defaultAppDir = getAppDir();
export const defaultDocumentName = '探索 Markdown';
export const defaultDocumentPath = path.join(defaultAppDir, `${defaultDocumentName}.md`);

export const checkIfDirExist = async (dirname: string) => {
  try {
    const stats = await promiseFs.stat(dirname);
    return stats.isDirectory();
  } catch(err) {
    console.log('checkIfDirExist fs stats error', err);
    return false;
  }
}

export const checkIfFileExist = async (filename: string) => {
  try {
    const stats = await promiseFs.stat(filename);
    return stats.isFile();
  } catch(err) {
    console.log('checkIfFileExist fs stats error', err);
    return false;
  }
}

export const createDir = async (dirname: string) => {
  const isDirExist = await checkIfDirExist(dirname);
  if (isDirExist) return;
  try {
    await promiseFs.mkdir(dirname, { recursive: true });
    return dirname;
  } catch(e) {
    console.log('mkdir error', e);
    return false;
  }
}

export const writeContent2File = async (dirname: string, filename: string, content: string) => {
  try {
    const filePath = path.join(dirname, filename);
    const ifFileExist = await checkIfFileExist(filePath);
    if (!ifFileExist) {
      await promiseFs.writeFile(filePath, content, { encoding: 'utf-8' });
      return filePath;
    }
    return '';
  } catch(e) {
    console.log('writeFile error', dirname, filename, e);
    return '';
  }
}

export const updateContent2File = async (dirname: string, filename: string, content: string) => {
  try {
    const filePath = path.join(dirname, filename);
    await promiseFs.writeFile(filePath, content, { encoding: 'utf-8' });
    return filePath;
  } catch(e) {
    console.log('writeFile error', dirname, filename, e);
    return '';
  }
}

export const renameFile = async (dirname: string, originFilename: string, newFileName: string) => {
  try {
    const filePath = path.join(dirname, newFileName);
    const ifFileExist = await checkIfFileExist(filePath);
    if (!ifFileExist) {
      await promiseFs.rename(path.join(dirname, originFilename), filePath)
      return filePath
    }
    return ''
  } catch(e) {
    console.log('writeFile error', dirname, originFilename, newFileName, e);
    return '';
  }
}

export const removeFile = async (dirname: string, filename: string) => {
  try {
    const filePath = path.join(dirname, filename);
    await promiseFs.unlink(filePath)
    return filePath
  } catch(e) {
    console.log('writeFile error', dirname, filename, e);
    return '';
  }
}

export const getFileContent = async (dirname: string, filename: string) => {
  try {
    const filePath = path.join(dirname, filename);
    return await promiseFs.readFile(filePath, { encoding: 'utf-8' });
  } catch(e) {
    console.log('writeFile error', dirname, filename, e);
    return '';
  }
}

// 列出所有 markdown 文件
export async function listAllMarkdownFiles(dirname: string): Promise<FileInfo[]> {
  try {
    const files = await promiseFs.readdir(dirname);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const fileInfos = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(dirname, filename);
        const stats = await promiseFs.stat(filePath);
        return {
          name: filename,
          path: filePath,
          createTime: stats.birthtime,
          modifyTime: stats.mtime,
        };
      })
    );
    
    return fileInfos;
  } catch (e) {
    console.error('listAllMarkdownFiles error', e);
    return [];
  }
}

// 读取历史记录文件
export async function readHistoryFile(dirname: string, filename: string): Promise<PostHistory | null> {
  try {
    const historyPath = path.join(dirname, `${filename}.history.json`);
    const content = await promiseFs.readFile(historyPath, { encoding: 'utf-8' });
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

// 写入历史记录文件
export async function writeHistoryFile(dirname: string, filename: string, history: PostHistory): Promise<boolean> {
  try {
    const historyPath = path.join(dirname, `${filename}.history.json`);
    await promiseFs.writeFile(historyPath, JSON.stringify(history, null, 2), { encoding: 'utf-8' });
    return true;
  } catch (e) {
    console.error('writeHistoryFile error', e);
    return false;
  }
}

export const initDocumentDir = async () => {
  const appDir = getAppDir();
  await createDir(appDir);

  // 如果第一次启动应用，则创建默认文件
  const storeKey = process.env.NODE_ENV === 'development' ? 'woocs-first-run-dev-5' : 'woocs-first-run-5';
  if (!getStore(storeKey)) {
    const defaultFileContent = await promiseFs.readFile(DEFAULT_DOCUMENT_PATH, { encoding: 'utf-8' });
    writeContent2File(appDir, `${defaultDocumentName}.md`, defaultFileContent);
    setStore(storeKey, '1');
  }
}
