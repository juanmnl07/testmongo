//File: controllers/messages.js
var mongoose = require('mongoose');  
var chat  = mongoose.model('Message');

//GET - Return all mmessages from mongo
exports.findAllMessages = function(req, res) {  
    chat.find(function(err, message) {
    if(err) res.send(500, err.message);

    console.log('GET /messages')
        res.status(200).jsonp(message);
    });
};

//GET - Return a message with specified ID
exports.findMessageById = function(req, res) {  
    chat.findById(req.params.id, function(err, message) {
    if(err) res.send(500, err.message);

    console.log('GET /message/' + req.params.id);
        res.status(200).jsonp(message);
    });
};

//PUT - Update a register already exists
exports.updateMessage = function(req, res) {  
    chat.findById(req.params.id, function(err, updateMessage) {
        updateMessage.msg   = req.body.msg;
        updateMessage.nick    = req.body.nick;

        updateMessage.save(function(err) {
            if(err) return res.status(500).send(err.message);
      res.status(200).jsonp(updateMessage);
        });
    });
};

//POST - Insert a new message in the DB
exports.newMessage = function(req, res) {  
    console.log('POST');
    console.log(req.body);

    var newMessage = new chat({
        msg:    req.body.msg,
        nick:     req.body.nick
    });

    newMessage.save(function(err, newMessage) {
        if(err) return res.status(500).send( err.message);
    res.status(200).jsonp(newMessage);
    });
};

//DELETE - Delete a message with specified ID
exports.deleteMessage = function(req, res) {  
    chat.findById(req.params.id, function(err, DeleteMessage) {
        DeleteMessage.remove(function(err) {
            if(err) return res.status(500).send(err.message);
      res.status(200).send();
        })
    });
};