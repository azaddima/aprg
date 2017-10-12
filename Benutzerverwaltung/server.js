
// express init

const express = require("express");
const app = express();

//body-parser init

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// ejs initialisieren
app.engine(".ejs", require("ejs").__express);
app.set("view engine","ejs");

// Server starten
const port = 3000;
app.listen(port, function () {
	console.log("listening to port " + port);
});

// Database setup
const DB_COLLECTION = 'users';
const Db = require('tingodb')().Db;
const db = new Db(__dirname + '/tingodb', {})
const ObjectID = require('tingodb')().ObjectID

// Startseite

var message = "";
app.get("/", (request, response) => {
	response.render('index', {"message": message});
});

const session = require("express-session");
app.use(session({
	secret: "example",
	resave: false,
	saveUninitialized: true,
}));

// login logic and access to databank

app.post("/login", (request,response) => {
	const username = request.body["username"];
	const password = request.body["password"];
	var accExtists = false;

	// looking for the given username
	db.collection(DB_COLLECTION).findOne({'username': username}, (error,result) => {

		// If account is found in databank
		if(result != null) {
			accExtists = true;	
			console.log(result.password);

			// if given password matches with account username
			if (result.password == password) {
				request.session['authenticated'] = true;
				request.session["username"] = username;
				response.redirect("/content");

			// wrong password given
			} else {
				console.log(error);
				message = "You password is wrong.";
				response.redirect("/");
			}			
		} 

		// username is not in the databank
		else {
			message = "The user does not exist.";
			response.redirect("/");
		}
	});




});

app.get("/content", (request, response) => {
	if(request.session['authenticated'] == true) {
		const username = request.session['username'];
		response.render("content", {"user": username });
	} else {
		message = "No permission! Please login.";
		response.redirect("/")
	}

});

app.get("/logout", (request,response) => {
	delete request.session.authenticated;
	message = "Logout successful."
	response.redirect("/");
});

app.get("/register", (request, response) => {
	response.render('register', {"error": "","on": ""});
});




// Revamp this for cleaner code and comments!

app.post("/registerverify", (request, response) => {
	const username = request.body["username"];
	const password = request.body["password"];
	const passwordrepeat = request.body["passwordrepeat"];
	const email = request.body["email"];
	const error = [];

	if(username == "" || username == null) {
		error.push("Type a username!");
	}
	if(password == "" || password == null){
		error.push("Type a password!");
	} else {
		if(passwordrepeat == "" || passwordrepeat == null) {
			error.push("Don't forget to repeat your password!")
		}
	}
	
	if(email == "" || email == null || !email.includes("@")) {
		error.push("Type a correct Email adress!")
	}

	if(password != passwordrepeat) {
		error.push("Passwords dont match!")
	}

	// USER DATEN IN DATENBANK SPEICHERN 


	if(error.length == 0) {
		const on = "Succesfully registered!";
		const documents = {'username': username, 'password': password, 'email': email};

		db.collection(DB_COLLECTION).save(documents, (err, result) =>  {
			if(err) return console.log(err);
			console.log("saved to database");
		});

		response.render('register', {"error": error, "on": on});
	} else {
		response.render('register', {"error": error, 'on': ""});
	}

	
});



