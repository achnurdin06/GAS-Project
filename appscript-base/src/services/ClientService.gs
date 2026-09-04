/**
 * Client Service Class for AppScript Enterprise Framework
 * Handles business logic, validation, and operations for Client (Master Pelanggan) entity
 */
class ClientService {
  constructor() {
    this.clientRepo = new ClientRepository();
    this.auditService = new AuditService();
  }

  /**
   * Helper to safely format dates
   */
  formatDateHelper(val, isDateOnly = false) {
    if (!val) return '';
    if (val instanceof Date) {
      const iso = Utils.formatIsoDate(val);
      return isDateOnly ? iso.split('T')[0] : iso;
    }
    const str = String(val).trim();
    if (isDateOnly && str.includes('T')) {
      return str.split('T')[0];
    }
    return str;
  }

  /**
   * Gets all active clients
   */
  getAllClients() {
    try {
      const clients = this.clientRepo.find(row => String(row.status).trim().toUpperCase() !== 'DELETED');
      const mapped = clients.map(c => ({
        id: String(c.id || ''),
        client_code: String(c.client_code || ''),
        client_name: String(c.client_name || ''),
        contact_person: String(c.contact_person || ''),
        phone: String(c.phone || ''),
        email: String(c.email || ''),
        address: String(c.address || ''),
        description: String(c.description || ''),
        status: String(c.status || ''),
        created_at: this.formatDateHelper(c.created_at, false),
        updated_at: this.formatDateHelper(c.updated_at, false),
        updated_by: String(c.updated_by || '')
      }));

      // Sort by created_at desc (newest first)
      mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return Response.success('Data pelanggan berhasil diambil', mapped, 'CLIENT_FETCH_SUCCESS');
    } catch (e) {
      LoggerUtil.error('ClientService', 'Failed to get clients', e);
      return Response.error('Gagal mengambil data pelanggan: ' + e.message, 'CLIENT_FETCH_FAILED');
    }
  }

  /**
   * Gets client by ID
   */
  getClientById(id) {
    if (!id) return Response.error('ID pelanggan tidak boleh kosong', 'CLIENT_NOT_FOUND', 400);

    try {
      const client = this.clientRepo.findById(id);
      if (!client || String(client.status).trim().toUpperCase() === 'DELETED') {
        return Response.error('Pelanggan tidak ditemukan', 'CLIENT_NOT_FOUND', 404);
      }

      const mapped = {
        id: String(client.id || ''),
        client_code: String(client.client_code || ''),
        client_name: String(client.client_name || ''),
        contact_person: String(client.contact_person || ''),
        phone: String(client.phone || ''),
        email: String(client.email || ''),
        address: String(client.address || ''),
        description: String(client.description || ''),
        status: String(client.status || ''),
        created_at: this.formatDateHelper(client.created_at, false),
        updated_at: this.formatDateHelper(client.updated_at, false),
        updated_by: String(client.updated_by || '')
      };

      return Response.success('Detail pelanggan berhasil diambil', mapped, 'CLIENT_DETAIL_SUCCESS');
    } catch (e) {
      LoggerUtil.error('ClientService', `Failed to get client with ID ${id}`, e);
      return Response.error('Gagal mengambil detail pelanggan', 'CLIENT_DETAIL_FAILED');
    }
  }

  /**
   * Creates new client record
   */
  createClient(payload, actorId = 'SYSTEM') {
    if (!payload.client_name) {
      return Response.error('Nama pelanggan harus diisi', 'VALIDATION_ERROR', 400);
    }

    try {
      let clientCode = payload.client_code ? String(payload.client_code).trim().toUpperCase() : '';
      
      // Auto-generate code if empty
      if (!clientCode) {
        const year = new Date().getFullYear();
        const existing = this.clientRepo.readAll();
        const count = existing.filter(c => String(c.client_code).startsWith(`CLI-${year}-`)).length + 1;
        clientCode = `CLI-${year}-${String(count).padStart(3, '0')}`;
      } else {
        const existing = this.clientRepo.findByCode(clientCode);
        if (existing) {
          return Response.error(`Kode pelanggan '${clientCode}' sudah digunakan`, 'DUPLICATE_CODE', 409);
        }
      }

      const newRecord = {
        client_code: clientCode,
        client_name: String(payload.client_name).trim(),
        contact_person: payload.contact_person ? String(payload.contact_person).trim() : '',
        phone: payload.phone ? String(payload.phone).trim() : '',
        email: payload.email ? String(payload.email).trim() : '',
        address: payload.address ? String(payload.address).trim() : '',
        description: payload.description ? String(payload.description).trim() : '',
        status: payload.status ? String(payload.status).trim().toUpperCase() : 'ACTIVE',
        created_at: Utils.formatIsoDate(),
        created_by: actorId,
        updated_at: Utils.formatIsoDate(),
        updated_by: actorId
      };

      const inserted = this.clientRepo.insert(newRecord, actorId);

      this.auditService.log(
        'CLIENT',
        'CREATE',
        'SUCCESS',
        actorId,
        `Pelanggan baru ditambahkan: ${clientCode} - ${newRecord.client_name}`,
        inserted.id,
        null,
        inserted
      );

      return Response.success('Pelanggan berhasil ditambahkan', inserted, 'CLIENT_CREATE_SUCCESS', 201);
    } catch (e) {
      LoggerUtil.error('ClientService', 'Failed to create client', e);
      return Response.error('Gagal menambahkan pelanggan: ' + e.message, 'CLIENT_CREATE_FAILED');
    }
  }

  /**
   * Updates existing client record
   */
  updateClient(id, payload, actorId = 'SYSTEM') {
    if (!id) return Response.error('ID pelanggan tidak boleh kosong', 'VALIDATION_ERROR', 400);

    try {
      const existing = this.clientRepo.findById(id);
      if (!existing || String(existing.status).trim().toUpperCase() === 'DELETED') {
        return Response.error('Pelanggan tidak ditemukan', 'CLIENT_NOT_FOUND', 404);
      }

      const updateData = {};
      if (payload.client_code !== undefined) {
        const code = String(payload.client_code).trim().toUpperCase();
        if (code !== existing.client_code) {
          const checkCode = this.clientRepo.findByCode(code);
          if (checkCode && checkCode.id !== id) {
            return Response.error(`Kode pelanggan '${code}' sudah digunakan`, 'DUPLICATE_CODE', 409);
          }
        }
        updateData.client_code = code;
      }

      if (payload.client_name !== undefined) updateData.client_name = String(payload.client_name).trim();
      if (payload.contact_person !== undefined) updateData.contact_person = String(payload.contact_person).trim();
      if (payload.phone !== undefined) updateData.phone = String(payload.phone).trim();
      if (payload.email !== undefined) updateData.email = String(payload.email).trim();
      if (payload.address !== undefined) updateData.address = String(payload.address).trim();
      if (payload.description !== undefined) updateData.description = String(payload.description).trim();
      if (payload.status !== undefined) updateData.status = String(payload.status).trim().toUpperCase();

      const isUpdated = this.clientRepo.updateById(id, updateData, actorId);

      if (!isUpdated) {
        return Response.error('Gagal memperbarui data pelanggan', 'CLIENT_UPDATE_FAILED');
      }

      this.auditService.log(
        'CLIENT',
        'UPDATE',
        'SUCCESS',
        actorId,
        `Pelanggan diperbarui: ${existing.client_code}`,
        id,
        existing,
        updateData
      );

      return Response.success('Pelanggan berhasil diperbarui', { id, ...updateData }, 'CLIENT_UPDATE_SUCCESS');
    } catch (e) {
      LoggerUtil.error('ClientService', `Failed to update client ${id}`, e);
      return Response.error('Gagal memperbarui pelanggan: ' + e.message, 'CLIENT_UPDATE_FAILED');
    }
  }

  /**
   * Soft deletes a client record
   */
  deleteClient(id, actorId = 'SYSTEM') {
    if (!id) return Response.error('ID pelanggan tidak boleh kosong', 'VALIDATION_ERROR', 400);

    try {
      const existing = this.clientRepo.findById(id);
      if (!existing || String(existing.status).trim().toUpperCase() === 'DELETED') {
        return Response.error('Pelanggan tidak ditemukan', 'CLIENT_NOT_FOUND', 404);
      }

      // Option: Check if client is used in projects before allowing deletion
      const projectRepo = new ProjectRepository();
      const linkedProjects = projectRepo.find({ client_id: id });
      if (linkedProjects && linkedProjects.length > 0) {
          const activeLinked = linkedProjects.filter(p => String(p.status).trim().toUpperCase() !== 'DELETED');
          if (activeLinked.length > 0) {
              return Response.error(`Tidak dapat menghapus pelanggan. Pelanggan sedang digunakan di ${activeLinked.length} proyek aktif.`, 'CLIENT_IN_USE', 409);
          }
      }

      const isDeleted = this.clientRepo.updateById(id, { status: 'DELETED' }, actorId);

      if (!isDeleted) {
        return Response.error('Gagal menghapus pelanggan', 'CLIENT_DELETE_FAILED');
      }

      this.auditService.log(
        'CLIENT',
        'DELETE',
        'SUCCESS',
        actorId,
        `Pelanggan dihapus (Soft Delete): ${existing.client_code}`,
        id,
        { status: existing.status },
        { status: 'DELETED' }
      );

      return Response.success('Pelanggan berhasil dihapus', { id }, 'CLIENT_DELETE_SUCCESS');
    } catch (e) {
      LoggerUtil.error('ClientService', `Failed to delete client ${id}`, e);
      return Response.error('Gagal menghapus pelanggan: ' + e.message, 'CLIENT_DELETE_FAILED');
    }
  }
}
