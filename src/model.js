const Sequelize = require("sequelize");

class Profile extends Sequelize.Model {}
class Contract extends Sequelize.Model {}
class Job extends Sequelize.Model {}

function createSequelize(params = {}) {
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite3",
    ...params,
  });

  Profile.init(
    {
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      profession: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
      },
      type: {
        type: Sequelize.ENUM("client", "contractor"),
      },
    },
    {
      sequelize,
      modelName: "Profile",
    }
  );

  Contract.init(
    {
      terms: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("new", "in_progress", "terminated"),
      },
    },
    {
      sequelize,
      modelName: "Contract",
    }
  );

  Job.init(
    {
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      paid: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      paymentDate: {
        type: Sequelize.DATE,
      },
    },
    {
      sequelize,
      modelName: "Job",
    }
  );

  Profile.hasMany(Contract, { as: "Contractor", foreignKey: "ContractorId" });
  Contract.belongsTo(Profile, { as: "Contractor" });
  Profile.hasMany(Contract, { as: "Client", foreignKey: "ClientId" });
  Contract.belongsTo(Profile, { as: "Client" });
  Contract.hasMany(Job);
  Job.belongsTo(Contract);

  return sequelize;
}

module.exports = {
  createSequelize,
  Profile,
  Contract,
  Job,
};
