const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Op } = require("sequelize");
const { getProfile } = require("./middleware/getProfile");

function createApp({ sequelize }) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.set("sequelize", sequelize);
  app.set("models", sequelize.models);

  /**
   * @returns contract
   *
   * @openapi
   * /contracts/{id}:
   *   get:
   *     description: Get contract
   *     parameters:
   *      -  name: id
   *         description: Contract id
   *         in: path
   *         schema:
   *           type: integer
   *           required: true
   *      -  name: profile_id
   *         description: Profile id
   *         in: header
   *         schema:
   *           type: string
   *           required: true
   *     responses:
   *       200:
   *         description: Returns a contract belonging to provider profile.
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: No such contract for given profile.
   */
  app.get("/contracts/:id", getProfile, async (req, res) => {
    const { Contract } = req.app.get("models");
    const { id } = req.params;
    const contract = await Contract.findOne({
      where: {
        id: id,
        [Op.or]: [
          { ClientId: req.profile.id },
          { ContractorId: req.profile.id },
        ],
      },
    });
    if (!contract) return res.status(404).end();
    res.json(contract);
  });

  return app;
}
module.exports = createApp;
