# Control built-in Presenter & Audience Mode

## Extended Description

This macro was created to provide a simple RoomOS touch interface for enabling and disabling Cisco’s built-in **Presenter and Audience** room mode. It is intended for rooms where Cisco’s native Presenter and Audience behavior should be available without requiring users, technicians, or administrators to manually run xAPI commands.

The macro does **not** manually switch camera inputs and does **not** manually control PresenterTrack. Instead, it activates or deactivates Cisco’s built-in room template by switching the codec room type between `PresenterAndAudience` and `Standard`.

When enabled, the macro activates the Cisco built-in `PresenterAndAudience` room type. When disabled, it returns the codec to the standard room type. A RoomOS UI panel is created so the behavior can be controlled directly from the touch interface.

***

## Why This Macro Exists

This macro was created to make Cisco’s built-in Presenter and Audience mode easier to use, easier to expose to users, and safer to deploy in real meeting rooms. Presenter and Audience mode can be very useful in rooms where both the presenter and the audience need to be handled by the codec’s native camera logic, but manually activating the correct room type through xAPI is not practical for everyday users.

Without a simple UI control, enabling or disabling the built-in room mode normally requires administrator access, xAPI knowledge, or manual configuration changes. That is not ideal in rooms where the behavior may need to be changed depending on the meeting type, room layout, support scenario, or customer preference.

This macro solves that by giving users or technicians a clear RoomOS control for switching the room between Cisco’s built-in `PresenterAndAudience` room type and the normal `Standard` room type. The room can therefore be placed into a presenter/audience optimized mode when needed, and returned to standard behavior when that mode is not required.

The macro was also created to avoid custom camera switching logic where it is not needed. Instead of manually selecting camera inputs or building a separate PresenterTrack workflow, this macro relies on Cisco’s native room template. That makes the solution simpler, more aligned with Cisco’s built-in behavior, and easier to understand operationally.

Because Microsoft Teams Rooms mode may not support the same room type behavior in the same way as native RoomOS, the macro includes an MTR safety mechanism. If Microsoft Teams Rooms is detected and the safety setting is enabled, the macro stops during startup. This prevents the UI panel from being saved, prevents the Presenter and Audience room type command from being sent, and avoids registering widget handlers for a mode that should not be activated in that environment.

Overall, the macro was created to provide a controlled, user-friendly, and safer way to activate Cisco’s native Presenter and Audience mode directly from the device UI, while avoiding unsupported behavior when Microsoft Teams Rooms is detected.

***

## How The Macro Works

When the macro starts, it first checks whether Microsoft Teams Rooms is installed by trying to read the Microsoft Teams app version from the codec status path.

If Microsoft Teams Rooms is detected and MTR safety is enabled, the macro stops immediately. In that case:

*   No UI panel is saved
*   No room type command is sent
*   No widget handler is registered
*   Presenter and Audience mode is not activated

If Microsoft Teams Rooms is not detected, or if the safety setting is disabled, the macro continues startup.

The macro then creates a RoomOS UI panel using the configured panel settings. The panel contains an information text field and a toggle button. The toggle button is used to enable or disable the built-in Presenter and Audience room mode.

After the UI panel is saved, the macro applies the configured default startup state:

*   If `defaultModeEnabled` is `true`, the macro activates `PresenterAndAudience`
*   If `defaultModeEnabled` is `false`, the macro activates `Standard`

The macro also updates the UI toggle so the touch interface reflects the current internal mode state.

When a user changes the toggle, the macro reads the requested value and converts it into a clear on/off state. If the requested state is different from the current state, the macro sends the correct Cisco xAPI room type activation command.

The workflow is:

*   Start macro
*   Check for Microsoft Teams Rooms
*   Stop startup if MTR safety requires it
*   Save the RoomOS UI panel
*   Apply the configured default startup mode
*   Update the UI toggle state
*   Listen for toggle changes
*   Activate `PresenterAndAudience` when enabled
*   Activate `Standard` when disabled

***

## Configuration Options

The macro includes a configuration section that controls logging, UI appearance, UI placement, MTR safety, startup behavior, and the room type names used by Cisco xAPI.

***

### Debug Logging

```javascript
debug: true,
```

Controls whether detailed log messages are written to the macro log.

*   `true` enables detailed logging
*   `false` disables the macro’s debug log output

This is useful during testing, commissioning, and troubleshooting. In production, this can normally be set to `false` unless detailed operational logs are needed.

***

### UI Panel ID

```javascript
panelId: 'presenter_audience_control',
```

Defines the unique ID of the RoomOS UI panel created by the macro.

This ID is used when saving or updating the panel. It should normally stay unchanged unless another UI extension already uses the same panel ID.

***

### UI Panel Name

```javascript
panelName: 'Camera Mode',
```

Defines the visible name of the UI tile or panel.

This is the name users see on the RoomOS touch interface. It should be short and clear because it represents the control users will open to enable or disable Presenter and Audience mode.

***

### UI Panel Icon

```javascript
panelIcon: 'Sliders',
```

Defines the icon used for the RoomOS UI panel.

The default `Sliders` icon communicates that this panel controls a device behavior or mode setting.

***

### UI Panel Color

```javascript
panelColor: '#2D8CFF',
```

Defines the color used for the UI panel icon or tile.

This can be changed to match customer branding, room standards, or local UI design preferences.

***

### UI Panel Location

```javascript
panelLocation: 'ControlPanel',
```

Controls where the UI panel is placed.

Supported values used by the macro:

*   `HomeScreen` places the button as a home screen tile
*   `ControlPanel` places the button in the control panel

For RoomOS 11 and newer, `HomeScreen` is commonly used when the control should be visible as a main tile. `ControlPanel` is useful when the control should be available but not shown as a primary home screen action.

***

### Stop Startup When MTR Is Detected

```javascript
stopMacroStartupWhenMtrDetected: true,
```

Controls whether the macro should stop during startup if Microsoft Teams Rooms is detected.

*   `true` stops the macro startup when MTR is detected
*   `false` allows the macro to continue even if MTR is detected

The recommended setting is usually `true`. This prevents unsupported or unwanted activation of Cisco Presenter and Audience room type behavior in Microsoft Teams Rooms mode.

When this safety setting stops startup, the macro does not save the UI panel, does not activate a room type, and does not register the toggle event handler.

***

### Include Legacy Type Home

```javascript
includeLegacyTypeHome: false,
```

Controls whether the macro includes the legacy XML element:

```xml
<Type>Home</Type>
```

*   `false` keeps the XML aligned with the RoomOS 11+ style used by the macro
*   `true` includes the legacy `Type` element for compatibility with older examples or older UI behavior

For RoomOS 11 and newer, this should normally stay `false`.

***

### UI Page Title

```javascript
pageTitle: 'Presenter & Audience Mode',
```

Defines the title shown inside the UI page when the user opens the panel.

This should describe the function of the page clearly, since it is the user-facing heading for the control.

***

### UI Page Text

```javascript
pageText: 'Enable or disable Cisco codec built-in room mode for presenter/audience camera switching behavior.',
```

Defines the information text shown next to the toggle button.

This text explains what the toggle controls. It should be concise but clear enough that a user or technician understands that the button changes the built-in Cisco room mode, not a custom camera switching script.

***

### Default Startup Mode

```javascript
defaultModeEnabled: true,
```

Controls what the macro applies when it starts.

*   `true` activates `PresenterAndAudience` at startup
*   `false` activates `Standard` at startup

Use `true` when the room should normally start in Presenter and Audience mode.  
Use `false` when the room should normally start in Standard mode and only enable Presenter and Audience mode manually when needed.

This value also defines the initial internal state used by the macro.

***

### Presenter And Audience Room Type Name

```javascript
presenterAudienceRoomType: 'PresenterAndAudience',
```

Defines the Cisco room type name used when enabling Presenter and Audience mode.

The macro sends this value to:

```javascript
xapi.Command.Provisioning.RoomType.Activate
```

This should normally not be changed unless Cisco changes the room type name or the deployment requires a different supported room type.

***

### Standard Room Type Name

```javascript
standardRoomType: 'Standard'
```

Defines the Cisco room type name used when disabling Presenter and Audience mode.

When the toggle is turned off, the macro activates `Standard` to return the codec to normal room behavior.

This should normally stay as `Standard`.

***

## Practical Use Cases

### Presenter And Audience Rooms

This macro is useful in rooms designed around Cisco’s native Presenter and Audience behavior, where the codec should manage the presenter/audience room template instead of using custom camera switching logic.

It gives users a simple way to enable or disable that mode directly from the touch interface.

***

### Training Rooms

In a training room, Presenter and Audience mode may be useful when an instructor is presenting to both local and remote participants.

The macro allows the room to start in the correct mode automatically or lets a technician enable it from the UI when the session requires it.

***

### Classrooms

In hybrid classrooms, the room may need Cisco’s built-in presenter/audience behavior when a teacher is presenting, but may need standard behavior for other types of sessions.

The macro makes it easier to switch between those modes without opening the codec web interface or running xAPI commands manually.

***

### Town Halls And Briefing Rooms

For town halls, briefings, and presentation-heavy rooms, Presenter and Audience mode can provide a more suitable camera behavior than the standard room type.

The macro allows that mode to be exposed as a simple operational control.

***

### Support And Commissioning

During testing, commissioning, or troubleshooting, technicians may need to quickly switch between `PresenterAndAudience` and `Standard`.

This macro provides a repeatable and visible method for doing that from the touch panel, while also keeping logs when debug is enabled.

***

### Rooms Where MTR Safety Is Important

In environments where some Cisco devices may run Microsoft Teams Rooms mode, the macro helps avoid unsupported behavior by stopping startup when MTR is detected.

This is useful in mixed deployments where the same macro repository may be used across both native RoomOS and MTR-capable devices.

***

## User Experience Benefit

For users, the macro provides a simple on/off control for a complex room behavior. They do not need to understand xAPI, room type activation, or the underlying Cisco configuration.

For technicians, it provides a predictable way to expose Presenter and Audience mode without building custom camera switching logic. The UI toggle reflects the intended mode state, and debug logging can be enabled when troubleshooting is needed.

The macro also avoids confusion by focusing on one clear purpose: enabling or disabling Cisco’s built-in Presenter and Audience room type. It does not try to manually control camera sources or PresenterTrack separately.

***

## Operational Behavior

The macro applies the configured default room mode at startup. If `defaultModeEnabled` is set to `true`, the room is placed into `PresenterAndAudience` mode when the macro starts. If it is set to `false`, the room is placed into `Standard` mode.

When the user changes the toggle, the macro activates the corresponding room type and updates the toggle state. If activation fails, the macro logs the error and keeps running. The UI is also updated to avoid showing an incorrect state where possible.

If Microsoft Teams Rooms is detected and the safety option is enabled, the macro stops before making changes. This prevents unsupported room type activation and avoids exposing a UI control that should not be used in that mode.

***

## Built-In Room Type Control

This macro uses Cisco’s built-in room type activation instead of custom camera logic.

When enabling the mode, it sends:

```javascript
xapi.Command.Provisioning.RoomType.Activate({
  Name: config.presenterAudienceRoomType
});
```

When disabling the mode, it sends:

```javascript
xapi.Command.Provisioning.RoomType.Activate({
  Name: config.standardRoomType
});
```

This means the macro delegates the actual presenter/audience camera behavior to Cisco’s native room template.

That is important because the macro is not responsible for deciding which camera should be active, when PresenterTrack should follow, or how Cisco’s built-in mode behaves internally. Its job is only to make activation and deactivation simple, visible, and repeatable.

***

## MTR Safety

The macro includes Microsoft Teams Rooms detection as a safety mechanism.

It checks whether this status path can return a Teams app version:

```javascript
xapi.Status.MicrosoftTeams.Software.Version.TeamsApp.get()
```

If a non-empty Teams app version is returned, the macro treats Microsoft Teams Rooms as detected.

When MTR is detected and `stopMacroStartupWhenMtrDetected` is `true`, startup is stopped immediately. This means:

*   No RoomOS UI panel is saved
*   No Presenter and Audience room type command is sent
*   No widget event handler is registered
*   The macro does not attempt to activate or deactivate room type behavior

This is included because Presenter and Audience room type activation may not be appropriate or supported in MTR mode. The safety check prevents the macro from applying a room behavior that could conflict with the Microsoft Teams Rooms operating mode.

***

## RoomOS UI Panel

The macro creates a RoomOS UI panel with a single toggle button and explanatory text.

The UI panel gives users or technicians a clear way to control the room mode:

*   Toggle on = activate `PresenterAndAudience`
*   Toggle off = activate `Standard`

The panel location is controlled by the configuration. It can be placed on the `HomeScreen` or in the `ControlPanel`, depending on how visible the control should be.

For RoomOS 11 and newer, the macro uses `<Location>` to define placement. The legacy `<Type>Home</Type>` element is not included by default but can be enabled if needed.

***

## Error Handling And Logging

The macro is designed to continue running where possible if an error occurs after startup.

If room type activation fails, the macro logs the error and keeps running. If activating Presenter and Audience mode fails, the macro updates the UI toggle to off to avoid showing the mode as enabled when activation did not succeed.

If returning to Standard mode fails, the macro does not assume that the room type changed. Instead, it keeps the UI aligned with the last known internal state.

Debug logging is controlled by `config.debug`. When debug is enabled, startup actions, UI updates, MTR detection, mode changes, and errors are logged with a clear prefix.

***

## Recommended Default Configuration

```javascript
const config = {
  debug: false,

  panelId: 'presenter_audience_control',
  panelName: 'Camera Mode',
  panelIcon: 'Sliders',
  panelColor: '#2D8CFF',

  panelLocation: 'ControlPanel',

  stopMacroStartupWhenMtrDetected: true,
  includeLegacyTypeHome: false,

  pageTitle: 'Presenter & Audience Mode',
  pageText: 'Enable or disable Cisco codec built-in room mode for presenter/audience camera switching behavior.',

  defaultModeEnabled: true,

  presenterAudienceRoomType: 'PresenterAndAudience',
  standardRoomType: 'Standard'
};
```

***

## Summary

This macro provides a RoomOS UI control for enabling or disabling Cisco’s built-in Presenter and Audience room mode. It activates `PresenterAndAudience` when enabled and returns the codec to `Standard` when disabled.

The macro was created to make Cisco’s native Presenter and Audience behavior easier to access, safer to deploy, and simpler to operate. It avoids custom camera switching logic, relies on Cisco’s built-in room type handling, provides a clear touch-panel toggle, applies a configurable startup state, includes debug logging, and stops startup when Microsoft Teams Rooms is detected if MTR safety is enabled.
