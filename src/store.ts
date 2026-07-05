import { AppData, MachineRecord, UserProfile, APP_VERSION } from './types';

const STORAGE_KEY = 'machine_tracker_data';

function getAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: APP_VERSION, profile: null, records: [] };
    return JSON.parse(raw) as AppData;
  } catch {
    return { version: APP_VERSION, profile: null, records: [] };
  }
}

function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProfile(): UserProfile | null {
  return getAppData().profile;
}

export function saveProfile(profile: UserProfile): void {
  const data = getAppData();
  data.profile = profile;
  saveAppData(data);
}

export function getRecords(): MachineRecord[] {
  return getAppData().records;
}

export function addRecord(record: MachineRecord): void {
  const data = getAppData();
  data.records.unshift(record);
  saveAppData(data);
}

export function updateRecord(updated: MachineRecord): void {
  const data = getAppData();
  const idx = data.records.findIndex(r => r.id === updated.id);
  if (idx !== -1) data.records[idx] = updated;
  saveAppData(data);
}

export function deleteRecord(id: string): void {
  const data = getAppData();
  data.records = data.records.filter(r => r.id !== id);
  saveAppData(data);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function exportData(): void {
  const data = getAppData();
  data.exportedAt = new Date().toISOString();
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MachineTracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = JSON.parse(raw) as AppData;
        if (!parsed.records || !Array.isArray(parsed.records)) {
          resolve({ success: false, message: 'ফাইলটি সঠিক ফরম্যাটে নেই।' });
          return;
        }
        saveAppData({ ...parsed, version: APP_VERSION });
        resolve({ success: true, message: `${parsed.records.length} রেকর্ড সফলভাবে ইম্পোর্ট হয়েছে।` });
      } catch {
        resolve({ success: false, message: 'ফাইল পড়তে সমস্যা হয়েছে।' });
      }
    };
    reader.onerror = () => resolve({ success: false, message: 'ফাইল খুলতে পারেনি।' });
    reader.readAsText(file);
  });
}

export function clearAllData(): void {
  const data = getAppData();
  data.records = [];
  saveAppData(data);
}

export function hasPendingItems(r: MachineRecord): boolean {
  return r.status === 'active' && (
    (r.issuedItems.bobbin && !r.returnedItems.bobbin) ||
    (r.issuedItems.case && !r.returnedItems.case) ||
    (r.issuedItems.needle > 0 && r.returnedItems.needle < r.issuedItems.needle) ||
    (r.issuedItems.knife && !r.returnedItems.knife)
  );
}

export function getStats() {
  const records = getRecords();
  const total = records.length;
  const active = records.filter(r => r.status === 'active').length;
  const closed = records.filter(r => r.status === 'closed').length;

  let pendingBobbin = 0, pendingCase = 0, pendingNeedle = 0, pendingKnife = 0;
  for (const r of records) {
    if (r.status !== 'active') continue;
    if (r.issuedItems.bobbin && !r.returnedItems.bobbin) pendingBobbin++;
    if (r.issuedItems.case && !r.returnedItems.case) pendingCase++;
    if (r.issuedItems.needle > 0 && r.returnedItems.needle < r.issuedItems.needle) pendingNeedle++;
    if (r.issuedItems.knife && !r.returnedItems.knife) pendingKnife++;
  }

  return { total, active, closed, pendingBobbin, pendingCase, pendingNeedle, pendingKnife };
}

export function searchRecords(query: string): MachineRecord[] {
  if (!query.trim()) return getRecords();
  const q = query.trim().toLowerCase();
  return getRecords().filter(r =>
    r.recipient.name.toLowerCase().includes(q) ||
    (r.recipient.cardNumber || '').toLowerCase().includes(q) ||
    r.machineNumber.toLowerCase().includes(q) ||
    r.lineNumber.toString() === q ||
    r.machineType.toLowerCase().includes(q)
  );
}

export function getPendingRecords(): MachineRecord[] {
  return getRecords().filter(hasPendingItems);
}

export function getPendingAccessoryCounts() {
  const records = getRecords().filter(r => r.status === 'active');
  let bobbin = 0, caseCount = 0, needle = 0, knife = 0;
  for (const r of records) {
    if (r.issuedItems.bobbin && !r.returnedItems.bobbin) bobbin++;
    if (r.issuedItems.case && !r.returnedItems.case) caseCount++;
    needle += Math.max(0, r.issuedItems.needle - r.returnedItems.needle);
    if (r.issuedItems.knife && !r.returnedItems.knife) knife++;
  }
  return { bobbin, case: caseCount, needle, knife, total: bobbin + caseCount + needle + knife };
}

export function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const side = Math.min(img.width, img.height, maxSize);
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas not supported')); return; }
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, side, side);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
