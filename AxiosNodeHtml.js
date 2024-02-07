const express =require('express');
const axios = require('axios');
const app = express();
var bodyParser = require('body-parser');

const base_url = "https://localhost:3000"

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(_dirname + '/public'));

app.get("/", async (req,res)=>{
    try{
        const response = await axios.get(base_url + '/books');
        res.render("books", {books: response.data});
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.get("/books/:id", async (req,res)=>{
    try{
        const response = await axios.get(base_url + '/books/'+ req.params.id);
        res.render("books", {books: response.data});
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.get("/create", (req, res) =>{
    res.render("create");
});

app.post("/create", async (req,res)=>{
    try{
        const data = {title: req.body.title, author: req.body.author};
        await axios.post(base_url + '/books', data);
        res.redirect("/");
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.post("/update/:id", async (req,res)=>{
    try{
        const response = await axios.get(base_url + '/books/'+ req.params.id);
        res.render("books", {books: response.data});
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.post("/update/:id", async (req,res)=>{
    try{
        const data = {title: req.body.title, author: req.body.author};
        await axios.put(base_url + '/books/' + req.params.id, data);
        res.redirect("/");
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.get("/delete/:id", async (req,res)=>{
    try{
        await axios.delete(base_url + '/books/'+ req.params.id);
        res.redirect("/");
    } catch(err){
        console.err(err);
        res.status(500).send('Error');
    }
});

app.listen(5500, () => {
    console.log(`Example app listening at http://localhost:5500`);
});