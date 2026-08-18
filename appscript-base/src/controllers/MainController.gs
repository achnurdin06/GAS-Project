/**
 * Main Web App Controller for AEF
 * Handles doGet entry point and partial view includes
 */
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.setup === 'true') {
      setupDatabase();
      return HtmlService.createHtmlOutput('<h3>Database reinitialized successfully!</h3>');
    }
    const template = HtmlService.createTemplateFromFile('views/Index');
    return template.evaluate()
      .setTitle('AppScript Enterprise Framework (AEF)')
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
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
