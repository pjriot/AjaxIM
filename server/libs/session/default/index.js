var packages = require('../../../libs/packages');

var MemorySessionStore = function() {
    this.maxAge = 15 * 60 * 1000;
    this.reapInterval = 60 * 60 * 1000;
    this.sessions = {};
    this.sessionMap = {};
    this.events = null;

    setInterval(function(self) {
        self._reapSessions(self.maxAge);
    }, this.reapInterval, this);
};

MemorySessionStore.prototype.get = function(key, val) {
    if(key == "sid") {
        return this.sessions[val];
    } else {
        return this.sessions[this.sessionMap[val]];
    }
};

MemorySessionStore.prototype.getAll = function() {
    return this.sessions;
};

MemorySessionStore.prototype.set = function(sid, sess, fn) {
    this.sessions[sid] = sess;
    this.sessionMap[sess.data('username')] = sid;
    fn && fn();
};

MemorySessionStore.prototype.destroy = function(username) {
    var sess = this.sessions[sessionMap["username"]];
    if(sess.listeners.length)
        sess.send(200, {type: 'goodbye'});
    delete this.sessions[sid];
    delete this.sessionMap[username];
    break;
};

MemorySessionStore.prototype.reap = function(eventType, sid) {
    reapTime = +new Date;
    console.log("Connection " + eventType);
    setTimeout(o_.bind(function(self) {
        sess = this.get("sid", sid);
        console.log(reapTime + ": " + sid + " lastAccess = " + sess.lastAccess);
        if(reapTime > sess.lastAccess) {
            console.log("reaping " + sid);
            this.events.emit('update', new packages.Offline(sess.data('username')));
        }
    }, this), 10000, this);
};

MemorySessionStore.prototype._reapSessions = function(ms) {
    var threshold = +new Date - ms,
        sids = Object.keys(this.sessions);

    for(var i = 0, len = sids.length; i < len; ++i) {
        var sid = sids[i], sess = this.sessions[sid];
        if(sess.lastAccess < threshold) {
            this.events.emit('update', new packages.Offline(sess.data('username')));
        }
    }
};

var instance = new MemorySessionStore();

exports.getInstance = function(eventsEmitter) {
    instance.events = eventsEmitter;
    return instance;
};
