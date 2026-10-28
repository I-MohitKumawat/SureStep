const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const env = { ...process.env };
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';

// Find the path key case-insensitively (e.g. 'Path' vs 'PATH')
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';

if (isWindows) {
  // Resolve paths for Windows
  const possibleJavaHome = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  const possibleAndroidHome = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');

  if (fs.existsSync(possibleJavaHome)) {
    env.JAVA_HOME = env.JAVA_HOME || possibleJavaHome;
  } else if (!env.JAVA_HOME) {
    console.warn(`Warning: Expected JAVA_HOME at "${possibleJavaHome}" but it was not found.`);
  }

  if (fs.existsSync(possibleAndroidHome)) {
    env.ANDROID_HOME = env.ANDROID_HOME || possibleAndroidHome;
    env.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT || possibleAndroidHome;
    const platformTools = path.join(possibleAndroidHome, 'platform-tools');
    const emulator = path.join(possibleAndroidHome, 'emulator');
    env[pathKey] = `${env[pathKey] || ''}${path.delimiter}${platformTools}${path.delimiter}${emulator}`;
  } else if (!env.ANDROID_HOME) {
    console.warn(`Warning: Expected ANDROID_HOME at "${possibleAndroidHome}" but it was not found.`);
  }

  if (env.JAVA_HOME) {
    env[pathKey] = `${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
  }
} else if (isMac) {
  // Resolve paths for macOS
  const macAndroidHomes = [
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ];
  const macAndroidHome = macAndroidHomes.find(p => fs.existsSync(p));
  if (macAndroidHome) {
    env.ANDROID_HOME = env.ANDROID_HOME || macAndroidHome;
    env.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT || macAndroidHome;
    const platformTools = path.join(macAndroidHome, 'platform-tools');
    const emulator = path.join(macAndroidHome, 'emulator');
    env[pathKey] = `${env[pathKey] || ''}${path.delimiter}${platformTools}${path.delimiter}${emulator}`;
  } else if (!env.ANDROID_HOME) {
    console.warn('Warning: ANDROID_HOME is not set and default macOS SDK path was not found.');
  }

  if (!env.JAVA_HOME) {
    try {
      const detectedJavaHome = execSync('/usr/libexec/java_home', { encoding: 'utf8' }).trim();
      if (detectedJavaHome && fs.existsSync(detectedJavaHome)) {
        env.JAVA_HOME = detectedJavaHome;
      }
    } catch {
      const asJbr = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
      if (fs.existsSync(asJbr)) {
        env.JAVA_HOME = asJbr;
      }
    }
  }

  if (env.JAVA_HOME) {
    env[pathKey] = `${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
  } else {
    console.warn('Warning: JAVA_HOME could not be detected on macOS.');
  }
} else {
  // Resolve paths for Linux
  const flatpakJbr = '/var/lib/flatpak/app/com.google.AndroidStudio/x86_64/stable/active/files/extra/jbr';
  const defaultAndroidHome = path.join(os.homedir(), 'Android', 'Sdk');

  if (fs.existsSync(flatpakJbr)) {
    env.JAVA_HOME = env.JAVA_HOME || flatpakJbr;
  } else if (!env.JAVA_HOME) {
    console.warn('Warning: JAVA_HOME is not set and Flatpak JBR was not found.');
  }

  if (fs.existsSync(defaultAndroidHome)) {
    env.ANDROID_HOME = env.ANDROID_HOME || defaultAndroidHome;
    env.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT || defaultAndroidHome;
    const platformTools = path.join(defaultAndroidHome, 'platform-tools');
    const emulator = path.join(defaultAndroidHome, 'emulator');
    env[pathKey] = `${env[pathKey] || ''}${path.delimiter}${platformTools}${path.delimiter}${emulator}`;
  } else if (!env.ANDROID_HOME) {
    console.warn(`Warning: ANDROID_HOME is not set and default SDK path "${defaultAndroidHome}" was not found.`);
  }

  if (env.JAVA_HOME) {
    env[pathKey] = `${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env[pathKey] || ''}`;
  }
}

// Generate android/local.properties if missing
if (env.ANDROID_HOME) {
  const localPropsPath = path.join(__dirname, 'android', 'local.properties');
  try {
    if (fs.existsSync(path.join(__dirname, 'android')) && !fs.existsSync(localPropsPath)) {
      fs.writeFileSync(localPropsPath, `sdk.dir=${env.ANDROID_HOME.replace(/\\/g, '/')}\n`);
      console.log(`Generated android/local.properties with sdk.dir=${env.ANDROID_HOME}`);
    }
  } catch (err) {
    // Ignore error writing local.properties
  }
}

console.log('--- Environment Configured ---');
console.log(`Platform: ${platform}`);
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
