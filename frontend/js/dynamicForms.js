/**
 * Dynamic Forms System
 * Modern, reusable form components
 */

// Form Component Class
class DynamicForm {
    constructor(options) {
        this.formId = options.id || 'dynamic-form-' + Math.random().toString(36).substr(2, 9);
        this.title = options.title || 'نموذج';
        this.fields = options.fields || [];
        this.onSubmit = options.onSubmit || (() => {});
        this.submitText = options.submitText || 'إرسال';
        this.cancelText = options.cancelText || 'إلغاء';
        this.modal = null;
    }

    // Create form HTML
    createFormHTML() {
        let fieldsHTML = '';
        
        this.fields.forEach(field => {
            fieldsHTML += this.createFieldHTML(field);
        });

        return `
            <div class="modal" id="${this.formId}-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.title}</h2>
                        <button class="modal-close" onclick="document.getElementById('${this.formId}-modal').remove()">✕</button>
                    </div>
                    <form id="${this.formId}" class="dynamic-form">
                        ${fieldsHTML}
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${this.submitText}</button>
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('${this.formId}-modal').remove()">${this.cancelText}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Create individual field HTML
    createFieldHTML(field) {
        const required = field.required ? 'required' : '';
        const pattern = field.pattern ? `pattern="${field.pattern}"` : '';
        const inputType = field.type || 'text';

        switch(field.type) {
            case 'textarea':
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <textarea 
                            id="${field.name}" 
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            rows="${field.rows || 4}"
                            ${required}
                        ></textarea>
                    </div>
                `;
            
            case 'select':
                const optionsHTML = field.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('');
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <select id="${field.name}" name="${field.name}" ${required}>
                            <option value="">-- اختر --</option>
                            ${optionsHTML}
                        </select>
                    </div>
                `;
            
            case 'number':
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <input 
                            type="number" 
                            id="${field.name}" 
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            min="${field.min || '0'}"
                            ${required}
                        />
                    </div>
                `;
            
            case 'email':
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <input 
                            type="email" 
                            id="${field.name}" 
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            ${required}
                        />
                    </div>
                `;

            case 'checkbox':
                return `
                    <div class="form-group checkbox-group">
                        <label>
                            <input 
                                type="checkbox" 
                                id="${field.name}" 
                                name="${field.name}"
                                value="${field.value || 'true'}"
                            />
                            ${field.label}
                        </label>
                    </div>
                `;

            default:
                return `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        <input 
                            type="${inputType}" 
                            id="${field.name}" 
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            ${required}
                            ${pattern}
                        />
                    </div>
                `;
        }
    }

    // Show form as modal
    show() {
        // Remove existing modal if any
        const existing = document.getElementById(this.formId + '-modal');
        if (existing) existing.remove();

        // Create and insert modal
        const container = document.createElement('div');
        container.innerHTML = this.createFormHTML();
        document.body.appendChild(container.firstElementChild);

        // Handle form submission
        const form = document.getElementById(this.formId);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Call the callback
            this.onSubmit(data);
            
            // Close modal
            document.getElementById(this.formId + '-modal').remove();
        });

        // Add animation
        setTimeout(() => {
            const modal = document.getElementById(this.formId + '-modal');
            if (modal) modal.classList.add('show');
        }, 10);
    }

    // Get form data
    getData() {
        const form = document.getElementById(this.formId);
        if (!form) return null;
        
        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    // Validate form
    validate() {
        const form = document.getElementById(this.formId);
        if (!form) return false;
        
        return form.checkValidity();
    }

    // Clear form
    clear() {
        const form = document.getElementById(this.formId);
        if (form) form.reset();
    }

    // Close form
    close() {
        const modal = document.getElementById(this.formId + '-modal');
        if (modal) modal.remove();
    }
}

// Export for use
window.DynamicForm = DynamicForm;
