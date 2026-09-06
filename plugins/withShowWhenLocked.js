const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to ensure Android MainActivity can wake the screen
 * and display over the keyguard/lockscreen when smart alarm notifications are triggered.
 */
function withShowWhenLocked(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainActivity = modConfig.modResults.manifest.application?.[0]?.activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
      mainActivity.$['android:showForAllUsers'] = 'true';
    }

    return modConfig;
  });
}

module.exports = withShowWhenLocked;
