class ConfigService {
  constructor() {
    this.configRepo = new ConfigRepository();
    this.auditService = new AuditService();
  }

  getAllConfigs() {
    const configs = this.configRepo.find(row => String(row.status).trim().toUpperCase() === 'ACTIVE');
    return Response.success('Konfigurasi sistem berhasil diambil', configs, 'CONFIG_LIST_SUCCESS');
  }

  updateConfig(configId, newValue, actorId = 'SYSTEM') {
    if (!configId || newValue === undefined) {
      return Response.error('Config ID dan Value wajib diisi', 'VALIDATION_ERROR');
    }

    const existing = this.configRepo.findById(configId);
    if (!existing) return Response.error('Konfigurasi tidak ditemukan', 'CONFIG_NOT_FOUND');

    const success = this.configRepo.updateById(configId, { config_value: String(newValue) }, actorId);
    if (!success) return Response.error('Gagal memperbarui konfigurasi', 'SYSTEM_ERROR');

    this.auditService.log('CONFIG', 'UPDATE', 'SUCCESS', actorId, `Config ${existing.config_key} updated to ${newValue}`, configId, existing.config_value, newValue);
    return Response.success('Konfigurasi berhasil diperbarui', null, 'CONFIG_UPDATE_SUCCESS');
  }
}
