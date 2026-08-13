/**
 * AppScript Enterprise Framework (AEF)
 * Config Service
 */

class ConfigService {
  constructor() {
    this.configRepo = new ConfigRepository();
    this.auditService = new AuditService();
  }

  /**
   * List all configurations
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  getAllConfigs(actorId) {
    const configs = this.configRepo.find({ status: 'ACTIVE' });
    return Response.success('List konfig berhasil diambil', configs, 'CONFIG_LIST_SUCCESS');
  }

  /**
   * Update configuration value
   * @param {string} configId 
   * @param {string} newValue 
   * @param {string} actorId 
   * @returns {Object} Standard Response
   */
  updateConfig(configId, newValue, actorId = 'SYSTEM') {
    if (!configId) return Response.error('Config ID wajib diisi', 'VALIDATION_ERROR');

    const existing = this.configRepo.findById(configId);
    if (!existing) return Response.error('Konfigurasi tidak ditemukan', 'CONFIG_NOT_FOUND');

    const updated = this.configRepo.updateById(configId, { config_value: newValue }, actorId);
    this.auditService.log('CONFIG', 'UPDATE', 'SUCCESS', actorId, `Config updated: ${existing.config_key} = ${newValue}`, configId, existing, updated);

    return Response.success('Konfigurasi berhasil diperbarui', updated, 'CONFIG_UPDATED');
  }
}
