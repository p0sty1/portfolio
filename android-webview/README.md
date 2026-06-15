# Portfolio WebView Apps

This Android project builds two WebView apps from the same source code:

- `publicApp`: opens `https://jyangb1y.com`
- `adminApp`: opens `https://jyangb1y.com/admin`

The two apps use different package names, so they can be installed on the same phone at the same time.

## Requirements

- Android Studio
- Android SDK Platform 35
- JDK 17, included with current Android Studio

If you want to build from the terminal, install Gradle or use Android Studio's built-in build actions.

## Use With Android Studio

1. Open Android Studio.
2. Choose **Open** and select `D:\portfolio\android-webview`.
3. Let Android Studio sync Gradle.
4. Open **Build Variants**.
5. Select one of:
   - `publicAppDebug`
   - `adminAppDebug`
6. Click **Run** to install it on a connected Android phone or emulator.

## Build APKs From Terminal

From this directory:

```powershell
gradle :app:assemblePublicAppDebug :app:assembleAdminAppDebug
```

APK outputs:

```text
app/build/outputs/apk/publicApp/debug/app-publicApp-debug.apk
app/build/outputs/apk/adminApp/debug/app-adminApp-debug.apk
```

Install with adb:

```powershell
adb install -r app/build/outputs/apk/publicApp/debug/app-publicApp-debug.apk
adb install -r app/build/outputs/apk/adminApp/debug/app-adminApp-debug.apk
```

## Change URLs

Edit `app/build.gradle`:

```gradle
buildConfigField "String", "START_URL", "\"https://jyangb1y.com\""
buildConfigField "String", "START_URL", "\"https://jyangb1y.com/admin\""
```

## Notes

- The admin app is not a security boundary. Keep the admin password/API authentication strong.
- Do not publish the admin app to a public app store.
- This WebView shell still depends on the website being reachable from the user's network.
