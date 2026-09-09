let notifications = [
    { _id: '1', type: 'info', message: 'System update completed successfully', isRead: false, createdAt: new Date() },
    { _id: '2', type: 'warning', message: 'High volume detected in waitlist', isRead: false, createdAt: new Date() },
    { _id: '3', type: 'error', message: 'Payment gateway timeout', isRead: false, createdAt: new Date() }
];

// Get all notifications
exports.getNotifications = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: notifications });
    } catch (err) {
        next(err);
    }
};

// Create a new notification
exports.createNotification = async (req, res, next) => {
    try {
        const { type, message } = req.body;
        const newNotif = { _id: Date.now().toString(), type, message, isRead: false, createdAt: new Date() };
        notifications.unshift(newNotif);
        res.status(201).json({ success: true, data: newNotif });
    } catch (err) {
        next(err);
    }
};

// Clear all notifications
exports.clearNotifications = async (req, res, next) => {
    try {
        notifications = [];
        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
        next(err);
    }
};
