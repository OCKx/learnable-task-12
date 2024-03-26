"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authorize = exports.authenticate = exports.validateUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const mongodb_1 = require("mongodb");
const userSchema = joi_1.default.object({
    username: joi_1.default.string().min(3).max(30).required(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('admin', 'guest').required()
});
function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}
exports.validateUser = validateUser;
const users = [
    { _id: new mongodb_1.ObjectId(), username: 'admin', password: bcrypt_1.default.hashSync('adminpassword', 10), role: 'admin' },
    { _id: new mongodb_1.ObjectId(), username: 'guest', password: bcrypt_1.default.hashSync('guestpassword', 10), role: 'guest' }
];
function findUserByUsername(username) {
    return users.find(user => user.username === username);
}
function verifyUser(username, password) {
    const user = findUserByUsername(username);
    if (!user)
        return false;
    return bcrypt_1.default.compareSync(password, user.password);
}
function authenticate(req, res, next) {
    const { username, password } = req.body;
    if (!verifyUser(username, password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    next();
}
exports.authenticate = authenticate;
function authorize(role) {
    return (req, res, next) => {
        const user = findUserByUsername(req.body.username);
        if (!user || user.role !== role) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        next();
    };
}
exports.authorize = authorize;
function generateToken(username, role) {
    return jsonwebtoken_1.default.sign({ username, role }, 'secretkey', { expiresIn: '1h' });
}
exports.generateToken = generateToken;
