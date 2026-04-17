import * as fs from 'fs';
import * as path from 'path';

const SHARED_DATA_FILE = path.join(__dirname, '../.shared-data.json');

export function setSharedData(key: string, value: string): void {
  let data: Record<string, string> = {};
  if (fs.existsSync(SHARED_DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, 'utf-8'));
  }
  data[key] = value;
  fs.writeFileSync(SHARED_DATA_FILE, JSON.stringify(data, null, 2));
}

export function getSharedData(key: string): string | null {
  if (!fs.existsSync(SHARED_DATA_FILE)) return null;
  const data: Record<string, string> = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, 'utf-8'));
  return data[key] ?? null;
}
