const { Op } = require("sequelize");
const { validate } = require("jsonschema");
const { getProfile } = require("../middleware/getProfile");

function balancesRoutes(app) {
  /**
   * @openapi
   * /balances/deposit/{id}:
   *   post:
   *     description: Deposit money to client profile
   *     consumes:
   *       - application/json
   *     parameters:
   *      -  name: id
   *         description: Id of client profile to deposit money to
   *         in: path
   *         schema:
   *           type: string
   *           required: true
   *      -  name: payload
   *         description: Object containing amount to deposit
   *         in: body
   *         schema:
   *           type: object
   *           properties:
   *             amount:
   *               type: number
   *               required: true
   *           required: true
   *      -  name: profile_id
   *         description: Profile id
   *         in: header
   *         schema:
   *           type: string
   *           required: true
   *     responses:
   *       200:
   *         description: Returns all unpaid jobs (for active contracts) matching provided profile.
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Invalid profile to deposit to
   */
  app.post("/balances/deposit/:id", getProfile, async (req, res) => {
    const { Profile, Job, Contract } = req.app.get("models");
    const sequelize = req.app.get("sequelize");
    const { id } = req.params;

    const { errors } = validate(req.body, {
      type: "object",
      properties: {
        amount: {
          type: "number",
          required: true,
        },
      },
    });

    if (errors.length > 0) {
      res.status(400).send();
      return;
    }

    const [profile, err] = await sequelize.transaction(async () => {
      const profileToDepositTo = await Profile.findOne({
        where: { id, type: "client" },
      });
      if (!profileToDepositTo || req.profile.id !== profileToDepositTo.id) {
        return [null, 403];
      }
      let { totalUnpaidJobsPrice } = await Job.findOne({
        raw: true,
        include: {
          model: Contract,
          required: true,
        },
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { paid: { [Op.ne]: true } },
                { paid: { [Op.eq]: null } },
              ],
            },
            { "$Contract.ClientId$": profileToDepositTo.id },
          ],
        },
        attributes: [
          [sequelize.fn("sum", sequelize.col("price")), "totalUnpaidJobsPrice"],
        ],
      });

      totalUnpaidJobsPrice = totalUnpaidJobsPrice || 0;

      if (
        req.body.amount > 0.25 * totalUnpaidJobsPrice ||
        req.body.amount < 0
      ) {
        return [null, 400];
      }

      profileToDepositTo.set({
        balance: profileToDepositTo.balance + req.body.amount,
      });
      await profileToDepositTo.save();

      return [profileToDepositTo, null];
    });

    if (err) {
      res.status(err).send();
      return;
    }

    res.json(profile);
  });

  return app;
}

module.exports = balancesRoutes;
