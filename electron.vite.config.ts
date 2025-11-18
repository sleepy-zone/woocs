// Polyfill Web APIs for undici in Node.js environment
if (typeof global !== 'undefined') {
  const g = global as any;
  
  if (typeof g.File === 'undefined') {
    g.File = class File {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      
      constructor(chunks: any, filename: string, options: any = {}) {
        this.name = filename;
        this.type = options.type || '';
        this.size = 0;
        this.lastModified = Date.now();
      }
    };
  }
  
  if (typeof g.Blob === 'undefined') {
    g.Blob = class Blob {
      type: string;
      size: number;
      
      constructor(chunks: any, options: any = {}) {
        this.type = options.type || '';
        this.size = 0;
      }
    };
  }
  
  if (typeof g.FormData === 'undefined') {
    g.FormData = class FormData {
      _data: Map<string, any>;
      
      constructor() {
        this._data = new Map();
      }
      append(key: string, value: any) {
        this._data.set(key, value);
      }
    };
  }
  
  if (typeof g.URLSearchParams === 'undefined') {
    g.URLSearchParams = class URLSearchParams {
      _params: Map<string, string>;
      
      constructor(init?: any) {
        this._params = new Map();
        if (typeof init === 'string') {
          // Simple parsing for query strings
          init.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) this._params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
          });
        }
      }
    };
  }
}

import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import doocsViteConfig from './doocs.vite.config';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: doocsViteConfig
})
