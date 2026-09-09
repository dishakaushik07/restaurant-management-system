// Get latest analytics data
let mockAnalytics = {
    predictedOrders: 150,
    actualOrders: 135,
    foodWasteKg: 12.5,
    anomalies: [
        { type: 'Inventory', description: 'Low on Tomatoes', severity: 'Medium', timestamp: new Date() }
    ]
};

exports.getAnalytics = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: mockAnalytics
        });
    } catch (err) {
        next(err);
    }
};

// Add anomaly
exports.addAnomaly = async (req, res, next) => {
    try {
        const { type, description, severity } = req.body;
        mockAnalytics.anomalies.push({ type, description, severity, timestamp: new Date() });

        res.status(201).json({
            success: true,
            data: mockAnalytics
        });
    } catch (err) {
        next(err);
    }
};
