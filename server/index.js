// server/index.js

const express = require("express");
const PORT = process.env.PORT || 80;
const app = express();
const mysql = require("mysql2");
const { execSync } = require("child_process");
const crypto = require("crypto");
const { Buffer } = require("buffer");

const algorithm = 'rsa';
let keypair;
/*
const salts = ['pcr','players','club','aman','aplan','acanal','panama'];
let index = 0;
let iv = Buffer.alloc(16);

keypair = crypto.generateKeyPairSync("rsa",{modulusLength: 2048});
console.log(keypair.publicKey);
let encrypted = crypto.publicEncrypt({key:keypair.publicKey},'KLEERTEXT');
console.log(encrypted);
let decrypted = crypto.privateDecrypt({key:keypair.privateKey},encrypted);
console.log(decrypted.toString());
*/

const defgate = execSync("/srv/server/ip.sh").toString().slice(0,-1);

let mysqlblock = {
 host: defgate,
 user: "uname",
 password: "pass",
 port: "3306",
 database: "pcr",
}

let con = mysql.createPool(mysqlblock);

app.use((req,res,next) =>
{
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  next();
});

function sanitize(q) {
  return q.replaceAll(" ","_");
};

app.get("/", (req, res) => {
  res.sendFile("/srv/client/public/index.html");
});

app.get("/getkey", (req, res) => {
  keypair = crypto.generateKeyPairSync("rsa",{modulusLength:2048});
  res.json({key:keypair.publicKey});
} 

/*
app.get("/mustard", (req, res) => {
  res.json({kitten: salts[index]});
  index += 1;
  index %= salts.length;
});

app.get("/ivreq", (req, res) => {
  iv = randomFillSync(iv);
  res.json({kitten: iv});
});
*/

app.get("/login/:uname.:pass", (req, res) => {
  try {
    let decrypted = privateDecrypt({key:keypair.privateKey},pass);
  } catch (e) {
    res.json({ message: 1}); console.log(e);
  }

  mysqlblock.user = req.params.uname;
  mysqlblock.password = decrypted;
  con = mysql.createPool(mysqlblock);

  let sql = ';';
  con.query(sql, function (err, result) {
    if (err) {res.json({ message: 2}); console.log(err);}
    else {res.json({ message: 0, sqlret: result });}
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
  res.json({ message: "Serv()r", params: JSON.stringify(req.params) });
});

app.get("/create/:fname.:lname", (req, res) => {
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
