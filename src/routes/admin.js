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

  app.get("/admin/best-clients", async (req, res) => {
    const { Job, Contract, Profile } = req.app.get("models");
    const sequelize = req.app.get("sequelize");
    const start = moment(req.query.start, "YYYY-MM-DD");
    const end = moment(req.query.end, "YYYY-MM-DD");
    const limit = parseInt(req.query.limit || "2", 10);

    const paramsInvalid =
      !start.isValid() ||
      !end.isValid() ||
      start.isAfter(end) ||
      isNaN(limit) ||
      limit < 0;

    if (paramsInvalid) {
      res.status(400).send();
      return;
    }

    const startDate = start.startOf("day").toDate();
    const endDate = end.endOf("day").toDate();

    const result = await Job.findAll({
      raw: true,
      nest: true,
      include: {
        model: Contract,
        required: true,
        include: {
          model: Profile,
          required: true,
          as: "Client",
        },
      },
      where: {
        paid: { [Op.eq]: true },
        [Op.and]: [
          { paymentDate: { [Op.gt]: startDate } },
          { paymentDate: { [Op.lte]: endDate } },
        ],
      },
      group: ["Contract.ClientId"],
      attributes: [
        [sequelize.fn("sum", sequelize.col("Job.price")), "totalSpent"],
      ],
      order: [["totalSpent", "desc"]],
      limit: limit,
    });

    if (!result) {
      res.status(404).send();
      return;
    }

    res.json(
      result.map((r) => ({
        Client: r.Contract.Client,
        totalSpent: r.totalSpent,
      }))
    );
  });

  return app;
}

module.exports = adminRoutes;
