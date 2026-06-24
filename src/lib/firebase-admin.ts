import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (error) {
  console.error('Error reading firebase-applet-config.json:', error);
  firebaseConfig = {};
}

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
export { getApps };
