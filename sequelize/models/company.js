'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Company.init({
    name: DataTypes.STRING,
    physical_address: DataTypes.STRING,
    company_cac_registration: DataTypes.INTEGER,
    year_of_commencing_business: DataTypes.INTEGER,
    number_of_employees: DataTypes.INTEGER,
    membership_nagobin: DataTypes.BOOLEAN,
    membership_leia: DataTypes.BOOLEAN,
    membership_indt: DataTypes.BOOLEAN,
    membership_others: DataTypes.STRING,
    quality_cert_company: DataTypes.STRING,
    competence_categoty: DataTypes.STRING,
    competence_line: DataTypes.INTEGER,
    incidental_line: DataTypes.INTEGER,
    contact_person: DataTypes.STRING,
    telephone: DataTypes.INTEGER,
    email_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Company',
  });
  return Company;
};