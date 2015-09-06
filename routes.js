﻿var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var bCrypt = require('bcrypt-nodejs');
var btoa = require('btoa');


var libraryConnection = mongoose.createConnection("mongodb://192.168.1.18/library");
var passPortConnection = mongoose.createConnection("mongodb://192.168.1.18/passport");

var User = require('./models/User').UserModel(passPortConnection);
var BookModel = require('./models/Book').BookModel(libraryConnection);


module.exports = function (app, passport) {

    var validPassword = function (user, password) {
        return bCrypt.compareSync(password, user.password);
    }

    app.post('/login', function (req, res) {
        console.log(JSON.stringify(req.body));

        var username = req.body.username;
        var password = req.body.password;


        app.login(username, password).then(function (user) {
            res.status(200);
            res.send(user);
        }, function (error) {
            res.status(403);
            res.send('Bad username/password;');
        });
    });

    app.login = function (username, password) {
        
        return new Promise(function (resolve, reject) {
            User.findOne({ username: username },
                function (err, user) {
                    if (err) {
                        console.error('Error finding user');
                        reject(err);;
                    }
                    if (!user) {
                        console.log('No user found');
                        reject('Could not match user/password');
                    }
                    if (!validPassword(user, password)) {
                        console.log('Bad password for user', user)
                        reject('Could not match user/password');
                    }
                    console.log("login successful for user: " + user.username)
                    resolve(user);
            });
        })
    }

    app.post('/signup', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var email = req.body.email || "";
        // find a user in Mongo with provided username
        console.log("User registration: " + req.body.username + ":" + req.body.password);


        User.findOne({ 'username': username }, function (err, user) {
            // In case of any error return
            if (err) {
                console.log('Error in SignUp: ' + err);
                res.status(500);
                res.send('Error creating user: ' + error.message);
            }
            // already exists
            if (user) {
                console.log('User already exists');
                res.status(500);
                res.send('Error creating user: ' + error.message);
            } else {
                // if there is no user with that email
                // create the user
                var newUser = new User();
                // set the user's local credentials
                newUser.username = username;
                newUser.password = createHash(password);
                newUser.token = btoa(createHash(new Date().getTime()));
                newUser.email = email;

                // save the user
                newUser.save(function (err) {
                    if (err) {
                        console.log('Error in Saving user: ' + err);
                        throw err;
                    }
                    console.log('User Registration succesful');
                    res.send(newUser);
                });
            }
        });

    });

    

    // Generates hash using bCrypt
    var createHash = function (password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

    app.get('/api/library', function (req, res) {
        var token = req.get("access_token");
        console.log(token);
        if (libraryConnection != null) {
            BookModel.find(function (err, books) {
                if (!err) {
                    res.send(JSON.stringify(books));
                }
                else {
                    console.log("Error listing books: " + err);
                }
            });
        }
    });

    app.get('/loggedin/:token', function (req, res) {

        var token = req.params.token;
        console.log(token);
        var promise = new Promise(function (resolve, reject) {
            resolve(app.validateToken(token));
        })

        promise.then(function (user) {
            console.log("Succesfully validated token")
            res.status(204);
        }, function (error) {
            console.log("Token invalid")
            res.status(401);
        });

    });

    app.validateToken = function (token) {
        User.findOne({ token: token }, function (err, user) {
                if (err) {
                    console.error('Error finding user');
                    return;
                }
                if (!user) {
                    console.log('No user found');
                    return;
                }
                console.log("token found for user: " + user.username)
                return user;
            });
    }

    app.get('/api/library/:id', function (req, res) {
        if (libraryConnection != null) {
            BookModel.findById(req.params.id, function (err, book) {
                if (!err) {
                    res.send(JSON.stringify(book));
                }
                else {
                    console.log("Error retrieving book " + req.params.id + ": " + err);
                }
            });

        }
    });


    app.post('/api/library', function (req, res) {

        var book = new BookModel(req.body);
        book.save(function (err) {
            if (err) {
                console.log("Error creating book: " + err);
            }
            else {
                res.send(book._id);
            }
        });
    });

    app.put('/api/library/:id', function (req, res) {
        BookModel.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
            if (err) {
                console.log("Error when updating book: " + req.body._id + ": " + err);
            }
            else {
                res.send(req.params.id);
            }

        });
    });

    app.delete('/api/library/:id', function (req, res) {

        if (libraryConnection != null) {
            BookModel.findById(req.params.id, function (err, book) {
                if (!err) {
                    book.remove(function (err) {
                        if (err) {
                            console.log("Error when removing book " + book.title + ": " + err);
                        }
                    });
                }
                else {
                    console.log("Error finding book " + req.params.id + ": " + err);
                }
            });
        }
    });

};