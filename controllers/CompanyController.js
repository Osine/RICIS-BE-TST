const { Company } = require('../sequelize/models');
const { Op, Sequelize } = require('sequelize');
const validator = require('validator');

// Validation helper
const validateCompanyData = (data) => {
  const errors = [];
  
  if (!data.name?.trim()) errors.push('Company name is required');
  if (!data.physical_address?.trim()) errors.push('Physical address is required');
  if (!data.contact_person?.trim()) errors.push('Contact person is required');
  if (!data.email_address?.trim()) errors.push('Email address is required');
  
  if (data.email_address && !validator.isEmail(data.email_address)) {
    errors.push('Invalid email format');
  }
  
  if (data.year_of_commencing_business) {
    const year = parseInt(data.year_of_commencing_business);
    const currentYear = new Date().getFullYear();
    if (year > currentYear || year < 1800) {
      errors.push('Invalid year of commencing business');
    }
  }
  
  if (data.telephone && isNaN(data.telephone)) {
    errors.push('Telephone must be a valid number');
  }
  
  return errors;
};

// Sanitize input data
const sanitizeCompanyData = (data) => {
  return {
    name: data.name?.trim(),
    physical_address: data.physical_address?.trim(),
    company_cac_registration: data.company_cac_registration ? parseInt(data.company_cac_registration) : null,
    year_of_commencing_business: data.year_of_commencing_business ? parseInt(data.year_of_commencing_business) : null,
    number_of_employees: data.number_of_employees ? parseInt(data.number_of_employees) : null,
    membership_nagobin: Boolean(data.membership_nagobin),
    membership_leia: Boolean(data.membership_leia),
    membership_indt: Boolean(data.membership_indt),
    membership_others: data.membership_others?.trim() || null,
    quality_cert_company: data.quality_cert_company?.trim() || null,
    competence_categoty: data.competence_categoty?.trim() || null, // Note: typo preserved from original
    competence_line: data.competence_line ? parseInt(data.competence_line) : null,
    incidental_line: data.incidental_line ? parseInt(data.incidental_line) : null,
    contact_person: data.contact_person?.trim(),
    telephone: data.telephone ? parseInt(data.telephone) : null,
    email_address: data.email_address ? validator.normalizeEmail(data.email_address) : null
  };
};

exports.createCompany = async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateCompanyData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Sanitize data
    const sanitizedData = sanitizeCompanyData(req.body);

    // Check if company with same CAC registration already exists
    if (sanitizedData.company_cac_registration) {
      const existingCompany = await Company.findOne({
        where: { company_cac_registration: sanitizedData.company_cac_registration }
      });
      
      if (existingCompany) {
        return res.status(409).json({
          status: false,
          message: 'Company with this CAC registration already exists'
        });
      }
    }

    // Check if company with same email already exists
    const existingEmail = await Company.findOne({
      where: { email_address: sanitizedData.email_address }
    });
    
    if (existingEmail) {
      return res.status(409).json({
        status: false,
        message: 'Company with this email address already exists'
      });
    }

    const company = await Company.create(sanitizedData);

    res.status(201).json({
      status: true,
      message: 'Company created successfully',
      data: company
    });

  } catch (error) {
    console.error('Error creating company:', error);
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        status: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: false,
        message: 'Company already exists with provided details'
      });
    }

    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      membership,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * Math.min(parseInt(limit), 100); // Cap limit at 100

    let whereClause = {};
    
    // Text search across multiple fields
    if (search) {
      const searchTerm = search.trim();
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { contact_person: { [Op.iLike]: `%${searchTerm}%` } },
        { email_address: { [Op.iLike]: `%${searchTerm}%` } },
        { physical_address: { [Op.iLike]: `%${searchTerm}%` } }
      ];
      
      // If search term is a number, also search CAC registration
      if (!isNaN(searchTerm)) {
        whereClause[Op.or].push(
          { company_cac_registration: { [Op.eq]: parseInt(searchTerm) } }
        );
      }
    }

    // Filter by membership type
    if (membership && ['nagobin', 'leia', 'indt'].includes(membership)) {
      whereClause[`membership_${membership}`] = true;
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'createdAt', 'updatedAt', 'contact_person'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [[sortField, order]],
      attributes: { exclude: [] } // Include all fields, can be modified for security
    });

    res.status(200).json({
      status: true,
      message: 'Companies fetched successfully',
      data: {
        companies: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: Math.min(parseInt(limit), 100),
          totalPages: Math.ceil(count / Math.min(parseInt(limit), 100)),
          hasNext: (parseInt(page) * Math.min(parseInt(limit), 100)) < count,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid company ID'
      });
    }
    
    const company = await Company.findByPk(parseInt(id));
    
    if (!company) {
      return res.status(404).json({
        status: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Company fetched successfully',
      data: company
    });

  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid company ID'
      });
    }

    const company = await Company.findByPk(parseInt(id));
    
    if (!company) {
      return res.status(404).json({
        status: false,
        message: 'Company not found'
      });
    }

    // Validate updates
    const validationErrors = validateCompanyData({ ...company.toJSON(), ...req.body });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Sanitize update data
    const sanitizedUpdates = sanitizeCompanyData(req.body);
    
    // Remove undefined/null fields to avoid overwriting with null
    Object.keys(sanitizedUpdates).forEach(key => {
      if (sanitizedUpdates[key] === undefined || sanitizedUpdates[key] === null) {
        delete sanitizedUpdates[key];
      }
    });

    // Check for duplicate CAC registration (excluding current company)
    if (sanitizedUpdates.company_cac_registration) {
      const existingCompany = await Company.findOne({
        where: { 
          company_cac_registration: sanitizedUpdates.company_cac_registration,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCompany) {
        return res.status(409).json({
          status: false,
          message: 'Another company with this CAC registration already exists'
        });
      }
    }

    // Check for duplicate email (excluding current company)
    if (sanitizedUpdates.email_address) {
      const existingEmail = await Company.findOne({
        where: { 
          email_address: sanitizedUpdates.email_address,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingEmail) {
        return res.status(409).json({
          status: false,
          message: 'Another company with this email address already exists'
        });
      }
    }

    await company.update(sanitizedUpdates);

    res.status(200).json({
      status: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        status: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid company ID'
      });
    }
    
    const company = await Company.findByPk(parseInt(id));
    
    if (!company) {
      return res.status(404).json({
        status: false,
        message: 'Company not found'
      });
    }

    // Check if company has related records (add your business logic here)
    // const hasRelatedRecords = await checkForRelatedRecords(id);
    // if (hasRelatedRecords) {
    //   return res.status(400).json({
    //     status: false,
    //     message: 'Cannot delete company with existing records'
    //   });
    // }

    if (permanent === 'true') {
      await company.destroy({ force: true }); // Hard delete
    } else {
      await company.destroy(); // Soft delete (if paranoid: true in model)
    }

    res.status(200).json({
      status: true,
      message: `Company ${permanent === 'true' ? 'permanently ' : ''}deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};