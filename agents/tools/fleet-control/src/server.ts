import { configDotenv } from "dotenv";
import app from "./app.js";

configDotenv();

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`fleet-control MCP server listening on PORT ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});