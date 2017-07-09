var express = require('express');
var app = express();
var pg = require('pg');
var session = require('express-session');
var connectionString = "postgres://postgres:farcry@localhost:5432/backlog";

app.use(session({secret:'g83$Ktg8hA*jg83'}));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get("/", function(request,response){
    if (!session.username)
        response.redirect('/home.html');
});

app.get('/getitem', function(request, response) {
	getitem(request, response);
});

app.get('/register', function(request, response){

    register(request, response);
});

app.get('/login', function(request, response){
    login(request, response);
});

app.get('/logout',function(req,res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

    app.listen(app.get('port'), function () {
        console.log('Node app is running on port', app.get('port'));
    });

    function getitem(request, response) {
        if(!session.uid)
            return;
        var uid = -1;
        uid = session.uid;

        var client = new pg.Client(connectionString);

        client.connect(function (err) {
            if (err) {
                console.log("Error connecting to DB: ");
                console.log(err);
                callback(err, null);
            }

        });
        console.log("connected");
        console.log("getting items from uid " + uid);
        var sql = 'SELECT * from item WHERE uid = $1::int';
        var params = []
        var query = client.query(sql, function (err, result) {
            client.end(function (err) {
                if (err) throw err;
            });
            console.log("Found result: " + JSON.stringify(result.rows));

        });
    }

    function register(request, response) {
        var client = new pg.Client(connectionString);
        console.log("request:" + request.query.name);
        client.connect(function (err) {
            if (err) {
                console.log("Error connecting to DB: ");
                console.log(err);
                callback(err, null);
            }

        });

        var requestname = request.query.name;
        var sql = 'INSERT INTO userdata(username, password) VALUES ($1::varchar,$2::varchar)';
        var params = [requestname, request.query.password];

        var query = client.query(sql, params, function (err, result) {
            client.end(function (err) {
                if (err) throw err;
            });

            if (err.code == 23505) {
                console.log("duplicate name");
                response.render('pages/register', {error: "Username is already taken"});
            }
            if (err.code == 23502) {
                console.log("invalid password");
                response.render('pages/register', {error: "invalid password"});
            }

        });
    }

    function login(request, response) {
        var client = new pg.Client(connectionString);
        console.log("request:" + request.query.name);
        client.connect(function (err) {
            if (err) {
                console.log("Error connecting to DB: ");
                console.log(err);
                callback(err, null);
            }

        });

        var requestname = request.query.name;
        var sql = 'SELECT * from userdata WHERE username = $1::varchar';
        var params = [request.query.name];
        console.log(request.query.name);
        var query = client.query(sql, params, function (err, result) {
            client.end(function (err) {
                if (err) throw err;
            });

            if (err) {
                console.log("Error in query: ");
                console.log(err);
            }
            console.log(request.rows);
            if (!result.rows[0]) {
                console.log("invalid username/password");
                var error = {error: "Invalid username/password"};
                response.render('pages/login', error);
            }

            else if (request.query.name == result.rows[0].username && request.query.pass == result.rows[0].password) {
                console.log("logged in");
                var sess = request.session;
                sess.username = result.rows[0].username;
                sess.uid = result.rows[0].id;
                console.log(sess);
                response.render('pages/index', request.session);
            }


        });
    }

