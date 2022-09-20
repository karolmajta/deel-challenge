const createApp = require("./app");
const { createSequelize } = require("./model");

async function main() {
  const app = createApp({
    sequelize: createSequelize(),
  });
  try {
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}

main();
