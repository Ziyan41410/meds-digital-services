-- =====================================
-- Database: MEDS Digital Services
-- Updated: Dynamic Multi-Path Form System
-- =====================================

-- Create Database
CREATE DATABASE IF NOT EXISTS meds_digital_services;
USE meds_digital_services;

-- =====================================
-- 1. ROLES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Roles
INSERT INTO roles (name, description) VALUES
('admin', 'مسؤول النظام'),
('programmer', 'مبرمج'),
('marketer', 'متخصص تسويق رقمي'),
('cyber_security_expert', 'خبير أمن سيبراني'),
('client', 'عميل')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- =====================================
-- 2. USERS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  bio TEXT,
  profile_image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role_id (role_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 3. EMAIL VERIFICATION TOKENS
-- =====================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 4. PASSWORD RESET TOKENS
-- =====================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 5. SERVICE CATEGORIES (Updated)
-- =====================================
CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Service Categories (Updated descriptions)
INSERT INTO service_categories (name, slug, description, icon, display_order) VALUES
('البرمجة والتطوير', 'programming', 'تطوير المواقع، التطبيقات، المتاجر، وأنظمة الإدارة وAPI', '💻', 1),
('التسويق الرقمي', 'marketing', 'إدارة الحملات، السوشيال ميديا، SEO، وبناء العلامة التجارية', '📣', 2),
('الأمن السيبراني', 'cyber_security', 'اختبار الاختراق، التدقيق الأمني، تأمين الشبكات، ومراجعة الأكواد', '🔒', 3)
ON DUPLICATE KEY UPDATE 
  name=VALUES(name), 
  description=VALUES(description),
  icon=VALUES(icon);

-- =====================================
-- 6. SERVICES (Updated with new services)
-- =====================================
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category_id INT NOT NULL,
  image VARCHAR(255),
  price DECIMAL(10,2),
  duration_days INT DEFAULT 14,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  INDEX idx_category_id (category_id),
  INDEX idx_slug (slug),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Services - Programming (Updated)
INSERT INTO services (name, slug, category_id, description, price, display_order) VALUES
('تطوير مواقع ويب', 'web-development', 1, 'تطوير مواقع ويب احترافية ومتجاوبة', 500, 1),
('متاجر إلكترونية', 'ecommerce', 1, 'إنشاء متاجر إلكترونية كاملة مع بوابات دفع', 1000, 2),
('تطبيقات ويب (SaaS)', 'web-app', 1, 'أنظمة إدارة، داشبورد، أو منصة خدمية مخصصة', 1200, 3),
('تطبيقات أندرويد', 'android-apps', 1, 'تطوير تطبيقات أندرويد احترافية', 800, 4),
('تطبيقات iOS', 'ios-apps', 1, 'تطوير تطبيقات iOS احترافية', 900, 5),
('تطبيقات جوال (Cross-Platform)', 'mobile-apps', 1, 'تطبيق Android و iOS بتصميم واحد', 1100, 6),
('أنظمة إدارة', 'management-systems', 1, 'تطوير أنظمة إدارة مخصصة', 1500, 7),
('تطوير APIs', 'api-development', 1, 'تطوير واجهات برمجية REST/GraphQL', 600, 8),
('API وتكاملات', 'api-integration', 1, 'ربط أنظمة وتكامل مع خدمات خارجية', 700, 9),
('Chatbots', 'chatbots', 1, 'تطوير روبوتات محادثة ذكية', 400, 10),
('حلول الذكاء الاصطناعي', 'ai-solutions', 1, 'تطوير حلول ذكاء اصطناعي', 2000, 11),
('صيانة وتطوير', 'maintenance', 1, 'إصلاح أخطاء، تحديث، أو إضافة ميزات لمشروع قائم', 300, 12);

-- Insert Services - Marketing (Updated)
INSERT INTO services (name, slug, category_id, description, price, display_order) VALUES
('إدارة السوشيال ميديا', 'social-media', 2, 'إنشاء محتوى، جدولة نشر، وتفاعل مع الجمهور', 300, 1),
('حملات إعلانية مدفوعة', 'paid-ads', 2, 'إعلانات Meta Ads وGoogle Ads لزيادة المبيعات', 500, 2),
('Google Ads', 'google-ads', 2, 'إدارة حملات جوجل الإعلانية', 500, 3),
('Facebook Ads', 'facebook-ads', 2, 'إدارة حملات فيسبوك الإعلانية', 450, 4),
('TikTok Ads', 'tiktok-ads', 2, 'إدارة حملات تيك توك الإعلانية', 400, 5),
('LinkedIn Ads', 'linkedin-ads', 2, 'إدارة حملات لينكد إن الإعلانية', 550, 6),
('SEO', 'seo', 2, 'تحسين ترتيب موقعك في نتائج Google بشكل مستدام', 400, 7),
('كتابة المحتوى', 'content-writing', 2, 'مقالات، نصوص إعلانية، وسكريبتات احترافية بالعربية', 350, 8),
('Content Marketing', 'content-marketing', 2, 'إنشاء محتوى تسويقي احترافي', 350, 9),
('Email Marketing', 'email-marketing', 2, 'حملات Email Marketing واستراتيجيات الاحتفاظ بالعملاء', 250, 10),
('Branding', 'branding', 2, 'شعار، ألوان، خطوط، وكتيب هوية بصرية متكامل', 600, 11);

-- Insert Services - Cyber Security (Updated)
INSERT INTO services (name, slug, category_id, description, price, display_order) VALUES
('اختبار الاختراق', 'penetration-testing', 3, 'كشف الثغرات في موقعك أو تطبيقك قبل المهاجمين', 1200, 1),
('تدقيق الأمان', 'security-audit', 3, 'مراجعة شاملة للكود والبنية التحتية وسياسات الأمان', 800, 2),
('مراجعة الكود الأمني', 'code-review', 3, 'مراجعة شاملة للكود المصدري لاكتشاف الثغرات البرمجية', 700, 3),
('تقييم الثغرات', 'vulnerability-assessment', 3, 'تحليل ومعالجة الثغرات الأمنية', 600, 4),
('تأمين الشبكات', 'network-hardening', 3, 'تأمين البنية التحتية للشبكة وإعداد جدران الحماية', 900, 5),
('أمان الويب', 'web-security', 3, 'حماية تطبيقات الويب', 500, 6),
('أمان الشبكات', 'network-security', 3, 'تأمين البنية التحتية', 700, 7),
('الحماية والرصد المستمر', 'continuous-monitoring', 3, 'مراقبة 24/7 واكتشاف التهديدات في الوقت الفعلي', 1000, 8),
('استعادة البيانات والطوارئ', 'disaster-recovery', 3, 'خطط الاسترداد بعد الحوادث والهجمات الإلكترونية', 800, 9),
('تدريب فريقك على الأمان', 'security-training', 3, 'ورش وتدريبات توعوية لحماية موظفيك من التهديدات', 400, 10),
('الامتثال والمعايير', 'compliance', 3, 'الاستعداد لشهادات GDPR وISO 27001 وغيرها', 900, 11),
('استشارات الأمان', 'security-consultation', 3, 'استشارات أمنية متخصصة', 400, 12);

-- =====================================
-- 7. SUB-SERVICES (Optional - for detailed service breakdown)
-- =====================================
CREATE TABLE IF NOT EXISTS sub_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_id (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 8. PROJECTS/TICKETS (Updated for Dynamic Form)
-- =====================================
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  service_id INT NOT NULL,
  
  -- NEW: Domain path indicator
  domain ENUM('dev', 'mkt', 'sec') NOT NULL DEFAULT 'dev' COMMENT 'مسار النموذج: dev=برمجة, mkt=تسويق, sec=أمن سيبراني',
  
  -- Core project info
  title VARCHAR(200) NOT NULL,
  description LONGTEXT NOT NULL,
  
  -- NEW: Dynamic form data (JSON)
  form_data JSON COMMENT 'البيانات الديناميكية المحددة لكل مسار (مثل: القنوات، الميزات، المعلومات التقنية)',
  
  -- Budget & Timeline
  budget DECIMAL(12,2),
  budget_range VARCHAR(50) COMMENT 'نطاق الميزانية المختار (مثل: 50-100, 100-300)',
  timeline_days INT,
  
  -- Status & Priority
  status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  
  -- Assignment
  assigned_to INT,
  
  -- Files & Notes
  attachments JSON COMMENT 'مسارات الملفات المرفوعة (JSON array)',
  notes TEXT,
  
  -- Progress & Dates
  progress INT DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  completed_at DATETIME NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  
  -- Indexes
  INDEX idx_client_id (client_id),
  INDEX idx_service_id (service_id),
  INDEX idx_domain (domain),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 9. PROJECT FORM OPTIONS (NEW - for analytics)
-- =====================================
CREATE TABLE IF NOT EXISTS project_form_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  option_key VARCHAR(100) NOT NULL COMMENT 'مثل: features, channels, goals, target_type',
  option_value VARCHAR(255) NOT NULL COMMENT 'القيمة المختارة',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_project_key (project_id, option_key),
  INDEX idx_option_key (option_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 10. PROJECT COMMENTS
-- =====================================
CREATE TABLE IF NOT EXISTS project_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 11. FILES
-- =====================================
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  size INT,
  mime_type VARCHAR(100),
  uploaded_by INT NOT NULL,
  project_id INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 12. MESSAGES/CHAT
-- =====================================
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message LONGTEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  INDEX idx_project_id (project_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 13. NOTIFICATIONS
-- =====================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  related_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 14. PAYMENTS
-- =====================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method ENUM('stripe', 'paypal', 'bank_transfer', 'cash') NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_date TIMESTAMP NULL,
  refund_reason VARCHAR(255),
  refunded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 15. INVOICES
-- =====================================
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  client_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (client_id) REFERENCES users(id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_project_id (project_id),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 16. REVIEWS/RATINGS
-- =====================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  client_id INT NOT NULL,
  professional_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (professional_id) REFERENCES users(id),
  UNIQUE KEY unique_review (project_id, client_id),
  INDEX idx_professional_id (professional_id),
  INDEX idx_rating (rating),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 17. PORTFOLIO
-- =====================================
CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  url VARCHAR(255),
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  INDEX idx_professional_id (professional_id),
  INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- 18. SETTINGS
-- =====================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value LONGTEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Settings
INSERT INTO settings (`key`, value, description) VALUES
('site_name', 'MEDS Digital Services', 'اسم الموقع'),
('site_email', 'info@medsdigitalservices.com', 'بريد الموقع الإلكتروني'),
('site_phone', '+966550000000', 'هاتف الموقع'),
('site_address', 'الرياض، المملكة العربية السعودية', 'عنوان الموقع'),
('currency', 'USD', 'العملة الافتراضية'),
('timezone', 'Asia/Riyadh', 'المنطقة الزمنية'),
('items_per_page', '10', 'عدد العناصر في الصفحة')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- =====================================
-- 19. ACTIVITY LOG
-- =====================================
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  table_name VARCHAR(100),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================
-- Performance Indexes
-- =====================================
CREATE INDEX idx_users_email_active ON users(email, is_active);
CREATE INDEX idx_projects_status_created ON projects(status, created_at);
CREATE INDEX idx_projects_domain_status ON projects(domain, status);
CREATE INDEX idx_messages_recipients ON messages(receiver_id, is_read, created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================
-- EXAMPLES: form_data JSON structure for each domain
-- =====================================
-- 
-- Domain: dev (البرمجة والتطوير)
-- {
--   "project_type": "ecommerce",
--   "goal": "إنشاء متجر إلكتروني لبيع المنتجات الغذائية",
--   "target_users": "العملاء في الجزائر، الفئة العمرية 25-50",
--   "has_design": "figma",
--   "pages_count": 15,
--   "similar_site": "example.com",
--   "features": ["login", "dashboard", "payment", "notifications"]
-- }
--
-- Domain: mkt (التسويق الرقمي)
-- {
--   "company_name": "مطعم الشام",
--   "sector": "restaurant",
--   "goals": ["sales", "followers"],
--   "channels": ["facebook", "instagram", "tiktok"],
--   "ad_budget": "20k"
-- }
--
-- Domain: sec (الأمن السيبراني)
-- {
--   "target_type": "webapp",
--   "service_type": "pentest",
--   "target_url": "example.com",
--   "server_type": "Linux",
--   "tech_stack": "PHP, Laravel, MySQL"
-- }

-- =====================================
-- DONE - Database ready for dynamic multi-path form
-- =====================================
