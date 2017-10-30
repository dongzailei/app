var db = require("../myModule/db.js");
var sd = require("silly-datetime");
var fd=require('formidable');
var fs=require('fs');
var md5=require("./MD5.js");
var gm=require("gm");
//用于将字符串的id转换为ObjectId
var objctId = require("mongodb").ObjectID;

var collection = "message";
exports.showIndex = function(req,res){
    //判断是否登录
    var cookies=req.cookies;//获取所有的cookie
    if(!cookies){
        //没有cookies
        res.render('login ');//跳转到登录
        return;
    }
    var username=cookies.username;//获取登录成功后设置的username这个cookie
    if(username){//登录过，跳转到留言的页面
        db.find(collection,{},function(err,docs){
            if(err){
                console.log(err);
                res.render("error");
                return;
            }
            //获取用户的信息 用户名，头像
            db.find('user',{},function(err,users){
                if(err){
                    console.log(err);
                    res.render("error");
                    return;
                }
                //返回的数据  留言信息、所有用户信息、登录的用户名
                res.render("index",{msg:docs,users:users,username:username});
            });

        });
    }else{//没有登录跳转到登录页面
        res.render('login');
    }

}

exports.add = function(req,res){
    //console.log(req.body);
    //通过cookie获取，不再使用参数方式
    var username = req.cookies.username;
    var msg = req.body.msg;
    var date = sd.format(new Date(),"YYYY-MM-DD HH:mm:ss");
    //console.log(date);
    var json = {username:username,msg:msg,date:date};
    db.add(collection,json,function(err,result){
        if(err){
            res.render("error");
            return;
        }
        res.redirect("/");
    });
}

exports.modify = function(req,res){
    //console.log(req.query.id);
    var id = req.query.id;
    id = objctId(id);//使用objectId将字符串的id转换为ObjectID类型
    db.find(collection,{_id:id},function(err,docs){
        if(err){
            console.log(err);
            res.end();
            return;
        }
        //console.log(docs);
        res.render("update",{msg:docs});
    });
}

exports.update = function(req,res){
    var id = objctId(req.body.id);
    var msg = req.body.msg;
    var date = sd.format(new Date(),"YYYY-MM-DD HH:mm:ss");
    var json = {_id:id};//修改的条件
    var data = {msg:msg,date:date};//修改的数据
    db.modify(collection,json,data,function(err,result){
        if(err){
            console.log(err);
            res.render("error");
            return;
        }
        res.redirect("/");
    });
}

exports.del = function(req,res){
    console.log(req);
    var id = req.query.id;
    //console.log(id);
    id = objctId(id);
    //console.log(id);
    var json = {_id:id};
    db.delete(collection,json,function(err,result){
        if(err){
            console.log(err);
            res.render("error");
            return;
        }
        //console.log(result);
        res.redirect("/");
    });
}


exports.regist = function(req,res){
    res.render("regist");
}

exports.doRegist = function(req,res){
    //console.log(req);
    var username = req.body.username;
    var password = req.body.password;
    password=md5.md5(password);
    var json = {username:username,password:password,pic:"/imgs/1.jpg"};
    //判断用户名是否存在
    db.find("user",{username:username},function(err,docs){
        if(err){
            console.log(err);
            res.send("网络错误");
            return;
        }
        if(docs.length!=0){//找到数据了，用户名重复
            res.send("用户名重复");
        }else{//没找到数据，用户名可用
            //将数据保存到数据库中
            db.add("user",json,function(err,result){
                if(err){
                    console.log(err);
                    res.send("网络错误");
                    return;
                }
                db.find('user',{username:username},function(err,docs){
                    if(err){
                        console.log(err);
                        res.send("网络错误");
                        return;}
                    res.cookie('username',req.body.username);//用户名
                    res.cookie('_id',docs[0]._id);//用户的id
                    res.redirect('/');
                });

            });
        }
    });
}
exports.login=function(req,res){
    var username=req.body.username;
    var password=req.body.password;

    password=md5.md5(password);
    db.find('user',{username:username,password:password},function(err,docs){
        if(err){console.log(err);res.render('error');return;}
        if(docs.length==0){
            res.send('用户名或密码错误')

        }else{
            //登录成功
            res.cookie('username',req.body.username);//用户名
            res.cookie('_id',docs[0]._id);//用户的id
            //跳转到index
            //res.render('index',{username:req.body.username,msg:docs});
            res.redirect('/');
        }
    });
};
exports.tc=function(req,res){

    res.clearCookie('username');
    res.clearCookie('_id');
   res.redirect('/');
}
exports.upload=function(req,res){
  res.render('upload');
};
exports.doupload=function(req,res){
    var form=fd.IncomingForm();//创建表单对象
    form.uploadDir='./upload';//设置保存的路径
    form.parse(req,function(err,fields,files) {
        if (err) {
         console.log(err);
            res.render('error');
        }


        var oldPath=files.pic.path;
        var name=files.pic.name;
        var arr=name.split('.');
        var extname=arr[arr.length-1];
        var date=new Date();
        var str=sd.format(date,'YYYYMMDDHHmmss');
        var newPath=str+"."+extname;
        fs.rename(oldPath,"./upload/"+newPath,function(err){
            if(err){
                console.log(err);
                res.render("error");
                return;
            }
            //跳转到上传的那个文件夹
            res.render("pic",{pic:newPath})

        });
    });
};
exports.cut=function(req,res){
    var x=parseInt(req.query.x);
    var y=parseInt(req.query.y);
    var w=parseInt(req.query.width);
    var h=parseInt(req.query.height);
    var img=req.query.img;
    //crop用于剪切图片，4个参数分别表示宽，高，x，y
    gm("./upload/"+img).crop(w,h,x,y).write("./touxiang/pic_"+img,function(err){
        if(err){
            console.log(err);
            res.send("失败")
        }else{
           //将修改后的数据保存进数据库
            var cookies=req.cookies;//获取所有的cookie
            if(!cookies){
                //没有cookies
                res.render('login');//跳转到登录
                return;
            }
            var username=cookies.username;
            var path={pic:"pic_"+img};
            db.modify("user",{username:username},path,function(err,result){
                if(err) {
                    console.log(err);
                    res.render("error");
                    return;
                }
                res.redirect("/")
            })
        }
    })
}