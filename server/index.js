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
  },true,['encrypt','decrypt'])
  .then(
    async kp=>{
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
    e=>{
      console.log('Failed to generate key pair (/pair)');
      console.error(e);
      res.json({s:1});
  });
});

console.log('Debug routes registered');
/***
 E002 END DEBUG ROUTES
 S003 START SQL CONSTANTS
 ***/

const DEFGATE = execSync("/srv/server/ip.sh").toString().slice(0,-1);

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
  return crypto.subtle.exportKey('spki', uk)
  .then(
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
  sqs[i].query(q)
  .then(
    sql => res.json(sql),
    err => {console.log('SQL Error: '+q);console.error(err);}
  );
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
      console.error(err);
      console.log('Failed to generate key pair "index.getkey"');
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
//  console.log('Forging uname and pass');
//  sqs[i] = mysql.createPool(poolconf('ptoboss','bossman'));

  function mkpoolandq(pas){
    console.log('Forging uname and pass'+Buffer.from(pas).toString());
    sqs[i] = mysql.createPool(poolconf('ptoboss','bossman'));
//    sqs[i] = mysql.createPool(poolconf(req.body.uname,pas));
    return sqs[i].query('show tables;');
  }

  dec(i,Uint8Array.from(Buffer.from(req.body.pass,'base64')))
  .then(
    pas => mkpoolandq(pas),//sqs[i].query('show tables;'),//gensqlpool(res,i,req.body.uname,pas),
    err => {
      console.error(err); 
      console.log('Failed to decrypt @ /login)');
      throw err;
  })
  .then(
    sqlr => res.json(sqlr[0]),
    err => {
      console.error(err);
      console.log('Sql Failed--probably credentials rejected @ /login');
      purger(i);
      res.send(''); //Generate COPS error
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
  console.log('Reset request from '+req.ip)

  if(req.body.checkphrase === 'reset'){
    ips=[];
    sqs=[];
    iks=[];
    console.log('All registrations purged')
    res.json({s:0});
  }else{
    console.error('Check phrase mismatch @ /reset');
    res.send(''); //Trigger CORS error
  }
});

app.get("/lemp",(req,res)=>{
  console.log('List employees request from '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  qandres(res,i,'select user from mysql.user');
})

app.post("/cuser",(req,res)=>{
  console.log('Create user request from '+req.ip);
  let newuser = sanitize(req.body.nuname);

  qandres(res,i,"GRANT INSERT,SELECT,DELETE ON pcr.pto TO "+newuser+"@'%' IDENTIFIED BY 'default'");
})

app.get("/allreqs",(req,res)=>{
  console.log('List pto reqeusts request from '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  qandres(res,i,'select * from pcr.pto');
})

console.log('Production routes registered');
/***
 E005 END PRODUCTION ROUTES
 ***/

/*app.get("/", (req, res) => {
  res.sendFile("/srv/client/public/index.html");
});
*/

/*app.get("/favicon.ico", (req,res) => {
  res.setHeader("Content-Type", "image/vnd.microsoft.icon");
  res.send(execSync("cat build/favicon.ico"));
});*/

app.get("/static/:mime/:file", (req,res) => {
  const catline = "cat build/static/"+`${req.params.mime}`+"/mimefile";
  const mimetype = execSync(`${catline}`).toString().slice(0,-1);
  res.setHeader("Content-Type", mimetype);
  res.sendFile(`build/static/${req.params.mime}/${req.params.file}`);
});

app.post("/create/:fname.:lname", (req, res) => {
  let sql = `INSERT INTO test (firstname, lastname) VALUES ('${sanitize(req.params.fname)}', '${sanitize(req.params.lname)}');`;
  con.query(sql, function (err, result) {
    if (err) {res.json({ message: "Failed"}); console.log(err);}
    else {res.json({ message: "Created", sqlret: JSON.stringify(result) });}
  });
});

app.get("/read/:id", (req, res) => {
  let sql = `SELECT * FROM test WHERE id = '${sanitize(req.params.id)}';`;
  con.query(sql, function (err, result) {
    if (err) {res.json({ message: "Failed" }); console.log(err);}
    else {res.json({ message: JSON.stringify(result), sqlret: JSON.stringify(result) });}
  });
});

app.get("/update/:id.:fname.:lname", (req, res) => {
  let sql = `UPDATE test SET firstname = '${sanitize(req.params.fname)}', lastname = '${sanitize(req.params.lname)}' WHERE id = '${sanitize(req.params.id)}';`;
  con.query(sql, function (err, result) {
    if (err) {res.json({ message: "Failed"}); console.log(err);}
    else {res.json({ message: "Updated", sqlret: JSON.stringify(result), q: sql });}
  });
});

app.get("/delete/:id", (req, res) => {
  let sql = `DELETE FROM test WHERE id = '${sanitize(req.params.id)}';`;
  con.query(sql, function (err, result) {
    if (err) {res.json({ message: "Failed"}); console.log(err);}
    else {res.json({ message: "Deleted", sqlret: JSON.stringify(result) });}
  });
});

app.get("/reset", (req, res) => {
  let sqldrop = 'DROP TABLE test;'
  let sqlrm = 'CREATE TABLE test.test(id INT AUTO_INCREMENT, firstname VARCHAR(255) NOT NULL DEFAULT "Mr.", lastname VARCHAR(255) NOT NULL DEFAULT "Kitty", PRIMARY KEY(id));'
  con.query(sqldrop, function (err, result) {
    if (err) {console.log(err);}
  });
  con.query(sqlrm, function (err, result) {
    if (err) {console.log(err); res.json({ message: "Failed" });}
    else {res.json({ message: "Reset", sqlret: JSON.stringify(result) });}
  });
});

app.get("/dump", (req, res) => {
  let sql = 'SELECT * FROM test';
  con.query(sql, function(err, result) {
    if (err) {console.log(err); res.json({ message: "Failed" });}
    else {res.json({ message: JSON.stringify(result), sqlret: JSON.stringify(result) });}
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
