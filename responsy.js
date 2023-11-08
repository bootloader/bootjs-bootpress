const status  = {
    UNAUTHORIZED : { key :  "UNAUTHORIZED", code : 401},
    PARAM_MISSING : { key :  "PARAM_MISSING", code : 400},
    PARAM_INVALID : { key :  "PARAM_INVALID", code : 400}
}

function throwInputException(status,fieldError){
    throw {
        statusCode : status.code,statusKey : status.key, errors : [fieldError]
    }
}

function printRequest(req,{printHeaders}){
    console.log("/=============  " + new Date() + "   =============/")
    if(printHeaders){
        console.log(JSON.stringify(req.headers));
        console.log("/---------------------------------------------/")
    }
    if(req.body)
        console.log(JSON.stringify(JSON.parse(JSON.stringify(req.body))))
    console.log("\n") 
}

function atob(b64Encoded){
    return Buffer.from(b64Encoded, 'base64').toString()
}

function decode(){
    for(var i in arguments){
        try {
            if(arguments[i]){
                console.log(arguments[i],atob)
                return atob(arguments[i]);
            }
        } catch(e){
        }
    }
    console.log("IMAPASS")
    for(var i in arguments){
        if(arguments[i]){
            return (arguments[i]);
        }
    }
}

function Response(version){
   this.json = {
    timestamp : Date.now() ,version : version
   }
}
Response.prototype = {
    status(status){
        this.json.status = status;
        return this;
    },
    ok(){
        return this.status("SUCCESS");
    },
    results(results){
        this.json.results = results;
        return this;
    },
    meta(meta){
        this.json.meta = meta;
        return this;
    },
    version(version){
        this.json.version = version;
        return this;
    },
    v(num){
        return this.version('v'+num);
    },
    build(){
        return this.json;
    }
}
Response.ok =  function(){
    return new Response('v1').ok();
}
Response.v =  function(num){
    return new Response().v(num);
}


module.exports = {
    status : status,
    throwInputException(status,fieldError){
        return throwInputException(status,fieldError)
    },
    throwMissinInputException(fieldError){
        return throwInputException(status.PARAM_MISSING,fieldError)
    },
    printRequest(req){
        return printRequest(req);
    },
    safely(asyncFunction,_options) {
        let options = {
            printRequest :  false,
            ..._options || {}
        }
        return async (req, res, next) => {
            try {
                if(options.printRequest){
                    printRequest(req,options);
                }
                await asyncFunction(req, res, next);
            }
            catch (e) {
                if(e.statusCode){
                    return res.status(e.statusCode).send(e);
                }
                console.error(e);
                // TODO Log error internally
                if(req.accepts( 'application/json' )){
                    res.status(500).send({ errro : "Server Error", message : e.message });
                } else {
                    res.status(500).send( "Server Error");
                }
            }
        }
    },
    wrap(appOrRouter){
        return {
            
        }
    },
    cdn(options){
        options || {CONST:{}};
        let _options = {
            viewName : "test",
            ...options,
            CONST : {
                CDN_URL : "https://deploy-xyz.mehery-web.pages.dev", CDN_DEBUG :  false,
                APP_TITLE : "Test",
                APP : "wwww", APP : "www", APP_SITE : undefined, APP_CONTEXT: "/www",
                CDN_VERSION: "5",
                SESS: "req.session.user",
                ...options.CONST
            }
        };
        return function(req, res,next){
            let BOOTJX_CDN_URL = req?.cookies?.CDN_URL || req?.cookies?.BOOTJX_CDN_URL;
            if (BOOTJX_CDN_URL) {
                _options.CONST.CDN_URL =  decode(req?.cookies?.CDN_URL,req?.cookies?.BOOTJX_CDN_URL, "http://127.0.0.1:8080");
                _options.CONST.CDN_DEBUG = true;
            }
            res.render(_options.viewName, {
                CONST : _options.CONST,
                CONST_SCRIPT : 'window.CONST='+JSON.stringify(_options.CONST)
            });
        }

    },
    Response : Response
}