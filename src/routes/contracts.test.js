const Client = require("test-client");
const createApp = require("../app");
const { createSequelize } = require("../model");

describe("GET /contracts/:id", () => {
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
      const response = await client.get("/contracts/1").send();
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
        type: "contractor",
      });
      await sequelize.models.Contract.create({
        id: 1,
        terms: "bla bla bla",
        status: "terminated",
        ClientId: 1,
        ContractorId: 2,
      });
    });

    test("returns 200 when accessing contract matching client profile", async () => {
      const response = await client
        .get("/contracts/1")
        .set("profile_id", "1")
        .send();
      response.assert(200);
    });

    test("returns 200 when accessing contract matching contractor profile", async () => {
      const response = await client
        .get("/contracts/1")
        .set("profile_id", "2")
        .send();
      response.assert(200);
    });

    test("returns 404 when accessing contract not matching any profiles", async () => {
      const response = await client
        .get("/contracts/1")
        .set("profile_id", "3")
        .send();
      response.assert(404);
    });

    test("returns 404 when accessing non-existing contract", async () => {
      const response = await client
        .get("/contracts/2")
        .set("profile_id", "1")
        .send();
      response.assert(404);
    });
  });
});

describe("GET /contracts", () => {
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
      const response = await client.get("/contracts").send();
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
        status: "new",
        ClientId: 1,
        ContractorId: 2,
      });
      await sequelize.models.Contract.create({
        id: 3,
        terms: "bla bla bla",
        status: "in_progress",
        ClientId: 1,
        ContractorId: 2,
      });
    });

    test("returns 200 with only non-terminated contracts", async () => {
      const response = await client
        .get("/contracts")
        .set("profile_id", "1")
        .send();
      expect(response.body.length).toEqual(2);
    });
  });
});
