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
const CLIPATH = '/public/index.html'

/***
 S001 START NON-ROUTE MIDDLEWARE
 ***/

app.use((req,res,next) => {
//  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
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

app.get("/", (req, res) => {
  res.redirect('../client/src/app/page.js');
});

app.get("/getkey", (req, res) => {
  console.log('Key requested: '+req.ip);

  let i = ips.indexOf(req.ip);
  if(i !== -1){
    console.log('Record exists for '+req.ip+'--logging out.')
    deleter(i);
  }
  i = ips.length;  
  ips[i] = req.ip; 

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
    pas => {
      sqs[i] = mysql.createPool(poolconf(req.body.uname,pas));
      return sqs[i].query('show tables;');
    },err => {throw Error('Decrypt failed',{cause:err});}
  ).then(
    jso => utype(i),
    err => {throw Error('Database connection failed',{cause:err});}
  ).then(
    adm => res.json({mode:adm?'admin':'employee',err:null}),
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

  res.json({err:null});
});

app.post("/reset",(req,res)=>{
  console.log('Reset request: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {if(adm && req.body.checkphrase === 'reset') {purger(); return res.json({err:null});} else throw Error('Checkphrase mismatch or nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(Error('Reset failed',{cause:err}));
    res.json({err:err});
  });
});

app.get("/lemp",(req,res)=>{
  console.log('List employees request from '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {;if(adm) return sqs[i].query("SELECT user FROM mysql.user WHERE user NOT IN ('maria','mariadb.sys','root')"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso,err:null}),
    err => {throw Error('Get users failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/cuser",(req,res)=>{
  console.log('Create user request from '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {if(adm) return sqs[i].query("GRANT INSERT,SELECT,DELETE ON pcr.pto TO "+sanitize(req.body.nuname)+"@'%' IDENTIFIED BY 'default'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso,err:null}),
    err => {throw Error('Create failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/duser",(req,res)=>{
  console.log('Delete user: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {if(adm) return sqs[i].query('SHOW GRANTS FOR '+sanitize(sqs[i].pool.config.connectionConfig.user)+"@'"+NIP+"'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    grs => {if(grs[0][0]['Grants for '+sanitize(req.body.user)+'@'+NIP].includes('GRANT CREATE USER')) throw Error('Delete admin blocked'); else return sqs[i].query('DROP USER IF EXISTS '+sanitize(req.body.uname));},
    err => {throw Error('User typing failed (duser)',{cause:err});}
  ).then(
    jso => res.json({d:jso,err:null}),
    err => {throw Error('Delete failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.get("/vreqs",(req,res)=>{
  console.log('List pto requests: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => sqs[i].query('SELECT * FROM pcr.pto'+ (adm ? '' : " WHERE empid = '"+sanitize(sqs[i].pool.config.connectionConfig.user)+"'")),
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({jso,err:null}),
    err => {throw Error('Get requests failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/spreq",(req,res)=>{
  console.log('Submit pto request: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {if(adm) throw Error('Blocked admin submission'); else return sqs[i].query("INSERT INTO pto (empid,startdate,enddate) values ('"+sanitize(sqs[i].pool.config.connectionConfig.user)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.end)+"')");},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({err:null}),
    err => {throw Error('Submission failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/rpreq",(req,res)=>{
  console.log('Delete pto request: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return Promise.all([utype(i), sqs[i].query('SELECT empid FROM pto WHERE id = '+sanitize(req.body.id))]); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    ([adm,usr]) => {if(usr[0][0] && (usr[0][0].empid === sqs[i].pool.config.connectionConfig.user || adm)) return sqs[i].query('DELETE FROM pto WHERE ID = '+sanitize(req.body.id)); else throw Error('User mismatch');},
    err => {throw Error('User typing or sql failed',{cause:err});}
  ).then(
    jso => res.json({err:null}),
    err => {throw Error('Delete failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:err});
  });
});

app.post("/preqs",(req,res)=>{
  console.log('Purge requests: '+req.ip);
  let i = ips.indexOf(req.ip);

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => {if(adm && req.body.checkphrase === 'PURGE') return sqs[i].query('TRUNCATE TABLE pto'); else throw Error('Nonadmin user or checkphrase mismatch');}, 
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({err:null}),
    err => {throw Error('Purge failed');}
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

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return Promise.all([dec(i,Buffer.from(req.body.opass,'base64')),dec(i,Buffer.from(req.body.npass,'base64'))]); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    pas => {if(pas[0] === sqs[i].pool.config.connectionConfig.password){sqs[sqs.length-1] = mysql.createPool(poolconf(req.body.uname,pas[1])); return sqs[i].query('set password for '+sanitize(req.body.uname)+"@'"+NIP+"' = password('"+sanitize(pas[1])+"')");} else throw Error('Bad password');},
    err => {throw Error('Decryption Failed',{cause:err});}
  ).then(
    jso => {deleter(i);res.json(jso);},
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

  Promise.resolve(i !== -1).then(
    ip => {if(ip) return utype(i); else throw Error('IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    adm => res.json({mode:adm?'admin':'employee',err:null}),
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

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
