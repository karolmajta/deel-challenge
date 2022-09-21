const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const contractRoutes = require("./routes/contracts");
const jobsRoutes = require("./routes/jobs");
const balancesRoutes = require("./routes/balances");
const adminRoutes = require("./routes/admin");

function createApp({ sequelize }) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.set("sequelize", sequelize);
  app.set("models", sequelize.models);

  contractRoutes(app);
  jobsRoutes(app);
  balancesRoutes(app);
  adminRoutes(app);

  return app;
}
module.exports = createApp;
