var bodyParser = require('body-parser'); 
var express = require('express');
var session = require('express-session');

var users = require('../models/user.js');
var boards = require('../models/board.js');

module.exports = function(app, express) {
  
    var router = express.Router();

    /**
      * POST request handler for the creation of new users.
      *
      * Request body should contain "username" and "password" fields.
      *
      * Returns JSON object to client with the following information:
      *     success: true if user successfully created, else false
      */
    router.post("/register", function(req, res){
        var username = req.body.username;
        var password = req.body.password;
        users.addUser({username: username, password: password}, function(err, user){
            if (err){
                res.status(500).json({success: false});
            }
            else{
                req.session.user = {name: username, id: user._id};
                res.status(201).json({success: true});
            }
        });
    });

    /** 
      * POST request to log in to the site.
      *
      * Request body should contain "username" and "password" fields.
      *
      * Returns JSON object to client with the following information:
      *     success: true if login was successful, else false
      */
    router.post("/login", function(req, res){
        var username = req.body.username;
        var password = req.body.password;
        users.verifyUser({username: username, password: password}, function(err, verify, user){
            if (err){
                res.status(500).json({success: false});
            }
            else if (verify){
                req.session.user = {name: username, id: user._id};
                res.status(200).json({success: true});
            }
            else{
                res.status(401).json({success: false});
            }
        });
    });

    /** POST request to log out of the site. */
    router.post("/logout", function(req, res){
        req.session.user = null;
        res.json({success: true});
    });
    
    /** 
      * GET request handler; returns information about whether or not the client is logged in.
      *
      * Returns JSON object to client with the following information:
      *     loggedIn: whether or not the requester is logged in to the site
      *     user: JSON object (null if not loggedIn) with the following information:
      *         name: the username of this user
      *         id: the user's id
      */
    router.get("/session", function(req, res){
        if (req.session.user){
            res.status(200).json({loggedIn: true, user: req.session.user});
        }
        else{
            res.status(200).json({loggedIn: false});
        }
    });
    
    /**
      * GET request handler for retrieving a user's collection of saved boards.
      *
      * Returns JSON object to client with the following information:
      *     success: whether or not the request was successful
      *     boards: JSON array containing IDs of all saved boards on successful request
      */
    router.get("/boards", function(req, res){
        if (req.session.user != null){
            users.getBoardsFromUser(req.session.user.id, function(err, boards){
                if (err){
                    res.status(400).json({success: false});
                }
                else{
                    res.status(200).json({success: true, boards: boards})
                }
            });
        }
        else{
            res.status(403).json({success: false});
        }
    });
    
    /** 
      * PUT request handler for adding a board to the user's collection of saved boards.
      *
      * Request body should contain "boardId" field.
      *
      * Returns JSON object with the following information:
      *     success: true if board was successfully added, else false
      */
    router.put("/boards", function(req, res){
        var boardId = req.body.boardId;
        if (req.session.user != null){
            boards.findBoard(boardId, function(err){
                if (err){
                    res.status(400).json({success: false});
                }
                else{
                    users.addBoardToUser(req.session.user.id, boardId, function(err){
                        if (err){
                            res.status(500).json({success: false});
                        }
                        else{
                            res.status(200).json({success: true});
                        }
                    });
                }
            });
        }
        else{
            res.status(403).json({success: false});
        }
    });
    
    /** 
      * DELETE request handler for removing a board from the user's collection of saved boards.
      *
      * Returns JSON object with the following information:
      *     success: true if board was successfully removed, else false
      */
    router.delete("/boards/:boardId", function(req, res){
        var boardId = req.params.boardId;
        if (req.session.user != null){
            users.removeBoardFromUser(req.session.user.id, boardId, function(err){
                if (err){
                    res.status(500).json({success: false});
                }
                else{
                    res.status(200).json({success: true});
                }
            });
        }
        else{
            res.status(403).json({success: false});
        }
    });

    return router;
}