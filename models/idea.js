// MongoDB data model for Idea

var mongoose = require('mongoose')

var ideaSchema = new mongoose.Schema({
    boardId: {
        type: String,
        required: [true, 'Needs to be associated with a board']
    },
    creatorId: {
        type: String,
        required: [true, 'Needs to be associated with a creator']
    },
    content: { 
        type: String,
        required: [true, 'Needs Content']
    },
    meta: {
        upvote_count: {
            type: Number,
            default: 0,
            min: [0, 'No negative upvote counts'],
            required: [true, 'Must have an upvote value, defaults to 0']
        },
        flag: {
            type: Boolean,
            default: false,
            required: [true, 'Must have a flag value, defaults to false']
        }
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
});

// -------- Validators --------
var max_content_len = 140;
var min_content_len = 1;

ideaSchema.path("content").validate(function(value) {
    // This validates that the length of content is between min_content_len
    // and max_content_len

    return (value.length >= min_content_len) && (value.length <= max_content_len);
}, "Invalid Content length");

ideaSchema.path("boardId").validate(function(value) {
    // This validates that the length of content is between min_content_len
    // and max_content_len
    return (value.length >= 0) && (value.length <= 6);
}, "Invalid boardId length");


var ideaModel = mongoose.model('Idea', ideaSchema);

var Ideas = (function(ideaModel) {

    var that = {};

    // Exposed function that takes an idea and a callback.
    // Expects the idea in the form of:
    //   {'content': 'someContent',
    //    'boardId': 'boardId',
    //    'creator': 'userId'}
    //
    // If the idea has an appropriate content length, we
    // allow it to be put in the _store, (with the addition
    // of a UUID and Date()). If not, we send an error message
    // back to the router, reminding the user of the character limit.
    that.addIdea = function(idea, callback) {
        if (idea.content.length <= max_content_len) {
            var idea = new ideaModel({
                content: idea.content,
                boardId: idea.boardId,
                creatorId: idea.creatorId
            });

            idea.save(function(err, newIdea) {
                if (err) callback(err, { msg: err});
                callback(null, newIdea);
            });
        } else {
            callback({ msg: 'Limit ideas to ' + max_content_len + 'characters!'});
        }
    }

    // Exposed function that takes an ideaId (as a string) and
    // a callback.
    //
    // Returns an idea if the idea exists, otherwise an error.
    that.findIdea = function(ideaId, callback) {
        if (ideaId.match(/^[0-9a-fA-F]{24}$/)) {
            ideaModel.findOne({ _id: ideaId }, function(err, result) {
                if (err) {
                    callback({ msg: err });
                }
                if (result !== null) {
                    callback(null, result);
                } else {
                    callback({ msg: 'No such idea!' });
                }
            });
        } else {
            callback({ msg: 'No such idea!' });
        }
    }

    // Exposed function that takes an array of ideaId (as strings) and
    // a callback.
    //
    // Returns an array of the ideas if they exist, otherwise an error.
    that.findIdeasByIds = function(ideaIds, callback) {
        ideaModel.find({ '_id': { $in: ideaIds } }, callback);
    }

    // Exposed function that takes a boardId (as a string) and 
    // a callback.
    //
    // If there are ideas associated with the boardId, returns
    // an array of idea objects, otherwise an error.
    that.findIdeasByBoard = function(boardId, callback) {
        ideaModel.find({ boardId: boardId }).sort('-date').exec(function(err, result) {
            if (err) callback(err, { msg: err });
            if (result.length > 0) {
                callback(null, result);
            } else {
                callback({ msg: 'No such ideas!'})
            }
        });
    }

    // Exposed function that takes an ideaId and a callback.
    //
    // If the ideaId exists, we delete the idea corresponding to
    // that Id in the _store. Otherwise, we return an error.
    that.removeIdea = function(ideaId, callback) {
        ideaModel.findOne({ _id: ideaId }, function(err, result) {
            if (err) callback({ msg: err });
            if (result !== null) {
                result.remove();
                callback(null);
            } else {
                callback({ msg: 'No such idea!'});
            }
        });
    }

    // Exposed function that takes an ideaId and a callback.
    //
    // If the ideaId exists, we increment the upvote count of the idea 
    // corresponding to that Id in the _store by +1. Otherwise, we return
    // an error.
    that.addUpvoteToIdea = function(ideaId, callback) {
        ideaModel.update({ _id: ideaId }, { $inc: { "meta.upvote_count": 1 } }, function(err, result) {
            if (err) {
                callback({ msg: err });
            } else {
                callback(null);
            }
        });
    }

    // Exposed function that takes an ideaId and a callback.
    //
    // If the ideaId exists, we increment the upvote count of the idea 
    // corresponding to that Id in the _store by -1. Otherwise, we return
    // an error.
    that.removeUpvoteFromIdea = function(ideaId, callback) {
        ideaModel.update({ _id: ideaId }, { $inc: { "meta.upvote_count": -1 } }, function(err, result) {
            if (err) {
                callback({ msg: err });
            } else {
                callback(null);
            }
        });
    }

    Object.freeze(that);
    return that;

})(ideaModel);

module.exports = Ideas;

