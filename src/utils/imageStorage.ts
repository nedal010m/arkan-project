import { ProjectItem } from '../types/portfolio';

const DB_NAME = 'arkan_portfolio_storage_db';
const STORE_NAME = 'portfolio_store';
const PROJECTS_KEY = 'saved_projects_list';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectsToIndexedDB(projects: ProjectItem[]): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(projects, PROJECTS_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB fails
  }
  try {
    localStorage.setItem('arkan_portfolio_projects_v1', JSON.stringify(projects));
  } catch {
    // Ignore localStorage quota exceeded when storing multiple high-res images
  }
}

export async function loadProjectsFromIndexedDB(): Promise<ProjectItem[] | null> {
  try {
    const db = await openDatabase();
    return await new Promise<ProjectItem[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(PROJECTS_KEY);
      req.onsuccess = () => {
        if (Array.isArray(req.result) && req.result.length > 0) {
          resolve(req.result as ProjectItem[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export function compressImageFile(file: File, maxDimension = 1100, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const resultStr = reader.result;
      if (typeof resultStr !== 'string') {
        reject(new Error('صيغة الملف غير مدعومة.'));
        return;
      }
      const img = new Image();
      img.onerror = () => {
        // If browser cannot decode (e.g. SVG), return raw data URL if reasonable size
        if (resultStr.length <= 850000) {
          resolve(resultStr);
        } else {
          reject(new Error('تعذر معالجة الصورة المختارة.'));
        }
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width || 800;
        let height = img.height || 600;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resultStr);
          return;
        }
        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let compressed = canvas.toDataURL('image/jpeg', quality);
        // Ensure it stays comfortably below Firestore's 900KB limit
        if (compressed.length > 750000) {
          compressed = canvas.toDataURL('image/jpeg', 0.62);
        }
        resolve(compressed);
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  });
}
