const swaggerJsdoc = require("swagger-jsdoc");
const express = require("express");
const swaggerUi = require("swagger-ui-express");

const options = {
  failOnErrors: true,
  definition: {
    host: "localhost:3001",
    scheme: "http",
    components: {},
  },
  apis: ["./openapi/*.yaml", "./src/routes/*.js"],
};

const swaggerDocument = swaggerJsdoc(options);
const app = express();
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

try {
  app.listen(3002, () => {
    console.log("API docs listening on Port 3002");
  });
} catch (error) {
  console.error(`An error occurred: ${JSON.stringify(error)}`);
  process.exit(1);
}
