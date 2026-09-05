const Table = require('../models/Table');

exports.createTable = async (req, res) => {
  try {
    const table = await Table.create({ ...req.body, organization: req.user.organization });
    res.status(201).json(table);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({ organization: req.user.organization });
    res.json(tables);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const table = await Table.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      { status },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found' });
    req.io.emit('tableStatusChanged', table);
    res.json(table);
  } catch (error) { res.status(400).json({ error: error.message }); }
};
