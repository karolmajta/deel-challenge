const { Op } = require("sequelize");
const { getProfile } = require("../middleware/getProfile");

function jobsRoutes(app) {
  /**
   * @openapi
   * /jobs/unpaid:
   *   get:
   *     description: Get contract
   *     parameters:
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
   */
  app.get("/jobs/unpaid", getProfile, async (req, res) => {
    const { Contract, Job } = req.app.get("models");
    const unpaidJobs = await Job.findAll({
      include: [{ model: Contract, required: true }],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { "$Contract.ClientId$": req.profile.id },
              { "$Contract.ContractorId$": req.profile.id },
            ],
          },
          { "$Contract.status$": "in_progress" },
          {
            [Op.or]: [{ paid: { [Op.ne]: true } }, { paid: { [Op.eq]: null } }],
          },
        ],
      },
    });
    res.json(unpaidJobs);
  });

  /**
   * @openapi
   * /jobs/{id}/pay:
   *   post:
   *     description: Pay for a job
   *     parameters:
   *      -  name: id
   *         description: Job id
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
   *         description: Pays for specified job marking it as paid. Moves required amount from client to contractor balance.
   *       400:
   *         description: Bad request - may indicate too low balance
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: No such unpaid job matching profile
   */
  app.post("/jobs/:id/pay", getProfile, async (req, res) => {
    const { Contract, Job, Profile } = req.app.get("models");
    const sequelize = req.app.get("sequelize");
    const { id } = req.params;
    const [paidJob, err] = await sequelize.transaction(async () => {
      const jobToPay = await Job.findOne({
        include: [
          {
            model: Contract,
            required: true,
          },
        ],
        where: {
          [Op.and]: [
            { id },
            { "$Contract.ClientId$": req.profile.id },
            {
              [Op.or]: [
                { paid: { [Op.ne]: true } },
                { paid: { [Op.eq]: null } },
              ],
            },
          ],
        },
      });

      if (!jobToPay) {
        return [null, 404];
      }

      const transferFrom = await Profile.findOne({
        where: { id: req.profile.id },
      });

      if (transferFrom.balance < jobToPay.price) {
        return [null, 400];
      }

      const transferTo = await Profile.findOne({
        where: { id: jobToPay.Contract.ContractorId },
      });

      jobToPay.set({
        paid: true,
        paymentDate: Date.now(),
      });
      await jobToPay.save();

      transferFrom.set({
        balance: transferFrom.balance - jobToPay.price,
      });
      await transferFrom.save();

      transferTo.set({
        balance: transferTo.balance + jobToPay.price,
      });
      await transferTo.save();

      return [jobToPay, null];
    });

    if (err) {
      res.status(err).send();
      return;
    }

    res.json(paidJob);
  });

  return app;
}

module.exports = jobsRoutes;
