const { getProfile } = require("../middleware/getProfile");
const { Op } = require("sequelize");

function contractsRoutes(app) {
  /**
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
   *         description: Returns a contract belonging to provided profile.
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

  /**
   * @openapi
   * /contracts:
   *   get:
   *     description: Get contracts
   *     parameters:
   *      -  name: profile_id
   *         description: Profile id
   *         in: header
   *         schema:
   *           type: string
   *           required: true
   *     responses:
   *       200:
   *         description: Returns all non-terminated contracts belonging to provided profile.
   *       401:
   *         description: Unauthorized
   */
  app.get("/contracts", getProfile, async (req, res) => {
    const { Contract } = req.app.get("models");
    const contracts = await Contract.findAll({
      where: {
        status: {
          [Op.not]: "terminated",
        },
        [Op.or]: [
          { ClientId: req.profile.id },
          { ContractorId: req.profile.id },
        ],
      },
    });
    res.json(contracts);
  });

  return app;
}

module.exports = contractsRoutes;
