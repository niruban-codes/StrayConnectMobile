# StrayConnect Mobile

Community animal welfare app built with React Native and Expo SDK 54.

## Android development

This app requires a **development build**, not Expo Go. Native Google Sign-In
requires native code that Expo Go does not include. Installing an older Expo Go
or upgrading the Expo SDK alone does not address that requirement.

Prerequisites: Node.js, an Android SDK, a compatible JDK (the Android Studio
bundled JDK can be used), and an Android phone with USB debugging enabled.
Accept the phone's USB debugging authorization prompt when connecting it.

Local configuration files are ignored by Git and must be supplied separately:

- `firebase.js`: exports Firebase `auth` and `db`, with React Native auth persistence.
- `google-services.json`: Firebase Android configuration for `com.strayconnect.mobile`.
- `.env`: `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` for location search.

Install dependencies and generate the native Android project:

```powershell
npm install
npx expo prebuild --platform android --no-install
```

Build and install on the connected phone:

```powershell
npm run android -- --device
```

After the development build is installed, normal JavaScript development only needs:

```powershell
npm start
```

Open the installed **StrayConnectMobile** app to connect to Metro. Keep the phone
and computer on the same network, or use USB forwarding with
`adb reverse tcp:8081 tcp:8081`. To clear Metro's cache, use `npm run start:clear`.

Rebuild the native app when changing native dependencies or native configuration.
Google Sign-In also requires the installed build's signing certificate SHA-1 to
be registered in Firebase. Push notifications require valid Firebase Cloud
Messaging credentials in addition to the Expo project ID.

## Checks

```powershell
npx expo install --check
npx expo-doctor
npx expo export --platform android --output-dir .expo/check-export
```

A successful JavaScript export does not verify native startup, authentication,
Firestore permissions, maps, or notification delivery; test those on the phone.

The existing `eas.json` also contains a development profile for cloud builds.
For an EAS build, the ignored local configuration files must be made available
to the build separately.

## Sighting map setup

The Android Maps SDK needs an API key embedded in the native application.
`app.config.js` uses `GOOGLE_MAPS_ANDROID_API_KEY` from the local environment,
falling back to the existing `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` for development.
Never commit the values. For production, use a dedicated Android Maps key with
package/signing-certificate restrictions; configure Places search credentials separately.
Enable Maps SDK for Android for the native key and the appropriate Places API for
search in the owning Google Cloud project. Cloud API access/billing and key
restrictions cannot be verified by the local regression tests.

After adding/changing the native key, regenerate and rebuild once:

```powershell
npx expo prebuild --platform android --no-install
npm run android -- --device
```

Subsequent map UI changes only need Metro and a reload. The map supports tapping,
long-pressing or dragging the pin, debounced place search, and Android foreground
location permission on demand. Search/location failure leaves manual selection available.
Coordinates and optional notes are shared only after confirmation. Sightings and
owner in-app notifications save atomically and reject pets no longer marked lost.
The deployed Firestore rules must permit the reporter's transaction to read the
animal and its own sighting path, create the sighting, and create its linked owner
notification. Existing rules have not been modified.

Run regression tests with `node --test tests/*.test.mjs`. On a phone, verify map
tiles load, search results appear, denied GPS permission still permits pin placement,
and a test sighting produces exactly one owner notification.
