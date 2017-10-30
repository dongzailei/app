//管理与数据库操作的所有方法

//增删改查
var MongoClient=require('mongodb').MongoClient();
var url='mongodb://localhost:27017/web1706';
//获取连接
var getConnection=function(callback){
    MongoClient.connect(url,function(err,db){
       if(err){
           console.log(err);
           callback(err,null);
           return;
       }else{
          // console.log('连接成功');
        callback(null,db);
       }

    });
};
   //1.查询所有的数据
exports.findAll=function(collection,callback){

    getConnection(function(err,db){
       if(err){
           console.log('连接失败');

           return;
       }

        db.collection(collection).find({}).sort({time:-1}).toArray(function(err,docs){
           callback(err,docs);


        });
    });
};
//查询指定的数据，并将该数据分页排序
//db.student.find({ }).skip(3).limit(2);
/*
collection表示数据库中的某一个集合
json表示查询的条件
C 表示第三个参数，如果传入的只有三个，C就表示callback
    如果传入的参数有四个，那么C就表示{skip:m,limit:n},D就表示callback
  D：表示第四个参数，只有传入四个参数时，才会表示callback
  如果传入的是3个参数，则D为undefined，不去使用
*/
exports.find=function(collection,json,C,D){
    if(arguments.length==3){//3个参数
        var page=1;
        var limit=50;
        var callback= C;
    }else if(arguments.length==4){//四个参数
        var page= C.page;//跳过的记录的条数
        var limit= C.limit;//每页显示的条数
        var callback=D;
    }else{
        throw new Error('参数个数错误');
        return;
    }
    //获取跳过的记录的条数
    var skip=(page-1)*limit;
    //获取连接。查询数据
    getConnection(function(err,db){
       if(err){
           callback(err,null);
           return;
       }
        db.collection(collection).find(json).skip(skip).limit(limit).toArray(function(err,docs){
           callback(err,docs);
            db.close();
        });
    });
};
//增
exports.add=function(collection,json,callback){

    getConnection(function(err,db){
  if(err){callback(err,null);return;}
    db.collection(collection).insertOne(json,function(err,result){
        callback(err,result);
        db.close();
    })  ;
    });
};
//删除
exports.delete=function(collection,json,callback){
  getConnection(function(err,db){
        if(err){callback(err,null);return;}
      db.collection(collection).deleteOne(json,function(err,result){
         callback(err,result);
          db.close();
      });
    })  ;
};
//修改
exports.modify=function(collection,json,data,callback){
  getConnection(function(err,db){
      if(err){callback(err,null);return;}
      db.collection(collection).updateOne(json,{$set:data},function(err,result){
         callback(err,result);
          db.close();
      });
  })  ;
};

/*
exports.regist=function(req,res){
  res.render('regist');
};
exports.doRegist=function(req,res){
    console.log(req);
    var username=req.body.username;
    var password=req.body.password;
    var json={username:username,password:password};
    //判断用户名是否存在
    db.find('user1',{username:username},function(err,docs){
        if(err){
            console.log(err);
            res.send('网络错误');
            return;
        }
        if(docs.length!=0){
            //用户名重复
            res.send('用户名重复')
        }else{
            //没找到数据，用户名可用
            //将数据保存到数据库中
            db.add('user',json,function(err,result){
                if(err){
                    console.log(err);
                    res.send('网络错误');
                    return;
                }
                res.send('注册成功');
            })
        }
    });

}*/
