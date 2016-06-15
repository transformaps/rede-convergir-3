require('./config/load');

var Config = require('nconf');
var Hoek = require('hoek');
var Glue = require('glue');
var Chalk = require('chalk');
var Db = require('./database');
var Utils = require('./util/utils');

process.title = Config.get('applicationTitle');

var manifest = {

    server: {

        cache: {
            name: "sessionCache",
            engine: require("catbox-memory"),
                        
            // other specific options for this cache client
            partition: "sessionCachePartition"
        },

        //  default connections configuration
        connections: {

            // controls how incoming request URIs are matched against the routing table
            router: {
                isCaseSensitive: false,
                stripTrailingSlash: true
            },

            // default configuration for every route.
            routes: {
                state: {
                    // determines how to handle cookie parsing errors ("ignore" = take no action)
                    failAction: "ignore"
                },

                // disable node socket timeouts (useful for debugging)
                timeout: {
                    server: false,
                    socket: false
                }
            }
        },
    },

    connections: [
        {
            host: "localhost",
            port: Config.get("port")
        }
    ],

    registrations: [

/*
        {
            plugin: {
                register: "...",
                options: require("./config/plugins/...")
            },
            options: {}
        },
*/

        {
            plugin: {
                register: "good",
                options: require("./config/plugins/good")
            },
            options: {}
        },

        {
            plugin: {
                register: "blipp",
                options: require("./config/plugins/blipp")
            },
            options: {}
        },

        {
            plugin: {
                register: "inert",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "vision",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "hapi-auth-cookie",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "hapi-qs",
                options: {}
            },
            options: {}
        },

        // dependencies: ["inert"]
        {
            plugin: {
                register: "./plugins/hapi-public/hapi-public.js",
                options: require("./config/plugins/hapi-public")
            },
            options: {}
        },

        // dependencies: ["hapi-auth-cookie"]
        {
            plugin: {
                register: "hapi-auth-session-memory",
                options: require("./config/plugins/hapi-auth-session-memory")
            },
            options: {}
        },

        // dependencies: ["vision", "hapi-auth-session-memory"]
        //   this is where we configure the views manager (using nunjucks) and declare the routes that
        //   return a view; note that reply.view is only available inside the plugin
        {
            plugin: {
                register: "./plugins/routes-views/routes-views.js",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "./plugins/routes-api/routes-api.js",
                options: {}
            },
            options: {
                routes: {  
                    prefix: Config.get("apiPrefix:v1")  
                }
            }
        },

        {
            plugin: {
                register: "./plugins/seneca-promise/seneca-promise.js",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "./plugins/initiatives/initiatives.js",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "./plugins/dashboard/dashboard.js",
                options: {}
            },
            options: {}
        },



/*
        {
            "good": require("./config/plugins/good")
        },

        {
            "blipp": require("./config/plugins/blipp")
        },

        {
            "inert": [{
                options: {}
            }]
        },

        {
            "vision": [{
                options: {}
            }]
        },

        // dependencies: []        
        {
            "./util/utils.js": [{
                options: {}
            }]
        },

        {
            "hapi-auth-cookie": [{
                options: {}
            }]
        },

        // dependencies: ["inert"]
        {
            "./plugins/hapi-public/hapi-public.js": require("./config/plugins/hapi-public")
        },




        // dependencies: ["hapi-auth-cookie"]
        {
            "hapi-auth-session-memory": require("./config/plugins/hapi-auth-session-memory")

        },

        // dependencies: ["vision", "hapi-auth-session-memory"]
        //   this is where we configure the views manager (using nunjucks) and declare the routes that
        //   return a view; note that reply.view is only available inside the plugin
        {   
            "./plugins/routes-views/routes-views.js": [{
                options: {}
            }]
        },


        {   
            "./plugins/routes-api/routes-api.js": require("./config/plugins/routes-api")
        },

        {
            "./plugins/seneca-promise/seneca-promise.js": [{
                options: {}
            }]
        },

        {   
            "./plugins/initiatives/initiatives.js": [{
                options: {}
            }]
        },

        {   
            "./plugins/dashboard/dashboard.js": [{
                options: {}
            }]
        }
*/
    ]
};

// TODO: remove good console if not in production
var glueOptions = {
    relativeTo: __dirname,
    preRegister: function(server, next){
        console.log("called prior to registering plugins with the server")
        next();
    },
    preConnections: function(server, next){
        console.log("called prior to adding connections to the server")
        next();
    }
};

Glue.compose(manifest, glueOptions, function (err, server) {

    Hoek.assert(!err, 'Failed registration of one or more plugins: ' + err);

    // start the server and finish the initialization process
    server.start(function(err) {

        Hoek.assert(!err, 'Failed server start: ' + err);

        // make the server object available for the methods in the ./util/utils module
        Utils.registerServer(server);
        
        // show some informations about the server
        console.log(Chalk.green('================='));
        console.log("Hapi version: " + server.version);
        console.log('host: ' + server.info.host);
        console.log('port: ' + server.info.port);
        console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);

        Db.query("SELECT * FROM version()")
            .then(function(result){
                console.log("database: ", result[0].version);
                console.log(Chalk.green('================='));
            });
        
    });
});


