var crypto=require('crypto');


exports.md5=function(str){
    var pwd=crypto.createHash('md5').update(str).digest('base64');
    var salt=crypto.createHash('md5').update("salt").digest('base64');
    var newStr=pwd+salt;
    return crypto.createHash('md5').update(newStr).digest('base64');
}