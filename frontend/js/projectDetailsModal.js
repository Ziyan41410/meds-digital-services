// دالة لعرض تفاصيل المشروع
async function showProjectDetails(projectId) {
  // تأكد من وجود المتغيرات الضرورية
  if (typeof token === 'undefined') {
    alert('لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.');
    return;
  }
  
  if (typeof domainIcon === 'undefined') {
    domainIcon = { dev:'💻', mkt:'📣', sec:'🔒' };
  }
  
  if (typeof STATUS_MAP === 'undefined') {
    STATUS_MAP = {
      'pending': { label: 'معلق', cls: 'badge-pending' },
      'in_progress': { label: 'قيد التنفيذ', cls: 'badge-in-progress' },
      'completed': { label: 'مكتمل', cls: 'badge-completed' },
      'cancelled': { label: 'ملغى', cls: 'badge-cancelled' },
      'on_hold': { label: 'مؤجل', cls: 'badge-on-hold' }
    };
  }
  
  if (typeof getProgressColor === 'undefined') {
    getProgressColor = function(pct, isLate) {
      if (isLate) return '#e74c3c';
      if (pct < 30) return '#e74c3c';
      if (pct < 70) return '#f39c12';
      return '#27ae60';
    };
  }

  function getProjectProgress(project) {
    const raw = project?.progress;
    const pct = Number.isFinite(Number(raw)) ? Number(raw) : 0;
    if (project?.status === 'completed' && pct < 100) return 100;
    return Math.min(Math.max(pct, 0), 100);
  }

  try {
    // جلب تفاصيل المشروع من الخادم - استخدم API_CONFIG
    const apiBaseUrl = API_CONFIG.BASE;

    const response = await fetch(`${apiBaseUrl}/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('فشل جلب تفاصيل المشروع');
    }

    const result = await response.json();
    const project = result.data;
    const pct = getProjectProgress(project);

    // إنشاء نافذة تفاصيل المشروع
    const modal = document.createElement('div');
    modal.className = 'sr-overlay open';
    modal.innerHTML = `
      <div class="sr-modal">
        <div class="sr-header">
          <div class="sr-header-left">
            <div class="sr-header-icon">${domainIcon[project.domain] || '📌'}</div>
            <div>
              <h3>${project.title || '�'}</h3>
              <p>${project.service_name || ''}</p>
            </div>
          </div>
          <button class="sr-close" onclick="this.closest('.sr-overlay').remove()">�</button>
        </div>
        <div class="sr-content">
          <div class="proj-details">
            <div class="detail-row">
              <span class="detail-label">الحالة:</span>
              <span class="status-badge ${STATUS_MAP[project.status]?.cls || 'badge-pending'}">${STATUS_MAP[project.status]?.label || project.status}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">التقدم:</span>
              <div class="progress-container">
                <div class="progress-bar" style="width: ${pct}%; background: ${getProgressColor(pct)};"></div>
                <span class="progress-text">${pct}%</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">الوصف:</span>
              <p class="detail-value">${project.description || '�'}</p>
            </div>
            ${project.budget ? `<div class="detail-row"><span class="detail-label">الميزانية:</span><p class="detail-value">${Number(project.budget).toLocaleString('ar-DZ')} دج</p></div>` : ''}
            ${project.timeline_days ? `<div class="detail-row"><span class="detail-label">مدة المشروع:</span><p class="detail-value">${project.timeline_days} يوم</p></div>` : ''}
            ${project.end_date ? `<div class="detail-row"><span class="detail-label">تاريخ الانتهاء:</span><p class="detail-value">${new Date(project.end_date).toLocaleDateString('ar-DZ')}</p></div>` : ''}
            ${project.notes ? `<div class="detail-row"><span class="detail-label">ملاحظات:</span><p class="detail-value">${project.notes}</p></div>` : ''}
            <div class="detail-row">
              <span class="detail-label">تفاصيل إضافية:</span>
              <div class="detail-tags">
                ${getDomainDetails(project)}
              </div>
            </div>
          </div>
        </div>
        <div class="sr-footer">
          <button class="qa-btn secondary" onclick="this.closest('.sr-overlay').remove()">إغلاق</button>
        </div>
      </div>
    `;

    // إضافة النافذة إلى الصفحة
    document.body.appendChild(modal);

    // إضافة معالج النقر خارج النافذة لإغلاقها
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('Error showing project details:', error);
    alert(`فشل عرض تفاصيل المشروع: ${error.message}`);
  }
}
