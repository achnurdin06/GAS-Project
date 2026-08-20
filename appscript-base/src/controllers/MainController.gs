/**
 * Main Web App Controller for AEF
 * Handles doGet entry point and partial view includes
 */

const DEFAULT_APP_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABlCAMAAADAgy5XAAAC/VBMVEX///8YeKAwkLAgkLAYcJAYcJgQkMAgqNAgoMggkLgYaJAQeKAQgLAIgLgAiMAAkMgIoNgAoNgIoNAQoNAYoMgYkLggcIgQYIgQaJAQeLAAgLgAgMAIqNAYoMAgmLgYYIgIYJAIaJgIcKgAeLgAqNgIqNgYqNAgqMgQUIAAaKAAcKgAcLAAeLAAoNAAqOAAsOAIsNgQqMgQoMAQWIAQYJAAaKgQsNgYoLgYqLggWJAIaKgAuOAIuNgQuNgYsMgYqMAIOGAISHgIWIgAYKAAYKgAiLgAmMgAqNAAuOgAwOgAyOgIyOgYyOAoyNgYSHAIQGgIUIgIWJgAWKAAsNgA0PAQ2PAgyNgowMg4yNAIOGgIQHgASIAAUJgAgLAAkMAAmNAI2PAY2Ogg0OAo0NAwyNAAOGgISIAASIgASJAAWIAIcJgQiLAYmMgImNAIwOgA2PAA4PAA2OgI2OgQ2OAg0NAw0Mgw0NAIQHAISIgAWJgIaKAIWIAQmMAImMAIyPAA0OgA4OgI4OAY0NgoWIgAUJAIYJgIUIAIeKgQgKgImMgI0PgI0PAA6OgQ8PAo4NgIMFgIQIAASJgAQIAAQIgIWJAIkMAY0PAI0OgA0OAA8PAA+PgI+PAo6OA44NhI2NgIMGAIOHAAOHgAQJAAQHgIUJAQgKAQkLAAoMgY0OgQ2OgA2OAA6PAA8PgA+PAY8PAo6Og40NAQMGAAOIAQSIAYgKAQmMgAmNgAmMAg4PgY4PAI4OgI+PgQ8Pgo0NggsLAQKGAAQHAAMFgQiKgQwOAo6PgY6PAQ6PAI8PAI6PAYyNgYqLAQKFgAMHAIQIgAMHgAOHAAIFAQeJgo0Ogw8Pgg8PAQwNgAKHAAMGAIeKAIgLAIiLgAkNAYwNgw6PAg6PggsLgAKGgAMGgIKGAIKFgIkMgAwOAYwNAIIFAQkMgAiMgQ2PgYuNgYoLAAKGAAKFgAIEgQiLgQ0PAYmKgACDAQyPAQmKgQSGgYYIAgeJgomLAomLgIKEgIcJAIuOAYsNitugFyAAAAAXRSTlMAQObYZgAAFPxJREFUeNrtnH18W9V5xw0tLyON7ZAycBy2ENkjRFEMo2ZrDF2MNcd2IDhKUuoXYugI9pbahdEtMazANhOSQXtjC5ZBNxTbo3Qd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';

function doGet(e) {
  try {
    // 1. Check Google Login session & Setup state
    const setupState = checkSetupState();
    
    // Check if we are checking database status explicitly or if it's the setup screen
    if (!setupState.google_logged_in) {
      const template = HtmlService.createTemplateFromFile('views/Setup');
      template.noGoogleLogin = true;
      return template.evaluate()
        .setTitle('AEF - Google Account Required')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    if (!setupState.database_initialized) {
      const template = HtmlService.createTemplateFromFile('views/Setup');
      template.noGoogleLogin = false;
      template.setupState = JSON.stringify(setupState);
      return template.evaluate()
        .setTitle('AEF - System Configuration Wizard')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // Default Web App loading
    if (e && e.parameter && e.parameter.setup === 'true') {
      setupDatabase();
      return HtmlService.createHtmlOutput('<h3>Database reinitialized successfully!</h3>');
    }
    const template = HtmlService.createTemplateFromFile('views/Index');
    const props = PropertiesService.getScriptProperties();
    template.appName = props.getProperty('APP_NAME') || 'AppScript Enterprise Framework';
    template.appLogo = getAppLogo();
    
    return template.evaluate()
      .setTitle(template.appName)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    LoggerUtil.error('MainController', 'Error rendering web app', err);
    return HtmlService.createHtmlOutput(`<h3>Error loading application: ${err.message}</h3>`);
  }
}

/**
 * Gets APP_LOGO with database and default fallback
 */
function getAppLogo() {
  let logo = '';
  try {
    logo = PropertiesService.getScriptProperties().getProperty('APP_LOGO');
  } catch (e) {}

  if (!logo || logo === 'undefined' || logo === 'null' || !logo.trim()) {
    try {
      const configRepo = new ConfigRepository();
      const existing = configRepo.find(c => String(c.config_key).trim().toUpperCase() === 'APP_LOGO');
      if (existing && existing.length > 0 && existing[0].config_value) {
        logo = existing[0].config_value;
      }
    } catch (e) {
      // Ignore if database not ready yet
    }
  }

  if (!logo || logo === 'undefined' || logo === 'null' || !logo.trim() || logo.length < 10) {
    logo = DEFAULT_APP_LOGO;
  }
  return logo;
}

/**
 * Helper to include partial HTML files into templates
 * @param {string} filename 
 * @returns {string} File content
 */
function include(filename) {
  const props = PropertiesService.getScriptProperties();
  const template = HtmlService.createTemplateFromFile(filename);
  template.appName = props.getProperty('APP_NAME') || 'AppScript Enterprise Framework';
  template.appLogo = getAppLogo();
  return template.evaluate().getContent();
}
