const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const env = { ...process.env };
const isWindows = os.platform() === 'win32';

// Find the path key case-insensitively (e.g. 'Path' vs 'PATH')
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';

if (isWindows) {
  // Resolve paths for Windows
  const possibleJavaHome = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  const possibleAndroidHome = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');

  if (fs.existsSync(possibleJavaHome)) {
    env.JAVA_HOME = possibleJavaHome;
    env[pathKey] = `${path.join(possibleJavaHome, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
  } else {
    console.warn(`Warning: Expected JAVA_HOME at "${possibleJavaHome}" but it was not found.`);
  }

  if (fs.existsSync(possibleAndroidHome)) {
    env.ANDROID_HOME = possibleAndroidHome;
    const platformTools = path.join(possibleAndroidHome, 'platform-tools');
    const emulator = path.join(possibleAndroidHome, 'emulator');
    env[pathKey] = `${env[pathKey] || ''}${path.delimiter}${platformTools}${path.delimiter}${emulator}`;
  } else {
    console.warn(`Warning: Expected ANDROID_HOME at "${possibleAndroidHome}" but it was not found.`);
  }
} else {
  // Resolve paths for Linux/macOS
  const flatpakJbr = '/var/lib/flatpak/app/com.google.AndroidStudio/x86_64/stable/active/files/extra/jbr';
  const defaultAndroidHome = path.join(os.homedir(), 'Android', 'Sdk');

  if (fs.existsSync(flatpakJbr)) {
    env.JAVA_HOME = flatpakJbr;
    env[pathKey] = `${path.join(flatpakJbr, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
  } else if (!env.JAVA_HOME) {
    console.warn('Warning: JAVA_HOME is not set and Flatpak JBR was not found.');
  }

  if (fs.existsSync(defaultAndroidHome)) {
    env.ANDROID_HOME = defaultAndroidHome;
    const platformTools = path.join(defaultAndroidHome, 'platform-tools');
    const emulator = path.join(defaultAndroidHome, 'emulator');
    env[pathKey] = `${env[pathKey] || ''}${path.delimiter}${platformTools}${path.delimiter}${emulator}`;
  } else if (!env.ANDROID_HOME) {
    console.warn(`Warning: ANDROID_HOME is not set and default SDK path "${defaultAndroidHome}" was not found.`);
  }
}

console.log('--- Environment Configured ---');
console.log(`Platform: ${os.platform()}`);
console.log(`JAVA_HOME: ${env.JAVA_HOME || 'Not Set'}`);
console.log(`ANDROID_HOME: ${env.ANDROID_HOME || 'Not Set'}`);
console.log('-------------------------------\n');

console.log('Starting Expo Android build...\n');

// Spawn the Expo CLI android runner
const child = spawn('npx', ['expo', 'run:android'], {
  stdio: 'inherit',
  shell: true,
  env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
