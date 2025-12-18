const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const Book = require('../model/book');
const User = require('../model/user');

let mongoServer;
let authToken;
let testUser;

// Setup in-memory MongoDB
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Set SECRET_KEY for JWT
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

// Helper to create a test user and get auth token
const createAuthenticatedUser = async () => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };
    
    const res = await request(app)
        .post('/api/signup')
        .send(userData);
    
    return res.body.token;
};

// Helper to create a test book
const createTestBook = async (token) => {
    const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        price: 29.99,
        yearPublished: 2023
    };
    
    const res = await request(app)
        .post('/api')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);
    
    return res.body;
};

describe('Book CRUD Endpoints', () => {
    
    describe('GET /api - Get all books', () => {
        it('should return 404 when no books exist', async () => {
            const res = await request(app).get('/api');
            expect(res.status).toBe(404);
            expect(res.text).toBe('Document not found');
        });

        it('should return all books when books exist', async () => {
            // First create a book
            const token = await createAuthenticatedUser();
            await createTestBook(token);
            
            const res = await request(app).get('/api');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
    });

    describe('POST /api - Create a new book', () => {
        it('should return 401 without authorization', async () => {
            const bookData = {
                title: 'Test Book',
                author: 'Test Author',
                price: 29.99,
                yearPublished: 2023
            };
            
            const res = await request(app)
                .post('/api')
                .send(bookData);
            
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('No Authorization Header');
        });

        it('should create a book with valid token', async () => {
            const token = await createAuthenticatedUser();
            const bookData = {
                title: 'New Book',
                author: 'New Author',
                price: 19.99,
                yearPublished: 2024
            };
            
            const res = await request(app)
                .post('/api')
                .set('Authorization', `Bearer ${token}`)
                .send(bookData);
            
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('New Book');
            expect(res.body.author).toBe('New Author');
        });

        it('should return 500 for invalid book data', async () => {
            const token = await createAuthenticatedUser();
            const invalidBookData = {
                title: '', // Required field empty
                price: -10 // Invalid price
            };
            
            const res = await request(app)
                .post('/api')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidBookData);
            
            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/:id - Get book by ID', () => {
        it('should return a book by valid ID', async () => {
            const token = await createAuthenticatedUser();
            const book = await createTestBook(token);
            
            const res = await request(app).get(`/api/${book._id}`);
            
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Test Book');
        });

        it('should return 500 for invalid ID format', async () => {
            const res = await request(app).get('/api/invalid-id');
            expect(res.status).toBe(500);
        });

        it('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/${fakeId}`);
            expect(res.status).toBe(404);
            expect(res.text).toBe('Document not found');
        });
    });

    describe('PUT /api/:id - Update book by ID', () => {
        it('should return 401 without authorization', async () => {
            const token = await createAuthenticatedUser();
            const book = await createTestBook(token);
            
            const res = await request(app)
                .put(`/api/${book._id}`)
                .send({ title: 'Updated Title' });
            
            expect(res.status).toBe(401);
        });

        it('should update a book with valid token', async () => {
            const token = await createAuthenticatedUser();
            const book = await createTestBook(token);
            
            const res = await request(app)
                .put(`/api/${book._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });
            
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Updated Title');
        });

        it('should return 404 for non-existent book', async () => {
            const token = await createAuthenticatedUser();
            const fakeId = new mongoose.Types.ObjectId();
            
            const res = await request(app)
                .put(`/api/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });
            
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/:id - Delete book by ID', () => {
        it('should return 401 without authorization', async () => {
            const token = await createAuthenticatedUser();
            const book = await createTestBook(token);
            
            const res = await request(app).delete(`/api/${book._id}`);
            
            expect(res.status).toBe(401);
        });

        it('should delete a book with valid token', async () => {
            const token = await createAuthenticatedUser();
            const book = await createTestBook(token);
            
            const res = await request(app)
                .delete(`/api/${book._id}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            
            // Verify book is deleted
            const getRes = await request(app).get(`/api/${book._id}`);
            expect(getRes.status).toBe(404);
        });

        it('should return 404 for non-existent book', async () => {
            const token = await createAuthenticatedUser();
            const fakeId = new mongoose.Types.ObjectId();
            
            const res = await request(app)
                .delete(`/api/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(404);
        });
    });
});
