import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let dbConnection: Db | undefined;
const MONGO_URL: string = process.env.MONGO_URL || "";

interface DatabaseModule {
    connectToDb(cb: (err?: Error) => void): void;
    getDb(): Db | undefined;
}

const databaseModule: DatabaseModule = {
    connectToDb: (cb) => {
        MongoClient.connect(MONGO_URL)
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

export { databaseModule };
