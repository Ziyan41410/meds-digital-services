(() => {
  // ✅ إصلاح مشكلة CORS - استخدم الرابط الصحيح للخادم
  const API_ORIGIN = window.API_ORIGIN || 
    (window.location.origin === 'https://meds-digital-services.onrender.com' 
      ? 'https://meds-digital-services-api.onrender.com' // استبدل برابط خادمك الفعلي على Render
      : window.location.origin);

  const token = sessionStorage.getItem('authToken')
    || sessionStorage.getItem('token')
    || localStorage.getItem('authToken')
    || localStorage.getItem('token');
  let currentUser = JSON.parse(
    sessionStorage.getItem('user')
      || sessionStorage.getItem('userData')
      || localStorage.getItem('user')
      || localStorage.getItem('userData')
      || '{}'
  );
  const LAST_CHAT_KEY = 'meds:lastOpenChatId';

  const state = {
    chats: [],
    currentChatId: null,
    currentProjectId: null,
    messages: [],
    participants: [],
    editingMessageId: null
  };

  let longPressTimer = null;

  const el = {
    chatsList: document.getElementById('chatsList'),
    searchInput: document.getElementById('searchInput'),
    refreshChats: document.getElementById('refreshChats'),
    toggleChats: document.getElementById('toggleChats'),
    chatListPanel: document.querySelector('.chat-list-panel'),
    actionMenuBtn: document.getElementById('actionMenuBtn'),
    actionMenu: document.getElementById('actionMenu'),
    toggleInfo: document.getElementById('toggleInfo'),
    closeInfo: document.getElementById('closeInfo'),
    infoPanel: document.getElementById('chatInfoPanel'),
    infoContent: document.getElementById('infoContent'),
    chatTitle: document.getElementById('chatTitle'),
    chatSubtitle: document.getElementById('chatSubtitle'),
    roomBadge: document.getElementById('roomBadge'),
    messages: document.getElementById('messagesContainer'),
    form: document.getElementById('messageForm'),
    input: document.getElementById('messageInput'),
    fileInput: document.getElementById('fileInput'),
    selectedFiles: document.getElementById('selectedFiles'),
    btnSend: document.getElementById('btnSend'),
    backDashboard: document.getElementById('backDashboard'),
    toast: document.getElementById('toast'),
    recordAudioBtn: document.getElementById('recordAudioBtn')
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const dataOf = (payload) => payload?.data ?? payload;

  function toast(message, isError = false) {
    el.toast.textContent = message;
    el.toast.classList.toggle('error', isError);
    el.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2800);
  }

  function fullName(user) {
    return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'مستخدم';
  }

  function updateCurrentUser(user) {
    if (!user || !user.id) return;
    currentUser = { ...currentUser, ...user };
    sessionStorage.setItem('user', JSON.stringify(currentUser));
  }

  function initials(name) {
    return String(name || 'M').trim().slice(0, 2).toUpperCase();
  }

  function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function formatDateLabel(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
                      'جويليه', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthsAr[date.getMonth()];
    return `${day} ${month}`;
  }

  function getMessageDateKey(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  async function request(path, options = {}) {
    if (!token) {
      window.location.href = 'login.html';
      throw new Error('يجب تسجيل الدخول');
    }

    const headers = {
      ...authHeaders(),
      ...(options.headers || {})
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_ORIGIN}${path}`, {
      ...options,
      headers
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 429) {
        const msg = payload.message || 'تم إرسال الكثير من الطلبات. الرجاء الانتظار قليلاً ثم المحاولة مرة أخرى.';
        const err = new Error(msg);
        err.status = 429;
        throw err;
      }
      throw new Error(payload.message || payload.error || 'تعذر تنفيذ الطلب');
    }
    return dataOf(payload);
  }

  async function loadCurrentUser() {
    const profile = await request('/api/auth/me');
    updateCurrentUser(profile.user || profile.data || profile);
  }

  function filteredChats() {
    const term = el.searchInput.value.trim().toLowerCase();
    if (!term) return state.chats;
    return state.chats.filter((chat) => {
      const haystack = [
        chat.name,
        chat.description,
        chat.last_message,
        chat.project_id
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  function renderChats() {
    const chats = filteredChats();
    if (!chats.length) {
      el.chatsList.innerHTML = '<div class="empty-state small">لا توجد محادثات مرتبطة بمشاريعك بعد.</div>';
      return;
    }

    el.chatsList.innerHTML = chats.map((chat) => {
      const active = Number(chat.id) === Number(state.currentChatId) ? ' active' : '';
      const unread = Number(chat.unread_count || 0);
      return `
        <div class="chat-item-wrapper${active}" data-chat-id="${chat.id}">
          <button class="chat-item-dots" type="button" data-chat-id="${chat.id}" aria-haspopup="true" aria-expanded="false">⋯</button>
          <div class="chat-item-menu" data-chat-id="${chat.id}" aria-hidden="true">
            <button class="menu-item chat-item-delete" data-action="delete-chat" data-chat-id="${chat.id}" title="حذف هذه المحادثة">
              <span class="menu-icon">🗑️</span>
              <span>حذف</span>
            </button>
          </div>
          <button class="chat-item" type="button" data-chat-id="${chat.id}">
            <span class="chat-avatar">${initials(chat.name)}</span>
            <span>
              <h3>${escapeHtml(chat.name || 'محادثة مشروع')}</h3>
              <span class="chat-preview">${escapeHtml(chat.last_message || chat.description || 'محادثة خدمة مباشرة')}</span>
              <span class="chat-meta">
                <span>${chat.project_id ? `مشروع #${chat.project_id}` : 'عام'}</span>
                <span>${unread ? `<b class="unread-count">${unread}</b>` : formatTime(chat.last_message_at || chat.created_at)}</span>
              </span>
            </span>
          </button>
        </div>
      `;
    }).join('');
  }

  function renderMessages() {
    if (!state.currentChatId) {
      el.messages.innerHTML = `
        <div class="empty-state">
          <strong>لا توجد محادثة محددة</strong>
          <span>اختر محادثة مشروع من القائمة للمتابعة.</span>
        </div>
      `;
      return;
    }

    if (!state.messages.length) {
      el.messages.innerHTML = `
        <div class="empty-state">
          <strong>ابدأ المحادثة</strong>
         
        </div>
      `;
      return;
    }

    const currentUserId = Number(currentUser.id || currentUser.userId);
    let lastDateKey = '';
    const items = [];

    state.messages.forEach((message) => {
      const messageDateKey = getMessageDateKey(message.created_at);
      if (messageDateKey && messageDateKey !== lastDateKey) {
        items.push(`
          <div class="date-separator">${escapeHtml(formatDateLabel(message.created_at))}
          <hr>
          </div>
        `);
        lastDateKey = messageDateKey;
      }

      const mine = Number(message.sender_id) === currentUserId ? ' mine' : '';
      const sender = message.sender_name || fullName(message);
      const isDeleted = message.deleted_at;
      const isEdited = message.edited_at;
      const isOwner = Number(message.sender_id) === currentUserId;
      const hasText = !!message.content?.trim();
      
      let actionsHtml = '';
      if (isOwner && !isDeleted) {
        actionsHtml = `
          <div class="message-actions">
            ${hasText ? `<button class="msg-action-btn edit-btn" title="تعديل" data-action="edit" data-message-id="${message.id}">✎</button>` : ''}
            <button class="msg-action-btn delete-btn" title="حذف" data-action="delete" data-message-id="${message.id}">🗑</button>
          </div>
        `;
      }
      
      const editedLabel = isEdited ? '<span class="edited-label">(معدل)</span>' : '';
      const deletedContent = isDeleted ? '<em class="deleted-message">تم حذف هذه الرسالة</em>' : escapeHtml(message.content || '');
      const attachmentsHtml = !isDeleted ? renderAttachments(message.attachments) : '';
      
      items.push(`
        <article class="message${mine}" data-message-id="${message.id}">
          <div class="message-meta">
            <strong>${escapeHtml(sender)}</strong>
            <span>${formatTime(message.created_at)}</span>
            ${editedLabel}
          </div>
          <div class="message-content">
            <div class="message-bubble">${deletedContent}</div>
            ${attachmentsHtml}
            ${actionsHtml}
          </div>
        </article>
      `);
    });

    el.messages.innerHTML = items.join('');
    el.messages.scrollTop = el.messages.scrollHeight;
  }

  function bindMessageActions() {
    // Event delegation for message actions
    el.messages.addEventListener('click', (event) => {
      const editBtn = event.target.closest('[data-action="edit"]');
      const deleteBtn = event.target.closest('[data-action="delete"]');

      if (editBtn) {
        const messageId = editBtn.dataset.messageId;
        console.log('Edit button clicked for message:', messageId);
        showEditMessageDialog(messageId);
      }

      if (deleteBtn) {
        const messageId = deleteBtn.dataset.messageId;
        console.log('Delete button clicked for message:', messageId);
        showDeleteConfirmDialog(messageId);
      }
    }, false);

    // Per-item delete button removed: use header action menu `deleteCurrentChat` instead
  }

  function renderInfo() {
    if (!state.currentChatId) {
      el.infoContent.innerHTML = '<div class="empty-state small">اختر محادثة لعرض المشاركين.</div>';
      return;
    }

    const chat = state.chats.find((item) => Number(item.id) === Number(state.currentChatId));
    const participants = state.participants.map((participant) => {
      const name = fullName(participant);
      return `
        <div class="participant">
          <span class="participant-avatar">${initials(name)}</span>
          <span>
            <strong>${escapeHtml(name)}</strong>
            <span>${roleLabel(participant.role)}</span>
          </span>
        </div>
      `;
    }).join('');

    el.infoContent.innerHTML = `
      <section class="info-card">
        <h3>${escapeHtml(chat?.name || 'محادثة')}</h3>
        <p class="chat-meta">${chat?.project_id ? `مشروع #${chat.project_id}` : 'محادثة عامة'}</p>
      </section>
      <section class="info-card">
        <h3>أعضاء المحادثة</h3>
        ${participants || '<div class="empty-state small">لا توجد بيانات مشاركين.</div>'}
      </section>
    `;
  }

  function roleLabel(role) {
    const labels = {
      owner: 'العميل',
      admin: 'المدير الرئيسي',
      moderator: 'مشرف',
      member: 'مدير الخدمة'
    };
    return labels[role] || role || 'عضو';
  }

  function setCurrentChat(chat) {
    state.currentChatId = chat?.id || null;
    state.currentProjectId = chat?.project_id || null;
    if (chat?.id) localStorage.setItem(LAST_CHAT_KEY, String(chat.id));
    el.chatTitle.textContent = chat?.name || 'اختر محادثة';
    el.chatSubtitle.textContent = chat?.description || 'تظهر هنا محادثات المشاريع بين العميل، مدير الخدمة، والمدير الرئيسي.';
    el.roomBadge.textContent = chat?.project_id ? `مشروع #${chat.project_id}` : 'خدمة';
    el.input.disabled = !chat;
    el.fileInput.disabled = !chat;
    el.btnSend.disabled = !chat;
    renderChats();
  }

  async function loadChats() {
    const params = new URLSearchParams(window.location.search);
    const queryParts = [];
    if (params.get('participant')) {
      queryParts.push(`participantId=${encodeURIComponent(params.get('participant'))}`);
    }
    if (params.get('project')) {
      queryParts.push(`project=${encodeURIComponent(params.get('project'))}`);
    }
    const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
    const chats = await request(`/api/chats${queryString}`);
    state.chats = Array.isArray(chats) ? chats : [];
    if (state.currentChatId) {
      const current = state.chats.find((item) => Number(item.id) === Number(state.currentChatId));
      if (current) setCurrentChat(current);
    }
    renderChats();
    return state.chats;
  }

  async function refreshVisibleChat() {
    await loadChats();
    const savedChatId = localStorage.getItem(LAST_CHAT_KEY);
    const target = state.currentChatId || savedChatId || state.chats[0]?.id;
    if (target) {
      await openChat(target);
    } else {
      renderMessages();
      renderInfo();
    }
  }

  async function openChat(chatId) {
    const chat = state.chats.find((item) => Number(item.id) === Number(chatId));
    if (!chat) {
      localStorage.removeItem(LAST_CHAT_KEY);
      try {
        const chatDetail = await request(`/api/chats/${chatId}`);
        if (chatDetail?.id) {
          const normalizedChat = {
            id: chatDetail.id,
            project_id: chatDetail.project_id,
            type: chatDetail.type,
            name: chatDetail.name,
            description: chatDetail.description,
            avatar: chatDetail.avatar,
            created_by: chatDetail.created_by,
            is_archived: chatDetail.is_archived,
            is_pinned: chatDetail.is_pinned,
            last_message_at: chatDetail.last_message_at,
            created_at: chatDetail.created_at,
            unread_count: chatDetail.unread_count || 0
          };
          state.chats.unshift(normalizedChat);
          await openChat(normalizedChat.id);
          return;
        }
      } catch (error) {
        console.warn('Unable to fetch missing chat by id:', error);
        if (String(error.message).includes('صلاحية') || String(error.message).includes('غير مصرح')) {
          try {
            await request(`/api/chats/${chatId}/join`, { method: 'POST' });
            await loadChats();
            await openChat(chatId);
            return;
          } catch (joinError) {
            console.warn('Unable to join hidden chat:', joinError);
          }
        }
      }

      if (state.chats[0]?.id && Number(state.chats[0].id) !== Number(chatId)) {
        await openChat(state.chats[0].id);
      }
      return;
    }

    setCurrentChat(chat);
    if (socket && socket.connected) {
      socketJoin(chat.id);
    } else {
      initSocket();
    }

    const [messages, participants] = await Promise.all([
      request(`/api/chats/${chat.id}/messages`),
      request(`/api/chats/${chat.id}/participants`)
    ]);
    state.messages = Array.isArray(messages)
      ? messages
      : (Array.isArray(messages?.messages) ? messages.messages : []);
    state.participants = Array.isArray(participants) ? participants : [];
    renderMessages();
    renderInfo();
    el.chatListPanel.classList.remove('open');
  }

  async function openProjectChat(projectId) {
    const result = await request(`/api/chats/projects/${projectId}/start`, { method: 'POST' });
    await loadChats();
    const chatId = result.chatId || result.id;
    if (!chatId) return;

    const chat = state.chats.find((item) => Number(item.id) === Number(chatId));
    if (chat) {
      await openChat(chat.id);
      return;
    }

    await openChat(chatId);
  }

  async function sendMessage(content, files = []) {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (files.length) {
      files.forEach((file) => formData.append('files', file));
    }

    const message = await request(`/api/chats/${state.currentChatId}/messages`, {
      method: 'POST',
      body: formData
    });
    appendMessage(message);
    el.input.value = '';
    clearSelectedFiles();
    await loadChats();
  }

  async function deleteAllChats() {
    const confirmed = window.confirm('هل أنت متأكد من حذف جميع المحادثات؟ هذا الإجراء لا يمكن التراجع عنه.');
    if (!confirmed) return;
    await request('/api/chats/delete-all', { method: 'DELETE' });
    state.chats = [];
    state.currentChatId = null;
    state.messages = [];
    state.participants = [];
    renderChats();
    renderMessages();
    renderInfo();
    toast('تم حذف جميع المحادثات بنجاح');
  }

  async function deleteCurrentChat() {
    if (!state.currentChatId) {
      toast('لا توجد محادثة حالية للحذف', true);
      return;
    }

    const confirmed = window.confirm('هل أنت متأكد من مسح محتوى هذه المحادثة من العرض؟');
    if (!confirmed) return;

    await request(`/api/chats/${state.currentChatId}`, { method: 'DELETE' });
    state.currentChatId = null;
    state.messages = [];
    state.participants = [];
    renderChats();
    renderMessages();
    renderInfo();
    toast('تم مسح محتوى المحادثة محليًا بنجاح');
  }

  async function editMessage(messageId, newContent) {
    const message = state.messages.find((m) => Number(m.id) === Number(messageId));
    if (!message) {
      const err = new Error('الرسالة غير موجودة');
      toast(err.message, true);
      throw err;
    }

    if (Number(message.sender_id) !== Number(currentUser.id || currentUser.userId)) {
      const err = new Error('لا يمكنك تعديل رسالة شخص آخر');
      toast(err.message, true);
      throw err;
    }

    try {
      const result = await request(`/api/chats/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: newContent })
      });
      console.log('✅ Message edited successfully:', result);

      message.content = newContent;
      message.edited_at = new Date().toISOString();
      renderMessages();
      toast('تم تعديل الرسالة بنجاح');
      
      // Emit socket event for real-time update
      if (socket && socket.connected) {
        socket.emit('edit_message', {
          messageId,
          content: newContent,
          chatId: state.currentChatId
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  }

  async function deleteMessage(messageId) {
    const message = state.messages.find((m) => Number(m.id) === Number(messageId));
    if (!message) {
      const err = new Error('الرسالة غير موجودة');
      toast(err.message, true);
      throw err;
    }

    if (Number(message.sender_id) !== Number(currentUser.id || currentUser.userId)) {
      const err = new Error('لا يمكنك حذف رسالة شخص آخر');
      toast(err.message, true);
      throw err;
    }

    try {
      await request(`/api/chats/messages/${messageId}`, {
        method: 'DELETE'
      });
      console.log('✅ Message deleted successfully:', messageId);

      message.deleted_at = new Date().toISOString();
      renderMessages();
      toast('تم حذف الرسالة بنجاح');
      
      // Emit socket event for real-time update
      if (socket && socket.connected) {
        socket.emit('delete_message', {
          messageId,
          chatId: state.currentChatId
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  function showDeleteConfirmDialog(messageId) {
    const message = state.messages.find((m) => Number(m.id) === Number(messageId));
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }

    console.log('Opening delete confirmation dialog for message:', messageId);

    // Create modal structure
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-danger';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = '<h3>تأكيد حذف الرسالة</h3><button class="modal-close" type="button">×</button>';

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = '<p>هل أنت متأكد من رغبتك في حذف هذه الرسالة؟</p><p class="warning-text">لا يمكن التراجع عن هذا الإجراء.</p>';

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'إلغاء';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'حذف الرسالة';

    footer.appendChild(cancelBtn);
    footer.appendChild(deleteBtn);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    document.body.appendChild(overlay);

    const closeBtn = header.querySelector('.modal-close');

    console.log('Delete confirmation modal created');

    const closeModal = () => {
      console.log('Closing delete confirmation modal');
      overlay.remove();
    };

    const handleDelete = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Delete confirmed for message:', messageId);
      
      deleteBtn.disabled = true;
      try {
        await deleteMessage(messageId);
        closeModal();
      } catch (error) {
        console.error('Delete error:', error);
        toast(error.message || 'حدث خطأ في حذف الرسالة', true);
        deleteBtn.disabled = false;
      }
    };

    const handleCancel = (e) => {
      console.log('Delete cancelled');
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };

    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };

    console.log('Binding delete confirmation event listeners...');
    deleteBtn.addEventListener('click', handleDelete);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleClose);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('Overlay clicked');
        closeModal();
      }
    });
  }

  function showEditMessageDialog(messageId) {
    const message = state.messages.find((m) => Number(m.id) === Number(messageId));
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }

    console.log('Opening edit dialog for message:', messageId);
    
    const currentContent = message.content || '';

    // Create modal structure
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<h3>تعديل الرسالة</h3><button class="modal-close" type="button">×</button>`;

    const body = document.createElement('div');
    body.className = 'modal-body';

    const textarea = document.createElement('textarea');
    textarea.className = 'edit-textarea';
    textarea.rows = 5;
    textarea.value = currentContent;
    body.appendChild(textarea);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'إلغاء';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.type = 'button';
    saveBtn.textContent = 'حفظ التعديل';

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    document.body.appendChild(overlay);

    const closeBtn = header.querySelector('.modal-close');
    const input = textarea;

    console.log('Modal created with elements:', { overlay, dialog, textarea, saveBtn, cancelBtn, closeBtn });

    const closeModal = () => {
      console.log('Closing modal');
      overlay.remove();
      state.editingMessageId = null;
    };

    const handleSave = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Save button clicked');
      
      const newContent = input.value.trim();
      if (!newContent) {
        toast('محتوى الرسالة لا يمكن أن يكون فارغا', true);
        return;
      }
      
      saveBtn.disabled = true;
      try {
        await editMessage(messageId, newContent);
        closeModal();
      } catch (error) {
        console.error('Save error:', error);
        toast(error.message || 'حدث خطأ في تعديل الرسالة', true);
        saveBtn.disabled = false;
      }
    };

    const handleCancel = (e) => {
      console.log('Cancel button clicked');
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };

    const handleClose = (e) => {
      console.log('Close button clicked');
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };

    console.log('Binding event listeners...');
    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleClose);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('Overlay clicked');
        closeModal();
      }
    });

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);

    state.editingMessageId = messageId;
  }

  function appendMessage(message) {
    if (!message || Number(message.chat_id) !== Number(state.currentChatId)) return;
    if (state.messages.some((item) => Number(item.id) === Number(message.id))) return;
    state.messages.push(message);
    renderMessages();
  }

  function formatAttachment(attachment) {
    const rawUrl = attachment.url || attachment.file_url || '';
    const url = rawUrl.startsWith('/') ? `${API_ORIGIN}${rawUrl}` : rawUrl;
    const name = attachment.name || attachment.file_name || 'ملف';
    const type = attachment.type || '';
    const mimeType = attachment.mimeType || attachment.mime_type || '';

    const isImage = mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].some((ext) => name.toLowerCase().endsWith(ext));
    if (isImage) {
      return `
        <button class="attachment-preview" type="button" data-full-url="${escapeHtml(url)}" data-file-name="${escapeHtml(name)}">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">
          <span class="attachment-label">
            <span class="attachment-name">${escapeHtml(name)}</span>
            <span class="attachment-meta">${escapeHtml(type || mimeType || 'صورة')}</span>
          </span>
        </button>
      `;
    }

    return `
      <a class="attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener" download="${escapeHtml(name)}">
        <span>${escapeHtml(name)}</span>
      </a>
    `;
  }

  function renderAttachments(attachments) {
    if (!Array.isArray(attachments) || attachments.length === 0) return '';
    return `<div class="message-attachments">${attachments.map(formatAttachment).join('')}</div>`;
  }

  function formatAudioAttachment(attachment) {
    const rawUrl = attachment.url || attachment.file_url || '';
    const url = rawUrl.startsWith('/') ? `${API_ORIGIN}${rawUrl}` : rawUrl;
    return `
      <div class="attachment-audio">
        <strong>${escapeHtml(attachment.name || 'ملف صوتي')}</strong>
        <audio controls src="${escapeHtml(url)}"></audio>
      </div>
    `;
  }

  function formatAttachment(attachment) {
    const rawUrl = attachment.url || attachment.file_url || '';
    const url = rawUrl.startsWith('/') ? `${API_ORIGIN}${rawUrl}` : rawUrl;
    const name = attachment.name || attachment.file_name || 'ملف';
    const type = attachment.type || '';
    const mimeType = attachment.mimeType || attachment.mime_type || '';

    if (mimeType.startsWith('audio/')) {
      return formatAudioAttachment(attachment);
    }

    const isImage = mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].some((ext) => name.toLowerCase().endsWith(ext));
    if (isImage) {
      return `
        <button class="attachment-preview" type="button" data-full-url="${escapeHtml(url)}" data-file-name="${escapeHtml(name)}">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}">
          <span class="attachment-label">
            <span class="attachment-name">${escapeHtml(name)}</span>
            <span class="attachment-meta">${escapeHtml(type || mimeType || 'صورة')}</span>
          </span>
        </button>
      `;
    }

    return `
      <a class="attachment-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener" download="${escapeHtml(name)}">
        <span>${escapeHtml(name)}</span>
      </a>
    `;
  }

  function updateSelectedFiles(files) {
    if (!el.selectedFiles) return;
    if (!files || !files.length) {
      el.selectedFiles.innerHTML = '';
      return;
    }
    const items = Array.from(files).map((file) => `
      <span class="attachment-chip">
        <strong>${escapeHtml(file.name)}</strong>
        <span>${Math.round(file.size / 1024)} KB</span>
      </span>
    `).join('');
    el.selectedFiles.innerHTML = items;
  }

  function showImagePreview(src, name) {
    if (!src) return;

    const overlay = document.createElement('div');
    overlay.className = 'attachment-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'overlay-dialog';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'overlay-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'إغلاق المعاينة');

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = name;

    const image = document.createElement('img');
    image.className = 'overlay-image';
    image.src = src;
    image.alt = name || 'معاينة الصورة';

    dialog.appendChild(closeButton);
    dialog.appendChild(title);
    dialog.appendChild(image);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const closeOverlay = () => overlay.remove();

    closeButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', function handleEscape(event) {
      if (event.key === 'Escape') {
        closeOverlay();
        document.removeEventListener('keydown', handleEscape);
      }
    });
  }

  function closeContextMenu() {
    const existing = document.querySelector('.chat-context-menu');
    if (existing) existing.remove();
  }

  function showContextMenu(items, x, y) {
    closeContextMenu();
    if (!items.length) return;

    const menu = document.createElement('div');
    menu.className = 'chat-context-menu';
    menu.style.left = `${Math.max(12, x)}px`;
    menu.style.top = `${Math.max(12, y)}px`;

    items.forEach((item) => {
      const menuItem = document.createElement('button');
      menuItem.type = 'button';
      menuItem.className = 'chat-context-menu__item';
      menuItem.textContent = item.label;
      menuItem.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        closeContextMenu();
        if (typeof item.onSelect === 'function') {
          item.onSelect();
        }
      });
      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    const removeMenu = () => {
      closeContextMenu();
      document.removeEventListener('click', removeMenu);
      document.removeEventListener('contextmenu', removeMenu);
      document.removeEventListener('keydown', removeOnEscape);
    };

    const removeOnEscape = (event) => {
      if (event.key === 'Escape') removeMenu();
    };

    document.addEventListener('click', removeMenu);
    document.addEventListener('contextmenu', removeMenu);
    document.addEventListener('keydown', removeOnEscape);
  }

  function downloadAttachment(url, name) {
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    if (name) anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function buildMessageContextItems(message) {
    if (!message) return [];
    const currentUserId = Number(currentUser.id || currentUser.userId);
    const isOwner = Number(message.sender_id) === currentUserId;
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    const hasAttachments = attachments.length > 0;
    const isImageOnly = hasAttachments && !message.content?.trim();
    const items = [];

    if (isOwner && !isImageOnly && message.content?.trim()) {
      items.push({
        label: 'تعديل',
        onSelect: () => showEditMessageDialog(message.id)
      });
    }

    if (isOwner) {
      items.push({
        label: 'حذف',
        onSelect: () => showDeleteConfirmDialog(message.id)
      });
    }

    if (hasAttachments) {
      attachments.forEach((attachment) => {
        const rawUrl = attachment.url || attachment.file_url || '';
        const url = rawUrl.startsWith('/') ? `${API_ORIGIN}${rawUrl}` : rawUrl;
        const name = attachment.name || attachment.file_name || 'تنزيل';
        items.push({
          label: `تنزيل ${name}`,
          onSelect: () => downloadAttachment(url, name)
        });
      });
    }

    return items;
  }

  function handleMessageContext(event) {
    const messageElement = event.target.closest('.message');
    if (!messageElement) return;
    event.preventDefault();
    event.stopPropagation();

    const messageId = messageElement.dataset.messageId;
    const message = state.messages.find((m) => String(m.id) === String(messageId));
    const items = buildMessageContextItems(message);
    if (!items.length) return;

    showContextMenu(items, event.clientX, event.clientY);
  }

  function clearLongPressTimer() {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function startLongPress(event) {
    const messageElement = event.target.closest('.message');
    if (!messageElement) return;

    longPressTimer = window.setTimeout(() => {
      const messageId = messageElement.dataset.messageId;
      const message = state.messages.find((m) => String(m.id) === String(messageId));
      const items = buildMessageContextItems(message);
      if (!items.length) return;

      const touch = event.touches[0];
      if (!touch) return;
      showContextMenu(items, touch.clientX, touch.clientY);
    }, 500);
  }

  function clearSelectedFiles() {
    if (!el.fileInput) return;
    el.fileInput.value = '';
    updateSelectedFiles([]);
  }

  function stopAudioRecording() {
    if (!state.mediaRecorder) return;
    state.mediaRecorder.stop();
    state.mediaRecorder = null;
    state.recordingChunks = [];
    if (el.recordAudioBtn) el.recordAudioBtn.classList.remove('active');
  }

  function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('الميكروفون غير مدعوم في المتصفح هذا', true);
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        state.mediaRecorder = mediaRecorder;
        state.recordingChunks = [];
        state.audioStream = stream;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data && event.data.size > 0) {
            state.recordingChunks.push(event.data);
          }
        });

        mediaRecorder.addEventListener('stop', () => {
          if (!state.recordingChunks.length) return;

          const audioBlob = new Blob(state.recordingChunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          const dt = new DataTransfer();
          dt.items.add(audioFile);
          if (el.fileInput) {
            el.fileInput.files = dt.files;
            updateSelectedFiles(el.fileInput.files);
            el.btnSend.disabled = !state.currentChatId || (!el.input.value.trim() && !el.fileInput.files.length);
          }
          stream.getTracks().forEach((track) => track.stop());
          el.recordAudioBtn?.classList.remove('active');
          state.mediaRecorder = null;
          state.audioStream = null;
        });

        mediaRecorder.start();
        el.recordAudioBtn?.classList.add('active');
        toast('جارٍ التسجيل الصوتي... اضغط مرة أخرى لإيقافه');
      })
      .catch((error) => {
        console.error('Audio recording failed:', error);
        toast('تعذر الوصول إلى الميكروفون', true);
      });
  }

  function toggleAudioRecording() {
    if (state.mediaRecorder) {
      stopAudioRecording();
      return;
    }
    startAudioRecording();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  let socket = null;

  function initSocket() {
    if (!window.io || !token) return;
    socket = io(API_ORIGIN, { auth: { token } });

    socket.on('connect', () => {
      socket.emit('set_user');
      if (state.currentChatId) socketJoin(state.currentChatId);
    });

    socket.on('message_received', (message) => {
      appendMessage(message);
      loadChats().catch(() => {});
    });

    socket.on('message_edited', (data) => {
      console.log('📝 Message edited event received:', data);
      const message = state.messages.find((m) => Number(m.id) === Number(data.messageId));
      if (message) {
        message.content = data.content;
        message.edited_at = data.edited_at;
        renderMessages();
        console.log('✅ Message updated in UI');
      } else {
        console.warn('⚠️ Message not found for edit:', data.messageId);
      }
    });

    socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted event received:', data);
      const message = state.messages.find((m) => Number(m.id) === Number(data.messageId));
      if (message) {
        message.deleted_at = data.deleted_at;
        renderMessages();
        console.log('✅ Message marked as deleted in UI');
      } else {
        console.warn('⚠️ Message not found for delete:', data.messageId);
      }
    });

    socket.on('notification', () => {
      loadChats().catch(() => {});
    });
  }

  function socketJoin(chatId) {
    if (!socket) {
      initSocket();
      return;
    }

    if (!socket.connected) {
      socket.once('connect', () => {
        socket.emit('join_room', { chatId });
      });
      return;
    }

    socket.emit('join_room', { chatId });
  }

  function bindEvents() {
    // Bind message actions once
    bindMessageActions();

    el.chatsList.addEventListener('click', (event) => {
      const itemBtn = event.target.closest('.chat-item');
      if (itemBtn) return openChat(itemBtn.dataset.chatId).catch((error) => toast(error.message, true));
    });

    // Per-item three-dots menu for chat items (toggle menu, delete chat)
    el.chatsList.addEventListener('click', async (event) => {
      const dots = event.target.closest('.chat-item-dots');
      if (dots) {
        event.stopPropagation();
        const chatId = dots.dataset.chatId;
        const menu = document.querySelector(`.chat-item-menu[data-chat-id="${chatId}"]`);
        if (!menu) return;
        const isOpen = menu.classList.toggle('open');
        menu.setAttribute('aria-hidden', String(!isOpen));
        dots.setAttribute('aria-expanded', String(isOpen));
        // close other menus
        document.querySelectorAll('.chat-item-menu.open').forEach((m) => {
          if (m !== menu) {
            m.classList.remove('open');
            m.setAttribute('aria-hidden', 'true');
            const otherDots = document.querySelector(`.chat-item-dots[data-chat-id="${m.dataset.chatId}"]`);
            if (otherDots) otherDots.setAttribute('aria-expanded', 'false');
          }
        });
        return;
      }

      const deleteBtn = event.target.closest('.chat-item-delete');
      if (deleteBtn) {
        event.preventDefault();
        event.stopPropagation();
        const chatId = deleteBtn.dataset.chatId;
        if (!chatId) return;
        const confirmed = window.confirm('هل تريد حذف هذه المحادثة من جانبك فقط؟');
        if (!confirmed) return;

        // prevent double-clicks
        deleteBtn.disabled = true;

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        try {
          try {
            await request(`/api/chats/${chatId}`, { method: 'DELETE' });
          } catch (err) {
            // if rate limited, wait and retry once
            if (err && err.status === 429) {
              toast(err.message || 'الرجاء الانتظار، سيتم المحاولة مرة أخرى...', true);
              await sleep(2000);
              await request(`/api/chats/${chatId}`, { method: 'DELETE' });
            } else throw err;
          }

          state.chats = state.chats.filter((chat) => Number(chat.id) !== Number(chatId));
          if (Number(state.currentChatId) === Number(chatId)) {
            state.currentChatId = null;
            state.messages = [];
            state.participants = [];
            renderMessages();
            renderInfo();
          }
          renderChats();
          toast('تم حذف المحادثة من جانبك بنجاح');
        } catch (error) {
          console.error('Error deleting chat:', error);
          toast(error.message || 'حدث خطأ أثناء حذف المحادثة', true);
        } finally {
          deleteBtn.disabled = false;
        }
      }
    });

    el.searchInput.addEventListener('input', renderChats);
    el.refreshChats.addEventListener('click', () => refreshVisibleChat().catch((error) => toast(error.message, true)));
    document.getElementById('deleteAllChats')?.addEventListener('click', () => deleteAllChats().catch((error) => toast(error.message, true)));
    const pageShell = document.querySelector('.chat-shell');

    const closeInfoPanel = () => {
      el.infoPanel.classList.remove('open');
      el.infoPanel.classList.add('closed');
      el.infoPanel.style.display = 'none';
      pageShell?.classList.add('info-closed');
    };

    const openInfoPanel = () => {
      el.infoPanel.classList.add('open');
      el.infoPanel.classList.remove('closed');
      el.infoPanel.style.display = '';
      pageShell?.classList.remove('info-closed');
    };

    const toggleInfoPanel = () => {
      if (el.infoPanel.classList.contains('open')) {
        closeInfoPanel();
      } else {
        openInfoPanel();
      }
    };

    const closeActionMenu = () => {
      if (!el.actionMenu) return;
      el.actionMenu.classList.remove('open');
      el.actionMenu.setAttribute('aria-hidden', 'true');
    };

    el.actionMenuBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!el.actionMenu || !el.actionMenuBtn) return;
      const isOpen = el.actionMenu.classList.toggle('open');
      el.actionMenu.setAttribute('aria-hidden', String(!isOpen));
      el.actionMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
      if (!el.actionMenu || !el.actionMenuBtn) return;
      if (!el.actionMenu.contains(event.target) && event.target !== el.actionMenuBtn) {
        closeActionMenu();
      }
    });

    el.toggleInfo.addEventListener('click', (event) => {
      event.stopPropagation();
      closeActionMenu();
      toggleInfoPanel();
    });
    el.closeInfo.addEventListener('click', closeInfoPanel);
    el.deleteCurrentChat?.addEventListener('click', async (event) => {
      event.stopPropagation();
      closeActionMenu();
      await deleteCurrentChat().catch((error) => toast(error.message, true));
    });
    el.backDashboard?.addEventListener('click', (event) => {
      event.stopPropagation();
      closeActionMenu();
      const managerRoleIds = new Set([1, 2, 3, 4]);
      const dashboardPage = managerRoleIds.has(Number(currentUser?.role)) ? 'manager-dashboard.html' : 'client-dashboard.html';
      window.location.href = dashboardPage;
    });
    el.toggleChats?.addEventListener('click', () => el.chatListPanel.classList.toggle('open'));

    el.input.addEventListener('input', () => {
      el.input.style.height = 'auto';
      el.input.style.height = `${Math.min(el.input.scrollHeight, 130)}px`;
      el.btnSend.disabled = !state.currentChatId || (!el.input.value.trim() && !el.fileInput.files.length);
    });

    if (el.fileInput) {
      el.fileInput.addEventListener('change', () => {
        updateSelectedFiles(el.fileInput.files);
        el.btnSend.disabled = !state.currentChatId || (!el.input.value.trim() && !el.fileInput.files.length);
      });
    }

    if (el.recordAudioBtn) {
      el.recordAudioBtn.addEventListener('click', toggleAudioRecording);
    }

    el.messages.addEventListener('click', (event) => {
      const previewButton = event.target.closest('.attachment-preview');
      if (!previewButton) return;
      event.preventDefault();
      const src = previewButton.dataset.fullUrl;
      const name = previewButton.dataset.fileName || '';
      showImagePreview(src, name);
    });

    el.messages.addEventListener('contextmenu', handleMessageContext);
    el.messages.addEventListener('touchstart', startLongPress, { passive: true });
    el.messages.addEventListener('touchend', clearLongPressTimer);
    el.messages.addEventListener('touchmove', clearLongPressTimer);
    el.messages.addEventListener('touchcancel', clearLongPressTimer);

    el.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        el.form.requestSubmit();
      }
    });

    el.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const content = el.input.value.trim();
      const files = el.fileInput ? Array.from(el.fileInput.files) : [];
      if (!state.currentChatId || (!content && !files.length)) return;

      el.btnSend.disabled = true;
      try {
        await sendMessage(content, files);
      } catch (error) {
        toast(error.message || 'تعذر إرسال الرسالة', true);
      } finally {
        el.btnSend.disabled = !state.currentChatId || (!el.input.value.trim() && !(el.fileInput?.files.length));
      }
    });
  }

  async function init() {
    bindEvents();

    // Setup aside resizer: insert resizer element and allow dragging to change --chat-list-width
    try {
      const pageShell = document.querySelector('.chat-shell');
      if (pageShell) {
        const resizer = document.createElement('div');
        resizer.className = 'aside-resizer';
        pageShell.appendChild(resizer);

        const docEl = document.documentElement;
        const getWidthValue = () => parseInt(getComputedStyle(docEl).getPropertyValue('--chat-list-width')) || 330;
        const setWidth = (w) => {
          const min = 220;
          const max = Math.max(420, Math.floor(window.innerWidth * 0.45));
          const val = Math.max(min, Math.min(max, w));
          docEl.style.setProperty('--chat-list-width', `${val}px`);
          resizer.style.left = `${val}px`;
        };

        setWidth(getWidthValue());

        let dragging = false;
        const onMove = (clientX) => {
          setWidth(clientX);
        };

        resizer.addEventListener('mousedown', (e) => {
          dragging = true;
          e.preventDefault();
          document.body.style.userSelect = 'none';
        });
        window.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          onMove(e.clientX);
        });
        window.addEventListener('mouseup', () => {
          if (!dragging) return;
          dragging = false;
          document.body.style.userSelect = '';
        });

        // touch support
        resizer.addEventListener('touchstart', (e) => { dragging = true; e.preventDefault(); });
        window.addEventListener('touchmove', (e) => { if (!dragging) return; onMove(e.touches[0].clientX); });
        window.addEventListener('touchend', () => { dragging = false; });

        // reposition if window resized
        window.addEventListener('resize', () => setWidth(getWidthValue()));
      }
    } catch (err) {
      console.warn('Resizer init failed', err);
    }

    initSocket();

    const params = new URLSearchParams(window.location.search);
    try {
      await loadCurrentUser();
      await loadChats();
      if (params.get('project')) {
        await openProjectChat(params.get('project'));
        return;
      }

      const chatId = params.get('chat');
      const savedChatId = localStorage.getItem(LAST_CHAT_KEY);
      const savedChatExists = state.chats.some((chat) => Number(chat.id) === Number(savedChatId));
      const target = chatId || (savedChatExists ? savedChatId : null) || state.chats[0]?.id;
      if (target) await openChat(target);
    } catch (error) {
      toast(error.message || 'تعذر تحميل المحادثات', true);
    }
  }

  init();
})();
