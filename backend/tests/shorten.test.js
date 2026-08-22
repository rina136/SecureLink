const request = require("supertest");
const app = require("../index");

describe("POST /shorten", () => {

    test("should create a short URL", async () => {

        const response = await request(app)
            .post("/shorten")
            .send({
                url: "https://example.com"
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.shortUrl).toBeDefined();

        expect(response.body.qrCode).toBeDefined();
    });


    test("should reject missing URL", async () => {

        const response = await request(app)
            .post("/shorten")
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Please provide a URL");
    });


    test("should reject invalid URL", async () => {

        const response = await request(app)
            .post("/shorten")
            .send({
                url: "not a valid url"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Invalid URL");
    });

});
