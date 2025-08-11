'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('categories', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      domain: { type: DataTypes.STRING(60), allowNull: false },
      line_no: { type: DataTypes.INTEGER, allowNull: false },
      category: { type: DataTypes.TEXT, allowNull: false },
      sub_category: { type: DataTypes.TEXT },
      classification: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('categories', {
      fields: ['domain','line_no'],
      type: 'unique',
      name: 'uq_categories_domain_line'
    });

    await queryInterface.createTable('incidental_categories', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      domain: { type: DataTypes.STRING(60), allowNull: false },
      line_no: { type: DataTypes.INTEGER, allowNull: false },
      category: { type: DataTypes.TEXT, allowNull: false },
      sub_category: { type: DataTypes.TEXT },
      classification: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('incidental_categories', {
      fields: ['domain','line_no'],
      type: 'unique',
      name: 'uq_incidental_domain_line'
    });

    await queryInterface.createTable('attachment_types', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(255), allowNull: false },
      allowed_mime: { type: DataTypes.ARRAY(DataTypes.TEXT) },
      required_conditions: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('attachments', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      owner_type: { type: DataTypes.STRING(20), allowNull: false },
      owner_id: { type: DataTypes.UUID, allowNull: false },
      attachment_type_id: { type: DataTypes.UUID, references: { model: 'attachment_types', key: 'id' } },
      file_path: { type: DataTypes.TEXT, allowNull: false },
      mime_type: { type: DataTypes.TEXT },
      issuer: { type: DataTypes.TEXT },
      issue_date: { type: DataTypes.DATEONLY },
      expiry_date: { type: DataTypes.DATEONLY },
      meta: { type: DataTypes.JSONB },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('form_instance_attachments', {
      id: { type: DataTypes.UUID, defaultValue: Sequelize.literal('uuid_generate_v4()'), primaryKey: true },
      form_instance_id: { type: DataTypes.UUID, allowNull: false },
      attachment_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'attachments', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('form_instance_attachments', {
      fields: ['form_instance_id','attachment_id'],
      type: 'unique',
      name: 'uq_form_instance_attachment'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('form_instance_attachments');
    await queryInterface.dropTable('attachments');
    await queryInterface.dropTable('attachment_types');
    await queryInterface.dropTable('incidental_categories');
    await queryInterface.dropTable('categories');
  }
};
