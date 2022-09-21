const Client = require("test-client");
const createApp = require("../app");
const { createSequelize } = require("../model");

describe("POST /balances/deposit/:id", () => {
  let sequelize;
  let app;
  let client;

  beforeEach(async () => {
    sequelize = createSequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
    });
    await sequelize.models.Profile.sync({ force: true });
    await sequelize.models.Contract.sync({ force: true });
    await sequelize.models.Job.sync({ force: true });
    app = createApp({ sequelize });
    client = new Client(app);
  });

  describe("unauthorized", () => {
    test("returns 401 when no authorization", async () => {
      const response = await client
        .post("/balances/deposit/30")
        .type("application/json")
        .send({});
      response.assert(401);
    });
  });

  describe("authorized", () => {
    beforeEach(async () => {
      await sequelize.models.Profile.create({
        id: 1,
        firstName: "Harry",
        lastName: "Potter",
        profession: "Wizard",
        balance: 1150,
        type: "client",
      });
      await sequelize.models.Profile.create({
        id: 2,
        firstName: "Mr",
        lastName: "Robot",
        profession: "Hacker",
        balance: 231.11,
        type: "contractor",
      });
      await sequelize.models.Profile.create({
        id: 3,
        firstName: "Mr",
        lastName: "Robot 2",
        profession: "Hacker",
        balance: 231.11,
        type: "client",
      });
      await sequelize.models.Contract.create({
        id: 1,
        terms: "bla bla bla",
        status: "terminated",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 200,
        paid: true,
        paymentDate: "2020-08-15T19:11:26.737Z",
        ContractId: 1,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 200,
        ContractId: 1,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 201,
        ContractId: 1,
      });
    });

    test("returns 403 when trying to deposit to contractor's balance", async () => {
      const response = await client
        .post("/balances/deposit/2")
        .set("profile_id", "1")
        .type("application/json")
        .send({ amount: 20 });
      response.assert(403);
    });

    test("returns 403 when trying to deposit to other client's balance", async () => {
      const response = await client
        .post("/balances/deposit/3")
        .set("profile_id", "1")
        .type("application/json")
        .send({ amount: 20 });
      response.assert(403);
    });

    test("returns 400 on invalid body", async () => {
      const response = await client
        .post("/balances/deposit/1")
        .set("profile_id", "1")
        .type("application/json")
        .send({ amount: -2 });
      response.assert(400);
    });

    test("returns 400 if deposited amount exceeds 25% of total unpaid jobs", async () => {
      const response = await client
        .post("/balances/deposit/1")
        .set("profile_id", "1")
        .type("application/json")
        .send({ amount: 101 });
      response.assert(400);
    });

    test("returns 200 and successfully deposits money to profile", async () => {
      const response = await client
        .post("/balances/deposit/1")
        .set("profile_id", "1")
        .type("application/json")
        .send({ amount: 100 });
      response.assert(200);

      const profile = await sequelize.models.Profile.findOne({
        where: { id: 1 },
      });
      expect(profile.balance).toEqual(1250);
    });
  });
});
