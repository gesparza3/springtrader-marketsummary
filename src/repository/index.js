const fs = require("fs");
const util = require("util");
const mongoose = require("mongoose");
const watch = require("node-watch");

let connection, watcher;
const MONGODB_CREDENTIALS_FILE = "/vault/secrets/mongodb.json";

const getConnection = () => {
    if (!connection) {
        throw new Error("monogodb connection hasn't been created yet");
    }

    return connection;
};

const setConnection = async (username, password) => {
  const newConnection = await mongoose.createConnection(
    `mongodb://${username}:${password}@mongodb.${process.env.DATABASE_NAMESPACE}.svc.cluster.local:27017/${process.env.NODE_ENV}`
  );

  connection = newConnection;
}

const getDatabaseCredentials = async () => {
    const data = await util.promisify(fs.readFile)(MONGODB_CREDENTIALS_FILE);

    return JSON.parse(data);
};

const start = async () => {
    const { username, password } = await getDatabaseCredentials();

    await setConnection(username, password);

    watcher = watch(MONGODB_CREDENTIALS_FILE, async () => {
        const { username, password } = await getDatabaseCredentials();
        await setConnection(username, password);
    });
};

const stop = async () => {
    if (watcher) {
        watcher.close();
    }

    if (connection) {
        await connection.close();
    }
};

module.exports = {
    start,
    stop,
    getConnection,
};
