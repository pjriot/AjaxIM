var http = require('http');

// Cookie that stores the session ID
// Will be set as request.sessionID in `authenticate` and `friends` functions
exports.cookie = 'sessionid';

exports.authenticate = function(request, callback) {
    var host = 'connect.uws',
        site = http.createClient(80, host),
        auth = site.request('GET', '/chat/ajaxim/user/',
                            {'host': host,
                             'cookie': exports.cookie + '=' + request.sessionID});

    auth.end();
    auth.on('response', function(response) {
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            data += chunk;
        });
        response.on('end', function() {
            try {
                var user = JSON.parse(data);
                user.host = host;
                callback(user);
            } catch(e) {
                callback();
            }
        });
    });
};

exports.friends = function(request, data, callback) {
    var host = data.host, // retrieve the hostname
         site = http.createClient(80, host),
         auth = site.request('GET', '/chat/ajaxim/friends/',
                             {'host': host,
                              'cookie': exports.cookie + '=' + request.sessionID});
    auth.end();
    auth.on('response', function(response) {
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            data += chunk;
        });

        response.on('end', function() {
            try {
                callback(JSON.parse(data));
            } catch(e) {
                callback();
            }
        });
    });
};
