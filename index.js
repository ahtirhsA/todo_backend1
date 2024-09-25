const express=require('express')
const cors=require('cors')
const app=express()
app.use(express.json())

app.use(cors({
    //origin: '*'
   origin: 'http://localhost:3005' // Allow requests from this origin
 }));



const {open}=require('sqlite');
const sqlite3=require('sqlite3');

const path=require('path');
const { request } = require('https');
const dbpath=path.join(__dirname,'todo.db');
let db

const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');


const initializeConnection=async ()=>{

try{
   db=await open({
      filename:dbpath,
      driver:sqlite3.Database
   })
   
   app.listen(3004,()=>{
      console.log('Server listening at http://localhost:3004');
      });
}
catch (e){
   console.log(`The error message is ${e}`);
}

}

initializeConnection()



app.post('/',async (request,response)=>{
   const {id,mailId,pswrd,name,mblNum}=request.body 

   const hashedpassword=await bcrypt.hash(pswrd,10);

   const checkDb=`
     SELECT * FROM regUsers WHERE email='${mailId}';
   `

   const resCheck=await db.get(checkDb);

   if (resCheck===undefined){

      const insertQuery=`
        INSERT INTO regUsers(id,email,password,name,phone)VALUES('${id}','${mailId}','${hashedpassword}','${name}','${mblNum}');
      `
      await db.run(insertQuery);
      response.send('ok');

   }
   else{
      response.send('not ok')
   }
})




app.post('/login',async (request,response)=>{

   const {mailId1,pswrd1}=request.body

   const query=`
    SELECT * FROM regUsers WHERE email='${mailId1}';
   `

   const runLoginQuery=await db.get(query)

   if (runLoginQuery!==undefined){

      const cmppswd=await bcrypt.compare(pswrd1,runLoginQuery.password)

      if (cmppswd){

         const payload={
            userMail:mailId1
         }

         const jwtToken=jwt.sign(payload,'ASHRITHA')

         response.send({jwtToken,userLoginName:runLoginQuery.name,userIdt:runLoginQuery.id})
      }
      else{
         response.status(401)
         response.send('not ok1')
      }

   }
   else{
      response.status(404)
      response.send('not ok2')
   }


})

const middleWear=(request,response,next)=>{

   const authHead=request.headers['authorization'];
   let jwt_token;
    
   if (authHead!==undefined){
      jwt_token=authHead.split(' ')[1]

      if (jwt_token!==undefined){
         jwt.verify(jwt_token,'ASHRITHA',(error,payload)=>{
            if (error){
               response.status(404)
               response.send('Invalid Jwt')
            }
            else{
               next()
            }
         })
      }
      else{
         response.status(404)
         response.send('Jwt not defined')
      }
   }else{
      response.status(404)
      response.send('Authorization header not provided')
   }
   
}

app.put('/detailsupdate/:userIdtn',middleWear,async (request,response)=>{

   const {userIdtn}=request.params
    
   const {updName,updEmail,updPswd,updPhone}=request.body 

   const newUpdPswd=await bcrypt.hash(updPswd,10);

   const updtQuery=`
      UPDATE regUsers 
      SET email='${updEmail}',
      password='${newUpdPswd}',
      name='${updName}',
      phone='${updPhone}'
      WHERE id='${userIdtn}';
   `

   const result1=await db.run(updtQuery)
   console.log(result1)
   response.send('updated')
   
})



app.get('/profileInfo/:pid',middleWear,async (request,response)=>{

  const {pid}=request.params

  const profileQuery=`
     SELECT * FROM regUsers WHERE id='${pid}';
  `

  const runQuery=await db.get(profileQuery)

  response.send(runQuery)
    

})

app.delete('/delUser/:delId',middleWear,async (request,response)=>{
   const {delId}=request.params

   const delQuery=`
    DELETE FROM regUsers WHERE id='${delId}'
   `
  await db.run(delQuery)

  response.send('deleted')

})


app.get('/todos',middleWear,async (request,response)=>{

   const query=`
   
     SELECT * FROM tasks;
   `
   const resQuery=await db.all(query)
   response.send(resQuery);
})


app.post('/todos',middleWear,async (request,response)=>{
    
   const {id,task,status}=request.body

   const query=`
      INSERT INTO tasks(id,task,status)
      VALUES('${id}','${task}',${status});
   `

   const resQuery=await db.run(query)
   console.log(resQuery);
   response.send('ok')

});

app.delete('/todos/:id',middleWear,async (request,response)=>{
   const {id}=request.params

   const query=`
      DELETE FROM tasks WHERE id='${id}';
   `
   await db.run(query);
   response.send('deleted')
})

app.put('/todos/:id',middleWear,async (request,response)=>{
   const {id}=request.params
   const {status}=request.body 

   const query=`
     UPDATE tasks SET status=${status} WHERE id='${id}';
   `

   await db.run(query)
   response.send('updated')
})


/*

app.put('/detailsupdate',async ()=>{
    
   const {userId,updName,updEmail,updPswd}=request.body 

   const updtQuery=`
      UPDATE TABLE regUsers 
      SET 
   `

})

*/