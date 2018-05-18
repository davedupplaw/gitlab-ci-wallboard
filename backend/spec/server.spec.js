const request = require('request');

// default port should be 3000
const baseUrl = 'http://localhost:3000';

describe('API Gateway Server', () => {
    it('should return 404 status for unknown paths', (done) => {
        request(baseUrl + '/' + Math.random(), (err, response, body) => {
            expect(response.statusCode).toEqual(404);
            done();
        });
    });

    it('should return 200 status on the root path', (done) => {
        request(baseUrl, (err, response, body) => {
            expect(response.statusCode).toEqual(200);
            done();
        });
    });

    it('should return HTML on the root path', (done) => {
        request(baseUrl, (err, response, body) => {
            expect(response.body).toContain('<html>');
            done();
        });
    });

    it('should embed the app on the root path', (done) => {
        request(baseUrl, (err, response, body) => {
            expect(response.body).toContain('<fs-app></fs-app>');
            done();
        });
    });
});