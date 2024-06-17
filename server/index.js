// server/index.js

const express = require("express");
const PORT = process.env.PORT || 5000;
const app = express();
const mysql = require("mysql2");
const { execSync } = require("child_process");
const crypto = require("crypto");
const { Buffer } = require("buffer");

const defgate = execSync("/srv/server/ip.sh").toString().slice(0,-1);

const SQL_PROT = {
 host: defgate,
 user: "uname",
 password: "pass",
 port: "3306",
 database: "pcr"
}

let sqs = [];
let ips = [];
let iks = [];

//let con = mysql.createPool(mysqlblock);

app.use((req,res,next) =>
{
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type');
  next();
});

app.use(express.json());

function sanitize(q) {
  return q.replaceAll(" ","_");
};

/*app.get("/", (req, res) => {
  res.sendFile("/srv/client/public/index.html");
});
*/

async function mkeys(){
  return Promise.resolve(
    await crypto.subtle.generateKey({
      name:'RSA-OAEP',
      modulusLength:2048,
      publicExponent:new Uint8Array([1,0,1]),
      hash:'SHA-256'
  },true,['encrypt','decrypt']));
}

async function exp(uk){
  return Promise.resolve(
    Buffer.from(
      await crypto.subtle.exportKey(
        'spki',
        uk
    )).toString('base64'));
}

async function dec(i,b){
  return Promise.resolve(
    await crypto.subtle.decrypt(
      {name:'RSA-OAEP'},
      iks[i],
      b
  ));
}

app.get("/getkey", (req, res) => {
  console.log('Key requested '+req.ip);
  let i = ips.length;
  ips[i] = req.ip; 
  mkeys().then(
    async kp=>{
      iks[i] = kp.privateKey;
      let uk = await exp(kp.publicKey)
      res.json({s:0,k:uk});
    },
    e=>{
      const E = 'Failed to generate keys';
      console.log(E+' (/getkey)');
      console.error(e);
      res.json({s:1,e:E});
  })
}); 

app.post("/login", (req,res) => {
  console.log('Login attempt'+req.ip);

  let i = ips.indexOf(req.ip);
  dec(i,Buffer.from(req.body.pass,'base64'))
  .then(
    p=>{
      sqs[i] = SQL_PROT;
      sqs[i].user = req.body.uname;
      sqs[i].password = p;
      let sql = ";";
      mysql.createPool(sqs[i]).query(
        sql,(e,r)=>{
          if(e){
            const E = 'Failed to database';
            console.log(E+' (/login)');
            console.error(e);
            res.json({s:1,e:E});
          }else{
            res.json({s:0,m:r});
        }}
    );},
    e=>{
      console.log('Failed to decrypt (/login)');
      console.error(e); 
      res.json({s:2,e:E});
  });
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
      let enc = await crypto.subtle.encrypt({name:'RSA-OAEP'},nk,Buffer.from('PASS'));
      let dec = await crypto.subtle.decrypt({name:'RSA-OAEP'},kp.privateKey,enc);
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

app.get("/logout", (req, res) => {
  mysqlblock.user = "uname";
  mysqlblock.password = "pass";
  con = mysql.createPool(mysqlblock);
});

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

app.get("/api/:param1.:param2", (req, res) => {
  console.log(JSON.stringify(req.params));
  console.log('api');
  res.json({ message: "Serv()r", params: JSON.stringify(req.params) });
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
