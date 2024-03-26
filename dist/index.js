"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const body_parser_1 = __importDefault(require("body-parser"));
const mongodb_1 = require("mongodb");
const user_1 = require("./user");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const PORT = parseInt(process.env.PORT) || 3000;
let db;
db_1.databaseModule.connectToDb((err) => {
    if (!err) {
        app.listen(PORT, () => {
            console.log(`listening to port ${PORT}`);
        });
        db = db_1.databaseModule.getDb();
    }
});
app.get('/', (req, res) => {
    res.send('Welcome to the hotel management API');
});
app.post('/api/v1/rooms-types', user_1.validateUser, user_1.authenticate, (0, user_1.authorize)('admin'), (req, res) => {
    const { name } = req.body;
    const roomType = {
        name: name
    };
    db.collection('rooms_types').insertOne(roomType)
        .then((doc) => {
        res.status(201).json(doc);
    })
        .catch((err) => {
        res.status(500).json({ error: 'Internal server error' });
    });
});
app.post('/api/v1/rooms', (req, res) => {
    const { name, roomType, price } = req.body;
    const room = {
        name: name,
        roomType: new mongodb_1.ObjectId(roomType),
        price: price,
    };
    db.collection('rooms')
        .insertOne(room)
        .then((doc) => {
        res.status(201).json(doc);
    })
        .catch((err) => {
        res.status(500).json({ error: 'bad request' });
    });
});
app.get('/api/v1/rooms', (req, res) => {
    const { search, roomType, minPrice, maxPrice } = req.query;
    console.log('Request Query:', req.query);
    const query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    if (roomType) {
        query.roomType = roomType;
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) {
            query.price.$gte = parseInt(minPrice);
        }
        if (maxPrice) {
            query.price.$lte = parseInt(maxPrice);
        }
    }
    console.log('Query Object:', query);
    db.collection('rooms')
        .find(query)
        .toArray((err, rooms) => {
        if (err) {
            console.error('Error fetching rooms:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rooms);
    });
});
app.patch('/api/v1/rooms/:Id', (req, res) => {
    const { name, roomType, price } = req.body;
    if (!name && !roomType && !price) {
        return res.status(400).json({ error: 'At least one field to update is required' });
    }
    const updateFields = {};
    if (name) {
        updateFields.name = name;
    }
    if (roomType) {
        updateFields.roomType = roomType;
    }
    if (price) {
        updateFields.price = price;
    }
    db.collection('rooms')
        .updateOne({ _id: new mongodb_1.ObjectId(req.params.Id) }, { $set: updateFields })
        .then((result) => {
        res.status(200).json(result);
    })
        .catch((err) => {
        console.error('Error updating room:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
});
app.delete('/api/v1/rooms/:id', (req, res) => {
    db.collection('rooms')
        .deleteOne({ _id: new mongodb_1.ObjectId(req.params.id) })
        .then((doc) => {
        res.status(200).json(doc);
    })
        .catch((err) => {
        res.status(500).json({ error: 'cannot complete request' });
    });
});
app.get('/api/v1/rooms/:roomid', (req, res) => {
    db.collection('rooms')
        .findOne({ _id: new mongodb_1.ObjectId(req.params.roomid) })
        .then((doc) => {
        if (doc) {
            res.status(200).json(doc);
        }
        else {
            res.status(404).json({ error: 'Room not found' });
        }
    })
        .catch((err) => {
        res.status(500).json({ error: 'Internal server error' });
    });
});
