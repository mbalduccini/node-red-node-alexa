module.exports = function(RED) {

    var handleList = [];

    function createResponseWrapper(node,res) {
        var wrapper = {
            _res: res
        };
        var toWrap = [
            "append",
            "attachment",
            "cookie",
            "clearCookie",
            "download",
            "end",
            "format",
            "get",
            "json",
            "jsonp",
            "links",
            "location",
            "redirect",
            "render",
            "send",
            "sendfile",
            "sendFile",
            "sendStatus",
            "set",
            "status",
            "type",
            "vary"
        ];
        toWrap.forEach(function(f) {
            wrapper[f] = function() {
                node.warn(RED._("httpin.errors.deprecated-call",{method:"msg.res."+f}));
                var result = res[f].apply(res,arguments);
                if (result === res) {
                    return wrapper;
                } else {
                    return result;
                }
            }
        });
        return wrapper;
    }

// =============================================================
// =============================================================

    function AlexaLaunchReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            var found   = false;
            var double  = false;

            for (var i = 0, len = handleList.length; i < len; i++) {
                if(handleList[i].url == this.confSkill.url) {
                    found = true;
                    if(handleList[i].node.id == node.id)
                        double = true;
                }
            }
            if(!found) setAlexaHandler(this.confSkill.url);

            if(!double) {
                handleList.push({
                    "url":  this.confSkill.url,
                    "type": "LaunchRequest",
                    "node": node
                });
            }

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa LaunchRequest", AlexaLaunchReq);

// =============================================================
// =============================================================

    function AlexaIntentReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            var found   = false;
            var double  = false;

            for (var i = 0, len = handleList.length; i < len; i++) {
                if(handleList[i].url == this.confSkill.url) {
                    found = true;
                    if(handleList[i].node.id == node.id)
                        double = true;
                }
            }
            if(!found) setAlexaHandler(this.confSkill.url);

            if(!double) {
                handleList.push({
                    "url":  this.confSkill.url,
                    "type": "IntentRequest",
                    "node": node
                });
            }

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa IntentRequest", AlexaIntentReq);

// =============================================================
// =============================================================

    function SessionEndReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            var found   = false;
            var double  = false;

            for (var i = 0, len = handleList.length; i < len; i++) {
                if(handleList[i].url == this.confSkill.url) {
                    found = true;
                    if(handleList[i].node.id == node.id)
                        double = true;
                }
            }
            if(!found) setAlexaHandler(this.confSkill.url);

            if(!double) {
                handleList.push({
                    "url":  this.confSkill.url,
                    "type": "SessionEndedRequest",
                    "node": node
                });
            }

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa SessionEndRequest", SessionEndReq);

// =============================================================
// =============================================================

    function setAlexaHandler(url) { 
        
        this.errorHandler = function(err,req,res,next) {
            RED.log.error(err);
            res.sendStatus(500);
        };

        this.callback = function(req,res) {
            var type  = req.body.request.type
            var resp  = {};

            switch(type) {
                case "IntentRequest":
                    resp.intent = req.body.request.intent.name;
                    resp.slots  = req.body.request.intent.slots;

                case "LaunchRequest":
                case "SessionEndedRequest":
                    resp.type = type;
            }

            for (var i = 0, len = handleList.length; i < len; i++) {
                if(handleList[i].url == req.url && handleList[i].type == type) {
                    var msg = { payload:resp, res:createResponseWrapper(handleList[i].node, res)}
                    handleList[i].node.send(msg);
                }
            }
        };
 
        this.httpMiddleware = function(req,res,next) { next(); }

        if (RED.settings.httpNodeMiddleware) {
            if (typeof RED.settings.httpNodeMiddleware === "function") {
                httpMiddleware = RED.settings.httpNodeMiddleware;
            }
        }
        
        RED.httpNode.post(url, httpMiddleware, callback, errorHandler);
    }

// =============================================================
// =============================================================

    function AlexaResponse(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);

        this.on("input",function(msg) {
            if (msg.res) {
                var statusCode = 200;
                var closing = true;

                if(typeof msg.closing !== 'undefined' && msg.closing !== null) 
                    closing = msg.closing;
    
                var json = {
                    "response": {
                        "shouldEndSession": closing,
                        "outputSpeech": {
                            "text": ""+msg.payload,
                            "type": "PlainText"
                        }
                    },
                    "version": "1.0"
                };
                msg.res._res.status(statusCode).send(json);

            } else {
                RED.log.warn(RED._("node-alexa.errors.no-response"));
            }
        });
    }
    RED.nodes.registerType("Alexa Response", AlexaResponse);

// =============================================================
// =============================================================

    function ConfigAlexa(config) {
        RED.nodes.createNode(this, config);
        this.url = config.url;
    }
    RED.nodes.registerType("alexa-config", ConfigAlexa);
}