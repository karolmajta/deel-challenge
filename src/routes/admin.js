const moment = require("moment");
const { Op } = require("sequelize");

function adminRoutes(app) {
  app.get("/admin/best-profession", async (req, res) => {
    const { Job, Contract, Profile } = req.app.get("models");
    const sequelize = req.app.get("sequelize");
    const start = moment(req.query.start, "YYYY-MM-DD");
    const end = moment(req.query.end, "YYYY-MM-DD");

    const paramsInvalid =
      !start.isValid() || !end.isValid() || start.isAfter(end);

    if (paramsInvalid) {
      res.status(400).send();
      return;
    }

    const startDate = start.startOf("day").toDate();
    const endDate = end.endOf("day").toDate();
    console.log(startDate, endDate);

    const result = await Job.findOne({
      raw: true,
      include: {
        model: Contract,
        required: true,
        include: {
          model: Profile,
          required: true,
          as: "Contractor",
        },
      },
      where: {
        paid: { [Op.eq]: true },
        [Op.and]: [
          { paymentDate: { [Op.gt]: startDate } },
          { paymentDate: { [Op.lte]: endDate } },
        ],
      },
      group: ["Contract.Contractor.profession"],
      attributes: [
        [sequelize.fn("sum", sequelize.col("Job.price")), "totalEarned"],
      ],
      order: [["totalEarned", "desc"]],
    });

    if (!result) {
      res.status(404).send();
      return;
    }

    res.json({
      profession: result["Contract.Contractor.profession"],
    });
  });

  return app;
}

module.exports = adminRoutes;
