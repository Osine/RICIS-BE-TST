'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('base_forms', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      version: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '1.0.0' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('form_types', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      base_form_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'base_forms', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      category: { type: DataTypes.STRING(100) },   // authorization | certification | registration
      requires_approval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      max_duration_days: { type: DataTypes.INTEGER },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_types', {
      fields: ['base_form_id','name'],
      type: 'unique',
      name: 'uq_form_types_base_name'
    });

    await queryInterface.createTable('form_fields', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      label: { type: DataTypes.STRING(255), allowNull: false },
      field_type: { type: DataTypes.STRING(50), allowNull: false },
      entity_binding: { type: DataTypes.JSONB },
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      validation_rules: { type: DataTypes.JSONB },
      default_value: { type: DataTypes.TEXT },
      placeholder: { type: DataTypes.TEXT },
      help_text: { type: DataTypes.TEXT },
      options: { type: DataTypes.JSONB },
      field_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_shared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('form_field_mappings', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_type_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_types', key: 'id' }, onDelete: 'CASCADE' },
      field_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_fields', key: 'id' }, onDelete: 'CASCADE' },
      is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      field_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      conditional_logic: { type: DataTypes.JSONB },
      validation_override: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_field_mappings', {
      fields: ['form_type_id','field_id'],
      type: 'unique',
      name: 'uq_form_field_mappings_form_field'
    });

    await queryInterface.createTable('form_steps', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_type_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_types', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: DataTypes.STRING(255), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      step_order: { type: DataTypes.INTEGER, allowNull: false },
      is_conditional: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      conditional_logic: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_steps', {
      fields: ['form_type_id','step_order'],
      type: 'unique',
      name: 'uq_form_steps_order_per_type'
    });

    await queryInterface.createTable('step_field_mappings', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      step_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_steps', key: 'id' }, onDelete: 'CASCADE' },
      field_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_fields', key: 'id' }, onDelete: 'CASCADE' },
      field_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('step_field_mappings', {
      fields: ['step_id','field_id'],
      type: 'unique',
      name: 'uq_step_field_mapping'
    });

    await queryInterface.createTable('form_rules', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_type_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'form_types', key: 'id' }, onDelete: 'CASCADE' },
      rule_name: { type: DataTypes.STRING(255), allowNull: false },
      trigger: { type: DataTypes.JSONB },
      effects: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('form_rules');
    await queryInterface.dropTable('step_field_mappings');
    await queryInterface.dropTable('form_steps');
    await queryInterface.dropTable('form_field_mappings');
    await queryInterface.dropTable('form_fields');
    await queryInterface.dropTable('form_types');
    await queryInterface.dropTable('base_forms');
  }
};
