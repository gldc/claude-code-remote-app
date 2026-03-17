# Changelog

## [1.4.0] - 2026-03-16

### Added
- File attachment support — camera, photo library, and document picker for attaching files to messages
- Themed AttachmentPicker modal replacing system ActionSheetIOS for cross-platform consistency

## [1.3.0] - 2026-03-15

### Added
- Respect server `show_cost` setting to conditionally hide cost display across SessionInfoBar, SessionCard, and per-turn status messages

### Fixed
- Gate per-turn cost in status_change messages behind show_cost setting

## [1.2.0] - 2026-03-14

### Added
- Cron tab with full job management — list, create, detail, and run history screens
- SchedulePicker component for frequency-based cron expression building (hourly/daily/weekly/monthly)
- Clock icon badge on cron-spawned sessions in the session list
- Swipe-to-delete on cron job cards
- Model and max budget fields on cron job create form

### Fixed
- Clean up cron tab UI polish and edge cases

## [1.1.1] - 2026-03-13

### Added
- Long-press copy support on all message card components with haptic feedback
- Clickable links in terminal view
- Paste button in terminal toolbar
- Ephemeral "Copied" toast on long-press copy

## [1.1.0] - 2026-03-13

### Added
- OTA updates via EAS Update with channel-based deployment (`preview` and `production`)
- EAS Workflow YAML files for automated OTA on push to `preview` and `main` branches
- Version and channel tag on Settings screen (channel hidden for production)

## [1.0.0] - 2026-03-12

### Added
- Expo Insights for EAS cold start analytics (#13)

### Fixed
- Ctrl toolbar button now works with keyboard input (#14)
- Guard `expo-notifications` import for Expo Go on Android (#15)

## [0.9.0] - 2026-03-12

### Added
- Android support: adaptive icon, cleartext traffic config, APK preview builds
- Cross-platform SymbolView format for SearchBar, ModelPicker, AvatarRow, ExpandableCard

### Fixed
- Use inverted FlatList so session detail opens at newest messages (#12)

## [0.8.0] - 2026-03-10

### Added
- Onboarding flow for new users (#10)
- Design system refactor: tokens, primitives, migrations (#9)

### Fixed
- Restore themed tab bar after leaving terminal screen (#8)
- Dark mode header and contrast improvements (#7)
- Themed header colors for session detail and workflow layouts

## [0.7.0] - 2026-03-09

### Added
- Actionable approve/deny buttons on push notifications (#5)

### Fixed
- Push notification setup and reliability improvements (#4)

### Security
- Harden app UI before release (#6)
- Handle 403 and WebSocket 4003 from ownership enforcement
- Clean up stale useCallback dependencies

## [0.6.0] - 2026-03-09

### Added
- Remote session management — full feature set (#1)
- Interactive terminal for Projects tab (#2)
- 14 Layer 1 foundation components

### Fixed
- `useBaseUrl` reactivity and query key cache invalidation
- Remove optimistic `appendMessage` causing duplicate user messages (#3)

## [0.5.0] - 2026-03-08

### Security
- Fix 3 vulnerabilities from security review

### Added
- Dark theme, command autocomplete, markdown rendering fixes
- Comprehensive README.md and CLAUDE.md

## [0.1.0] - 2026-03-07

### Added
- Initial Expo app scaffold with dependencies
- Theme system (light/dark), types, Zustand store, API client, WebSocket, notifications
- Root layout and tab navigator with stack routes
- All UI components (message cards, project/template cards, shared components)
- All screens (sessions, projects, settings, templates)
