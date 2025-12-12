// ---------------------------------------------------------------------
// <copyright file="db.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.MYSQLHOST || "localhost";
const dbUser = process.env.MYSQLUSER || "root";
const dbPassword = process.env.MYSQLPASSWORD || "";
const dbName = process.env.MYSQL_DATABASE || "event_booking";
const dbPort = Number(process.env.MYSQLPORT) || 3306;

const isCloudDB =
  !dbHost.includes("localhost") && !dbHost.includes("127.0.0.1");

const dbConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};


if (isCloudDB) {
  dbConfig.ssl = { rejectUnauthorized: false };
}


console.log("Database Configuration Loaded:", {
  host: dbHost,
  user: dbUser,
  database: dbName,
  port: dbPort,
  ssl: isCloudDB ? "ENABLED" : "DISABLED",
});


const pool = mysql.createPool(dbConfig);

export default pool.promise();
