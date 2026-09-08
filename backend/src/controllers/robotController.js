const Robot = require("../models/Robot"); // <-- Yahan sirf ek baar '../' hoga

exports.registerRobot = async (req, res) => {
  try {
    const robot = await Robot.create({ ...req.body, organization: req.user.organization });
    res.status(201).json(robot);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};

exports.updateTelemetry = async (req, res) => {
  try {
    const { apiKey } = req.headers;
    if (!apiKey) return res.status(401).json({ message: "No API Key provided" });
    
    const robot = await Robot.findOneAndUpdate(
      { apiKey },
      { batteryLevel: req.body.batteryLevel, status: req.body.status },
      { new: true }
    );
    
    if (!robot) return res.status(404).json({ message: "Robot not found" });
    
    req.io.emit("robotTelemetry", robot);
    res.json(robot);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};