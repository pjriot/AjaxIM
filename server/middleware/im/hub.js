var events = require('events'),
    sys = require('sys'),
    packages = require('../../libs/packages'),
    o_ = require('../../libs/utils'),
    User = require('./user');

var Hub = module.exports = function Hub(options) {
    this.events = new events.EventEmitter();
    this.auth = options.authentication;

    this.events.addListener('update', o_.bind(function(package) {
        var _package = package.toJSON();
        if(package.type == 'status' && package.status == 'offline') {
            this.sessions.destroy(package.username);
        }
    }, this));

    this.sessions = options.sessions.getInstance(this.events);
};

Hub.prototype.get = function(req, fn) {
    // add reap callbacks for when the user leaves the page
    req.connection.addListener('end', function() {
                    console.log("end");
                    req.sessionStore.sessions.reap("end", req.sessionID);
              });

    if(this.sessions.get("sid", [req.sessionID])) {
        fn(null, this.sessions.get("sid", req.sessionID));
    } else {
        this.auth.authenticate(req, o_.bind(function(data) {
            if(data) {
                var session = new User(req.sessionID, data);
                this.sessions.set(req.sessionID, session);

                this.auth.friends(req, data, o_.bind(function(friends) {
                    // cycle through your friends list comparing it to active sessions
                    var friends_copy = friends.slice();
                    for(i = 0; i < friends_copy.length; i++) {
                        var username = friends_copy[i];
                        friend_session = this.sessions.get("username", username);
                        if(friend_session != undefined) {
                            friends_copy[i] = [username, friend_session._status];
                        }
                    }
                    session._friends(friends_copy);
                    session.events.addListener('status',
                        o_.bind(function(value, message) {
                            // console.log("hub.js: 64 -           session.events.status callback");
                            this.events.emit(
                                'update',
                                new packages.Status(session.data('username'),
                                                    value,
                                                    message)
                            );
                        }, this));
                    this.events.addListener('update',
                                      o_.bind(session.receivedUpdate, session));
                    // session.status('available', '');
                    this.sessions.set(req.sessionID, session);
                    fn(null, session);
                }, this));
            } else {
                fn();
            }
        }, this));
    }
};

Hub.prototype.find = function(username, fn) {
    session = this.sessions.get("username", username);
    if(session) {
        fn(session);
        return;
    }
    fn(false);
};

Hub.prototype.message = function(from, to, package) {
    try {
        package.user = from;
        to.send(package);
        from.respond(new packages.Success('sent'));
    } catch(e) {
        from.respond(new packages.Error(e.description));
    }
};

Hub.prototype.signOff = function(sid) {
    if(this.sessions.get("sid", sid))
        this.events.emit('update',
                         new packages.Offline(
                            this.sessions.get("sid", sid).data('username')));
};

Hub.prototype.getStore = function(sid) {
    return this.sessions;
};

