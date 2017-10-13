
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

// password encryption
const passwordHash = require('password-hash'); 

// Startseite

var message = "";
app.get("/", (request, response) => {
	response.render('index', {"message": message});
});

// init
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
			// Uing passwordHash to decrypt the password and compare them
			if (passwordHash.verify(password,result.password)) {

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
			message = "The user " + username +  " does not exist.";
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
	delete request.session.username;
	message = "Logout successful."
	response.redirect("/");
});



// REGISTER

// Always have different ways to access to one side. Really important for user experience.

app.get("/register", (request, response) => {
	// "error" and "on" have to be initialized as empty objects, otherwise you get an error message.
	response.render('register', {"error": "","on": ""});
});



app.post("/registerverify", (request, response) => {
	const username = request.body["username"];
	const password = request.body["password"];
	const passwordrepeat = request.body["passwordrepeat"];
	const email = request.body["email"];
	let error = [];

	var allowRegister = true;


	// search for the username in database
	db.collection(DB_COLLECTION).findOne({'username': username}, (err,result) => {
		
		if(result == null) {
			
			// checks for mistakes in typed userdata
			if(username == "" || username == null) {
				error.push("Type a username!");
			}
		
			if(password == "" || password == null){
				error.push("Type a password!");
		
			} else {
		
				if(passwordrepeat == "" || passwordrepeat == null) {
					error.push("Don't forget to repeat your password!")
				} 
				else if(password != passwordrepeat) {
					error.push("Passwords dont match!")
				}
			}
			
			/*
			// not needed due to updated html - html can check by itself if it's an email,
			// with type="email"
		
			if(email == "" || email == null || !email.includes("@")) {
				error.push("Type a correct Email adress!")
			}
		
			// can definitely be more complex 
			*/
		
		
		
			// save userdata in databank
			if(error.length == 0) {
				// Password encryption
				const on = "Succesfully registered!";
				const encryptedPass = passwordHash.generate(password);
				const documents = {'username': username, 'password': encryptedPass, 'email': email};
		
				db.collection(DB_COLLECTION).save(documents, (err, result) =>  {
					if(err) return console.log(err);
					console.log("saved to database");
				});
				
				// Redirect should  be changed to login page!
				response.render('register', {"error": error, "on": on});
			} else {
				// response with error message
				response.render('register', {"error": error, 'on': ""});
			}
			
		} else {
			error.push("Username already taken");
			response.render('register', {'error': error, 'on': ""});

		} 
	});




});



