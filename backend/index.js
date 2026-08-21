const express = require("express");
require("dotenv").config({ path: "./.env" });

const db = require("./db");
const QRCode = require("qrcode");

const app = express();

app.use(express.json());

const generateId = () => {
    return Math.random().toString(36).substring(2, 8);
};


app.post("/shorten", async (req, res) => {
    let { url, alias, expiresIn } = req.body;

    if (!url) {
        return res.status(400).send({
            message: "Please provide a URL"
        });
    }

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        url = "https://" + url;
    }

    try {
        new URL(url);
    } catch (error) {
        return res.status(400).send({
            message: "Invalid URL"
        });
    }

    const cleanUrl = new URL(url).toString();

    const shortCode = alias || generateId();

    const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

    try {

        // Check whether alias already exists
        const checkResult = await db.query(
            "SELECT id FROM urls WHERE short_code = $1",
            [shortCode]
        );

        if (checkResult.rows.length > 0) {
            return res.status(409).send({
                message: "Alias already exists"
            });
        }

        const result = await db.query(
            `INSERT INTO urls
            (original_url, short_code, clicks, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [
                cleanUrl,
                shortCode,
                0,
                expiresAt
            ]
        );

        const shortUrl =
            `http://localhost:3000/${shortCode}`;

        QRCode.toDataURL(shortUrl, (err, qr) => {

            if (err) {
                return res.status(500).send({
                    message: "QR generation failed"
                });
            }

            res.send({
                shortUrl,
                qrCode: qr
            });

        });

    } catch (error) {

        console.error(error);

        return res.status(500).send({
            message: "Database error"
        });

    }
});


app.get("/:id", async (req, res) => {

    const shortCode = req.params.id;

    const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    const userAgent =
        req.headers["user-agent"];

    try {

        const result = await db.query(
            "SELECT * FROM urls WHERE short_code = $1",
            [shortCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).send({
                message: "URL not found"
            });
        }

        const data = result.rows[0];

        if (
            data.expires_at &&
            new Date() > new Date(data.expires_at)
        ) {
            return res.status(410).send({
                message: "URL expired"
            });
        }

        await db.query(
            `UPDATE urls
             SET clicks = clicks + 1
             WHERE id = $1`,
            [data.id]
        );

        await db.query(
            `INSERT INTO clicks
            (url_id, ip_address, user_agent)
            VALUES ($1, $2, $3)`,
            [
                data.id,
                ip,
                userAgent
            ]
        );

        res.redirect(data.original_url);

    } catch (error) {

        console.error(error);

        res.status(500).send({
            message: "Database error"
        });

    }

});


app.get("/analytics/:id", async (req, res) => {

    const shortCode = req.params.id;

    try {

        const result = await db.query(
            `SELECT COUNT(*) AS total_clicks
             FROM clicks c
             JOIN urls u ON c.url_id = u.id
             WHERE u.short_code = $1`,
            [shortCode]
        );

        res.send(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).send({
            message: "Database error"
        });

    }

});


app.delete("/:id", async (req, res) => {

    const shortCode = req.params.id;

    try {

        const result = await db.query(
            "DELETE FROM urls WHERE short_code = $1",
            [shortCode]
        );

        if (result.rowCount === 0) {
            return res.status(404).send({
                message: "URL not found"
            });
        }

        res.send({
            message: "Deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).send({
            message: "Database error"
        });

    }

});


app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port 3000");
});