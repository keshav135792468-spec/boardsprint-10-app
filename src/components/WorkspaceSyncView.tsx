import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckSquare,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Table,
  Trash2,
} from 'lucide-react';
import { SCHEDULE_DAYS, STUDY_BLOCKS, SUBJECTS } from '../data/syllabusData';
import {
  buildCalendarEventPayload,
  buildGoogleSheetRows,
} from '../utils/scheduleEngine';
import { WorkspaceProgressChart } from './WorkspaceProgressChart';
import {
  createCalendarEvent,
  createGoogleTask,
  createGoogleTaskList,
  createStudyTrackerSpreadsheet,
  deleteCalendarEvent,
  deleteGoogleTask,
  fetchSpreadsheetMetadata,
  initWorkspaceAuth,
  listGoogleTaskLists,
  listGoogleTasks,
  listUpcomingCalendarEvents,
  readSpreadsheetRange,
  signInWithGoogleWorkspace,
  signOutWorkspace,
  updateGoogleTaskStatus,
  writeSpreadsheetRange,
  type CalendarEventItem,
  type GoogleTaskItem,
  type GoogleTaskList,
  type SpreadsheetMetadata,
} from '../services/googleWorkspace';

interface WorkspaceSyncViewProps {
  completedBlockIds: Set<string>;
  completedChapterIds: Set<string>;
}

interface PendingConfirmation {
  title: string;
  description: string;
  items: string[];
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

export function WorkspaceSyncView({
  completedBlockIds,
  completedChapterIds,
}: WorkspaceSyncViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Mandatory explicit user confirmation modal for ALL mutating Workspace calls
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);

  // Calendar State
  const [calendarDayToSync, setCalendarDayToSync] = useState<number>(1);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

  // Tasks State
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [tasksDayToSync, setTasksDayToSync] = useState<number>(1);

  // Sheets State
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [sheetMeta, setSheetMeta] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [sheetPreviewRows, setSheetPreviewRows] = useState<string[][]>([]);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await signInWithGoogleWorkspace();
      setUser(result.user);
      setNeedsAuth(false);
      setStatusMessage('Connected to Google Calendar, Google Tasks, and Google Sheets.');
      // Fetch initial read-only data right after sign-in
      await Promise.all([refreshCalendar(), refreshTaskLists()]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutWorkspace();
    setUser(null);
    setNeedsAuth(true);
    setCalendarEvents([]);
    setTaskLists([]);
    setTasks([]);
    setSheetMeta(null);
    setSheetPreviewRows([]);
    setStatusMessage('Signed out of Google Workspace.');
  };

  const runConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await action.onConfirm();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Workspace operation failed.');
    } finally {
      setBusyAction(null);
    }
  };

  // --- Calendar Operations ---
  const refreshCalendar = async () => {
    setBusyAction('load-calendar');
    setErrorMessage(null);
    try {
      const items = await listUpcomingCalendarEvents(15);
      setCalendarEvents(items);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load Calendar events.');
    } finally {
      setBusyAction(null);
    }
  };

  const requestPushDayToCalendar = () => {
    const dayBlocks = STUDY_BLOCKS.filter((b) => b.dayNumber === calendarDayToSync);
    const dayMeta = SCHEDULE_DAYS.find((d) => d.dayNumber === calendarDayToSync);
    setPendingConfirm({
      title: `Add ${dayBlocks.length} Study Events to Google Calendar?`,
      description: `This will create ${dayBlocks.length} events on your primary Google Calendar for Day ${calendarDayToSync} (${dayMeta?.displayDate}, 2026).`,
      items: dayBlocks.map((b) => `${b.startTime}–${b.endTime}: ${b.title}`),
      confirmLabel: `Create ${dayBlocks.length} Calendar Events`,
      onConfirm: async () => {
        setBusyAction('push-calendar');
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        for (const block of dayBlocks) {
          await createCalendarEvent(buildCalendarEventPayload(block, tz));
        }
        setStatusMessage(
          `Added ${dayBlocks.length} Day ${calendarDayToSync} study blocks to Google Calendar.`
        );
        await refreshCalendar();
      },
    });
  };

  const requestDeleteCalendarEvent = (ev: CalendarEventItem) => {
    setPendingConfirm({
      title: 'Delete Google Calendar Event?',
      description: `Are you sure you want to permanently remove "${ev.summary || 'Untitled event'}" from your Google Calendar?`,
      items: [ev.summary || ev.id],
      confirmLabel: 'Delete Event',
      isDestructive: true,
      onConfirm: async () => {
        setBusyAction(`del-cal-${ev.id}`);
        await deleteCalendarEvent(ev.id);
        setStatusMessage(`Deleted "${ev.summary || 'event'}" from Google Calendar.`);
        await refreshCalendar();
      },
    });
  };

  // --- Tasks Operations ---
  const refreshTaskLists = async () => {
    setBusyAction('load-tasks');
    setErrorMessage(null);
    try {
      const lists = await listGoogleTaskLists();
      setTaskLists(lists);
      if (lists.length > 0) {
        const targetId = selectedTaskListId || lists[0].id;
        setSelectedTaskListId(targetId);
        const listItems = await listGoogleTasks(targetId);
        setTasks(listItems);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load Google Tasks.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSelectTaskList = async (listId: string) => {
    setSelectedTaskListId(listId);
    setBusyAction('load-tasks');
    try {
      const listItems = await listGoogleTasks(listId);
      setTasks(listItems);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load tasks in this list.');
    } finally {
      setBusyAction(null);
    }
  };

  const requestCreatePreBoardTaskList = () => {
    setPendingConfirm({
      title: 'Create New Google Tasks List?',
      description: 'This will create a dedicated "Class 10 Pre-Board Sprint" task list in your Google Tasks account.',
      items: ['New Task List: Class 10 Pre-Board Sprint'],
      confirmLabel: 'Create Task List',
      onConfirm: async () => {
        setBusyAction('create-tasklist');
        const created = await createGoogleTaskList('Class 10 Pre-Board Sprint');
        setSelectedTaskListId(created.id);
        setStatusMessage(`Created Google Tasks list "${created.title}".`);
        await refreshTaskLists();
      },
    });
  };

  const requestPushDayToTasks = () => {
    if (!selectedTaskListId) {
      setErrorMessage('Select or create a Google Tasks list first.');
      return;
    }
    const dayBlocks = STUDY_BLOCKS.filter((b) => b.dayNumber === tasksDayToSync);
    const activeList = taskLists.find((l) => l.id === selectedTaskListId);
    setPendingConfirm({
      title: `Add ${dayBlocks.length} Tasks to "${activeList?.title || 'Google Tasks'}"?`,
      description: `This will insert ${dayBlocks.length} study checklist items for Day ${tasksDayToSync} into your selected Google Tasks list.`,
      items: dayBlocks.map((b) => `[Day ${b.dayNumber}] ${b.title}`),
      confirmLabel: `Add ${dayBlocks.length} Tasks`,
      onConfirm: async () => {
        setBusyAction('push-tasks');
        for (const b of dayBlocks) {
          const subj = SUBJECTS.find((s) => s.id === b.subjectId);
          await createGoogleTask(selectedTaskListId, {
            title: `[${subj?.shortName || b.subjectId}] ${b.title}`,
            notes: `Resources: ${b.resources.join(', ')}\nTarget: ${b.deliverable}`,
            due: `${b.dateISO}T23:59:00.000Z`,
          });
        }
        setStatusMessage(`Added ${dayBlocks.length} tasks to "${activeList?.title}".`);
        const updated = await listGoogleTasks(selectedTaskListId);
        setTasks(updated);
      },
    });
  };

  const requestToggleGoogleTask = (task: GoogleTaskItem) => {
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    setPendingConfirm({
      title: nextStatus === 'completed' ? 'Mark Google Task Completed?' : 'Reopen Google Task?',
      description: `Update status of "${task.title}" in Google Tasks to ${nextStatus === 'completed' ? 'Completed' : 'Needs Action'}.`,
      items: [task.title],
      confirmLabel: 'Update Task',
      onConfirm: async () => {
        setBusyAction(`toggle-task-${task.id}`);
        await updateGoogleTaskStatus(selectedTaskListId, task.id, nextStatus);
        const updated = await listGoogleTasks(selectedTaskListId);
        setTasks(updated);
        setStatusMessage(`Updated task "${task.title}".`);
      },
    });
  };

  const requestDeleteGoogleTask = (task: GoogleTaskItem) => {
    setPendingConfirm({
      title: 'Delete Task from Google Tasks?',
      description: `Permanently delete "${task.title}" from your Google Tasks list?`,
      items: [task.title],
      confirmLabel: 'Delete Task',
      isDestructive: true,
      onConfirm: async () => {
        setBusyAction(`del-task-${task.id}`);
        await deleteGoogleTask(selectedTaskListId, task.id);
        const updated = await listGoogleTasks(selectedTaskListId);
        setTasks(updated);
        setStatusMessage(`Deleted task "${task.title}".`);
      },
    });
  };

  // --- Sheets Operations ---
  const requestCreateTrackerSheet = () => {
    const rows = buildGoogleSheetRows(completedBlockIds);
    setPendingConfirm({
      title: 'Create Class 10 Pre-Board Google Sheet?',
      description: `This will create a new Google Spreadsheet titled "Class 10 Pre-Board Master Schedule (Nov 21–30)" and write ${rows.length} rows (header + 50 study blocks with live completion status).`,
      items: [
        'Spreadsheet: Class 10 Pre-Board Master Schedule (Nov 21–30)',
        `Tab: Pre-Board Schedule (${rows.length} rows × 9 columns)`,
      ],
      confirmLabel: 'Create & Export Sheet',
      onConfirm: async () => {
        setBusyAction('create-sheet');
        const created = await createStudyTrackerSpreadsheet(
          'Class 10 Pre-Board Master Schedule (Nov 21–30)',
          rows
        );
        setCreatedSheetUrl(created.spreadsheetUrl);
        setSpreadsheetIdInput(created.spreadsheetId);
        setSelectedSheetTab(created.sheetTitle);
        setSheetPreviewRows(rows.slice(0, 11));
        setStatusMessage('Created and populated your Class 10 Pre-Board Google Sheet.');
      },
    });
  };

  const handleInspectExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = spreadsheetIdInput.trim();
    if (!trimmed) {
      setErrorMessage('Enter a Google Spreadsheet ID first.');
      return;
    }
    setBusyAction('load-sheet');
    setErrorMessage(null);
    try {
      // Always fetch spreadsheet metadata first to discover real tab names (never assume Sheet1)
      const meta = await fetchSpreadsheetMetadata(trimmed);
      setSheetMeta(meta);
      setCreatedSheetUrl(meta.spreadsheetUrl);
      const firstTab = meta.sheets[0]?.properties.title || '';
      setSelectedSheetTab(firstTab);
      if (firstTab) {
        const rows = await readSpreadsheetRange(trimmed, firstTab, 'A1:I15');
        setSheetPreviewRows(rows);
      }
      setStatusMessage(`Loaded spreadsheet "${meta.properties.title}" with ${meta.sheets.length} tab(s).`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not inspect spreadsheet.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleLoadTabPreview = async (tabTitle: string) => {
    setSelectedSheetTab(tabTitle);
    if (!spreadsheetIdInput.trim()) return;
    setBusyAction('load-sheet');
    try {
      const rows = await readSpreadsheetRange(spreadsheetIdInput.trim(), tabTitle, 'A1:I15');
      setSheetPreviewRows(rows);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not read selected sheet tab.');
    } finally {
      setBusyAction(null);
    }
  };

  const requestOverwriteExistingSheet = () => {
    if (!spreadsheetIdInput.trim() || !selectedSheetTab) {
      setErrorMessage('Inspect a spreadsheet and choose a target tab first.');
      return;
    }
    const rows = buildGoogleSheetRows(completedBlockIds);
    setPendingConfirm({
      title: `Update Tab "${selectedSheetTab}" in Google Sheets?`,
      description: `This will write ${rows.length} rows into range '${selectedSheetTab}'!A1:I${rows.length} of your selected spreadsheet, overwriting existing cells in that range.`,
      items: [
        `Spreadsheet ID: ${spreadsheetIdInput.trim()}`,
        `Target Tab: ${selectedSheetTab}`,
        `Rows to write: ${rows.length} (including live Completed/Pending statuses)`,
      ],
      confirmLabel: 'Overwrite & Sync Sheet',
      isDestructive: true,
      onConfirm: async () => {
        setBusyAction('write-sheet');
        await writeSpreadsheetRange(spreadsheetIdInput.trim(), selectedSheetTab, rows);
        setSheetPreviewRows(rows.slice(0, 11));
        setStatusMessage(`Synced ${rows.length} schedule rows to tab "${selectedSheetTab}".`);
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header + Auth Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E8D7E4]">
        <div>
          <p className="text-xs font-medium text-[#7E22CE]">
            Google Calendar · Google Tasks · Google Sheets
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#221329] mt-1 tracking-tight">
            Google Workspace Sync
          </h1>
          <p className="text-sm text-[#614B69] mt-1.5 max-w-2xl">
            Push daily Class 10th study blocks to Google Calendar, track checklists in Google Tasks,
            and maintain a complete 10-day master tracker in Google Sheets. Every change asks for
            your confirmation before running.
          </p>
        </div>

        <div className="shrink-0">
          {needsAuth ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/95 border border-[#E8D7E4] rounded-xl px-4 py-2 shadow-xs">
              <div className="text-xs">
                <div className="font-semibold text-[#221329]">{user?.displayName || 'Google User'}</div>
                <div className="text-[#614B69]">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {statusMessage && (
        <div
          role="status"
          className="rounded-xl border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-sm text-[#065F46] flex items-center gap-2.5"
        >
          <Check className="w-4 h-4 shrink-0 text-[#047857]" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-[#BE123C]/30 bg-[#FFF1F2] px-4 py-3 text-sm text-[#9F1239] flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#BE123C]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visual Progress Overview (Recharts) */}
      <WorkspaceProgressChart
        completedBlockIds={completedBlockIds}
        completedChapterIds={completedChapterIds}
      />

      {/* 3 Workspace Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Google Calendar */}
        <section className="enchanted-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#6D28D9]" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#221329]">
                  Google Calendar
                </h2>
                <p className="text-xs text-[#614B69]">Schedule daily time-blocked study sessions</p>
              </div>
            </div>
            <button
              type="button"
              disabled={needsAuth || busyAction === 'load-calendar'}
              onClick={refreshCalendar}
              aria-label="Refresh Google Calendar events"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3] disabled:opacity-45 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'load-calendar' ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#E8D7E4]">
            <label htmlFor="cal-day-select" className="text-xs font-medium text-[#614B69]">
              Choose Day:
            </label>
            <select
              id="cal-day-select"
              value={calendarDayToSync}
              onChange={(e) => setCalendarDayToSync(Number(e.target.value))}
              className="w-full sm:w-auto max-w-full min-w-0 text-xs bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-2.5 py-2 text-[#221329] focus:outline-none focus:border-[#6D28D9]"
            >
              {SCHEDULE_DAYS.map((d) => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  Day {d.dayNumber} ({d.displayDate}) — {d.theme}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={needsAuth || busyAction === 'push-calendar'}
              onClick={requestPushDayToCalendar}
              className="enchanted-cta inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-white disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyAction === 'push-calendar' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Push 5 Blocks to Calendar
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {needsAuth ? (
              <p className="text-xs text-[#614B69] py-4">
                Sign in with Google above to view upcoming Nov 2026 events and schedule study blocks.
              </p>
            ) : calendarEvents.length === 0 ? (
              <p className="text-xs text-[#614B69] py-4">
                No upcoming events loaded yet. Click Refresh or push a study day above.
              </p>
            ) : (
              calendarEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-[#FBF6F9] border border-[#E8D7E4] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#221329] truncate">
                      {ev.summary || '(No title)'}
                    </div>
                    <div className="font-mono text-[11px] text-[#614B69] tabular-nums">
                      {ev.start?.dateTime
                        ? new Date(ev.start.dateTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ev.start?.date || 'All day'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestDeleteCalendarEvent(ev)}
                    aria-label={`Delete calendar event "${ev.summary || ev.id}"`}
                    className="p-1.5 text-[#614B69] hover:text-[#BE123C] rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Panel 2: Google Tasks */}
        <section className="enchanted-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-[#047857]" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#221329]">Google Tasks</h2>
                <p className="text-xs text-[#614B69]">Sync daily chapters into mobile-ready checklists</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={needsAuth}
                onClick={requestCreatePreBoardTaskList}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#221329] hover:bg-[#F6ECF3] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Sprint List
              </button>
              <button
                type="button"
                disabled={needsAuth || busyAction === 'load-tasks'}
                onClick={refreshTaskLists}
                aria-label="Refresh Google Tasks"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3] disabled:opacity-45 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'load-tasks' ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#E8D7E4]">
            <label htmlFor="task-list-select" className="sr-only">
              Select Google Tasks list
            </label>
            <select
              id="task-list-select"
              disabled={needsAuth || taskLists.length === 0}
              value={selectedTaskListId}
              onChange={(e) => handleSelectTaskList(e.target.value)}
              className="max-w-full min-w-0 text-xs bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-2.5 py-2 text-[#221329] focus:outline-none focus:border-[#6D28D9]"
            >
              {taskLists.length === 0 ? (
                <option value="">No lists loaded</option>
              ) : (
                taskLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))
              )}
            </select>

            <label htmlFor="task-day-select" className="sr-only">
              Select schedule day to export to Google Tasks
            </label>
            <select
              id="task-day-select"
              value={tasksDayToSync}
              onChange={(e) => setTasksDayToSync(Number(e.target.value))}
              className="text-xs bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-2.5 py-2 text-[#221329] focus:outline-none focus:border-[#6D28D9]"
            >
              {SCHEDULE_DAYS.map((d) => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  Day {d.dayNumber} ({d.displayDate})
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={needsAuth || !selectedTaskListId || busyAction === 'push-tasks'}
              onClick={requestPushDayToTasks}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#2A1438] text-white hover:bg-[#3F1E54] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyAction === 'push-tasks' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add Day’s Tasks
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {needsAuth ? (
              <p className="text-xs text-[#614B69] py-4">
                Sign in with Google above to view your Google Task lists and push chapter tasks.
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-[#614B69] py-4">
                This task list is empty. Push Day {tasksDayToSync} tasks above to populate it.
              </p>
            ) : (
              tasks.map((t) => {
                const done = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-[#FBF6F9] border border-[#E8D7E4] flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => requestToggleGoogleTask(t)}
                      className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          done
                            ? 'bg-[#047857] border-[#047857] text-white'
                            : 'bg-white border-[#D3BDD0]'
                        }`}
                      >
                        {done && <Check className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-xs truncate ${
                          done ? 'line-through text-[#614B69]' : 'text-[#221329] font-medium'
                        }`}
                      >
                        {t.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDeleteGoogleTask(t)}
                      aria-label={`Delete task "${t.title}"`}
                      className="p-1.5 text-[#614B69] hover:text-[#BE123C] rounded shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Panel 3: Google Sheets Full-Width Tracker */}
      <section className="enchanted-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-[#BE185D]" />
            <div>
              <h2 className="font-display text-xl font-bold text-[#221329]">
                Google Sheets Master Tracker
              </h2>
              <p className="text-xs text-[#614B69]">
                Export all 50 schedule sessions & live completion status into a spreadsheet, or sync
                with an existing sheet ID.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {createdSheetUrl && (
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#6D28D9] hover:bg-[#F6ECF3]"
              >
                Open in Google Sheets
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              disabled={needsAuth || busyAction === 'create-sheet'}
              onClick={requestCreateTrackerSheet}
              className="enchanted-cta inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-white disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyAction === 'create-sheet' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create New 10-Day Tracker Sheet
            </button>
          </div>
        </div>

        {/* Inspect & Sync Existing Spreadsheet */}
        <form
          onSubmit={handleInspectExistingSheet}
          className="pt-4 border-t border-[#E8D7E4] flex flex-wrap items-center gap-2.5"
        >
          <label htmlFor="sheet-id-input" className="text-xs font-medium text-[#614B69]">
            Existing Spreadsheet ID:
          </label>
          <input
            id="sheet-id-input"
            type="text"
            value={spreadsheetIdInput}
            onChange={(e) => setSpreadsheetIdInput(e.target.value)}
            placeholder="Paste spreadsheet ID from its URL"
            className="flex-1 min-w-[220px] text-xs bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-3 py-2 text-[#221329] placeholder:text-[#8E7896] font-mono focus:outline-none focus:border-[#6D28D9]"
          />
          <button
            type="submit"
            disabled={needsAuth || busyAction === 'load-sheet'}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#221329] hover:bg-[#F6ECF3] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect Tabs
          </button>

          {sheetMeta && sheetMeta.sheets.length > 0 && (
            <>
              <label htmlFor="sheet-tab-select" className="sr-only">
                Select sheet tab
              </label>
              <select
                id="sheet-tab-select"
                value={selectedSheetTab}
                onChange={(e) => handleLoadTabPreview(e.target.value)}
                className="text-xs bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-2.5 py-2 text-[#221329] focus:outline-none focus:border-[#6D28D9]"
              >
                {sheetMeta.sheets.map((s) => (
                  <option key={s.properties.sheetId} value={s.properties.title}>
                    Tab: {s.properties.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={needsAuth || busyAction === 'write-sheet'}
                onClick={requestOverwriteExistingSheet}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-[#2A1438] text-white hover:bg-[#3F1E54] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sync Live Progress to Tab
              </button>
            </>
          )}
        </form>

        {/* Sheet Preview Grid */}
        {sheetPreviewRows.length > 0 && (
          <div className="overflow-x-auto border border-[#E8D7E4] rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <tbody>
                {sheetPreviewRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={
                      rIdx === 0
                        ? 'bg-[#FBF6F9] font-semibold text-[#221329] border-b border-[#E8D7E4]'
                        : 'border-b border-[#E8D7E4]/70 last:border-b-0'
                    }
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-[#221329] max-w-[200px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MANDATORY Explicit Confirmation Dialog for All Mutating/Destructive Workspace Actions */}
      {pendingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 bg-[#1B0D27]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E8D7E4] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 id="confirm-modal-title" className="font-display text-2xl font-bold text-[#221329]">
              {pendingConfirm.title}
            </h3>
            <p className="text-sm text-[#614B69] leading-relaxed">{pendingConfirm.description}</p>

            {pendingConfirm.items.length > 0 && (
              <ul className="bg-[#FBF6F9] border border-[#E8D7E4] rounded-xl p-3 space-y-1.5 text-xs text-[#221329] max-h-44 overflow-y-auto">
                {pendingConfirm.items.map((item, idx) => (
                  <li key={idx} className="truncate">
                    • {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runConfirmedAction}
                className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors cursor-pointer ${
                  pendingConfirm.isDestructive
                    ? 'bg-[#BE123C] hover:bg-[#9F1239]'
                    : 'enchanted-cta'
                }`}
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
