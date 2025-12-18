const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../index');
const User = require('../model/user');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    process.env.SECRET_KEY = 'test-secret-key';
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Authentication Endpoints', () => {
    
    const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
    };

    describe('POST /api/signup - User Registration', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send(validUser);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toBe(validUser.email);
            expect(res.body.name).toBe(validUser.name);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return error for duplicate email', async () => {
            // First signup
            await request(app)
                .post('/api/signup')
                .send(validUser);
            
            // Second signup with same email
            const res = await request(app)
                .post('/api/signup')
                .send(validUser);
            
            expect(res.status).toBe(500);
        });

        it('should return error for missing required fields', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({ email: 'test@test.com' }); // Missing name and password
            
            expect(res.status).toBe(500);
        });
    });

    describe('POST /api/signin - User Login', () => {
        beforeEach(async () => {
            // Create a user before each signin test
            await request(app)
                .post('/api/signup')
                .send(validUser);
        });

        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/api/signin')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toBe(validUser.email);
            expect(res.body.name).toBe(validUser.name);
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/signin')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'anyPassword'
                });
            
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Email not found');
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/signin')
                .send({
                    email: validUser.email,
                    password: 'wrongPassword'
                });
            
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid password');
        });
    });

    describe('GET /api/signout - User Logout', () => {
        it('should return success message on signout', async () => {
            const res = await request(app).get('/api/signout');
            
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Successfully signed out');
            expect(res.body.clearToken).toBe(true);
        });
    });
});

describe('Authorization Middleware', () => {
    const validUser = {
        name: 'Auth Test User',
        email: 'authtest@example.com',
        password: 'password123'
    };

    it('should return 401 when no authorization header is provided', async () => {
        const res = await request(app)
            .post('/api')
            .send({ title: 'Test', author: 'Test', price: 10, yearPublished: 2020 });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('No Authorization Header');
    });

    it('should return 401 for invalid token format', async () => {
        const res = await request(app)
            .post('/api')
            .set('Authorization', 'InvalidFormat token123')
            .send({ title: 'Test', author: 'Test', price: 10, yearPublished: 2020 });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid Token Format');
    });

    it('should return 401 for invalid/malformed token', async () => {
        const res = await request(app)
            .post('/api')
            .set('Authorization', 'Bearer invalid.token.here')
            .send({ title: 'Test', author: 'Test', price: 10, yearPublished: 2020 });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid Token');
    });

    it('should allow access with valid token', async () => {
        // Get a valid token
        const signupRes = await request(app)
            .post('/api/signup')
            .send(validUser);
        
        const token = signupRes.body.token;
        
        const res = await request(app)
            .post('/api')
            .set('Authorization', `Bearer ${token}`)
            .send({ 
                title: 'Test Book', 
                author: 'Test Author', 
                price: 19.99, 
                yearPublished: 2020 
            });
        
        expect(res.status).toBe(200);
    });
});
