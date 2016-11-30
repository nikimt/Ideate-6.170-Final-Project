// MongoDB data model for Board

var mongoose = require('mongoose');
var codeGenerator = require('../../utils/board_code.js');
var ideas = require('../models/idea.js');

var boardSchema = new mongoose.Schema({
    boardId: {
        type: String,
        unique: true,
        required: [true, 'Board needs a secret code']
    },
    moderator: { 
        type: String,
        required: [true, 'Needs a moderator']
    },
    ideas: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Idea',
        default: []
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
});

// -------- Validators --------
boardSchema.path("boardId").validate(function(value) {
    // This validates that the length of content is between min_content_len
    // and max_content_len
    return (value.length >= 0) && (value.length <= 6);
}, "Invalid boardId length");

var boardModel = mongoose.model('board', boardSchema);

var Boards = (function(boardModel) {

    var that = {};

    // Exposed function that takes an board and a callback.
    // Expects the board in the form of:
    //   {'moderator': 'userId'}
    //
    // We put the board in the _store, (with the addition
    // of a UUID and Date()). If error, we send an error message
    // back to the router.
    that.addBoard = function(board, callback) {
        var board = new boardModel({
            moderator: board.moderator,
            boardId: codeGenerator.getUniqueCode()
        });

        board.save(function(err, newboard) {
            if (err) callback(err, { msg: err});
            callback(null, newboard);
        });
    }

    // Exposed function that takes an boardId (as a string) and
    // a callback.
    //
    // Returns an board if the board exists, otherwise an error.
    that.findBoard = function(boardId, callback) {
        boardModel.findOne({ boardId: boardId }, function(err, result) {
            if (err) {
                callback(err,null);
            }
            if (result !== null) {
                callback(null, result);
            } else {
                callback(err,null);
            }
        });
    }

    // Exposed function that takes a boardId (as a string) and 
    // a callback.
    //
    // If there are boards associated with the moderatorId, returns
    // an array of board objects, otherwise an error.
    that.findBoardsByModerator = function(moderatorId, callback) {
        boardModel.find({ moderator: moderatorId }).sort('-date').exec(function(err, result) {
            if (err) callback({ msg: err });
            if (result.length > 0) {
                callback(null, result);
            } else {
                callback({ msg: 'No such boards!'})
            }
        });
    }

    // Exposed function that takes a boardId (as a string) and 
    // a callback.
    //
    // If there are ideas associated with the boardId, returns
    // an array of idea object ids, otherwise an error.
    that.getBoardIdeas = function(boardId, callback) {
        boardModel.findOne({ boardId: boardId }, function(err, result) {
            if (err) {
                callback({ msg: err });
            }
            if (result !== null) {
                ideas.findIdeasByIds(result.ideas, function(err, result) {
                    if (err) {
                        callback({ msg: err });
                    } else {
                        callback(null, result);
                    }
                });
            } else {
                callback({ msg: 'No such board!' });
            }
        });
    }

    // Exposed function that takes an board, an idea, and a callback.
    // Expects the idea in the form of:
    //   {'content': 'someContent',
    //    'boardId': 'boardId',
    //    'creator': 'userId'}
    //
    // We put the board in the _store, (with the addition
    // of a UUID and Date()). If error, we send an error message
    // back to the router.
    that.addIdeaToBoard = function(boardId, idea, callback) {
        ideas.addIdea(idea, function(err, result) {
            if (err) { callback(err, { msg: err }) }

            boardModel.update({ boardId: boardId },
                { $push: { "ideas": result } }, function(err, result) {
                    if (err) { callback(err, { msg: err }) }
                    else {
                        callback(null);
                    }
            });
        });
    }

    // Exposed function that takes a boardId, an ideaId, and a callback.
    //
    // We remove the ideaId from the board and from the idea collection. 
    // If error, we send an error message back to the router.
    that.removeIdeaFromBoard = function(boardId, ideaId, callback) {
        boardModel.update({ boardId: boardId },
            { $pull: { "ideas": ideaId } }, function(err, result) {
                if (err) {
                    callback(err, { msg: err });
                } else {
                    callback(null);
                }
        });

        ideas.removeIdea(ideaId, function(err, result) {
            if (err) { 
                callback(err, { msg: err });
            } else {
                callback(null);
            }
        });
    }

    // Exposed function that takes an boardId and a callback.
    //
    // If the boardId exists, we delete the board corresponding to
    // that Id in the _store. Otherwise, we return an error.
    // We also delete all ideas associated with the board because
    // those ideas only exist within the context of the board.
    that.removeBoard = function(boardId, callback) {
        boardModel.findOne({ _id: boardId }, function(err, result) {
            if (err) callback({ msg: err });
            if (result !== null) {
                ideas.removeIdeasbyIds(result.ideas, function(err, result) {
                    if (err) callback({ msg: err });
                });
                result.remove();
                callback(null);
            } else {
                callback({ msg: 'No such board!'});
            }
        });
    }

    Object.freeze(that);
    return that;

})(boardModel);

module.exports = Boards;
