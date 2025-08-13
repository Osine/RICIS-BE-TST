const express = require('express');
const router = express.Router();
const formController = require('../controllers/FormController');
const userAuth = require('../middlewares/userAuth');
const adminAuth = require('../middlewares/adminAuth');

// Form type routes (public - for getting form templates)
router.get('/types', formController.getFormTypes);
router.get('/types/:type/subtypes', formController.getFormSubtypes);
router.get('/types/:type/template', formController.getFormTemplate);

// User routes (authenticated users only)
router.use(userAuth); // All routes below require user authentication

// Create and manage applications
router.post('/applications', formController.createApplication);
router.get('/applications', formController.getUserApplications);
router.get('/applications/:id', formController.getApplicationById);
router.put('/applications/:id', formController.updateApplication);
router.delete('/applications/:id', formController.deleteApplication);

// Submit application for review
router.post('/applications/:id/submit', formController.submitApplication);

// Upload documents for applications
router.post('/applications/:id/documents', formController.uploadDocuments);
router.delete('/applications/:id/documents/:documentId', formController.deleteDocument);

// Admin routes (admin authentication required)
router.use(adminAuth); // All routes below require admin authentication

// Admin application management
router.get('/admin/applications', formController.getAllApplications);
router.get('/admin/applications/:id', formController.getApplicationForReview);
router.post('/admin/applications/:id/review', formController.reviewApplication);
router.post('/admin/applications/:id/comments', formController.addComment);
router.get('/admin/applications/stats', formController.getApplicationStats);

// Admin form template management
router.post('/admin/templates', formController.createFormTemplate);
router.put('/admin/templates/:id', formController.updateFormTemplate);
router.delete('/admin/templates/:id', formController.deleteFormTemplate);

module.exports = router;