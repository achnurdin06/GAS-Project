/**
 * Project Service Class for AppScript Enterprise Framework (AEF)
 * Handles business logic, validation, audit logging, and metrics for project management
 */
class ProjectService {
  constructor() {
    this.projectRepo = new ProjectRepository();
    this.clientRepo = new ClientRepository();
    this.auditService = new AuditService();
  }

  /**
   * Helper to safely format dates and prevent RangeError on invalid dates
   */
  formatDateHelper(val, isDateOnly = false) {
    if (!val) return '';
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const iso = val.toISOString();
      return isDateOnly ? iso.split('T')[0] : iso;
    }
    const str = String(val).trim();
    if (isDateOnly && str.includes('T')) {
      return str.split('T')[0];
    }
    return str;
  }

  /**
   * Retrieves all non-deleted projects
   */
  getAllProjects(actorId = 'SYSTEM') {
    const projects = this.projectRepo.find(row => String(row.status).trim().toUpperCase() !== 'DELETED');
    const clients = this.clientRepo.readAll();
    const clientMap = new Map(clients.map(c => [c.id, c.client_name]));

    const safeProjects = projects.map(p => ({
      id: p.id,
      project_code: p.project_code || '',
      project_name: p.project_name || '',
      client_id: p.client_id || '',
      client_name: clientMap.get(p.client_id) || 'Unknown Client',
      project_manager: p.project_manager || '',
      start_date: this.formatDateHelper(p.start_date, true),
      end_date: this.formatDateHelper(p.end_date, true),
      budget: Number(p.budget || 0),
      priority: String(p.priority || 'MEDIUM').toUpperCase(),
      status: String(p.status || 'PLANNING').toUpperCase(),
      progress: Math.min(100, Math.max(0, Number(p.progress || 0))),
      description: p.description || '',
      created_at: this.formatDateHelper(p.created_at, false),
      created_by: p.created_by || '',
      updated_at: this.formatDateHelper(p.updated_at, false),
      updated_by: p.updated_by || ''
    }));

    return Response.success('List data proyek berhasil diambil', safeProjects, 'PROJECT_LIST_SUCCESS');
  }

  /**
   * Retrieves project summary statistics
   */
  getProjectStats() {
    const projects = this.projectRepo.find(row => String(row.status).trim().toUpperCase() !== 'DELETED');
    
    let totalBudget = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let planningCount = 0;
    let onHoldCount = 0;

    projects.forEach(p => {
      const status = String(p.status || '').toUpperCase();
      const budget = Number(p.budget || 0);
      totalBudget += isNaN(budget) ? 0 : budget;

      if (status === 'IN_PROGRESS') inProgressCount++;
      else if (status === 'COMPLETED') completedCount++;
      else if (status === 'PLANNING') planningCount++;
      else if (status === 'ON_HOLD') onHoldCount++;
    });

    const stats = {
      total_projects: projects.length,
      in_progress: inProgressCount,
      completed: completedCount,
      planning: planningCount,
      on_hold: onHoldCount,
      total_budget: totalBudget
    };

    return Response.success('Statistik proyek berhasil dihitung', stats, 'PROJECT_STATS_SUCCESS');
  }

  /**
   * Retrieves single project by ID
   */
  getProjectById(id) {
    if (!id) return Response.error('ID Proyek wajib disertakan', 'VALIDATION_ERROR');
    const project = this.projectRepo.findById(id);
    if (!project || String(project.status).trim().toUpperCase() === 'DELETED') {
      return Response.error('Proyek tidak ditemukan', 'NOT_FOUND');
    }
    const client = this.clientRepo.findById(project.client_id);
    const safeProject = {
      ...project,
      client_name: client ? client.client_name : 'Unknown Client',
      start_date: this.formatDateHelper(project.start_date, true),
      end_date: this.formatDateHelper(project.end_date, true),
      created_at: this.formatDateHelper(project.created_at, false),
      updated_at: this.formatDateHelper(project.updated_at, false),
      budget: Number(project.budget || 0),
      progress: Math.min(100, Math.max(0, Number(project.progress || 0)))
    };
    return Response.success('Detail proyek berhasil diambil', safeProject, 'PROJECT_DETAIL_SUCCESS');
  }

  /**
   * Creates new project record
   */
  createProject(payload, actorId = 'SYSTEM') {
    if (!payload.project_name || String(payload.project_name).trim() === '') {
      return Response.error('Nama Proyek wajib diisi', 'VALIDATION_ERROR');
    }
    if (!payload.client_id || String(payload.client_id).trim() === '') {
      return Response.error('Klien / Instansi wajib dipilih', 'VALIDATION_ERROR');
    }

    let projectCode = payload.project_code ? String(payload.project_code).trim().toUpperCase() : '';
    if (!projectCode) {
      const year = new Date().getFullYear();
      const existing = this.projectRepo.readAll();
      const nextNum = String(existing.length + 1).padStart(3, '0');
      projectCode = `PRJ-${year}-${nextNum}`;
    } else {
      const duplicate = this.projectRepo.findByCode(projectCode);
      if (duplicate) {
        return Response.error(`Kode proyek ${projectCode} sudah terdaftar`, 'DUPLICATE_CODE');
      }
    }

    const progressVal = payload.progress !== undefined ? Math.min(100, Math.max(0, Number(payload.progress))) : 0;
    const budgetVal = payload.budget !== undefined ? Math.max(0, Number(payload.budget)) : 0;

    const newProject = {
      id: Utils.generateUuid(),
      project_code: projectCode,
      project_name: String(payload.project_name).trim(),
      client_id: String(payload.client_id).trim(),
      project_manager: payload.project_manager ? String(payload.project_manager).trim() : '',
      start_date: payload.start_date ? String(payload.start_date).trim() : '',
      end_date: payload.end_date ? String(payload.end_date).trim() : '',
      budget: budgetVal,
      priority: payload.priority ? String(payload.priority).trim().toUpperCase() : 'MEDIUM',
      status: payload.status ? String(payload.status).trim().toUpperCase() : 'PLANNING',
      progress: progressVal,
      description: payload.description ? String(payload.description).trim() : '',
      created_at: Utils.formatIsoDate(),
      created_by: actorId,
      updated_at: Utils.formatIsoDate(),
      updated_by: actorId
    };

    const inserted = this.projectRepo.insert(newProject, actorId);
    this.auditService.log('PROJECT', 'CREATE', 'SUCCESS', actorId, `Project created: [${newProject.project_code}] ${newProject.project_name}`, inserted.id);

    return Response.success('Data proyek baru berhasil disimpan', inserted, 'PROJECT_CREATE_SUCCESS');
  }

  /**
   * Updates existing project record
   */
  updateProject(id, payload, actorId = 'SYSTEM') {
    if (!id) return Response.error('ID Proyek wajib disertakan', 'VALIDATION_ERROR');

    const existing = this.projectRepo.findById(id);
    if (!existing || String(existing.status).trim().toUpperCase() === 'DELETED') {
      return Response.error('Data proyek tidak ditemukan', 'NOT_FOUND');
    }

    if (payload.project_code) {
      const cleanCode = String(payload.project_code).trim().toUpperCase();
      if (cleanCode !== String(existing.project_code).trim().toUpperCase()) {
        const duplicate = this.projectRepo.findByCode(cleanCode);
        if (duplicate && duplicate.id !== id) {
          return Response.error(`Kode proyek ${cleanCode} sudah digunakan oleh proyek lain`, 'DUPLICATE_CODE');
        }
      }
    }

    const updateData = {};
    if (payload.project_code !== undefined) updateData.project_code = String(payload.project_code).trim().toUpperCase();
    if (payload.project_name !== undefined) updateData.project_name = String(payload.project_name).trim();
    if (payload.client_id !== undefined) updateData.client_id = String(payload.client_id).trim();
    if (payload.project_manager !== undefined) updateData.project_manager = String(payload.project_manager).trim();
    if (payload.start_date !== undefined) updateData.start_date = String(payload.start_date).trim();
    if (payload.end_date !== undefined) updateData.end_date = String(payload.end_date).trim();
    if (payload.budget !== undefined) updateData.budget = Math.max(0, Number(payload.budget));
    if (payload.priority !== undefined) updateData.priority = String(payload.priority).trim().toUpperCase();
    if (payload.status !== undefined) updateData.status = String(payload.status).trim().toUpperCase();
    if (payload.progress !== undefined) updateData.progress = Math.min(100, Math.max(0, Number(payload.progress)));
    if (payload.description !== undefined) updateData.description = String(payload.description).trim();

    this.projectRepo.updateById(id, updateData, actorId);
    this.auditService.log('PROJECT', 'UPDATE', 'SUCCESS', actorId, `Project updated: [${existing.project_code}]`, id, JSON.stringify(existing), JSON.stringify(updateData));

    return Response.success('Data proyek berhasil diperbarui', Object.assign({}, existing, updateData), 'PROJECT_UPDATE_SUCCESS');
  }

  /**
   * Soft deletes project record
   */
  deleteProject(id, actorId = 'SYSTEM') {
    if (!id) return Response.error('ID Proyek wajib disertakan', 'VALIDATION_ERROR');

    const existing = this.projectRepo.findById(id);
    if (!existing || String(existing.status).trim().toUpperCase() === 'DELETED') {
      return Response.error('Data proyek tidak ditemukan', 'NOT_FOUND');
    }

    this.projectRepo.updateById(id, { status: 'DELETED' }, actorId);
    this.auditService.log('PROJECT', 'DELETE', 'SUCCESS', actorId, `Project deleted: [${existing.project_code}] ${existing.project_name}`, id);

    return Response.success('Proyek berhasil dihapus', { id: id }, 'PROJECT_DELETE_SUCCESS');
  }
}
