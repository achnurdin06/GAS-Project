/**
 * Main Web App Controller for AEF
 * Handles doGet entry point and partial view includes
 */
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
    template.appLogo = props.getProperty('APP_LOGO') || '';
    
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
 * Helper to include partial HTML files into templates
 * @param {string} filename 
 * @returns {string} File content
 */
function include(filename) {
  const props = PropertiesService.getScriptProperties();
  const template = HtmlService.createTemplateFromFile(filename);
  template.appName = props.getProperty('APP_NAME') || 'AppScript Enterprise Framework';
  template.appLogo = props.getProperty('APP_LOGO') || '';
  return template.evaluate().getContent();
}

