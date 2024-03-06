const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const d = new Date();
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { count } = require("console");

//const base_url = "http://localhost:3000";
//const base_url = "http://node56765-wanichanon.proen.app.ruk-com.cloud";
//const base_url = "http://node56967-env-0063028.proen.app.ruk-com.cloud";
const base_url = "http://node59449-book-ecom.proen.app.ruk-com.cloud";

app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

app.use(cookieParser());

function getQuantities(cookie) {
    let quantities = [];

    // Check if the cookie exists
    if (cookie) {
        // If the cookie exists, parse its value to get the array of item IDs
        const cookiePairs = cookie.split(",");
        // Extract only the quantities from the cookie pairs
        quantities = cookiePairs.map((pair) => {
            const [, quantity] = pair.split(":");
            return parseInt(quantity);
        });
    }

    return quantities;
}

function getTotalQuantity(cookie) {
    let totalQuantity = 0;

    // Check if the cookie exists
    if (cookie) {
        // If the cookie exists, parse its value to get the array of item IDs
        const itemIds = cookie.split(",");

        // Iterate over the item IDs and sum up their quantities
        itemIds.forEach((itemId) => {
            const [, quantity] = itemId.split(":");
            totalQuantity += parseInt(quantity);
        });
    }

    return totalQuantity;
}

function getItemIds(cookie) {
    let itemIds = [];

    // Check if the cookie exists
    if (cookie) {
        // If the cookie exists, parse its value to get the array of item IDs
        const cookiePairs = cookie.split(",");
        // Extract only the IDs from the cookie pairs
        itemIds = cookiePairs.map((pair) => pair.split(":")[0]);
    }

    return itemIds;
}

const file_path = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "./public/uploads"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // Generating a unique identifier
        const originalExtension = path.extname(file.originalname);
        cb(null, uniqueSuffix + originalExtension); // Appending unique identifier to the original filename
    },
});

const file_upload = multer({ storage: file_path });

app.get("/", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books");
        res.render("main", {
            books: response.data,
            level: req.cookies.level,
            username: req.cookies.username,
            totalQ: getTotalQuantity(req.cookies.itemIds),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.get("/register", async (req, res) => {
    try {
        res.render("sigup", {
            level: req.cookies.level,
            username: req.cookies.username,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.post("/register", async (req, res) => {
    console.log("its here");
    try {
        const data = {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            currentcart: 1,
            level: "member",
        };
        console.log(data);
        await axios.post(base_url + "/users", data);
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/login", async (req, res) => {
    try {
        res.render("login", {
            level: req.cookies.level,
            username: req.cookies.username,
        });
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
                if (
                    req.body.username === account.username &&
                    req.body.password === account.password
                ) {
                    loginFailed = false;
                    if (account.level == "admin")
                        res.cookie("level", "admin", { maxAge: 900000, httpOnly: true });
                    else if (account.level == "member")
                        res.cookie("level", "member", { maxAge: 900000, httpOnly: true });
                    res.cookie("id", account.id, {
                        maxAge: 900000,
                        httpOnly: true,
                    });
                    res.cookie("username", account.username, {
                        maxAge: 900000,
                        httpOnly: true,
                    });
                    return res.redirect("/");
                }
            }
        } else {
            return res.redirect("sigup");
        }

        if (loginFailed) {
            return res.redirect("/login");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Login");
    }
});

app.get("/logout", async (req, res) => {
    try {
        res.clearCookie("level");
        res.clearCookie("username");
        res.clearCookie("id");
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Logout");
    }
});

app.get("/books", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books");
        res.render("books", {
            books: response.data,
            level: req.cookies.level,
            username: req.cookies.username,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});

app.get("/book/:id", async (req, res) => {
    try {
        const response = await axios.get(base_url + "/books/" + req.params.id);
        res.render("book", {
            book: response.data,
            level: req.cookies.level,
            username: req.cookies.username,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

//cart
app.get("/cart", async (req, res) => {
    try {
        // Retrieve the itemIds from the cookies
        const itemIds = req.cookies.itemIds
        //console.log(itemIdsArray);
        // If itemIds is not set or is empty, send an empty array
        if (!itemIds || Object.keys(itemIds).length === 0) {
            return res.render("order", {
                books: [],
                level: req.cookies.level,
                username: req.cookies.username,
                quantity: [],
            });
        }

        // Assuming itemIds is a string in the format "id:quantity,id:quantity,..."
        const itemIdsString = req.cookies.itemIds;
        const itemIdsArray = itemIdsString.split(',').map(item => {
            const [id, quantity] = item.split(':');
            return { id, quantity: parseInt(quantity) };
        });

        // Sort the array by id
        itemIdsArray.sort((a, b) => {
            return parseInt(a.id) - parseInt(b.id);
        });

        const sortedItemIdsString = itemIdsArray.map(item => `${item.id}:${item.quantity}`).join(',');
        const quantities = getQuantities(sortedItemIdsString)
        const ids = getItemIds(sortedItemIdsString);

        const response = await axios.get(base_url + "/books");
        const filteredBooks = response.data.filter((book) =>
            ids.includes(String(book.id))
        );

        totalP = []
        for(const v in ids){
            totalP.push(filteredBooks[v].price*quantities[v])
        }

        res.render("order", {
            books: filteredBooks,
            level: req.cookies.level,
            username: req.cookies.username,
            quantity: getQuantities(sortedItemIdsString),
            totalP: totalP
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error Access Root Web");
    }
});
//store in cart
app.post("/store/:id", (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).send("Invalid item ID");
    }

    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        return res.status(400).send("Invalid quantity");
    }

    let itemIds = [];

    if (req.cookies.itemIds) {
        itemIds = req.cookies.itemIds.split(",");
    }

    const existingItemIndex = itemIds.findIndex(
        (item) => item.split(":")[0] === id
    );

    if (existingItemIndex !== -1) {
        const [existingId, existingQuantity] =
            itemIds[existingItemIndex].split(":");
        const updatedQuantity = parseInt(existingQuantity) + parseInt(quantity);
        itemIds[existingItemIndex] = `${existingId}:${updatedQuantity}`;
    } else {
        itemIds.push(`${id}:${quantity}`);
    }

    res.cookie("itemIds", itemIds.join(","), { maxAge: 900000, httpOnly: true });

    res.redirect("/");
});

app.post('/change-quantity/:id', (req, res) => {
    const { id } = req.params; // Get the item ID to change the quantity from the request params
    const { quantity } = req.body; // Get the new quantity from the request body
  
    // Check if the ID is valid
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).send('Invalid item ID');
    }
  
    // Check if the quantity is valid
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return res.status(400).send('Invalid quantity');
    }
  
    let itemIds = [];
  
    // Check if the cookie exists
    if (req.cookies.itemIds) {
      // If the cookie exists, parse its value to get the array of item IDs
      itemIds = req.cookies.itemIds.split(',');
    }
  
    // Find the index of the item with the specified ID in the array
    const indexToUpdate = itemIds.findIndex(item => item.split(':')[0] === id);
  
    if (indexToUpdate !== -1) {
      // If the item exists, update its quantity
      const [existingId, existingQuantity] = itemIds[indexToUpdate].split(':');
      itemIds[indexToUpdate] = `${existingId}:${quantity}`;
  
      // Set the updated array of item IDs in the cookie
      res.cookie('itemIds', itemIds.join(','), { maxAge: 900000, httpOnly: true });
  
      res.redirect("/cart");
    } else {
      res.status(404).send(`Item ID ${id} not found in the cookie`);
    }
  }); 

  app.post("/placeOrder", async (req, res) => {
    try {
        const data = {
            user_id: req.cookies.id,
            address: req.body.address,
            phone: req.body.phone,
            status: "Waiting for payment"
        };
        console.log(data)
        const response = await axios.post(base_url + "/placeOrder", data);
        const id = response.data.id
        const itemIdsString = req.cookies.itemIds;
        const itemIdsArray = itemIdsString.split(',').map(item => {
            const [id, quantity] = item.split(':');
            return { id, quantity: parseInt(quantity) };
        });

        itemIdsArray.sort((a, b) => {
            return parseInt(a.id) - parseInt(b.id);
        });

        const sortedItemIdsString = itemIdsArray.map(item => `${item.id}:${item.quantity}`).join(',');
        const quantities = getQuantities(sortedItemIdsString)
        const ids = getItemIds(sortedItemIdsString);

        var response2 = await axios.get(base_url + "/books");
        const filteredBooks = response2.data.filter((book) =>
            ids.includes(String(book.id))
        );
        totalP = []
        for(const v in ids){
            totalP.push(filteredBooks[v].price*quantities[v])
        }



        for(const v in ids){
            var dataline = {
                order_id: id,
                book_id: ids[v],
                quantity: quantities[v],
                totalOP: totalP[v]
            }
            console.log(dataline)
            await axios.post(base_url + "/placeOrderLine", dataline);
        }
        res.clearCookie("itemIds")
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.get("/create", (req, res) => {
    res.render("create", {
        level: req.cookies.level,
        username: req.cookies.username,
    });
});

app.post("/create", file_upload.single("file_name"), async (req, res) => {
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
        console.log(data);
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
        res.render("update", {
            book: response.data,
            level: req.cookies.level,
            username: req.cookies.username,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
//update initiate
app.post("/update/:id", async (req, res) => {
    try {
        console.log("Updated");
        const data = {
            title: req.body.title,
            author: req.body.author,
            type_id: req.body.type_id,
            genre: req.body.genre,
            theme_id: req.body.theme_id,
            stock: req.body.stock,
            price: req.body.price,
        };
        console.log(data);
        await axios.put(base_url + "/books/" + req.params.id, data);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
//update stock
app.post("/update/stock/:id", async (req, res) => {
    try {
        const data = { stock: req.body.stock };
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
        fs.unlink(
            path.join(__dirname, "./public/uploads/" + response.data.file_name),
            (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("File is deleted.");
                }
            }
        );
        res.redirect("/books");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(5500, () => {
    console.log("Server stated on port 5500");
});
