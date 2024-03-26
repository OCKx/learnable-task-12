import express, { Request, Response, NextFunction } from 'express';
import { databaseModule } from './db';
import bodyParser from 'body-parser';
import { ObjectId } from 'mongodb';
import { validateUser, authenticate, authorize, generateToken } from './user';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Connect to the database
const PORT: number = parseInt(process.env.PORT as string) || 3000;
let db: any; // Adjust the type based on your database connection object

databaseModule.connectToDb((err: Error | undefined) => {
    if (!err) {
        app.listen(PORT, () => {
            console.log(`listening to port ${PORT}`);
        })
        db = databaseModule.getDb()
    }
});

// Define routes
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the hotel management API');
});


// Create a POST endpoint for storage of room types
app.post('/api/v1/rooms-types', validateUser, authenticate, authorize('admin'), (req: Request, res: Response) => {
    const { name } = req.body;
    const roomType = {
        name: name
    };

    db.collection('rooms_types').insertOne(roomType)
        .then((doc: any) => {
            res.status(201).json(doc);
        })
        .catch((err: Error) => {
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Create a POST endpoint for storage of rooms
app.post('/api/v1/rooms', (req: Request, res: Response) => {
    const { name, roomType, price } = req.body;
    const room = {
        name: name,
        roomType: new ObjectId(roomType),
        price: price,
    };

    db.collection('rooms')
        .insertOne(room)
        .then((doc: any) => {
            res.status(201).json(doc);
        })
        .catch((err: Error) => {
            res.status(500).json({ error: 'bad request' });
        });
});

// Create a GET endpoint for fetching all rooms with optional filters
app.get('/api/v1/rooms', (req: Request, res: Response) => {
    const { search, roomType, minPrice, maxPrice } = req.query as {
        search?: string;
        roomType?: string;
        minPrice?: string;
        maxPrice?: string;
    };
    console.log('Request Query:', req.query);

    const query: any = {};
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
        .toArray((err: Error | null, rooms: any[]) => {
            if (err) {
                console.error('Error fetching rooms:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(rooms);
        });
});

// Create a PATCH endpoint for editing a room using its id
app.patch('/api/v1/rooms/:Id', (req: Request, res: Response) => {
    const { name, roomType, price } = req.body;
    if (!name && !roomType && !price) {
        return res.status(400).json({ error: 'At least one field to update is required' });
    }

    const updateFields: any = {};
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
        .updateOne({ _id: new ObjectId(req.params.Id) }, { $set: updateFields })
        .then((result: any) => {
            res.status(200).json(result);
        })
        .catch((err: Error) => {
            console.error('Error updating room:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Create a DELETE endpoint for deleting a room using its id
app.delete('/api/v1/rooms/:id', (req: Request, res: Response) => {
    db.collection('rooms')
        .deleteOne({ _id: new ObjectId(req.params.id) })
        .then((doc: any) => {
            res.status(200).json(doc);
        })
        .catch((err: Error) => {
            res.status(500).json({ error: 'cannot complete request' });
        });
});

// Create a GET endpoint for fetching a room using its id
app.get('/api/v1/rooms/:roomid', (req: Request, res: Response) => {
    db.collection('rooms')
        .findOne({ _id: new ObjectId(req.params.roomid) })
        .then((doc: any) => {
            if (doc) {
                res.status(200).json(doc);
            } else {
                res.status(404).json({ error: 'Room not found' });
            }
        })
        .catch((err: Error) => {
            res.status(500).json({ error: 'Internal server error' });
        });
});

