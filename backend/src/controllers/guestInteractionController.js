let guestInteractions = [];

// Handle Guest Query
exports.handleGuestQuery = async (req, res, next) => {
    try {
        const { tableNumber, sessionId, query } = req.body;
        
        let response = "I'm a mock AI assistant. How can I help?";
        if (query.toLowerCase().includes('waiter')) {
            response = "I have notified the staff. A waiter will be at table " + tableNumber + " shortly.";
        } else if (query.toLowerCase().includes('bill')) {
            response = "I am processing your bill for table " + tableNumber + ".";
        }

        const newInteraction = {
            _id: Date.now().toString(),
            tableNumber,
            sessionId,
            query,
            response,
            status: 'Pending',
            createdAt: new Date()
        };
        guestInteractions.push(newInteraction);

        res.status(201).json({
            success: true,
            data: newInteraction
        });
    } catch (err) {
        next(err);
    }
};

// Get Pending Assistance
exports.getPendingAssistance = async (req, res, next) => {
    try {
        const pending = guestInteractions.filter(i => i.status === 'Pending');
        res.status(200).json({ success: true, data: pending });
    } catch (err) {
        next(err);
    }
};

// Resolve Assistance
exports.resolveAssistance = async (req, res, next) => {
    try {
        const id = req.params.id;
        const interaction = guestInteractions.find(i => i._id === id);
        
        if (!interaction) {
            return res.status(404).json({ success: false, message: 'Interaction not found' });
        }
        
        interaction.status = 'Resolved';
        res.status(200).json({ success: true, data: interaction });
    } catch (err) {
        next(err);
    }
};