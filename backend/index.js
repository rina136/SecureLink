const express = require("express");
require("dotenv").config({ path: "./.env" });
const db = require("./db");

const QRCode = require("qrcode");


const app = express();

app.use(express.json());


const generateId = () => {
    return Math.random().toString(36).substring(2, 8);
};

app.post("/shorten", (req, res) => {
    let { url, alias, expiresIn } = req.body;
    if (!url) {
        return res.status(400).send({
            message: "Please provide a URL"
        });
    }
    if (!url.startsWith("http://") &&
        !url.startsWith("https://")) {

        url = "https://" + url;
    }
    try {
        new URL(url);
    }
    catch(error) {
        return res.status(400).send({
            message:"Invalid URL"
        });
    }
    const cleanUrl = new URL(url).toString();

    const id = alias ? alias : generateId();


    const expiresAt = expiresIn
        ? Date.now() + expiresIn * 1000
        : null;

    const checkSql =
    "SELECT id FROM urls WHERE id = ?";

    db.query(checkSql,[id],(err,results)=>{

        if(err){
            return res.status(500).send({
                message:"Database error"
            });
        }


        if(results.length > 0){
            return res.status(409).send({
                message:"Alias already exists"
            });
        }

        const sql = `
        INSERT INTO urls
        (id, original_url, clicks, expires_at,
        security_status, security_message)

        VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                id,
                cleanUrl,
                0,
                expiresAt,
                "safe",
                "No threats detected"
            ],
            (err)=>{
                if(err){
                    console.log(err);

                    return res.status(500).send({
                        message:"Database error"
                    });
                }

                const shortUrl =
                `http://localhost:3000/${id}`;

                QRCode.toDataURL(shortUrl,(err,qr)=>{


                    if(err){
                        return res.status(500).send({
                            message:"QR generation failed"
                        });
                    }
                    res.send({
                        shortUrl,
                        qrCode:qr
                    });


                });


            }
        );


    });


});

app.get("/:id",(req,res)=>{
    const id=req.params.id;
    const ip =
    req.headers["x-forwarded-for"]
    || req.socket.remoteAddress;

    const userAgent =
    req.headers["user-agent"];

    const sql =
    "SELECT * FROM urls WHERE id=?";

    db.query(sql,[id],(err,results)=>{
        if(err){
            return res.status(500).send({
                message:"Database error"
            });
        }

        if(results.length===0){

            return res.status(404).send({
                message:"URL not found"
            });

        }

        const data=results[0];

        if(
            data.expires_at &&
            Date.now()>data.expires_at
        ){

            return res.status(410).send({
                message:"URL expired"
            });

        }

        const updateSql =
        "UPDATE urls SET clicks = clicks + 1 WHERE id=?";

        db.query(updateSql,[id],(err)=>{


            if(err){
                console.log(err);
            }

            const clickSql=`
            INSERT INTO clicks
            (url_id,ip_address,user_agent)

            VALUES(?,?,?)
            `;

            db.query(
                clickSql,
                [
                    id,
                    ip,
                    userAgent
                ],

                (err)=>{


                    if(err){
                        console.log(err);
                    }


                    res.redirect(data.original_url);


                }
            );


        });

    });

});


app.get("/analytics/:id",(req,res)=>{
    const id=req.params.id;
    const sql=`
    SELECT 
    COUNT(*) AS total_clicks
    FROM clicks
    WHERE url_id=?
    `;

    db.query(sql,[id],(err,result)=>{
        if(err){
            return res.status(500).send({
                message:"Database error"
            });

        }
        res.send(result[0]);

    });

});

app.delete("/:id",(req,res)=>{
    const id=req.params.id;
    db.query(
        "DELETE FROM urls WHERE id=?",
        [id],
        (err)=>{
            if(err){
               return res.status(500).send({
                    message:"Database error"
                });

            }
            res.send({
                message:"Deleted successfully"
            });


        }
    );


});
app.listen(process.env.PORT || 3000,()=>{

    console.log(
        "Server running on port 3000"
    );

});