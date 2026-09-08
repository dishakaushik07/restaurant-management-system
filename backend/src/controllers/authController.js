const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;
    let organization = await Organization.findOne({ name: orgName });
    if (!organization) {
      organization = await Organization.create({ name: orgName, email: `contact@${orgName}.com` });
    }
    const user = await User.create({ name, email, password, role: 'admin', organization: organization._id });
    res.status(201).json({ _id: user._id, name: user.name, token: generateToken(user._id) });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ _id: user._id, name: user.name, role: user.role, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) { res.status(400).json({ error: error.message }); }
};