const Client = require("test-client");
const createApp = require("../app");
const { createSequelize } = require("../model");

describe("GET /jobs/unpaid", () => {
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
      const response = await client.get("/jobs/unpaid").send();
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
      await sequelize.models.Contract.create({
        id: 1,
        terms: "bla bla bla",
        status: "terminated",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Contract.create({
        id: 2,
        terms: "bla bla bla",
        status: "in_progress",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Contract.create({
        id: 3,
        terms: "bla bla bla",
        status: "new",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 200,
        ContractId: 1,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 200,
        ContractId: 2,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 2020,
        paid: true,
        paymentDate: "2020-08-15T19:11:26.737Z",
        ContractId: 2,
      });
      await sequelize.models.Job.create({
        description: "work",
        price: 200,
        ContractId: 3,
      });
    });

    test("returns 200 with unpaid jobs from active contracts matching profile", async () => {
      const response = await client
        .get("/jobs/unpaid")
        .set("profile_id", "1")
        .send();
      response.assert(200);
      expect(response.body.length).toEqual(1);
    });
  });
});

describe("POST /jobs/:id/pay", () => {
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
      const response = await client.post("/jobs/1/pay").send();
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
      await sequelize.models.Contract.create({
        id: 1,
        terms: "bla bla bla",
        status: "terminated",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Contract.create({
        id: 2,
        terms: "bla bla bla",
        status: "in_progress",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Contract.create({
        id: 3,
        terms: "bla bla bla",
        status: "new",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Job.create({
        id: 1,
        description: "work",
        price: 200,
        ContractId: 1,
      });
      await sequelize.models.Job.create({
        id: 2,
        description: "work",
        price: 200,
        ContractId: 2,
      });
      await sequelize.models.Job.create({
        id: 3,
        description: "work",
        price: 2020,
        paid: true,
        paymentDate: "2020-08-15T19:11:26.737Z",
        ContractId: 2,
      });
      await sequelize.models.Job.create({
        id: 4,
        description: "work",
        price: 200,
        ContractId: 3,
      });
    });

    test("returns 404 when no matching unpaid job", async () => {
      const response = await client
        .post("/jobs/3/pay")
        .set("profile_id", "1")
        .send();
      response.assert(404);
    });

    test("returns 400 when balance is too low", async () => {
      const job = await sequelize.models.Job.findOne({
        where: { id: 1 },
      });
      job.set({ price: 1000 });
      await job.save();

      const clientProfile = await sequelize.models.Profile.findOne({
        where: { id: 1 },
      });
      clientProfile.set({ balance: 990 });
      await clientProfile.save();

      const response = await client
        .post("/jobs/1/pay")
        .set("profile_id", "1")
        .send();
      response.assert(400);
    });

    test("retuns 200, correctly transfers funds and resolves jobs, when ok", async () => {
      const response = await client
        .post("/jobs/1/pay")
        .set("profile_id", "1")
        .send();
      response.assert(200);

      const job = await sequelize.models.Job.findOne({
        where: { id: 1 },
      });

      const clientProfile = await sequelize.models.Profile.findOne({
        where: { id: 1 },
      });

      const contractorProfile = await sequelize.models.Profile.findOne({
        where: { id: 2 },
      });

      expect(job.paid).toBe(true);
      expect(clientProfile.balance).toEqual(950);
      expect(contractorProfile.balance).toEqual(431.11);
    });
  });
});
