/**
 * AppScript Enterprise Framework (AEF)
 * Main Controller & Entry Point (PRD Section 4.2 & 21)
 */

/**
 * Serves the web application HTML.
 * @param {Object} e 
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  try {
    const template = HtmlService.createTemplateFromFile('views/Index');
    return template.evaluate()
      .setTitle('AEF App - AppScript Enterprise Framework')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    Logger.error('MAIN', 'doGet', `Failed to render page: ${err.message}`);
    return HtmlService.createHtmlOutput(`<h3>Error rendering application: ${err.message}</h3>`);
  }
}

/**
 * Include HTML files (CSS / JS / Partials) into template.
 * @param {string} filename 
 * @returns {string} Content of HTML file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
