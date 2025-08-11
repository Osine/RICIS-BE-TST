const { Company } = require('../sequelize/models');

exports.createCompany = async (req, res) => {
  try {
    const {
      name,
      physical_address,
      company_cac_registration,
      year_of_commencing_business,
      number_of_employees,
      membership_nagobin,
      membership_leia,
      membership_indt,
      membership_others,
      quality_cert_company,
      competence_categoty, // Note: You might want to fix this typo to 'competence_category'
      competence_line,
      incidental_line,
      contact_person,
      telephone,
      email_address
    } = req.body;

    // Validation
    if (!name || !physical_address || !contact_person || !email_address) {
      return res.status(400).json({
        status: false,
        message: 'Required fields: name, physical_address, contact_person, email_address'
      });
    }

    // Check if company with same CAC registration already exists
    if (company_cac_registration) {
      const existingCompany = await Company.findOne({
        where: { company_cac_registration }
      });
      
      if (existingCompany) {
        return res.status(400).json({
          status: false,
          message: 'Company with this CAC registration already exists'
        });
      }
    }

    const company = await Company.create({
      name,
      physical_address,
      company_cac_registration,
      year_of_commencing_business,
      number_of_employees,
      membership_nagobin: membership_nagobin || false,
      membership_leia: membership_leia || false,
      membership_indt: membership_indt || false,
      membership_others,
      quality_cert_company,
      competence_categoty,
      competence_line,
      incidental_line,
      contact_person,
      telephone,
      email_address
    });

    res.status(201).json({
      status: true,
      message: 'Company created successfully',
      data: company
    });

  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { contact_person: { [Op.iLike]: `%${search}%` } },
          { email_address: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: true,
      message: 'Companies fetched successfully',
      data: {
        companies: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
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
    
    const company = await Company.findByPk(id);
    
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
    const updates = req.body;

    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        status: false,
        message: 'Company not found'
      });
    }

    await company.update(updates);

    res.status(200).json({
      status: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        status: false,
        message: 'Company not found'
      });
    }

    await company.destroy();

    res.status(200).json({
      status: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};