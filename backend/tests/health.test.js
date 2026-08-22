const request = require("supertest");
const app = require("../index");

describe("Health Check", () => {

    test("API and database should be healthy", async () => {

        const response = await request(app)
            .get("/health");

        expect(response.statusCode).toBe(200);

        expect(response.body.status).toBe("ok");

        expect(response.body.database).toBe("connected");
    });

});
