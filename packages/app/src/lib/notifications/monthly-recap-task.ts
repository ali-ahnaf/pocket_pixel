import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { initDatabase } from '../../db/init';
import { authService, logger, monthlyRecapService } from '../../services';

const TASK_NAME = 'monthly-recap';
// The OS treats this as a minimum and picks the real time (iOS often waits for overnight), so the recap can land hours after its day starts.
const CHECK_INTERVAL_MINUTES = 6 * 60;

// Must run at module scope: the OS can start the app headless, with no screen mounted, just to run this task.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await initDatabase();
    const userId = await authService.restoreSession();
    if (userId) await monthlyRecapService.deliverIfDue(userId);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (err) {
    logger.error('Monthly recap task failed', { err });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the periodic check while a recap day is set, and removes it when the recap is turned off. The OS keeps the registration across restarts. */
export async function setRecapTaskEnabled(enabled: boolean): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (enabled && !registered) await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: CHECK_INTERVAL_MINUTES });
  if (!enabled && registered) await BackgroundTask.unregisterTaskAsync(TASK_NAME);
}
