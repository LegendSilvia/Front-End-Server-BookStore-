const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
const multer = require("multer");
const d = new Date();
var bodyParser = require("body-parser");
const { count } = require("console");

const base_url = "http://localhost:3000";
//const base_url = "http://node56765-wanichanon.proen.app.ruk-com.cloud";
//const base_url = "http://node56967-env-0063028.proen.app.ruk-com.cloud";
//const base_url = "http://node59449-book-ecom.proen.app.ruk-com.cloud:11932";

app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

const file_path = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "./public/uploads"));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const file_upload = multer({ storage: file_path });

app.get("/", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books");
        res.render("books", { books: response.data });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.get("/book/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        res.render("book", { book: response.data });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/create", (req, res) => {
    res.render("create");
});

app.post("/create", file_upload.single('file_name'), async (req, res) => {
    try {
        const data = {
            title: req.body.title,
            author: req.body.author,
            type_id: req.body.type_id,
            genre: req.body.genre,
            theme_id: req.body.theme_id,
            file_name: req.file.filename,
            stock: req.body.stock,
            price: req.body.price,
        };
        console.log(data)
        await axios.post(base_url + "/books", data);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/update/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        res.render("update", { book: response.data });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.post("/update/:id", async (req, res) => {
    try {
        const data = { title: req.body.title, author: req.body.author };
        await axios.put(base_url + "/books/" + req.params.id, data);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/delete/:id", async (req, res) => {
    try {
        await axios.delete(base_url + "/books/" + req.params.id);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(5500, () => {
    console.log("Server stated on port 5500");
});
