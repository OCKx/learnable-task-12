import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { ObjectId } from 'mongodb';

// Define a user schema for validation
const userSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'guest').required()
});

// Middleware for validating user input
function validateUser(req: any, res: any, next: any) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

// Mock user data for demonstration
const users: { _id: ObjectId, username: string, password: string, role: string }[] = [
    { _id: new ObjectId(), username: 'admin', password: bcrypt.hashSync('adminpassword', 10), role: 'admin' },
    { _id: new ObjectId(), username: 'guest', password: bcrypt.hashSync('guestpassword', 10), role: 'guest' }
];

// Function to find a user by username
function findUserByUsername(username: string) {
    return users.find(user => user.username === username);
}

// Function to verify user credentials
function verifyUser(username: string, password: string) {
    const user = findUserByUsername(username);
    if (!user) return false;
    return bcrypt.compareSync(password, user.password);
}

// Middleware for authentication
function authenticate(req: any, res: any, next: any) {
    const { username, password } = req.body;
    if (!verifyUser(username, password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    next();
}

// Middleware for authorization
function authorize(role: string) {
    return (req: any, res: any, next: any) => {
        const user = findUserByUsername(req.body.username);
        if (!user || user.role !== role) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        next();
    };
}

// Generate JWT token
function generateToken(username: string, role: string) {
    return jwt.sign({ username, role }, 'secretkey', { expiresIn: '1h' });
}

export {
    validateUser,
    authenticate,
    authorize,
    generateToken
};
