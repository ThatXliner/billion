# Android development and Google Play release

Billion uses the same Expo app for iOS and Android. Its Android package is `app.billionnews.billion`, configured in [app.config.base.json](../apps/expo/app.config.base.json). Native Android files are generated into ignored `apps/expo/android`; make lasting configuration changes in Expo config or a config plugin. See [Contributing](../CONTRIBUTING.md#run-the-mobile-app) for the shared mobile workflow.

## Verified local result (September 8, 2026)

Both the development APK and standalone release-mode ARM64 APK built successfully. The standalone preview is installed on `Billion_API_36_16KB` and cold-launches with Metro stopped. Android reports API 36 and a 16,384-byte page size. All 25 packaged ARM64 native libraries passed ELF LOAD alignment checks, and `zipalign -c -P 16 -v 4` passed for the APK.

Live Browse content, article details, sponsor information, and the original-source-text view worked in the development build. The standalone build loaded live Browse content and showed only Browse, Elections, and Feedback tabs. The Feedback contact and Terms & Privacy route were accessible. No AndroidRuntime or ReactNativeJS error entries appeared during these smoke checks. Physical-device testing, address lookup, external sharing, full accessibility testing, and Play-delivered AAB verification remain outstanding.

Local artifacts are in ignored `.cache/android/`: `billion-0.7.0-preview-arm64.apk` (about 53 MB), build logs, screenshots, UI dumps, the merged release manifest, and native-alignment results. The original APKs are under `apps/expo/android/app/build/outputs/apk/{debug,release}/`. The preview is signed with the debug key and must not be uploaded to Play. Installing it replaces the development build because both use the same package; run `pnpm android` to reinstall the development client.

## Local setup on this Mac

The September 8, 2026 setup uses Homebrew for Android Studio, command-line tools, and OpenJDK 17. Java 17 follows [Expo's Android environment guide](https://docs.expo.dev/workflow/android-studio-emulator/); the existing Java 21 and 26 installations remain available. The SDK lives in the standard user directory, so Android Studio and terminal builds can share it.

- Android Studio: `~/Applications/Android Studio.app` (user installation, managed by Homebrew).
- SDK: `~/Library/Android/sdk`.
- Java: `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`.
- Gradle memory: `~/.gradle/gradle.properties` sets a 4 GB heap and 2 GB metaspace for release lint.
- Shell setup: `~/.config/android/env.sh`, sourced by `~/.zprofile` and `~/.zshrc`.
- Android API 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1, platform tools, and the emulator. Gradle also installs Build Tools 35.0.0 and NDK 27.0.12077973 for dependencies.
- Virtual device: `Billion_API_36_16KB`, a Pixel 9 using the Google APIs ARM64 Android 16 image with 16 KB memory pages.

Open a new terminal, or load the environment in an existing terminal:

```bash
source "$HOME/.config/android/env.sh"
java -version
adb version
emulator -list-avds
```

To reproduce the tool installation on an Apple Silicon Mac:

```bash
brew install openjdk@17
brew install --cask --appdir="$HOME/Applications" android-studio
brew install --cask android-commandlinetools
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
sdkmanager --sdk_root="$ANDROID_HOME" --licenses
sdkmanager --sdk_root="$ANDROID_HOME" \
  'cmdline-tools;latest' 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' \
  'ndk;27.1.12297006' 'cmake;3.22.1' 'emulator' \
  'system-images;android-36;google_apis_ps16k;arm64-v8a'
echo no | avdmanager create avd --name Billion_API_36_16KB \
  --package 'system-images;android-36;google_apis_ps16k;arm64-v8a' \
  --device pixel_9
```

Release lint exceeded Expo's default 512 MB metaspace during the first build. On this Mac, the user-level `~/.gradle/gradle.properties` contains:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=2048m
```

Merge this setting into an existing file on another machine rather than overwriting its other Gradle settings. These are per-user settings, so clean Expo prebuilds preserve them.

Persist the three environment exports in your shell configuration on a new machine. `sdkmanager` is deprecated; the SDK-managed command-line tools now delegate to the newer [Android CLI](https://developer.android.com/tools/agents/android-cli); use `android --sdk="$ANDROID_HOME" sdk list` to explore its replacement commands. Homebrew provides the bootstrap tools, while the SDK-managed copy on PATH keeps virtual-device discovery under the same SDK root. Keep the build's SDK/NDK versions tied to Expo and React Native rather than upgrading them independently.

Use `brew upgrade openjdk@17` for Java patch updates and Homebrew or Android Studio's updater for the IDE. Use Android Studio's SDK Manager for SDK and emulator updates, pointing it at the SDK directory above. If opening the native project in Android Studio, select the Homebrew JDK 17 as its Gradle JDK.

## Run a development build

From the repository root:

```bash
source "$HOME/.config/android/env.sh"
emulator -avd Billion_API_36_16KB &
pnpm android
```

`pnpm android` generates native files if needed, compiles, installs, and starts the development app and Metro. After native installation, `pnpm --filter @acme/expo dev:android` starts Metro without rebuilding native code. Use `pnpm dev` when you also need the local API.

The committed Expo environment targets `https://www.billion-news.app`. Browsing with that default reads live content. To use an API running on this Mac, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` in ignored `apps/expo/.env.local`, run `pnpm dev:next`, and restart Metro. `10.0.2.2` is the Android emulator's alias for the Mac; see [Android emulator networking](https://developer.android.com/studio/run/emulator-networking). Physical devices need the Mac's LAN address or a tunnel instead.

## Build a standalone local preview

A release-mode APK embeds JavaScript and opens without Metro. This is useful for testing production navigation and cold launches:

```bash
source "$HOME/.config/android/env.sh"
pnpm --filter @acme/expo exec expo prebuild --platform android --no-install
cd apps/expo/android
NODE_ENV=production ./gradlew :app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a --console=plain
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -n app.billionnews.billion/.MainActivity
```

This ARM64 preview works on the configured emulator and ARM64 phones. Expo's generated Gradle project signs this local release variant with the **debug key**. It is a local test artifact, not a Google Play upload. Do not commit generated native directories or signing credentials.

## Create the Google Play build

The existing [EAS configuration](../apps/expo/eas.json) already has a `production` build profile with remote version management, automatic version increments, and the production update channel. Android submission credentials have not been configured.

From `apps/expo`, after reviewing the production environment and signing identity:

```bash
pnpm dlx eas-cli@latest build --platform android --profile production
```

EAS produces a signed Android App Bundle (AAB) for this store profile and can manage its upload keystore. Use `--local` if you want EAS to perform that build on this Mac. Keep an encrypted backup of the upload key and its passwords; use Google Play App Signing for the distribution key. Confirm the package ID before the first upload because the Play identity cannot later be renamed.

Upload the first AAB manually in Play Console, normally to internal testing. For later automated uploads, configure a Google service account with the required Play Console access and run:

```bash
pnpm dlx eas-cli@latest submit --platform android --profile production
```

Select the intended build explicitly in the interactive flow. Uploading a binary does not finish the store listing, declarations, testing, or release review. Follow [Expo's Google Play submission guide](https://docs.expo.dev/submit/android/) for credentials. Expo documentation is currently inconsistent about whether the first submission can be automated; a manual first internal upload remains a straightforward option.

## Google Play launch checklist

Requirements checked September 8, 2026. Recheck the linked policies before submitting.

1. **Create and verify the publisher account.** Play Console has a one-time US$25 fee. Choose an organization account if a legal organization publishes Billion; it needs matching legal details, verification documents, and usually a D-U-N-S number. A new personal account additionally needs a real Android device verification and a closed test with at least 12 testers continuously opted in for 14 days before applying for production access. An emulator cannot satisfy that device-verification step. [Account setup](https://support.google.com/googleplay/android-developer/answer/6112435), [organization verification](https://support.google.com/googleplay/android-developer/answer/13628312), [testing gate](https://support.google.com/googleplay/android-developer/answer/14151465), [device verification](https://support.google.com/googleplay/android-developer/answer/14316361).
2. **Create the Play app and confirm its package identity.** Google requires Play package registration by September 30, 2026. New package names normally register during app creation; existing off-Play distribution can require signing-key ownership proof. Use `app.billionnews.billion` unless intentionally changing it before the first release. [Package registration](https://support.google.com/googleplay/android-developer/answer/16984799).
3. **Build, sign, and test the production AAB.** Target API 36 is already configured by this Expo/React Native version. Check the final bundle's permissions and all native libraries for 16 KB page support, then run the Play-delivered app on a physical phone and review Play's pre-launch report. A local ARM64 emulator test does not verify all ABIs in an EAS bundle. [Target API](https://developer.android.com/google/play/requirements/target-sdk), [16 KB verification](https://developer.android.com/guide/practices/page-sizes).
4. **Prepare the listing.** Name up to 30 characters, short description up to 80, full description up to 4,000; contact email; 512×512 PNG icon; 1024×500 feature graphic; at least two eligible phone screenshots. Capture the production Android UI. Google limits screenshot aspect ratios, so a full tall Pixel screenshot may need framing or cropping. [Listing fields](https://support.google.com/googleplay/android-developer/answer/9859152), [asset specifications](https://support.google.com/googleplay/android-developer/answer/9866151).
5. **Complete App content declarations.** Answer ads, app access, target audience, content rating, Data safety, News, and Government accurately. Audit PostHog, address lookup, feedback, diagnostics, and every bundled SDK against [the privacy policy](https://billion-news.app/privacy). Verify the Feedback tab's email contact and "Terms and Privacy Policy" link in the production Android UI; these provide access while Settings is hidden. The current policy says there are no app user accounts; account-deletion UI becomes mandatory if account creation is introduced. [App content](https://support.google.com/googleplay/android-developer/answer/9859455), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).
6. **Review civic/news presentation.** Preserve publisher/source, dates, citations, and the distinction between source text and generated explanation. News apps need current content and accessible contact information. Clearly state in the app and listing that Billion does not represent or have endorsement from a government or political entity. Provide verifiable official sources. Hosting generated summaries appears outside Google's prompt-driven AI-app policy, but news and misleading-election-content rules still apply. [News requirements](https://support.google.com/googleplay/android-developer/answer/10523915), [government information](https://support.google.com/googleplay/android-developer/answer/9514050), [AI policy scope](https://support.google.com/googleplay/android-developer/answer/14094294).
7. **Release through testing, then production review.** Start with internal testing. Complete the closed-testing gate if applicable, fix pre-launch findings, choose countries and availability, and submit the production release for review.

### Known Android review items

The merged local release manifest includes legacy storage permissions (limited to API 32), `READ_MEDIA_IMAGES` on API 33, screen-capture detection, network/Wi-Fi state, biometrics, install-referrer access, vibration, internet, and `SYSTEM_ALERT_WINDOW`. Inspect the merged production manifest, not just Expo config, and remove permissions without a current feature need before store submission. The development client can account for permissions that are inappropriate in a store build. Direct Instagram Stories handoff is currently iOS-only; Android uses the share-sheet fallback. Verify that fallback on a real phone.

See [frontend navigation](frontend.md) for production tab visibility and [sharing](virality.md) for the sharing implementation. Android also shows clipped final characters in some compact controls and tab labels on the Pixel 9 emulator. Review typography at default and enlarged font sizes before capturing store screenshots. These are release follow-ups, not claims that a Play review has been completed.
