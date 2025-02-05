// server/index.js

const express = require("express");
const app = express();
const https = require('https');
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const { Buffer } = require("buffer");
const fs = require('fs');

const PORT = process.env.PORT || 5000;
const MIP = process.env.MIP || '172.17.0.1';
const MPORT = process.env.MPORT || '3306';
const NIP = process.env.NIP || '%';
const CLIPATH = '/home/user/pcrpto/client/out/'

/***
 S001 START NON-ROUTE MIDDLEWARE
 ***/

app.use((req,res,next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://10.0.1.49:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type');
  next();
});

app.use(express.static(CLIPATH));
app.use(express.json());

console.log('Non-route middleware configured');

/***
 E001 END NON-ROUTE MIDDLEWARE
 S002 START DEBUG ROUTES
 ***/

app.post("/echo", (req,res) => {
  console.log('API POST echo request: '+req.ip);
  res.json({d:req.body,err:null});
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
    port: MPORT,
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

function deleter(i){
  ips[i]=null;ips=ips.filter(ip=>ip);
  iks[i]=null;iks=iks.filter(ik=>ik);
  sqs[i]=null;sqs=sqs.filter(sq=>sq);
  console.log('IP registration deleted');
}

function purger(){
  ips = [];
  iks = [];
  sqs = [];
  console.log('All IP registrations purged');
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

function currentuser(req){
  if(ips.indexOf(req.ip) === -1)
    throw Error('User is not logged in');
  else
    return sqs[ips.indexOf(req.ip)].pool.config.connectionConfig.user;
}

function isadmin(i,empid){
  return sqs[i].query("SELECT isadmin FROM employees WHERE id = '"+empid+"'").then(
    jso => Promise.resolve(jso[0][0].isadmin),
    err => {throw Error('Query failed'),{cause:err};}
  );
}

function utype(i){
  let el = 'Grants for '+sanitize(sqs[i].pool.config.connectionConfig.user)+'@';

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
  iks[i] = '.';
  sqs[i] = '.';

  mkeys().then(
    kp => {iks[i]=kp.privateKey;return exp(kp.publicKey);},
    err => {throw Error('Generate key pair failed',{cause:err});}
  ).then(
    uk => res.json({d:uk,err:null}),
    err => {throw Error('Export public key failed',{cause:err});}
  ).catch(err =>{
    console.error(err);
    deleter(i);
    res.json({err:err});
  });
}); 

app.post("/login", (req,res) => {
  console.log('Login attempt '+req.ip);
  let i = ips.indexOf(req.ip);

  dec(i,Buffer.from(req.body.pass,'base64')).then(
    pas => sqs[i] = mysql.createPool(poolconf(sanitize(req.body.uname),sanitize(pas))),
    err => {throw Error('Decrypt failed',{cause:err});}
  ).then(
    jso => isadmin(i,currentuser(req)),
    err => {throw Error('Create pool failed',{cause:err});}
  ).then(
    adm => res.json({d:{mode:adm?'admin':'employee'},err:null}),
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(Error('Login Failed',{cause:err}));
    deleter(i);
    res.json({err:err});
  });
});


app.get("/logout", (req, res) => {
  console.log('Logout request '+req.ip);

  let i = ips.indexOf(req.ip); 
  if(i === -1){
    console.log('IP not found; no action taken.');
  }else{
    deleter(i);
    console.log('Log out completed.');
  }

  res.json({d:null,err:null});
});

app.post("/reset", (req,res) => {
  console.log('Reset request: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm && req.body.checkphrase === 'reset') {purger(); res.json({d:null,err:null});} else throw Error('Checkphrase mismatch or nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(Error('Reset failed',{cause:err}));
    res.json({err:err});
  });
});

app.get("/lemp",(req,res)=>{
  console.log('List employees request from '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return sqs[i].query("SELECT id FROM employees WHERE isadmin = FALSE"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get users failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/cuser",(req,res)=>{
  console.log('Create user request from '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return sqs[i].query("GRANT INSERT,SELECT,DELETE ON pcr.pto TO "+sanitize(req.body.nuname)+"@'"+NIP+"' IDENTIFIED BY 'default'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => sqs[i].query("INSERT INTO employees (id) VALUES ('"+sanitize(req.body.nuname)+"')"),
    err => {throw Error('Creat pt 1 failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {sqs[i].query('DROP USER IF EXISTS '+sanitize(req.body.nuname)); throw Error('Create pt 2 failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/duser",(req,res)=>{
  console.log('Delete user: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return isadmin(i,sanitize(req.body.uname)); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    adm => {if(adm) throw Error('Delete admin blocked'); else return sqs[i].query('DROP USER IF EXISTS '+sanitize(req.body.uname));},
    err => {throw Error('User typing failed (duser)',{cause:err});}
  ).then(
    jso => sqs[i].query("DELETE FROM employees WHERE id = '"+sanitize(req.body.uname)+"'"),
    err => {throw Error('Delete pt 1 failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Delete pt 2 failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.get("/vreqs",(req,res)=>{
  console.log('List pto requests: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => sqs[i].query('SELECT * FROM pcr.pto'+ (adm ? '' : " WHERE empid = '"+currentuser(req)+"'")),
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get requests failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/spreq",(req,res)=>{
  console.log('Submit pto request: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm) throw Error('Blocked admin submission'); else return sqs[i].query("INSERT INTO pto (empid,startdate,enddate) values ('"+currentuser(req)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.end)+"')");},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Submission failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/rpreq",(req,res)=>{
  console.log('Delete pto request: '+req.ip);
  let i = ips.indexOf(req.ip);

console.log(req.body.id);
console.log(sanitize(req.body.id));
console.log('DELETE FROM pto WHERE id = '+sanitize(req.body.id)+" AND empid = '"+currentuser(req)+"'");

  isadmin(i,currentuser(req)).then(
    (adm) => sqs[i].query('DELETE FROM pto WHERE id = '+sanitize(req.body.id)+(adm?'':" AND empid = '"+currentuser(req)+"'")),
    err => {throw Error('User typing or sql failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Delete failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/preqs",(req,res)=>{
  console.log('Purge requests: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => {if(adm && req.body.checkphrase === 'PURGE') return sqs[i].query('TRUNCATE TABLE pto'); else throw Error('Nonadmin user or checkphrase mismatch');}, 
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Purge failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/cpass",(req,res)=>{
  console.log('Change password: '+req.ip);
  let i = ips.indexOf(req.ip)

  ips[ips.length] = ips[i];
  iks[iks.length] = iks[i];
  sqs[sqs.length] = '';

  Promise.resolve(i !== -1 && currentuser(req) === req.body.uname).then(
    ip => {if(ip) return Promise.all([dec(i,Buffer.from(req.body.opass,'base64')),dec(i,Buffer.from(req.body.npass,'base64'))]); else throw Error('User name mismatch or IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    pas => {if(pas[0] === sqs[i].pool.config.connectionConfig.password) return Promise.all([sqs[i].query('SET PASSWORD FOR '+currentuser(req)+"@'"+NIP+"' = password('"+sanitize(pas[1])+"')"),Promise.resolve(pas[1])]); else throw Error('Bad password');},
    err => {throw Error('Decryption Failed',{cause:err});}
  ).then(
    pas => sqs[i] = mysql.createPool(poolconf(currentuser(req),pas[1])),
    err => {throw Error('Query failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query Failed',err);}
  ).catch(err => {
    console.error(err);
    deleter(ips.length);
    res.json({err:err});
  });
});

app.get("/whoami",(req,res)=>{
  console.log('Who is: '+req.ip);
  let i = ips.indexOf(req.ip);

  isadmin(i,currentuser(req)).then(
    adm => res.json({d:{mode:adm?'admin':'employee'},err:null}),
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

console.log('Production routes registered');

/***
 E005 END PRODUCTION ROUTES
 ***/

https.createServer({key:fs.readFileSync('serverkey.pem'),passphrase:'deewee',cert:fs.readFileSync('servercrt.pem')},app).listen(PORT, () => {
 console.log('Server listening on '+PORT);
});
