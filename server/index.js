// server/index.js

const express = require("express");
const PORT = process.env.PORT || 5000;
const app = express();
//const mysql = require("mysql2");
const mysql = require("mysql2/promise");
const { execSync } = require("child_process");
const crypto = require("crypto");
const { Buffer } = require("buffer");

/***
 S001 START NON-ROUTE MIDDLEWARE
 ***/

app.use((req,res,next) =>
{
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type');
  next();
});
app.use(express.json());

console.log('Non-route middleware configured');

/***
 E001 END NON-ROUTE MIDDLEWARE
 S002 START DEBUG ROUTES
 ***/

app.get("/api/:param1.:param2", (req, res) => {
  console.log(JSON.stringify(req.params));
  console.log(JSON.stringify(req.body));
  console.log(req.ip);
  console.log('api');
  res.json({ s:0, message: "Serv()r", params: JSON.stringify(req.params) });
});

app.post("/echo", (req,res) => {
  console.log('API POST echo request from '+req.ip);
  res.json(req.body);
});

app.get("/pair", (req, res) => {
  console.log(req.ip);

  crypto.subtle.generateKey({
    name:'RSA-OAEP',
    modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),
    hash:'SHA-256'
  },true,['encrypt','decrypt']).then(
    async kp => {
      let uk = await crypto.subtle.exportKey('spki',kp.publicKey);
      let ik = await crypto.subtle.exportKey('pkcs8',kp.privateKey);
      let ke = [uk,ik];
      console.log('Exported keys');
      mrfiddle = Uint8Array.from(Buffer.from(JSON.parse(JSON.stringify(Buffer.from(uk)))));
      let bf = Buffer.from(uk);
      console.log(bf);
      console.log(Buffer.from(bf.toString('base64'),'base64'));
      let nk = await crypto.subtle.importKey('spki',mrfiddle,{hash:'SHA-256',name:'RSA-OAEP'},true,['encrypt'])
      let enc = Buffer.from(await crypto.subtle.encrypt({name:'RSA-OAEP'},nk,Buffer.from('PASS'))).toString('Base64');
      console.log(enc);
      let dec = await crypto.subtle.decrypt({name:'RSA-OAEP'},kp.privateKey,Buffer.from(enc,'Base64'));
      console.log(Buffer.from(dec).toString('utf-8'));
      console.log(await Promise.resolve('cat'));
      res.json({s:0,keys:ke});
    },
    err => {
      console.log('Failed to generate key pair (/pair)');
      console.error(err);
      res.json({s:1});
  });
});

console.log('Debug routes registered');

/***
 E002 END DEBUG ROUTES
 S003 START SQL CONSTANTS
 ***/

const DEFGATE = execSync("/home/user/pcrpto/server/ip.sh").toString().slice(0,-1);

const SQL_PROT = {
  host: DEFGATE,
  user: "uname",
  password: "pass",
  port: "3306",
  database: "pcr"
}

function poolconf(uname,pass){
  return {
    host: DEFGATE,
    user: uname,
    password: pass,
    port: "3306",
    database: "pcr"
  };
}

let sqs = [];
let ips = [];
let iks = [];

console.log('SQL constants defined');

/***
 E003 END SQL CONSTANTS
 S004 START HELPER FUNCTIONS
 ***/

function purger(i){
  ips[i]=null;ips=ips.filter(ip=>ip);
  iks[i]=null;iks=iks.filter(ik=>ik);
  sqs[i]=null;sqs=sqs.filter(sq=>sq);
  console.log('IP registration purged');
}

function sanitize(q) {
  return q.replaceAll(" ","_");
};

function mkeys(){
  return crypto.subtle.generateKey({
      name:'RSA-OAEP',
      modulusLength:2048,
      publicExponent:new Uint8Array([1,0,1]),
      hash:'SHA-256'
  },true,['encrypt','decrypt']);
}

function exp(uk){
  return crypto.subtle.exportKey('spki', uk).then(
    key => Buffer.from(new Uint8Array(key)).toString('base64'),
    err => {
      console.error(err);
      console.log('Failed to Export Key');
  });
}

function dec(i,b){
  return crypto.subtle.decrypt(
    {name:'RSA-OAEP'},
    iks[i],
    b
  );
}

function checkindex(res,i){
  if(i === -1){
    console.error( 
      'Record not found found.\n'+ 
      'IP & Private Key should have been registered by "/getkey"\n'+
      'Sending CORS error to client.'
    );
    res.send(''); //Empty string triggers CORS error in client.
  }
}

// ( req from routing functions )
function checkip(req){
  let i = ips.indexOf(req.ip)
  return (i !== -1)
}

function qandres(res,i,q){
  sqs[i].query(q).then(
    sql => res.json(sql),
    err => {
      res.send('');
      console.log('SQL Error: '+q);
      console.error(err);
  });
}

console.log('Helper functions defined');

/***
 E004 END HELPER FUNCTIONS
 S005 START PRODUCTION ROUTES
 ***/

app.get("/getkey", (req, res) => {
  console.log('Key requested '+req.ip);

  let i = ips.indexOf(req.ip);
  if(i !== -1){
    console.log('Record exists for '+req.ip+'--logging out.')
    purger(i);
  }

  i = ips.length;  
  ips[i] = req.ip; 

  function handlekp(i,kp){
    iks[i] = kp.privateKey;
    return exp(kp.publicKey);
  }

  mkeys().then(
    kp => handlekp(i,kp),
    err => {
      console.log('Failed to generate key pair "index.getkey"');
      console.error(err);
      throw err;
  }).then(
    uk => res.json(uk),
    err => {
      console.error(err);
      console.log('Failed to export public key "index.getkey"');
      purger(i);
  });
}); 

app.post("/login", (req,res) => {
  console.log('Login attempt '+req.ip);

  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  function mkpoolandq(pas){
    //console.log('Forging uname and pass '+Buffer.from(pas).toString());
    sqs[i] = mysql.createPool(poolconf(req.body.uname,pas));
    return sqs[i].query('show tables;');
  }

  dec(i,Uint8Array.from(Buffer.from(req.body.pass,'base64'))).then(
    pas => mkpoolandq(Buffer.from(pas)),
    err => {
      console.log('Failed to decrypt @ /login)');
      console.error(err); 
      throw err;
  }).then(
    sqlr => res.json(req.body.uname === 'ptoboss' ? {mode:'admin'} : {mode:'employee'}),
    err => {
      console.log('Sql Failed--probably credentials rejected @ /login');
      console.error(err);
      purger(i);
      res.send(''); //Generate CORS error
  });
});


app.get("/logout", (req, res) => {
  console.log('Logout request '+req.ip);
  let i = ips.indexOf(req.ip); 
 
  if(i > -1){
    purger(i);
    console.log('Log out completed.');
  }else{
    console.log('IP not found; no action taken.');
  }

  res.json({s:0});
});

app.post("/reset",(req,res)=>{
  console.log('Reset request: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i);

  if(sqs[i].pool.config.connectionConfig.user === 'ptoboss' && req.body.checkphrase === 'reset'){
    ips=[];
    sqs=[];
    iks=[];
    console.log('All registrations purged')
    res.json({s:0});
  }else{
    console.error('Check phrase mismatch or nonadmin user @ /reset');
    res.send(''); //Trigger CORS error
  }
});

app.get("/lemp",(req,res)=>{
  console.log('List employees request from '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  qandres(res,i,"select user from mysql.user where user NOT IN ('maria','ptoboss','mariadb.sys','root')");
})

app.post("/cuser",(req,res)=>{
  console.log('Create user request from '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  let newuser = sanitize(req.body.nuname);

  qandres(res,i,"GRANT INSERT,SELECT,DELETE ON pcr.pto TO "+newuser+"@'%' IDENTIFIED BY 'default'");
})

app.post("/duser",(req,res)=>{
  console.log('Delete user request from '+req.ip);
  let duser = sanitize(req.body.uname);

  if(duser === 'ptoboss'){
    console.error('Attempt to delete admin user blocked');
    res.send('');
  }else{
    let i = ips.indexOf(req.ip);
    checkindex(res,i); //error if ip not found
    qandres(res,i,"DROP USER IF EXISTS "+duser);
}})

app.get("/vreqs",(req,res)=>{
  console.log('List pto requests: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  let where = (sqs[i].pool.config.connectionConfig.user === 'ptoboss')?'':"where empid = '"+sqs[i].pool.config.connectionConfig.user+"'"
  qandres(res,i,'select * from pcr.pto '+where);
})

app.post("/spreq",(req,res)=>{
  console.log('Submit pto request: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  let u = sqs[i].pool.config.connectionConfig.user;
  let s = sanitize(req.body.start);
  let e = sanitize(req.body.end);
  if(u === 'ptoboss'){
    console.error('Blocked ptoboss submission attempt');
    res.send('');    
  }else{
    qandres(res,i,"insert into pto (empid,startdate,enddate) values ('"+u+"','"+s+"','"+e+"')")
  }
})

app.post("/rpreq",(req,res)=>{
  console.log('Delete pto request: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  let u = sqs[i].pool.config.connectionConfig.user;
  let id = sanitize(req.body.id);

  sqs[i].query("select empid from pto where id = "+id).then(
    jso => { console.log(jso[0]);
      if(jso[0][0] && (jso[0][0].empid === u || u === 'ptoboss')){
        sqs[i].query("delete from pto where id = "+id).then(
          jso => res.json(jso),
          err => {
            console.error(err);
            res.send('');
         });
      }else{
        console.error("User name does not match or request does not exist");
        res.send('');
    }},
    err => {
      console.error(err);
      res.send('');
  });
});

app.post("/preqs",(req,res)=>{
  console.log('Purge request: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i);

  if(sqs[i].pool.config.connectionConfig.user === 'ptoboss' && req.body.checkphrase === 'PURGE'){
    qandres(res,i,"truncate table pto");
  }else
    console.error('Blocked purge request');
    res.send('');
});

console.log('Production routes registered');

/***
 E005 END PRODUCTION ROUTES
 ***/

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
