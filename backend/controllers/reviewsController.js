/**
 * Reviews Controller
 * Handles project reviews and ratings
 */

const pool = require('../config/database');

// ===== CREATE REVIEW =====
exports.createReview = async (req, res) => {
    try {
        const { project_id, professional_id, rating, comment } = req.body;
        const clientId = req.userId;

        // Check if project exists and user is the client
        const [project] = await pool.query(
            'SELECT id, client_id FROM projects WHERE id = ?',
            [project_id]
        );

        if (project.length === 0 || project[0].client_id !== clientId) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحيات لتقييم هذا المشروع'
            });
        }

        // Check if review already exists
        const [existingReview] = await pool.query(
            'SELECT id FROM reviews WHERE project_id = ? AND client_id = ?',
            [project_id, clientId]
        );

        if (existingReview.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'لقد قمت بتقييم هذا المشروع بالفعل'
            });
        }

        // Create review
        const [result] = await pool.query(
            `INSERT INTO reviews (project_id, client_id, professional_id, rating, comment, is_visible)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [project_id, clientId, professional_id, rating, comment]
        );

        // Notify professional
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id)
             VALUES (?, ?, ?, ?, ?)`,
            [
                professional_id,
                'new_review',
                'تقييم جديد',
                `تم تقييم مشروعك بـ ${rating} نجوم`,
                result.insertId
            ]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة التقييم بنجاح',
            review_id: result.insertId
        });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة التقييم',
            error: error.message
        });
    }
};

// ===== GET PROFESSIONAL REVIEWS =====
exports.getProfessionalReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [reviews] = await pool.query(
            `SELECT r.id, r.rating, r.comment, r.created_at,
                    u.username as client_name, u.profile_image
             FROM reviews r
             JOIN users u ON r.client_id = u.id
             WHERE r.professional_id = ? AND r.is_visible = TRUE
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [id, parseInt(limit), offset]
        );

        // Get average rating
        const [ratingStats] = await pool.query(
            `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
             FROM reviews 
             WHERE professional_id = ? AND is_visible = TRUE`,
            [id]
        );

        res.json({
            success: true,
            data: reviews,
            stats: ratingStats[0],
            pagination: {
                current_page: parseInt(page),
                total_items: ratingStats[0].total_reviews,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get professional reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التقييمات',
            error: error.message
        });
    }
};

// ===== GET FEATURED REVIEWS (For Landing Page) =====
exports.getFeaturedReviews = async (req, res) => {
    try {
        const [reviews] = await pool.query(
            `SELECT r.id, r.rating, r.comment, r.created_at,
                    u.username, u.profile_image, p.title as project_title
             FROM reviews r
             JOIN users u ON r.client_id = u.id
             JOIN projects p ON r.project_id = p.id
             WHERE r.is_visible = TRUE AND r.rating >= 4
             ORDER BY r.created_at DESC
             LIMIT 6`
        );

        res.json({
            success: true,
            data: reviews
        });

    } catch (error) {
        console.error('Get featured reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التقييمات',
            error: error.message
        });
    }
};

// ===== DELETE REVIEW (Admin/Moderator) =====
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if review exists
        const [review] = await pool.query(
            'SELECT id FROM reviews WHERE id = ?',
            [id]
        );

        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'التقييم غير موجود'
            });
        }

        await pool.query('DELETE FROM reviews WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'تم حذف التقييم بنجاح'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التقييم',
            error: error.message
        });
    }
};
