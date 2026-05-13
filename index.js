/**
 * Root entry file for the SureStep React Native app.
 *
 * Background task registration MUST happen before the app mounts —
 * expo-task-manager requires the task to be defined at module-load time.
 */
import './app/utils/locationTask';
import './app/index.tsx';
