const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/CompanyController');
const adminAuth = require('../middleware/adminAuth');

// All company routes require admin authentication
router.use(adminAuth);

// Company CRUD routes
router.post('/', CompanyController.createCompany);
router.get('/', CompanyController.getAllCompanies);
router.get('/:id', CompanyController.getCompanyById);
router.put('/:id', CompanyController.updateCompany);
router.delete('/:id', CompanyController.deleteCompany);

module.exports = router;