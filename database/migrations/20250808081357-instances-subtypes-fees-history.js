'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Fees
    await queryInterface.createTable('fees', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      fee_type: { type: DataTypes.STRING(50), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
      calculation_logic: { type: DataTypes.JSONB },
      conditions: { type: DataTypes.JSONB },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('form_types_fees', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_type_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_types', key: 'id' }, onDelete: 'CASCADE' },
      fee_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'fees', key: 'id' }, onDelete: 'CASCADE' },
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      fee_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_types_fees', {
      fields: ['form_type_id','fee_id'],
      type: 'unique',
      name: 'uq_form_type_fee'
    });

    // Instances
    await queryInterface.createTable('form_instances', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_type_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_types', key: 'id' } },
      reference_number: { type: DataTypes.STRING(120), unique: true },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
      submitted_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
      submitted_at: { type: DataTypes.DATE },
      approved_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
      approved_at: { type: DataTypes.DATE },
      total_fees: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('form_instances', ['form_type_id']);
    await queryInterface.addIndex('form_instances', ['status']);
    await queryInterface.addIndex('form_instances', ['submitted_by']);

    await queryInterface.createTable('form_instance_subjects', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      subject_type: { type: DataTypes.STRING(20), allowNull: false },
      subject_id: { type: DataTypes.UUID, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_instance_subjects', {
      fields: ['form_instance_id'],
      type: 'unique',
      name: 'uq_form_instance_primary_subject'
    });

    // Subtypes
    await queryInterface.createTable('authorization_apps', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      type_of_service: { type: DataTypes.STRING(20) }, // nuclear | non_nuclear
      service_classes: { type: DataTypes.JSONB }, // array of {domain,line_no,label}
      exemption_requested: { type: DataTypes.BOOLEAN },
      is_reapplication: { type: DataTypes.BOOLEAN },
      meta: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('certification_apps', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      type_of_certification: { type: DataTypes.TEXT },
      certification_class: { type: DataTypes.TEXT },
      endorsements: { type: DataTypes.JSONB },
      training_start_date: { type: DataTypes.DATEONLY },
      training_end_date: { type: DataTypes.DATEONLY },
      training_org_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' } },
      training_method: { type: DataTypes.STRING(20) },
      employer_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' } },
      exemption_requested: { type: DataTypes.BOOLEAN },
      is_reapplication: { type: DataTypes.BOOLEAN },
      meta: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('registration_apps', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      type_of_installation: { type: DataTypes.STRING(30) },  // boiler | pressure_vessel
      type_of_facility: { type: DataTypes.TEXT },
      object_use: { type: DataTypes.STRING(20) },            // power | process | heating | other
      object_use_other: { type: DataTypes.TEXT },
      installation_start_date: { type: DataTypes.DATEONLY },
      installation_completion_date: { type: DataTypes.DATEONLY },
      installer_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' } },
      owner_id: { type: DataTypes.UUID, references: { model: 'organizations', key: 'id' } },
      equipment_id: { type: DataTypes.UUID, references: { model: 'equipment', key: 'id' } },
      variance_requested: { type: DataTypes.BOOLEAN },
      meta: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('reference_identifiers', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      ref_type: { type: DataTypes.STRING(20), allowNull: false }, // NGAN | NGACN | NGTAN | NGRN | EXAM_REG_NO
      value: { type: DataTypes.STRING(120), allowNull: false },
      issued_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('reference_identifiers', {
      fields: ['ref_type','value'],
      type: 'unique',
      name: 'uq_reference_identifiers_type_value'
    });

    await queryInterface.createTable('form_field_values', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      field_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_fields', key: 'id' } },
      field_value: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_field_values', {
      fields: ['form_instance_id','field_id'],
      type: 'unique',
      name: 'uq_form_field_value_per_instance'
    });

    await queryInterface.createTable('form_instance_fees', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      fee_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'fees', key: 'id' } },
      calculated_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
      calculation_details: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_instance_fees', {
      fields: ['form_instance_id','fee_id'],
      type: 'unique',
      name: 'uq_form_instance_fee_once'
    });

    await queryInterface.createTable('form_history', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_instances', key: 'id' }, onDelete: 'CASCADE' },
      action: { type: DataTypes.STRING(100), allowNull: false },
      performed_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
      performed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      details: { type: DataTypes.JSONB },
      previous_values: { type: DataTypes.JSONB },
      new_values: { type: DataTypes.JSONB }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('form_history');
    await queryInterface.dropTable('form_instance_fees');
    await queryInterface.dropTable('form_field_values');
    await queryInterface.dropTable('reference_identifiers');
    await queryInterface.dropTable('registration_apps');
    await queryInterface.dropTable('certification_apps');
    await queryInterface.dropTable('authorization_apps');
    await queryInterface.dropTable('form_instance_subjects');
    await queryInterface.dropTable('form_instances');
    await queryInterface.dropTable('form_types_fees');
    await queryInterface.dropTable('fees');
  }
};
