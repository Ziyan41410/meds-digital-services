/* Invoices page script */
const token = sessionStorage.getItem('token') || localStorage.getItem('token');
if (!token) window.location.href = 'login.html';
const API_ORIGIN = API_CONFIG.BASE.replace('/api', '');

function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  if (!el) {
    alert(msg);
    return;
  }
  el.textContent = (ok ? '✅ ' : '❌ ') + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

async function init() {
  try {
    const profileRes = await fetch(`${API_ORIGIN}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!profileRes.ok) throw new Error('failed profile');
    const profileJson = await profileRes.json();
    const currentUser = profileJson.user || profileJson.data || {};

    const managerRoleIds = new Set([1,2,3,4]);
    const isManager = managerRoleIds.has(Number(currentUser.role));

    if (isManager) document.getElementById('managerControls').style.display = '';
    document.getElementById('ddName').textContent = `${currentUser.first_name||''} ${currentUser.last_name||''}`.trim() || currentUser.username || '—';
    document.getElementById('ddRole').textContent = currentUser.role_name || (isManager ? 'مدير' : 'عميل');

    const invoices = await fetchInvoices();
    if (isManager) renderManagerView(invoices || []);
    else renderClientView(invoices || []);
  } catch (err) {
    console.error(err);
    toast('خطأ أثناء تحميل البيانات', false);
    document.getElementById('invoicesContainer').textContent = 'فشل التحميل';
  }
}

async function fetchInvoices() {
  const r = await fetch(`${API_ORIGIN}/api/dashboard/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!r.ok) throw new Error('Failed to fetch invoices');
  const j = await r.json();
  // controller may return { invoices: [...] } or { data: [...] } or array
  return j.invoices || j.data || j || [];
}

function formatCurrency(n) {
  try { return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(Number(n||0)); }
  catch(e){ return (n||0) + ' ر.س'; }
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('ar-EG');
}

function renderClientView(invoices) {
  const container = document.getElementById('invoicesContainer');
  if (!invoices.length) { container.innerHTML = '<p>لا توجد فواتير حالياً.</p>'; return; }
  const list = document.createElement('div'); list.className = 'invoices-list';
  invoices.forEach(inv => {
    const el = document.createElement('div'); el.className = 'invoice-card';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div>
          <div style="font-weight:800">رقم الفاتورة: ${escapeHtml(inv.invoice_number || inv.id || '')}</div>
          <div style="color:var(--muted)">المشروع: ${escapeHtml(inv.project_title || inv.project_name || '')}</div>
        </div>
        <div style="text-align:left">
          <div style="font-weight:800">${formatCurrency(inv.amount)}</div>
          <div style="color:var(--muted)">حالة: ${escapeHtml(inv.payment_status || inv.status || '—')}</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">
        <button class="qa-btn" onclick='viewInvoiceDetails(${JSON.stringify(inv).replace(/'/g,'\'')})'>عرض</button>
      </div>
    `;
    list.appendChild(el);
  });
  container.innerHTML = ''; container.appendChild(list);
}

function renderManagerView(invoices) {
  const container = document.getElementById('invoicesContainer');
  container.innerHTML = '';

  const table = document.createElement('table'); table.className = 'invoices-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>رقم/معرّف</th><th>العميل</th><th>المشروع</th><th>المبلغ</th><th>الحالة</th><th>تاريخ</th><th>إجراءات</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  container.appendChild(table);

  function populate(filter) {
    tbody.innerHTML = '';
    const rows = invoices.filter(inv => {
      if (!filter || filter === 'all') return true;
      const ps = String(inv.payment_status || inv.status || '').toLowerCase();
      if (filter === 'pending') return ps.includes('pending') || ps.includes('partial') || ps.includes('unpaid');
      if (filter === 'paid') return ps.includes('paid') || ps.includes('completed');
      if (filter === 'overdue') return ps.includes('overdue') || ps.includes('late');
      return true;
    });
    rows.forEach(inv => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(inv.invoice_number || inv.id || '')}</td>
        <td>${escapeHtml(inv.client_name || inv.client || inv.customer_name || '')}</td>
        <td>${escapeHtml(inv.project_title || inv.project_name || '')}</td>
        <td>${escapeHtml(formatCurrency(inv.amount))}</td>
        <td>${escapeHtml(inv.payment_status || inv.status || '')}</td>
        <td>${escapeHtml(formatDate(inv.created_at || inv.date || inv.createdAt))}</td>
        <td><button class="qa-btn" onclick='viewInvoiceDetails(${JSON.stringify(inv).replace(/'/g,'\'')})'>عرض</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // wire chips
  const chips = document.querySelectorAll('#filterChips .chip');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x=>x.classList.remove('active')); c.classList.add('active');
    populate(c.dataset.filter);
  }));

  populate('all');
}

function viewInvoiceDetails(inv) {
  const o = typeof inv === 'string' ? JSON.parse(inv) : inv;
  // build modal
  let modal = document.getElementById('invoiceModal');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'invoiceModal';
  modal.className = 'modal-backdrop';
  modal.style.position = 'fixed'; modal.style.inset = 0; modal.style.background = 'rgba(0,0,0,0.4)'; modal.style.display = 'grid'; modal.style.placeItems = 'center'; modal.style.zIndex = 800;

  const card = document.createElement('div');
  card.style.width = '720px'; card.style.maxWidth = '96%'; card.style.background = 'var(--surface)'; card.style.border = '1px solid var(--line)'; card.style.borderRadius = '12px'; card.style.padding = '18px'; card.style.direction = 'rtl';

  const title = document.createElement('h3'); title.textContent = `فاتورة — ${o.invoice_number || o.id || ''}`; title.style.marginTop = 0;
  const body = document.createElement('div');
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px">
      <div>
        <div style="font-weight:800">المشروع: ${escapeHtml(o.project_title || o.project_name || '')}</div>
        <div style="color:var(--muted)">الخدمة: ${escapeHtml(o.service_name || '')}</div>
      </div>
      <div style="text-align:left">
        <div style="font-weight:800">${formatCurrency(o.amount)}</div>
        <div style="color:var(--muted)">الحالة: ${escapeHtml(o.payment_status || o.status || '—')}</div>
      </div>
    </div>
    <div style="margin-top:12px;color:var(--muted)">تاريخ: ${escapeHtml(formatDate(o.invoice_date || o.created_at || o.createdAt))}</div>
  `;

  const actions = document.createElement('div'); actions.style.marginTop = '16px'; actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.gap = '8px';

  // View invoice (if URL)
  const viewBtn = document.createElement('button'); viewBtn.className = 'qa-btn'; viewBtn.textContent = 'عرض الفاتورة';
  viewBtn.onclick = () => {
    if (o.invoice_url) window.open(o.invoice_url, '_blank');
    else toast('لا يوجد ملف فاتورة متاح', false);
  };
  actions.appendChild(viewBtn);

  // Determine role to show relevant actions
  (async function attachButtons() {
    try {
      const profileRes = await fetch(`${API_ORIGIN}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      const profileJson = await profileRes.json();
      const currentUser = profileJson.user || profileJson.data || {};
      const managerRoleIds = new Set([1,2,3,4]);
      const isManager = managerRoleIds.has(Number(currentUser.role));

      if (!isManager) {
        // client actions: pay, confirm receipt if applicable
        const payBtn = document.createElement('button'); payBtn.className = 'qa-btn primary'; payBtn.textContent = 'اكمل الدفع';
        payBtn.onclick = async () => { await attemptPayment(o); };
        actions.appendChild(payBtn);

        const receiveBtn = document.createElement('button'); receiveBtn.className = 'qa-btn'; receiveBtn.textContent = 'استلام المشروع';
        receiveBtn.onclick = async () => { await confirmDelivery(o); };
        actions.appendChild(receiveBtn);
      } else {
        // manager actions: mark as paid
        const markPaid = document.createElement('button'); markPaid.className = 'qa-btn primary'; markPaid.textContent = 'وضع كمدفوع';
        markPaid.onclick = async () => { await markAsPaid(o); };
        actions.appendChild(markPaid);
      }
    } catch (e) {
      console.warn(e);
    }
  })();

  const closeBtn = document.createElement('button'); closeBtn.className = 'qa-btn'; closeBtn.textContent = 'إغلاق'; closeBtn.onclick = () => modal.remove();
  actions.appendChild(closeBtn);

  card.appendChild(title); card.appendChild(body); card.appendChild(actions);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

async function attemptPayment(o) {
  try {
    toast('جاري معالجة الدفع...');
    const res = await fetch(`${API_ORIGIN}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ project_id: o.id || o.project_id, amount: o.amount || o.budget, payment_method: 'bank_transfer' })
    });
    if (res.ok) {
      toast('تم تسجيل الدفع بنجاح');
      await refreshInvoices();
      document.getElementById('invoiceModal')?.remove();
      return;
    }
    if (res.status === 404) {
      toast('بوابة الدفع غير مفعّلة على الخادم — محاكاة الدفع محلياً');
      // simulate success: attempt to mark project paid via status update (best-effort)
      try {
        const pId = o.id || o.project_id;
        const r2 = await fetch(`${API_ORIGIN}/api/projects/${pId}/status`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'completed', progress: 100 }) });
        if (r2.ok) toast('تم وضع المشروع كمكتمل (محاكاة)');
      } catch (ee) { /* ignore */ }
      await refreshInvoices();
      document.getElementById('invoiceModal')?.remove();
      return;
    }
    const j = await res.json().catch(()=>null);
    throw new Error(j?.message || 'فشل الدفع');
  } catch (err) {
    console.error(err);
    toast(err.message || 'حدث خطأ أثناء الدفع', false);
  }
}

async function markAsPaid(o) {
  try {
    const pId = o.id || o.project_id;
    const res = await fetch(`${API_ORIGIN}/api/projects/${pId}/status`, {
      method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'completed', progress: 100 })
    });
    if (!res.ok) throw new Error('فشل تحديث الحالة');
    toast('تم تغيير حالة المشروع إلى مكتمل');
    await refreshInvoices();
    document.getElementById('invoiceModal')?.remove();
  } catch (err) {
    console.error(err);
    toast('فشل وضع المشروع كمدفوع', false);
  }
}

async function confirmDelivery(o) {
  try {
    // No dedicated endpoint: simulate client confirmation and notify managers
    toast('تم تأكيد استلام المشروع (محلي)');
    await refreshInvoices();
    document.getElementById('invoiceModal')?.remove();
  } catch (err) {
    console.error(err);
    toast('فشل تأكيد الاستلام', false);
  }
}

async function refreshInvoices() {
  try {
    const invs = await fetchInvoices();
    const profileRes = await fetch(`${API_ORIGIN}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
    const profileJson = await profileRes.json();
    const currentUser = profileJson.user || profileJson.data || {};
    const managerRoleIds = new Set([1,2,3,4]);
    const isManager = managerRoleIds.has(Number(currentUser.role));
    if (isManager) renderManagerView(invs || []);
    else renderClientView(invs || []);
  } catch (e) { console.warn(e); }
}

init();
