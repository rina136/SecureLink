const request = require("supertest");
const app = require("../index");
const db = require("../db");

describe("SecureLink API", () => {

    let shortCode;


    test("should create a short URL", async () => {

        const alias = `dup${Math.random().toString(36).substring(2, 8)}`;

        const response = await request(app)
            .post("/shorten")
            .send({
                url: "https://example.com",
                alias: alias
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.shortUrl).toBeDefined();
        expect(response.body.qrCode).toBeDefined();

        shortCode = alias;
    });


    test("should reject an invalid URL", async () => {

        const response = await request(app)
            .post("/shorten")
            .send({
                url: "not a valid url"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Invalid URL");
    });


    test("should reject a request without a URL", async () => {

        const response = await request(app)
            .post("/shorten")
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Please provide a URL");
    });


    // DUPLICATE ALIAS
    test("should reject a duplicate alias", async () => {

        const alias = `dup${Math.random().toString(36).substring(2, 8)}`;

        await request(app)
            .post("/shorten")
            .send({
                url: "https://example.com",
                alias: alias
            });

        const response = await request(app)
            .post("/shorten")
            .send({
                url: "https://google.com",
                alias: alias
            });

        expect(response.statusCode).toBe(409);

        expect(response.body.message)
            .toBe("Alias already exists");
    });

    test("should redirect to the original URL", async () => {

        const response = await request(app)
            .get(`/${shortCode}`)
            .redirects(0);

        expect(response.statusCode).toBe(302);

        expect(response.headers.location)
            .toBe("https://example.com/");
    });


    test("should return analytics", async () => {

        const response = await request(app)
            .get(`/analytics/${shortCode}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.total_clicks)
            .toBeDefined();
    });


    test("should delete the short URL", async () => {

        const response = await request(app)
            .delete(`/${shortCode}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe("Deleted successfully");
    });


    test("should return 404 after deletion", async () => {

        const response = await request(app)
            .get(`/${shortCode}`);

        expect(response.statusCode).toBe(404);

        expect(response.body.message)
            .toBe("URL not found");
    });

});
