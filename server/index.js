// server/index.js

const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const { execSync } = require("child_process");
const crypto = require("crypto");
const { Buffer } = require("buffer");

const PORT = process.env.PORT || 5000;
const MIP = process.env.MIP || '172.17.0.1';
const NIP = process.env.NIP || "%";


/***
 S001 START NON-ROUTE MIDDLEWARE
 ***/

app.use((req,res,next) => {
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
  console.log('API POST echo request: '+req.ip);
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

function poolconf(uname,pass){
  return {
    host: MIP,
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

function generr(m,err){
  console.log(m);
  console.error(err);
  return err;
}

function ngenerr(m,err){
  return Error(m,err?{cause:err}:null);
}

function checkindex(res,i){
  if(i === -1){
    console.error(
      'Record not found found.\n'+ 
      'IP & Private Key should have been registered by "/getkey"\n'+
      'Sending CORS error to client.'
    );
    res.send('');
  }
}

function deleter(i){
  ips[i]=null;ips=ips.filter(ip=>ip);
  iks[i]=null;iks=iks.filter(ik=>ik);
  sqs[i]=null;sqs=sqs.filter(sq=>sq);
  console.log('IP registration deleted');
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
    err => {throw Error('Export key failed',{cause:err});}
  );
}

function dec(i,b){
  return (
    crypto.subtle.decrypt({name:'RSA-OAEP'},iks[i],b).then(
      dec => Buffer.from(dec).toString(),
      err => {throw Error('Decrypt failed',{cause:err});}
  ));
}

function qandres(res,i,q){
  sqs[i].query(q).then(
    sql => res.json(sql),
    err => {
      console.error(Error('SQL Error: '+q,{cause:err}));
      res.send('');
  });
}

function utype(i){
  let u = sqs[i].pool.config.connectionConfig.user;
  let el = 'Grants for '+u+'@';

  return(
    sqs[i].query('show '+el+"'"+NIP+"'").then(
      grs => grs[0][0][el+NIP].includes('GRANT CREATE USER'),
      err => {throw Error('Query failed',{cause,err});}
  ));
}

console.log('Helper functions defined');

/***
 E004 END HELPER FUNCTIONS
 S005 START PRODUCTION ROUTES
 ***/

app.get("/getkey", (req, res) => {
  console.log('Key requested: '+req.ip);
  let i = ips.indexOf(req.ip);
  if(i !== -1){
    console.log('Record exists for '+req.ip+'--logging out.')
    deleter(i);
  }
  i = ips.length;  
  ips[i] = req.ip; 

/*  function handlekp(i,kp){
    iks[i] = kp.privateKey;
    return exp(kp.publicKey);
  }
*/

  mkeys().then(
    kp => {iks[i]=kp.privateKey;return exp(kp.publicKey);},//handlekp(i,kp),
    err => {throw Error('Generate key pair failed',{cause:err});}
  ).then(
    uk => res.json(uk),
    err => {throw Error('Export public key failed',{cause:err});}
  ).catch(err =>{
    console.error(err);
    deleter(i);
  });
}); 

app.post("/login", (req,res) => {
  console.log('Login attempt '+req.ip);

  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  dec(i,Buffer.from(req.body.pass,'base64')).then(
    pas => {
      sqs[i] = mysql.createPool(poolconf(req.body.uname,pas));
      return sqs[i].query('show tables;');
    },
    err => {
     console.error('Failed to decrypt');
     throw err;
   }).then(
    jso => utype(i),
    err => {
      console.error('Query failed');
      throw err;
   }).then(
    adm => res.json({mode:adm?'admin':'employee'}),
    err => {
      console.error('Could not determine user type');
      throw err;
  }).catch(err => {
      deleter(i);
      generr('Login Failed @ /login',err);
      res.send('');
  });
});


app.get("/logout", (req, res) => {
  console.log('Logout request '+req.ip);
  let i = ips.indexOf(req.ip); 
 
  if(i > -1){
    deleter(i);
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

  utype(i).then(
    adm => {
      if(adm && req.body.checkphrase === 'reset'){
        ips=[];
        sqs=[];
        iks=[];
        console.log('All registrations purged');
        res.json({s:0});
      }else{
        throw Error('Checkphrase mismatch or nonadmin user');
      }},
    err => {
      throw Error('Could not determine user type',{cause:err});
    }).catch(err => {
      console.error(Error('Reset failed',{cause:err}));
      res.send('');
  });
});

app.get("/lemp",(req,res)=>{
  console.log('List employees request from '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i); //error if ip not found

  qandres(res,i,"select user from mysql.user where user NOT IN ('maria','mariadb.sys','root')");
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
    console.error('Blocked admin submission attempt');
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
        qandres(res,i,"delete from pto where id = "+id)
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
  console.log('Purge requests: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i);

  if(sqs[i].pool.config.connectionConfig.user === 'ptoboss' && req.body.checkphrase === 'PURGE'){
    qandres(res,i,"truncate table pto");
  }else{
    console.error('Blocked purge request');
    res.send('');
  }
});

app.post("/cpass",(req,res)=>{
  console.log('Change password: '+req.ip);
  let i = ips.indexOf(req.ip)
  checkindex(res,i);

  ips[ips.length] = ips[i];
  iks[iks.length] = iks[i];
  sqs[sqs.length] = '';

  Promise.all([dec(i,Buffer.from(req.body.opass,'base64')),dec(i,Buffer.from(req.body.npass,'base64'))]).then(
    pas => {
      if(pas[0] === sqs[i].pool.config.connectionConfig.password){
        sqs[sqs.length-1] = mysql.createPool(poolconf(req.body.uname,pas[1]));
        return sqs[i].query('set password for '+req.body.uname+"@'"+NIP+"' = password('"+pas[1]+"')");
      }
      else
        throw Error('Bad password');
    },err => {
      console.error('Decryption Failed');
      throw err;
    }).then(
      jso => {deleter(i);res.json(jso);},
      err => {
        console.error('Query Failed');
        throw err;
    }).catch(err => {
      generr('Change password failed',err);
      deleter(ips.length);
      res.send('');
    });
});

app.get("/whoami",(req,res)=>{
  console.log('Who is: '+req.ip);
  let i = ips.indexOf(req.ip);
  checkindex(res,i);

  utype(i).then(
    who => res.json({mode:who?'admin':'employee'}),
    err => {
      generr('Could not determine user type @ /whoami',err);
      res.send('');
  });
});

console.log('Production routes registered');

/***
 E005 END PRODUCTION ROUTES
 ***/

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
