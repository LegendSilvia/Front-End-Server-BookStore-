const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
const multer = require("multer");
const fs = require("fs")
const d = new Date();
var bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { count } = require("console");

// const base_url = "http://localhost:3000";
//const base_url = "http://node56765-wanichanon.proen.app.ruk-com.cloud";
//const base_url = "http://node56967-env-0063028.proen.app.ruk-com.cloud";
const base_url = "http://node59449-book-ecom.proen.app.ruk-com.cloud";

app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

app.use(cookieParser());

const file_path = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "./public/uploads"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generating a unique identifier
        const originalExtension = path.extname(file.originalname);
        cb(null, uniqueSuffix + originalExtension); // Appending unique identifier to the original filename
    },
});

const file_upload = multer({ storage: file_path });

app.get("/", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books");
        res.render("main", { books: response.data, level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.get("/register", async (req, res) => {
    try {
        res.render("sigup", { level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.post("/register", async (req, res) => {
    console.log("its here")
    try {
        const data = {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            currentcart: 1,
            level: "member",
        };
        console.log(data)
        await axios.post(base_url + "/users", data);
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/login", async (req, res) => {
    try {
        res.render("login", { level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.post("/login", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/users");
        const accounts = response.data;
        let loginFailed = true; 

        if (accounts && accounts.length > 0) {
            for (const account of accounts) {
                if (req.body.username === account.username && req.body.password === account.password) {
                    loginFailed = false; 
                    if (account.level == 'admin') res.cookie('level', 'admin', { maxAge: 900000, httpOnly: true });
                    else if (account.level == 'member') res.cookie('level', 'member', { maxAge: 900000, httpOnly: true });
                    res.cookie('username', account.username, { maxAge: 900000, httpOnly: true });
                    res.cookie('id', account.id_account, { maxAge: 900000, httpOnly: true });
                    return res.redirect("/");
                }
            }
        } else {
            return res.redirect("sigup");
        }

        if (loginFailed) {
            return res.render("login");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error Login')
    }
});

app.get("/logout", async (req, res) => {
    try {
        res.clearCookie('level');
        res.clearCookie('username');
        res.clearCookie('id');
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error Logout')
    }
})

app.get("/books", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books");
        res.render("books", { books: response.data ,level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.get("/book/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        res.render("book", { book: response.data, level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/create", (req, res) => {
    res.render("create", { level: req.cookies.level, username: req.cookies.username });
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
        res.redirect("/books");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
//request data for update
app.get("/update/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        res.render("update", { book: response.data, level: req.cookies.level, username: req.cookies.username });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
//update initiate
app.post("/update/:id", async (req, res) => {
    try {
        console.log("Updated")
        const data = {
            title: req.body.title,
            author: req.body.author,
            type_id: req.body.type_id,
            genre: req.body.genre,
            theme_id: req.body.theme_id,
            stock: req.body.stock,
            price: req.body.price,
        };
        console.log(data)
        await axios.put(base_url + "/books/" + req.params.id, data);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
//update stock
app.post("/update/stock/:id", async (req, res) => {
    console.log("did mentioned")
    try {
        const data = { stock: req.body.stock};
        await axios.put(base_url + "/books/stock/" + req.params.id, data);
        res.redirect("/books");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/delete/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        await axios.delete(base_url + "/books/" + req.params.id);
        fs.unlink(path.join(__dirname, "./public/uploads/"+ response.data.file_name), (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log('File is deleted.');
            }
        });
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(5500, () => {
    console.log("Server stated on port 5500");
});
