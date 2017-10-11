
// Express init

const express = require("express");
const app = express();

//activate CSS path!
//
//
//
app.use(express.static(__dirname + '/styles'));

// body-parser init

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// ejs initialisieren

app.engine(".ejs", require("ejs").__express);
app.set("view engine", "ejs");

// Server starten
const port = 3001;
app.listen(port, function() {
	console.log("listening to port" + port);
});


//database setup
require('fs').mkdir(__dirname + '/tingodb', (err)=>{}); 
const DB_COLLECTION = "products";
const Db = require('tingodb')().Db; 
const db = new Db(__dirname + '/tingodb', {}); 
const ObjectID = require('tingodb')().ObjectID; 

// Startseite
app.get("/", (request,response) => {
	response.sendFile(__dirname + "/index.html");
});

// Produkt hinzufügen

app.post("/add", (request, response) => {
	const produkt = request.body["product"];
	const preis = request.body.price;
	const document = {'product': produkt, 'price': preis}; 

	db.collection(DB_COLLECTION).save(document, (err, result) => {   
		if (err) return console.log(err);

		console.log("Data set");
	});

	// Muss nicht mit
	const array = db.collection(DB_COLLECTION).find().toArray(function(err, result) {       
		response.render('datenbank', {'products': result});

	 }); 

});

// Produkt auslesen

app.get("/datenbank", (request, response) => {
	const array = db.collection(DB_COLLECTION).find().toArray(function(err, result) {       
		response.render('datenbank', {'products': result});

	 }); 
});


// Produkt löschen

app.post('/deleteProduct/:id', (request, response) => {
	const id = request.params.id;
	const o_id = new ObjectID(id);
	db.collection(DB_COLLECTION).remove({"_id": o_id}, (err,result) => {
		response.redirect("/datenbank");
	})
});