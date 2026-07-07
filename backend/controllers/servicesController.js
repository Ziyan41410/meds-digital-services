/**
 * Services Controller
 * Handles service listing and management
 */

const pool = require('../config/database');

// ===== GET ALL SERVICES =====
exports.getAllServices = async (req, res) => {
    try {
        const { category_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.id, s.name, s.slug, s.description, s.image, s.price,
                   s.features, sc.name as category_name, COUNT(*) OVER() as total
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            WHERE s.is_active = TRUE
        `;

        const params = [];

        if (category_id) {
            query += ' AND s.category_id = ?';
            params.push(category_id);
        }

        query += ' ORDER BY s.display_order ASC, s.name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [services] = await pool.query(query, params);

        const total = services.length > 0 ? services[0].total : 0;

        res.json({
            success: true,
            data: services,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الخدمات',
            error: error.message
        });
    }
};

// ===== GET SERVICE BY ID =====
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const [services] = await pool.query(
            `SELECT s.id, s.name, s.slug, s.description, s.image, s.price,
                    s.features, sc.name as category_name, sc.id as category_id
             FROM services s
             JOIN service_categories sc ON s.category_id = sc.id
             WHERE s.id = ? AND s.is_active = TRUE`,
            [id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخدمة غير موجودة'
            });
        }

        res.json({
            success: true,
            data: services[0]
        });

    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الخدمة',
            error: error.message
        });
    }
};

// ===== GET CATEGORIES =====
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            `SELECT id, name, slug, description, icon, display_order
             FROM service_categories
             WHERE is_active = TRUE
             ORDER BY display_order ASC`
        );

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الفئات',
            error: error.message
        });
    }
};

// ===== CREATE SERVICE (ADMIN ONLY) =====
exports.createService = async (req, res) => {
    try {
        const { name, slug, description, category_id, price, features } = req.body;

        const [result] = await pool.query(
            `INSERT INTO services (name, slug, description, category_id, price, features, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [name, slug, description, category_id, price, JSON.stringify(features || [])]
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الخدمة بنجاح',
            service_id: result.insertId
        });

    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء الخدمة',
            error: error.message
        });
    }
};

// ===== UPDATE SERVICE (ADMIN ONLY) =====
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, features, is_active } = req.body;

        const [result] = await pool.query(
            `UPDATE services 
             SET name = ?, description = ?, price = ?, features = ?, is_active = ?
             WHERE id = ?`,
            [name, description, price, JSON.stringify(features || []), is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخدمة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث الخدمة بنجاح'
        });

    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الخدمة',
            error: error.message
        });
    }
};

// ===== DELETE SERVICE (ADMIN ONLY) =====
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM services WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخدمة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف الخدمة بنجاح'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الخدمة',
            error: error.message
        });
    }
};
