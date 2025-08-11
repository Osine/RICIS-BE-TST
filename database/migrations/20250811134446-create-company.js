'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Companies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      physical_address: {
        type: Sequelize.STRING
      },
      company_cac_registration: {
        type: Sequelize.INTEGER
      },
      year_of_commencing_business: {
        type: Sequelize.INTEGER
      },
      number_of_employees: {
        type: Sequelize.INTEGER
      },
      membership_nagobin: {
        type: Sequelize.BOOLEAN
      },
      membership_leia: {
        type: Sequelize.BOOLEAN
      },
      membership_indt: {
        type: Sequelize.BOOLEAN
      },
      membership_others: {
        type: Sequelize.STRING
      },
      quality_cert_company: {
        type: Sequelize.STRING
      },
      competence_categoty: {
        type: Sequelize.STRING
      },
      competence_line: {
        type: Sequelize.INTEGER
      },
      incidental_line: {
        type: Sequelize.INTEGER
      },
      contact_person: {
        type: Sequelize.STRING
      },
      telephone: {
        type: Sequelize.INTEGER
      },
      email_address: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Companies');
  }
};