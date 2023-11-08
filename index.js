const config = require('@bootloader/config');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { safely } = require('../../mry/mehery.social/app/service/responsy');

// const sample_controller = require('../app/controller/sample_controller');
// router.use('/sample',sample_controller);

const contextPath=config.getIfPresent("server.contextPath");
const controllerDir=config.getIfPresent("dir.controller");
console.log("contextPath",contextPath)
console.log("controllerDir",controllerDir)

function RouterController(){
    const _router = express.Router();
    let _path = "/";
    let wrapper = {
        path(path){
            if(path !== undefined){
                _path = path;
            }
            return _path;
        },
        router(){
            return _router;
        }
    };
    ['all', 'get' , 'post' , 'put' , 'delete' , 'patch' , 'options' , 'head'].forEach(method => {
        wrapper[method] = async function(a,b,c,d,e,f){
            //console.log(_path,method,arguments)
            let newArgs = [...arguments].map(function(arg){
                if(typeof arg == 'function'){
                    return safely(arg)
                } else return arg;
            });
            return await _router[method].apply(_router,newArgs);
        }
    });
    return wrapper;
}

function fixpath(path){
    // let contexts = path.split("/");
    // if(contexts[0] != ''){
    //     contexts.unshift("");
    // }
    // if(contexts[contexts.length-1] != ''){
    //     contexts.push("");
    // }
    return ("/"+path+"/").replace(/\/+/g, "/");
}

module.exports = {
    routes(options){

        let { dir="./app/controller/", context = contextPath } = options || { 
            dir : "./app/controller/", context : contextPath || "/" };
            
        context = fixpath(context);

        let contollers = (function getFiles(dir, files = []) {
            // Get an array of all files and directories in the passed directory using fs.readdirSync
            const fileList = fs.readdirSync(dir);
            // Create the full path of the file/directory by concatenating the passed directory and file/directory name
            for (const file of fileList) {
              const name = `${dir}/${file}`;
              // Check if the current file/directory is a directory using fs.statSync
              if (fs.statSync(name).isDirectory()) {
                // If it is a directory, recursively call the getFiles function with the directory path and the files array
                getFiles(name, files);
              } else {
                // If it is a file, push the full path to the files array
                files.push({path : name,file});
              }
            }
            return files;
        })(dir);
        //__dirname+"/../app/controller/"
        
        contollers.forEach(element => {
            const controller = require.main.require(element.path);
            //const controller = require('../app/controller/'+element.file);
            if( typeof controller == 'function'
                && controller.name == 'router'
                && typeof controller.get == 'function'
                && typeof controller.post == 'function'
                && typeof controller.all == 'function'
                && typeof controller.head == 'function'
            ){
                //console.log("DefaultRouter",element,typeof controller)
                //console.log("DefaultRouter",controller)
                router.use(context,controller);
            } else if(typeof controller == 'function') {
                //console.log("RouterController",element,typeof controller)
                let wrapper = RouterController();
                //console.log("RouterController.path",wrapper.path())
                controller(wrapper);
                //console.log("RouterController.router",wrapper.router())
                let path = fixpath(context + wrapper.path());
                console.log(path,"->",element.file)
                router.use(path,wrapper.router());
            }
        
        });

        return router;
    }
};