const jwt = require('jsonwebtoken');
const { AdminStaff } = require('../sequelize/models'); 

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        status: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, 'your-secret-key'); 
    
    // Verify admin exists and has proper role
    const admin = await AdminStaff.findOne({
      where: { 
        id: decoded.id, 
        user_status: 'approved',
        userroleId: 1 // Super admin role
      }
    });

    if (!admin) {
      return res.status(401).json({ 
        status: false, 
        message: 'Invalid token or insufficient permissions.' 
      });
    }

    req.user = admin;
    next();
  } catch (error) {
    res.status(400).json({ 
      status: false, 
      message: 'Invalid token.' 
    });
  }
};

module.exports = adminAuth;