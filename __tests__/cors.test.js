const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../index');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    process.env.SECRET_KEY = 'test-secret-key';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('CORS Policy Tests', () => {
    
    describe('CORS Headers', () => {
        it('should include Access-Control-Allow-Origin header in response', async () => {
            const res = await request(app)
                .get('/api')
                .set('Origin', 'http://localhost:3000');
            
            expect(res.headers['access-control-allow-origin']).toBeDefined();
        });

        it('should allow any origin (default cors() behavior)', async () => {
            const res = await request(app)
                .get('/api')
                .set('Origin', 'http://example.com');
            
            // Default cors() allows all origins with '*'
            expect(res.headers['access-control-allow-origin']).toBe('*');
        });

        it('should handle preflight OPTIONS request', async () => {
            const res = await request(app)
                .options('/api')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
            
            expect(res.status).toBe(204); // No content for preflight
            expect(res.headers['access-control-allow-origin']).toBeDefined();
            expect(res.headers['access-control-allow-methods']).toBeDefined();
        });

        it('should allow Content-Type header in requests', async () => {
            const res = await request(app)
                .options('/api')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type');
            
            expect(res.status).toBe(204);
        });

        it('should allow Authorization header for protected routes', async () => {
            const res = await request(app)
                .options('/api')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Authorization');
            
            expect(res.status).toBe(204);
        });
    });

    describe('Cross-Origin Requests', () => {
        it('should accept GET request from different origin', async () => {
            const res = await request(app)
                .get('/api')
                .set('Origin', 'http://different-domain.com');
            
            // Should not fail due to CORS (will be 404 since no books exist)
            expect([200, 404]).toContain(res.status);
            expect(res.headers['access-control-allow-origin']).toBe('*');
        });

        it('should accept POST request with JSON body from different origin', async () => {
            const res = await request(app)
                .post('/api/signup')
                .set('Origin', 'http://different-domain.com')
                .set('Content-Type', 'application/json')
                .send({
                    name: 'CORS Test User',
                    email: 'corstest@example.com',
                    password: 'password123'
                });
            
            expect(res.headers['access-control-allow-origin']).toBe('*');
            expect(res.status).toBe(200);
        });
    });

    describe('HTTP Methods Support', () => {
        it('should support GET method', async () => {
            const res = await request(app).get('/api');
            expect([200, 404]).toContain(res.status);
        });

        it('should support POST method', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    name: 'Method Test',
                    email: 'methodtest@example.com',
                    password: 'password123'
                });
            expect(res.status).toBe(200);
        });

        it('should support PUT method', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/${fakeId}`)
                .send({ title: 'Test' });
            // Will be 401 (unauthorized) but method is supported
            expect(res.status).toBe(401);
        });

        it('should support DELETE method', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/api/${fakeId}`);
            // Will be 401 (unauthorized) but method is supported
            expect(res.status).toBe(401);
        });
    });
});
