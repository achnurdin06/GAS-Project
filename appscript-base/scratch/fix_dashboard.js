const fs = require('fs');

let html = fs.readFileSync('src/views/Dashboard.html', 'utf8');

const targetStr = `<!-- 5 SUMMARY CARDS -->
              </div>
            </div>
            <div class="aef-stat-chart-placeholder"><canvas id="spark-menu"></canvas></div>
            <a href="#" onclick="AEF.navigateTo('/menus'); return false;" class="aef-stat-footer text-primary">Kelola Menu <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
        <div class="col">
          <div class="aef-stat-card">
            <div class="aef-stat-top">
              <div class="aef-stat-icon-wrapper bg-success text-white"><i class="bi bi-shield-check"></i></div>
              <div class="aef-stat-val-wrapper">
                <div class="aef-stat-count" id="dash-count-role">0</div>
                <div class="aef-stat-label">Total Role</div>
              </div>
            </div>
            <div class="aef-stat-chart-placeholder"><canvas id="spark-role"></canvas></div>
            <a href="#" onclick="AEF.navigateTo('/roles'); return false;" class="aef-stat-footer text-success">Kelola Role <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
        <div class="col">
          <div class="aef-stat-card">
            <div class="aef-stat-top">
              <div class="aef-stat-icon-wrapper" style="background:#8b5cf6; color:white;"><i class="bi bi-people-fill"></i></div>
              <div class="aef-stat-val-wrapper">
                <div class="aef-stat-count" id="dash-count-user">0</div>
                <div class="aef-stat-label">Total User</div>
              </div>
            </div>
            <div class="aef-stat-chart-placeholder"><canvas id="spark-user"></canvas></div>
            <a href="#" onclick="AEF.navigateTo('/users'); return false;" class="aef-stat-footer" style="color:#8b5cf6;">Kelola User <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
        <div class="col">
          <div class="aef-stat-card">
            <div class="aef-stat-top">
              <div class="aef-stat-icon-wrapper bg-warning text-white"><i class="bi bi-lock-fill"></i></div>
              <div class="aef-stat-val-wrapper">
                <div class="aef-stat-count" id="dash-count-perm">0</div>
                <div class="aef-stat-label">Total Permission</div>
              </div>
            </div>
            <div class="aef-stat-chart-placeholder"><canvas id="spark-perm"></canvas></div>
            <a href="#" onclick="AEF.navigateTo('/permissions'); return false;" class="aef-stat-footer text-warning">Kelola Permission <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
        <div class="col">
          <div class="aef-stat-card">
            <div class="aef-stat-top">
              <div class="aef-stat-icon-wrapper bg-info text-white"><i class="bi bi-clipboard-data-fill"></i></div>
              <div class="aef-stat-val-wrapper">
                <div class="aef-stat-count" id="dash-count-audit">0</div>
                <div class="aef-stat-label">Total Aktivitas</div>
              </div>
            </div>
            <div class="aef-stat-chart-placeholder"><canvas id="spark-audit"></canvas></div>
            <a href="#" onclick="AEF.navigateTo('/audit'); return false;" class="aef-stat-footer text-info">Lihat Audit Trail <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
      </div>`;

const replaceStr = `<!-- 5 SUMMARY CARDS -->
      <div class="aef-stat-grid mb-3">
        <!-- Menu Card -->
        <div class="aef-stat-card">
          <div class="aef-stat-top">
            <div class="aef-stat-icon-wrapper bg-primary text-white"><i class="bi bi-grid-fill"></i></div>
            <div class="aef-stat-val-wrapper">
              <div class="aef-stat-count" id="dash-count-menu">0</div>
              <div class="aef-stat-label">Total Menu</div>
            </div>
          </div>
          <div class="aef-stat-chart-placeholder"><canvas id="spark-menu"></canvas></div>
          <a href="#" onclick="AEF.navigateTo('/menus'); return false;" class="aef-stat-footer text-primary">Kelola Menu <i class="bi bi-arrow-right"></i></a>
        </div>
        <!-- Role Card -->
        <div class="aef-stat-card">
          <div class="aef-stat-top">
            <div class="aef-stat-icon-wrapper bg-success text-white"><i class="bi bi-shield-check"></i></div>
            <div class="aef-stat-val-wrapper">
              <div class="aef-stat-count" id="dash-count-role">0</div>
              <div class="aef-stat-label">Total Role</div>
            </div>
          </div>
          <div class="aef-stat-chart-placeholder"><canvas id="spark-role"></canvas></div>
          <a href="#" onclick="AEF.navigateTo('/roles'); return false;" class="aef-stat-footer text-success">Kelola Role <i class="bi bi-arrow-right"></i></a>
        </div>
        <!-- User Card -->
        <div class="aef-stat-card">
          <div class="aef-stat-top">
            <div class="aef-stat-icon-wrapper" style="background:#8b5cf6; color:white;"><i class="bi bi-people-fill"></i></div>
            <div class="aef-stat-val-wrapper">
              <div class="aef-stat-count" id="dash-count-user">0</div>
              <div class="aef-stat-label">Total User</div>
            </div>
          </div>
          <div class="aef-stat-chart-placeholder"><canvas id="spark-user"></canvas></div>
          <a href="#" onclick="AEF.navigateTo('/users'); return false;" class="aef-stat-footer" style="color:#8b5cf6;">Kelola User <i class="bi bi-arrow-right"></i></a>
        </div>
        <!-- Permission Card -->
        <div class="aef-stat-card">
          <div class="aef-stat-top">
            <div class="aef-stat-icon-wrapper bg-warning text-white"><i class="bi bi-lock-fill"></i></div>
            <div class="aef-stat-val-wrapper">
              <div class="aef-stat-count" id="dash-count-perm">0</div>
              <div class="aef-stat-label">Total Permission</div>
            </div>
          </div>
          <div class="aef-stat-chart-placeholder"><canvas id="spark-perm"></canvas></div>
          <a href="#" onclick="AEF.navigateTo('/permissions'); return false;" class="aef-stat-footer text-warning">Kelola Permission <i class="bi bi-arrow-right"></i></a>
        </div>
        <!-- Audit Card -->
        <div class="aef-stat-card">
          <div class="aef-stat-top">
            <div class="aef-stat-icon-wrapper bg-info text-white"><i class="bi bi-clipboard-data-fill"></i></div>
            <div class="aef-stat-val-wrapper">
              <div class="aef-stat-count" id="dash-count-audit">0</div>
              <div class="aef-stat-label">Total Aktivitas</div>
            </div>
          </div>
          <div class="aef-stat-chart-placeholder"><canvas id="spark-audit"></canvas></div>
          <a href="#" onclick="AEF.navigateTo('/audit'); return false;" class="aef-stat-footer text-info">Lihat Audit Trail <i class="bi bi-arrow-right"></i></a>
        </div>
      </div>`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, replaceStr);
  fs.writeFileSync('src/views/Dashboard.html', html, 'utf8');
  console.log("Fixed dashboard layout!");
} else {
  console.log("Could not find target string.");
}
