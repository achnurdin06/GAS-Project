/**
 * AppScript Enterprise Framework (AEF)
 * Configuration Repository (sys_configuration)
 */

class ConfigRepository extends BaseRepository {
  constructor() {
    super('sys_configuration');
  }

  /**
   * Get config value by key.
   * @param {string} key 
   * @param {string} [defaultValue=''] 
   * @returns {string}
   */
  getValue(key, defaultValue = '') {
    const matches = this.find({ config_key: key });
    return matches.length > 0 ? matches[0].config_value : defaultValue;
  }
}
