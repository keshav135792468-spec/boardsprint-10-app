import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of WORKSPACE_SCOPES) {
  provider.addScope(scope);
}

// Strict in-memory access token cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export function initWorkspaceAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthRequired?: () => void
) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthRequired?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthRequired?.();
    }
  });
}

export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain a Google Workspace access token. Please try signing in again.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getWorkspaceAccessToken(): string | null {
  return cachedAccessToken;
}

export async function signOutWorkspace(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
}

async function googleFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getWorkspaceAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google first to access your Workspace data.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      (data as { error?: { message?: string } })?.error?.message ||
      `Google API error (${res.status})`;
    if (res.status === 401) {
      cachedAccessToken = null;
    }
    throw new Error(errMsg);
  }
  return data as T;
}

// --- Google Calendar API ---
export interface CalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function listUpcomingCalendarEvents(maxResults = 15): Promise<CalendarEventItem[]> {
  const timeMin = encodeURIComponent('2026-11-20T00:00:00Z');
  const data = await googleFetch<{ items?: CalendarEventItem[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`
  );
  return data.items || [];
}

export async function createCalendarEvent(payload: {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}): Promise<CalendarEventItem> {
  return googleFetch<CalendarEventItem>(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  await googleFetch<void>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' }
  );
}

// --- Google Tasks API ---
export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
}

export async function listGoogleTaskLists(): Promise<GoogleTaskList[]> {
  const data = await googleFetch<{ items?: GoogleTaskList[] }>(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists'
  );
  return data.items || [];
}

export async function createGoogleTaskList(title: string): Promise<GoogleTaskList> {
  return googleFetch<GoogleTaskList>(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    }
  );
}

export async function listGoogleTasks(taskListId: string): Promise<GoogleTaskItem[]> {
  const data = await googleFetch<{ items?: GoogleTaskItem[] }>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&maxResults=50`
  );
  return data.items || [];
}

export async function createGoogleTask(
  taskListId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTaskItem> {
  return googleFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify(task),
    }
  );
}

export async function updateGoogleTaskStatus(
  taskListId: string,
  taskId: string,
  status: 'needsAction' | 'completed'
): Promise<GoogleTaskItem> {
  return googleFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
}

export async function deleteGoogleTask(taskListId: string, taskId: string): Promise<void> {
  await googleFetch<void>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'DELETE' }
  );
}

// --- Google Sheets API ---
export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: { title: string };
  sheets: Array<{ properties: { sheetId: number; title: string } }>;
}

export async function createStudyTrackerSpreadsheet(
  title: string,
  rows: string[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTitle: string }> {
  const sheetTitle = 'Pre-Board Schedule';
  const created = await googleFetch<SpreadsheetMetadata>(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: sheetTitle } }],
      }),
    }
  );

  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A1:I${rows.length}`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(created.spreadsheetId)}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `'${sheetTitle}'!A1:I${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    sheetTitle,
  };
}

export async function fetchSpreadsheetMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
  return googleFetch<SpreadsheetMetadata>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)`
  );
}

export async function readSpreadsheetRange(
  spreadsheetId: string,
  sheetTitle: string,
  cellRange = 'A1:I30'
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!${cellRange}`);
  const data = await googleFetch<{ values?: string[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}`
  );
  return data.values || [];
}

export async function writeSpreadsheetRange(
  spreadsheetId: string,
  sheetTitle: string,
  rows: string[][]
): Promise<void> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A1:I${rows.length}`);
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `'${sheetTitle}'!A1:I${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );
}
