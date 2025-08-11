'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('users', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      first_name: { type: DataTypes.STRING(100) },
      last_name: { type: DataTypes.STRING(100) },
      role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'user' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('organizations', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      physical_address: { type: DataTypes.TEXT },
      cac_registration_number: { type: DataTypes.STRING(100) },
      year_commencing_business: { type: DataTypes.INTEGER },
      number_of_employees: { type: DataTypes.INTEGER },
      membership_nagobin: { type: DataTypes.BOOLEAN },
      membership_leia: { type: DataTypes.BOOLEAN },
      membership_indt: { type: DataTypes.BOOLEAN },
      membership_other: { type: DataTypes.JSONB },
      quality_certifications: { type: DataTypes.JSONB },
      competence_category: { type: DataTypes.TEXT },
      competence_line_no: { type: DataTypes.TEXT },
      incidental_line_no: { type: DataTypes.TEXT },
      contact_person: { type: DataTypes.STRING(255) },
      contact_phone: { type: DataTypes.STRING(50) },
      contact_email: { type: DataTypes.STRING(255) },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('people', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      organization_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL' },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      address: { type: DataTypes.TEXT },
      dob: { type: DataTypes.DATEONLY },
      email: { type: DataTypes.STRING(255) },
      phone: { type: DataTypes.STRING(50) },
      role_title: { type: DataTypes.STRING(120) },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('person_education', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      person_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'people', key: 'id' }, onDelete: 'CASCADE' },
      school_name: { type: DataTypes.TEXT, allowNull: false },
      date_admitted: { type: DataTypes.DATEONLY },
      date_completed: { type: DataTypes.DATEONLY },
      qualification: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('person_qualifications', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      person_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'people', key: 'id' }, onDelete: 'CASCADE' },
      institution: { type: DataTypes.TEXT },
      date_issued: { type: DataTypes.DATEONLY },
      expiry_date: { type: DataTypes.DATEONLY },
      details: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('person_experience', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      person_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'people', key: 'id' }, onDelete: 'CASCADE' },
      company_name: { type: DataTypes.TEXT },
      date_joined: { type: DataTypes.DATEONLY },
      date_exited: { type: DataTypes.DATEONLY },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('equipment', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      manufacturer: { type: DataTypes.TEXT },
      year_of_manufacture: { type: DataTypes.INTEGER },
      place_of_manufacture: { type: DataTypes.TEXT },
      code_of_construction: { type: DataTypes.TEXT },
      intended_use: { type: DataTypes.TEXT },
      is_new: { type: DataTypes.BOOLEAN },
      inspection_agency_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' }, onDelete: 'SET NULL' },
      aia_authorization_no: { type: DataTypes.STRING(100) },
      hydro_test_date: { type: DataTypes.DATEONLY },
      hydro_test_pressure: { type: DataTypes.TEXT },
      design_pressure: { type: DataTypes.TEXT },
      mawp_mdmt: { type: DataTypes.TEXT },
      equipment_type: { type: DataTypes.TEXT },
      distinctive_no: { type: DataTypes.TEXT },
      operating_medium: { type: DataTypes.TEXT },
      equipment_category: { type: DataTypes.TEXT },
      equipment_sub_category: { type: DataTypes.TEXT },
      equipment_classification: { type: DataTypes.TEXT },
      equipment_line_no: { type: DataTypes.TEXT },
      equipment_incidental_no: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('equipment');
    await queryInterface.dropTable('person_experience');
    await queryInterface.dropTable('person_qualifications');
    await queryInterface.dropTable('person_education');
    await queryInterface.dropTable('people');
    await queryInterface.dropTable('organizations');
    await queryInterface.dropTable('users');
  }
};
