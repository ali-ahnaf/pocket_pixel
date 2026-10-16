// Background tasks must be defined before the router loads, because the OS can start the app headless just to run one.
import './src/lib/notifications/monthly-recap-task';
import 'expo-router/entry';
