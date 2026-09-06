---
name: release-billion-testflight
description: Build, submit, replace, or check a Billion iOS TestFlight release. Use for mobile version bumps, EAS builds, App Store Connect submission, and release-status verification.
---

# Release Billion to TestFlight

Read [the iOS release guide](../../../docs/ios-release.md) for commands and fallback procedures. Complete the requested release through build and submission monitoring. Distinguish an EAS build, an accepted Apple upload, completed Apple processing, and tester availability.

## 1. Establish the release source and acceptance criteria

Inspect the working tree, recent commits, tags, `apps/expo/app.config.base.json`, and `apps/expo/eas.json`. Verify identifiers from those files against the signed-in EAS project and App Store Connect. Run EAS commands from `apps/expo`.

Preserve unrelated changes and stage only intended release files. Build from an exact commit or tag in a clean worktree with its own real install. Linked `node_modules` can break native fingerprint parity.

Extract the behavior the user wants shipped. A status-only request needs inspection and a report, not a new version or build. For a new release, define a check for each requested change before spending a build. Navigation checks must cover both Expo Router options and the custom tab renderer; environment-gated behavior needs a production bundle or runtime check.

Done when the source, target app, release path, and behavior checks are identified.

## 2. Validate the release

Follow [release preflight](../../../docs/ios-release.md#release-preflight). Verify the canonical API URL against committed production configuration and EAS production. Show only public values; inspect secret settings by presence without printing credentials. Verify the live site and at least one public app API request, plus the relevant session flow for authentication changes.

Require mobile typecheck, lint, Expo Doctor, and the production iOS export to pass. Native dependency, plugin, or app-configuration changes also require prebuild validation. Resolve missing native peers, SDK mismatches, duplicate native modules, and config errors before building.

Done when the preflight and release-specific checks pass, with evidence for the behavior being shipped.

## 3. Version once and choose the build owner

Follow [TestFlight through CI](../../../docs/ios-release.md#testflight-through-ci). The bump script edits, commits, and tags; do not duplicate those operations. Review the staged diff before using it. EAS owns the remote iOS build number.

Pushing a `v*` tag starts `release-ios.yml`, which builds and submits. Inspect the workflow and EAS builds for the exact tag before starting anything manually. If CI is running or has succeeded, proceed to monitoring.

If CI cannot complete the release, state the reason and use the [manual EAS fallback](../../../docs/ios-release.md#manual-eas-fallback). Use the [local Xcode fallback](../../../docs/ios-release.md#local-xcode-fallback) when EAS quota or infrastructure prevents a build. Retain the same clean source, preflight, signing, and submission checks. For a local upload, choose an unused App Store build number and synchronize EAS's remote number afterward.

Done when one build path owns the exact release and its build/submission identifiers or local archive path are recorded.

## 4. Monitor and finish

Follow [build and submission verification](../../../docs/ios-release.md#verify-build-and-submission). On recoverable failure, inspect the current logs, correct the cause, rerun the relevant checks, and continue. Interactive Apple login, two-factor prompts, or agreements may require the account holder.

Verify Apple processing directly when a signed-in session is available. Otherwise report the accepted upload and pending or unverified processing state; do not claim tester availability without evidence.

Before finishing, verify:

- Release commit and tag, marketing version, and build number.
- Completed build and submission, or the precise remaining account/processing gate.
- Production API URL and checks for every requested behavior change.
- Unrelated working-tree changes preserved.

Remove the temporary worktree after monitoring completes. Report version/build and direct build, submission, and TestFlight links where available. For status-only requests, report the observed state and identifiers without creating release artifacts.
