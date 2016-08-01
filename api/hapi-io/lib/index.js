'use strict';

var _ = require('lodash');
var socketio = require('socket.io');
var auth = require('./auth');
var routes = require('./routes');
var async = require("async");

// Declare internals

var internals = {
  defaults: {
    socketio: {
      path: '/socket.io'
    }
  }
};

exports.register = function(server, options, next) {

  _.defaults(options, internals.defaults);

  var s = options.connectionLabel ?
          server.select(options.connectionLabel) : server;

  if (!s) {
    return next('hapi-io - no server');
  }

  if (!s.connections.length) {
    return next('hapi-io - no connection');
  }

  if (s.connections.length !== 1) {
    return next('hapi-io - multiple connections');
  }

  var connection = s && s.connections.length && s.connections[0];

  if (!connection) {
    return next('No connection/listener found');
  }

  var io = socketio(connection.listener, options.socketio);

  s.expose('io', io);

  if (options.auth) {
    auth(s, io, options);
  }

  io.on('connection', function(socket) {
    // handle room
    console.log("a client connected");

    socket.on('join', function(data) {
      console.log("start =======================");
      console.log('rooms');
      console.log(io.sockets.adapter.rooms)
      console.log('join data');
      console.log(data);
      var rooms = Object.keys(io.sockets.adapter.rooms);
      async.each(rooms, function(r, cb) {
        // leave another room
        if (r != data.profileId && r != data.socketId && r != data.role) {
          console.log("Leaving " + r);
          socket.leave(r);
        } else {
          console.log("Stay at " + r);
        }
        cb();
      }, function(err) {
        // then join the room
        socket.join(data.profileId);
        if (data.role) socket.join(data.role);
        console.log(io.sockets.adapter.rooms)
        console.log("end =======================");
      })
    });
    socket.on('leaveAll', function(data) {
      var rooms = Object.keys(io.sockets.adapter.rooms);
      async.each(rooms, function(r, cb) {
        socket.leave(r);
        cb();
      }, function(err) {
        console.log("Socket : logout. leave all socket room");
      })
    });
    routes(s, socket);
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
