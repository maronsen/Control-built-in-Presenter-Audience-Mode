
import xapi from 'xapi';
/*
===============================================================================
 Cisco Presenter and Audience Mode Control
===============================================================================
Purpose:
- Creates a RoomOS 11+ home screen UI tile with a Sliders icon.
- Opens a UI page for enabling/disabling Cisco built-in Presenter and Audience mode.
- Defaults to ON when the macro starts.
- Activates Cisco's built-in PresenterAndAudience room type.
- Deactivates by returning the room type to Standard.
- Provides detailed logging only when config.debug is true.
Important:
- This macro does NOT manually switch camera inputs.
- This macro does NOT manually control PresenterTrack.
- This macro activates/deactivates Cisco's built-in room template:
    Provisioning RoomType Activate Name: PresenterAndAudience
MTR safety:
- If Microsoft Teams Rooms is detected, startup is stopped.
- No UI panel is saved.
- No Presenter&Audience room type command is sent.
- No widget handler is registered.
Cisco xAPI used:
- xCommand Provisioning RoomType Activate Name: PresenterAndAudience
- xCommand Provisioning RoomType Activate Name: Standard
- xCommand UserInterface Extensions Panel Save
- xCommand UserInterface Extensions Widget SetValue
- xStatus MicrosoftTeams Software Version TeamsApp
RoomOS 11+ UI note:
- The UI location is controlled by config.panelLocation.
- For RoomOS 11 or higher, <Location>HomeScreen</Location> is preferred.
- <Type>Home</Type> is not included by default.
- If you need legacy compatibility, set config.includeLegacyTypeHome to true.
===============================================================================
*/

/*
===============================================================================
 STATIC IDS
===============================================================================
 Do not edit unless you also update all matching UI/event references.
===============================================================================
*/
const TOGGLE_WIDGET_ID = 'presenter_audience_toggle';
const INFO_TEXT_WIDGET_ID = 'presenter_audience_info_text';

/*
===============================================================================
 CONFIG SECTION
===============================================================================
 Edit this section only.
===============================================================================
*/
const config = {
  debug: true,
  // UI panel configuration
  panelId: 'presenter_audience_control',
  panelName: 'Camera Mode',
  panelIcon: 'Sliders',
  panelColor: '#2D8CFF',
  // RoomOS 11+ panel location
  // Use:
  // - 'HomeScreen'   = button appears as a home screen tile
  // - 'ControlPanel' = button appears in the control panel
  panelLocation: 'ControlPanel',
  // MTR safety
  // true = if Microsoft Teams Rooms is detected, stop macro startup immediately.
  // This prevents unsupported Presenter&Audience room type activation in MTR mode.
  stopMacroStartupWhenMtrDetected: true,
  // Only enable this if you need compatibility with older XML examples.
  // For RoomOS 11+, this should normally stay false.
  includeLegacyTypeHome: false,
  // UI text shown inside the control page
  pageTitle: 'Presenter & Audience Mode',
  pageText: 'Enable or disable Cisco codec built-in room mode for presenter/audience camera switching behavior.',
  // Default startup behavior
  // true  = activate Presenter and Audience mode when the macro starts
  // false = set room type to Standard when the macro starts
  defaultModeEnabled: true,
  // Room type names used by Cisco xAPI
  presenterAudienceRoomType: 'PresenterAndAudience',
  standardRoomType: 'Standard'
};

/*
===============================================================================
 INTERNAL STATE
===============================================================================
*/
let modeEnabled = config.defaultModeEnabled;
let mtrDetected = false;

/*
===============================================================================
 LOGGING
===============================================================================
*/
function log(message, data) {
  if (!config.debug) return;
  if (data !== undefined) {
    console.log(`[PresenterAudienceControl] ${message}`, data);
  } else {
    console.log(`[PresenterAudienceControl] ${message}`);
  }
}
function logError(message, error) {
  if (!config.debug) return;
  if (error !== undefined) {
    console.log(`[PresenterAudienceControl][ERROR] ${message}`, error);
  } else {
    console.log(`[PresenterAudienceControl][ERROR] ${message}`);
  }
}

/*
===============================================================================
 XML HELPERS
===============================================================================
*/
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function buildLegacyTypeXml() {
  if (!config.includeLegacyTypeHome) return '';
  return `
    <Type>Home</Type>`;
}

/*
===============================================================================
 MTR SAFETY
===============================================================================
*/
async function detectMtrInstalled() {
  log('Checking if Microsoft Teams Rooms is installed.');
  try {
    const teamsAppVersion = await xapi.Status.MicrosoftTeams.Software.Version.TeamsApp.get();
    if (
      teamsAppVersion !== undefined &&
      teamsAppVersion !== null &&
      String(teamsAppVersion).trim() !== ''
    ) {
      log(`Microsoft Teams Rooms detected. Teams app version: ${teamsAppVersion}.`);
      return true;
    }
    log('Microsoft Teams status path exists, but Teams app version is empty. Treating as MTR not detected.');
    return false;
  } catch (error) {
    log('Microsoft Teams Rooms status path not available. Treating as MTR not detected.');
    return false;
  }
}

/*
===============================================================================
 UI PANEL
===============================================================================
*/
function buildPanelXml() {
  return `
<Extensions>
  <Version>1.11</Version>
  <Panel>
    <Order>1</Order>
    <PanelId>${escapeXml(config.panelId)}</PanelId>
    <Origin>local</Origin>
    <Location>${escapeXml(config.panelLocation)}</Location>${buildLegacyTypeXml()}
    <Icon>${escapeXml(config.panelIcon)}</Icon>
    <Color>${escapeXml(config.panelColor)}</Color>
    <Name>${escapeXml(config.panelName)}</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>${escapeXml(config.pageTitle)}</Name>
      <Row>
        <Name>Presenter and Audience Control</Name>
        <Widget>
          <WidgetId>${INFO_TEXT_WIDGET_ID}</WidgetId>
          <Name>${escapeXml(config.pageText)}</Name>
          <Type>Text</Type>
          <Options>size=3;fontSize=normal;align=left</Options>
        </Widget>
        <Widget>
          <WidgetId>${TOGGLE_WIDGET_ID}</WidgetId>
          <Name>Enable</Name>
          <Type>ToggleButton</Type>
          <Options>size=1</Options>
        </Widget>
      </Row>
      <Options/>
    </Page>
  </Panel>
</Extensions>`;
}
async function saveUiPanel() {
  log('Saving UI panel.');
  log(`Configured panel location: ${config.panelLocation}.`);
  log(`Include legacy <Type>Home</Type>: ${config.includeLegacyTypeHome}.`);
  try {
    await xapi.Command.UserInterface.Extensions.Panel.Save(
      { PanelId: config.panelId },
      buildPanelXml()
    );
    log('UI panel saved successfully.');
    return true;
  } catch (error) {
    logError('Failed to save UI panel.', error);
    return false;
  }
}
async function setToggleValue(enabled) {
  const value = enabled ? 'on' : 'off';
  log(`Setting UI toggle to ${value}.`);
  try {
    await xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: TOGGLE_WIDGET_ID,
      Value: value
    });
    log('UI toggle updated.');
    return true;
  } catch (error) {
    logError('Failed to update UI toggle.', error);
    return false;
  }
}

/*
===============================================================================
 BUILT-IN ROOM TYPE CONTROL
===============================================================================
*/
async function activatePresenterAndAudienceMode() {
  log('Activating Presenter and Audience mode by setting room type to PresenterAndAudience.');
  try {
    await xapi.Command.Provisioning.RoomType.Activate({
      Name: config.presenterAudienceRoomType
    });
    modeEnabled = true;
    log('Presenter and Audience room type activated.');
    await setToggleValue(true);
    log('Presenter and Audience mode is now active.');
    return true;
  } catch (error) {
    modeEnabled = false;
    logError('Failed to activate Presenter and Audience room type. Macro will continue running.', error);
    // Keep the UI consistent with the failed activation.
    await setToggleValue(false);
    return false;
  }
}
async function deactivatePresenterAndAudienceMode() {
  log('Deactivating Presenter and Audience mode by setting room type to Standard.');
  try {
    await xapi.Command.Provisioning.RoomType.Activate({
      Name: config.standardRoomType
    });
    modeEnabled = false;
    log('Room type set to Standard.');
    await setToggleValue(false);
    log('Presenter and Audience mode is now inactive.');
    return true;
  } catch (error) {
    logError('Failed to set room type to Standard. Macro will continue running.', error);
    // Do not assume the room type changed.
    // Keep the UI showing the last known internal state.
    await setToggleValue(modeEnabled);
    return false;
  }
}
async function setPresenterAndAudienceMode(enabled) {
  log(`Requested mode state: ${enabled ? 'ON' : 'OFF'}.`);
  if (enabled) {
    return await activatePresenterAndAudienceMode();
  }
  return await deactivatePresenterAndAudienceMode();
}

/*
===============================================================================
 EVENT HANDLING
===============================================================================
*/
function normalizeToggleValue(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).toLowerCase();
  if (normalized === 'on' || normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'off' || normalized === 'false' || normalized === '0') {
    return false;
  }
  return null;
}
function registerWidgetHandler() {
  log('Registering widget event handler.');
  xapi.Event.UserInterface.Extensions.Widget.Action.on(async (event) => {
    if (!event || event.WidgetId !== TOGGLE_WIDGET_ID) {
      return;
    }
    log('Widget action received.', event);
    const requestedState = normalizeToggleValue(event.Value);
    if (requestedState === null) {
      log('Ignoring widget event because value could not be interpreted.', event);
      return;
    }
    if (requestedState === modeEnabled) {
      log(`Ignoring widget event because mode is already ${requestedState ? 'ON' : 'OFF'}.`);
      return;
    }
    const success = await setPresenterAndAudienceMode(requestedState);
    if (!success) {
      logError(`Requested mode change to ${requestedState ? 'ON' : 'OFF'} failed, but macro is still running.`);
    }
  });
}

/*
===============================================================================
 STARTUP
===============================================================================
*/
async function init() {
  log('Macro starting.');
  log('Configuration:', config);
  mtrDetected = await detectMtrInstalled();
  if (mtrDetected && config.stopMacroStartupWhenMtrDetected) {
    logError('Microsoft Teams Rooms is installed. Macro startup stopped by MTR safety setting.');
    return;
  }
  const uiSaved = await saveUiPanel();
  if (!uiSaved) {
    logError('Startup stopped because UI panel could not be saved.');
    return;
  }
  log(`Default mode is ${config.defaultModeEnabled ? 'ON' : 'OFF'}. Applying startup mode.`);
  const startupSuccess = await setPresenterAndAudienceMode(config.defaultModeEnabled);
  if (startupSuccess) {
    if (config.defaultModeEnabled) {
      log('Startup Presenter&Audience Mode successfully activated.');
    } else {
      log('Startup Presenter&Audience Mode successfully deactivated.');
    }
  } else {
    if (config.defaultModeEnabled) {
      logError('Startup Presenter&Audience Mode activation failed but macro still running.');
    } else {
      logError('Startup Presenter&Audience Mode deactivation failed but macro still running.');
    }
  }
  registerWidgetHandler();
  log('Macro initialized.');
}
init();
