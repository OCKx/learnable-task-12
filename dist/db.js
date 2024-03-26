"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseModule = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let dbConnection;
const MONGO_URL = process.env.MONGO_URL || "";
const databaseModule = {
    connectToDb: (cb) => {
        mongodb_1.MongoClient.connect(MONGO_URL)
            .then((client) => {
            dbConnection = client.db();
            console.log("connected successfully");
            cb();
        })
            .catch((err) => {
            console.log(err);
            console.log('cannot connect.....');
            cb(err);
        });
    },
    getDb: () => dbConnection,
};
exports.databaseModule = databaseModule;
