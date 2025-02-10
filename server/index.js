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
const BOSPAS = process.env.BOSPAS || 'bossman';
const EMPPAS = process.env.EMPPAS || 'employeeman';
const CRTPAS = process.env.CRTPAS || 'deewee';
const CLIPATH = '/home/user/pcrpto/client/out';

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

/*
app.post("/echo", (req,res) => {
  console.log('POST echo request: '+req.ip);
  res.json({d:req.body,err:null});
});
*/

app.get("/echo", (req,res) => {
  console.log('GET echo request: '+req.ip);
  res.json({d:'echo',err:null});
});

console.log('Debug routes registered');

/***
 E002 END DEBUG ROUTES
 S003 START SQL CONSTANTS
 ***/

let pools = [];

let usr = {
   uid:[],
   typ:[],
   ips:[],
   iks:[],
   tok:[]
};

let sqs = [];
let ips = [];
let iks = [];

console.log('SQL constants defined');

/***
 E003 END SQL CONSTANTS
 S004 START HELPER FUNCTIONS
 ***/

function deleter(i){
  usr.uid[i]=null;usr.uid=usr.uid.filter(id=>id);
  usr.typ[i]=null;usr.typ=usr.typ.filter(ty=>ty);
  usr.ips[i]=null;usr.ips=usr.ips.filter(ip=>ip);
  usr.iks[i]=null;usr.iks=usr.iks.filter(ik=>ik);
  console.log('User token deleted');
}

function estackstring(err){
  let estring = '';
  for(let errcomp=err;errcomp;errcomp=errcomp.cause) estring = estring+errcomp.toString()+' -> ';
  return estring.slice(0,-4);
}

function mktok(){
  let tok;
  let inuse;

  do {
    tok = Math.random();
    inuse = 0;
    usr.tok.forEach(e => {if(e === tok) inuse = 1;});
  } while(inuse);
}

function poolconf(uname,pass){
  return {
    host: MIP,
    user: uname,
    password: pass,
    port: MPORT,
    database: "pcr"
  };
}

function purger(){
  usr.uid = [];
  usr.typ = [];
  usr.ips = [];
  usr.iks = [];
  console.log('All user tokens purged');
}

function sanitize(q) {
  if(q) return q.replaceAll(" ","_");
  else throw Error('Empty String');
};

console.log('Helper functions defined');

/***
 E004 END HELPER FUNCTIONS
 S005 START PROMISES
 ***/

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

function dec(ik,enc){
  return (
    crypto.subtle.decrypt({name:'RSA-OAEP'},ik,Buffer.from(enc,'base64')).then(
      dec => Buffer.from(dec).toString(),
      err => {throw Error('Decrypt failed',{cause:err});}
  ));
}

function gtok(req){
  let i = usr.uid.indexOf(req.body.uname);

  return Promise.resolve(i !== -1 && usr.ips[i] === req.ip).then(
    fnd => {if(fnd) return [usr.uid[i],usr.typ[i],usr.ips[i],usr.iks[i]]; else throw Error('Request-token mismatch');},
    err => {throw Error('Equlaity test should not fail');}
  );
}

function isadmin(empid){
  return pools[1].query("SELECT id,adm FROM employees WHERE id = '"+sanitize(empid)+"'").then(
    jso => {if(jso[0] && jso[0][0]) return jso[0][0].adm; else throw Error(empid+' not registered');},
    err => {throw Error('Query failed',{cause:err});}
  );
}

console.log('Promises defined');

/***
 E005 END PROMISES
 S006 START PRODUCTION ROUTES
 ***/

app.post("/getkey", (req, res) => {
  console.log('Key requested: '+req.ip);

  let i = usr.uid.indexOf(req.body.uname);
  if(i !== -1){
    console.log('Token exists for '+req.body.uname+'--deleting.')
    deleter(i);
  }
  i = usr.uid.length;
  usr.uid[i] = req.body.uname;
  usr.typ[i] = '.';
  usr.ips[i] = req.ip;
  usr.iks[i] = '.';

  isadmin(req.body.uname).then(
    adm => {usr.typ[i] = adm;return mkeys();},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    kp => {usr.iks[i]=kp.privateKey;return exp(kp.publicKey);},
    err => {throw Error('Generate key pair failed',{cause:err});}
  ).then(
    uk => res.json({d:uk,err:null}),
    err => {throw Error('Export public key failed',{cause:err});}
  ).catch(err =>{
    console.error(err);
    deleter(i);
    res.json({err:estackstring(err)});
  });
}); 

app.post("/login", (req,res) => {
  console.log('Login attempt: '+(req.body.uname||'unknown')+' @ '+req.ip);
  
  gtok(req).then(
    tok => dec(tok[3],req.body.pass),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    pas => pools[1].query("SELECT id FROM employees WHERE id = '"+sanitize(req.body.uname)+"' AND pass = PASSWORD('"+sanitize(pas)+"')"),
    err => {throw Error('Decrypt failed',{cause:err});}
  ).then(
    jso => {console.log(jso); if (jso[0] && jso[0][0] && jso[0][0].id === req.body.uname) res.json({d:null,err:null}); else throw Error('User name or password incorrect');},
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    deleter(usr.uid.indexOf(req.body.uname));
    res.json({err:estackstring(err)});
  });
});

app.post("/logout", (req, res) => {
  console.log('Logout: '+(req.body.uname||'unknown')+' @ '+req.ip);

  let i = usr.uid.indexOf(req.body.uname); 
  if(i === -1){
    console.log('Token not found; no action taken.');
  }else{
    deleter(i);
    console.log('Log out completed.');
  }

  res.json({d:null,err:null});
});

app.post("/cpass",(req,res)=>{
  console.log('Change password: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => Promise.all([dec(tok[3],req.body.opass),dec(tok[3],req.body.npass),dec(tok[3],req.body.cpass)]),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    pas => {if(pas[0] && pas[1] && pas[2] && pas[1] === pas[2] && req.body.cname === req.body.uname) return pools[1].query("UPDATE employees SET pass=PASSWORD('"+sanitize(pas[1])+"') WHERE id = '"+sanitize(req.body.uname)+"' AND pass = PASSWORD('"+sanitize(pas[0])+"')"); else throw Error('User name or password mismatch');},
    err => {throw Error('Decryption failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Password change failed',{cause:err});}
  ).catch(err => {
    console.error(err)
    res.json({err:estackstring(err)});
  });

/*  Promise.resolve(i !== -1 && currentuser(req) === req.body.uname).then(
    ip => {if(ip) return; else throw Error('User name mismatch or IP record not found');},
    err => {throw Error('Equality test should not fail');}
  ).then(
    pas => {if(pas[0] && pas[1] && pas[2] && pas[1] === pas[2] && pas[0] === sqs[i].pool.config.connectionConfig.password) return pas[1]; else throw Error('Password mismatch');},
    err => {throw Error('Decryption Failed',{cause:err});}
  ).then(
    pas => Promise.all([sqs[i].query('SET PASSWORD FOR '+currentuser(req)+"@'"+NIP+"' = password('"+sanitize(pas)+"')"),sqs[i] = mysql.createPool(poolconf(currentuser(req),pas))]),
    err => {throw Error('Equality test should not fail',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query or pool creation failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/cuser",(req,res)=>{
  console.log('Create user: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query("INSERT INTO employees(id) VALUES ('"+sanitize(req.body.nuname)+"')"),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err)
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return sqs[i].query("GRANT employee TO "+sanitize(req.body.nuname)+"@'"+NIP+"' IDENTIFIED BY 'default'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => sqs[i].query("SET DEFAULT ROLE employee FOR "+sanitize(req.body.nuname)),
    err => {throw Error('Create user / assign role failed',{cause:err});}
  ).then(
    jso => sqs[i].query("INSERT INTO employees (id) SELECT user FROM mysql.user WHERE user = '"+sanitize(req.body.nuname)+"'"),
    err => {throw Error('Set role failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Mirroring failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/duser",(req,res)=>{
  console.log('Delete user: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query("SELECT adm FROM employees WHERE id = '"+sanitize(req.body.dname)+"'"),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    adm => {if(adm[0] && adm[0][0].adm) throw Error('Delete admin blocked'); else return pools[1].query("DELETE FROM employees WHERE id = '"+sanitize(req.body.dname)+"' AND adm = FALSE");},
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return isadmin(i,sanitize(req.body.uname)); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    adm => {if(adm) throw Error('Delete admin blocked'); else return sqs[i].query('DROP USER IF EXISTS '+sanitize(req.body.uname));},
    err => {throw Error('User typing failed (duser)',{cause:err});}
  ).then(
    jso => sqs[i].query("DELETE FROM employees WHERE id = '"+sanitize(req.body.uname)+"'"),
    err => {throw Error('Delete failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Delete mirror failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/lemp",(req,res)=>{
  console.log('List employees: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query("SELECT id FROM employees WHERE adm = FALSE"),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return sqs[i].query("SELECT user FROM mysql.user WHERE default_role = 'employee'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get users failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/loadshifts",(req,res)=>{
  console.log('Load shifts: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query("SELECT ustart,wstart,sstart,usc,wsc,ssc,uend,wend,send FROM stores WHERE id = '"+sanitize(req.body.store)+"'"),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get shifts failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if (adm) return sqs[i].query("SELECT ustart,wstart,sstart,usc,wsc,ssc,uend,wend,send FROM stores WHERE id = '"+sanitize(req.body.store)+"'"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get shifts failed',{cause:err});}
  ).catch(err => {
    res.json({err:estackstring(err)});
    console.error(err);
  });
*/
});

app.post("/preqs",(req,res)=>{
  console.log('Purge requests: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => {if(req.body.checkphrase === 'PURGE') return pools[tok[1]].query('TRUNCATE pto'); else throw Error('Checkphrase mismatch')},
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json(estackstring(err));
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm && req.body.checkphrase === 'PURGE') return sqs[i].query('TRUNCATE TABLE pto'); else throw Error('Nonadmin user or checkphrase mismatch');}, 
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Purge failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/reset", (req,res) => {
  console.log('Reset: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => {if(tok[1] && req.body.checkphrase === 'RESET') {purger(); res.json({d:null,err:null});} else throw Error('Checkphrase mismatch or nonadmin user');},
    err => {throw Error('Get token failed',{cause:err});}
  ).catch(err => {
   console.error(err);
   res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm && req.body.checkphrase === 'RESET') {purger(); res.json({d:null,err:null});} else throw Error('Checkphrase mismatch or nonadmin user');},
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(Error('Reset failed',{cause:err}));
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/rpreq",(req,res)=>{
  console.log('Delete pto request: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query('DELETE FROM pto WHERE id = '+sanitize(req.body.id)+(tok[1]?'':" AND emp = '"+sanitize(req.body.uname)+"'")),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Delete failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => sqs[i].query('DELETE FROM pto WHERE id = '+sanitize(req.body.id)+(adm?'':" AND empid = '"+currentuser(req)+"'")),
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Delete failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/saveshifts",(req,res)=>{
  console.log('Save shifts: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query("REPLACE INTO stores (id,ustart,wstart,sstart,usc,wsc,ssc,uend,wend,send) VALUES('"+req.body.shifts.toString()+"')"),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Save failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm) return sqs[i].query("REPLACE INTO stores (id,ustart,wstart,sstart,usc,wsc,ssc,uend,wend,send) VALUES('"+req.body.shifts.toString()+"')"); else throw Error('Nonadmin user');},
    err => {throw Error('User typing failed',{cause:'err'});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Save failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/spreq",(req,res)=>{
  console.log('Submit pto request: '+(req.body.uname||'unknown')+' @ '+req.ip);

  gtok(req).then(
    tok => {if(tok[1]) throw Error('Blocked admin submission'); else return pools[0].query("INSERT INTO pto (emp,startdate,enddate) values ('"+sanitize(req.body.uname)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.end)+"')");},
    err => {throw Error('Get token failed',{cause,err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => {if(adm) throw Error('Blocked admin submission'); else return sqs[i].query("INSERT INTO pto (emp,startdate,enddate) values ('"+currentuser(req)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.end)+"')");},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Submission failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/vreqs",(req,res)=>{
  console.log('List pto requests: '+(req.body.uname||'unknown')+' @ '+req.ip);
  let i = ips.indexOf(req.ip);

  gtok(req).then(
    tok => pools[tok[1]].query('SELECT * FROM pto'+ (tok[1]?'':" WHERE emp = '"+sanitize(req.body.uname)+"'")),
    err => {throw Error('Get token failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get requests failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => sqs[i].query('SELECT * FROM pto'+ (adm?'':" WHERE emp = '"+currentuser(req)+"'")),
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    jso => res.json({d:jso[0],err:null}),
    err => {throw Error('Get requests failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

app.post("/whoami",(req,res)=>{
  console.log('Who is: '+req.ip);
  let i = ips.indexOf(req.ip);

  gtok(req).then(
    tok => res.json({d:{mode:tok[1]?'admin':'employee'},err:null}),
    err => {throw error('Get token failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });

/*  isadmin(i,currentuser(req)).then(
    adm => res.json({d:{mode:adm?'admin':'employee'},err:null}),
    err => {throw Error('User typing failed',{cause:err});}
  ).catch(err => {
    console.error(err);
    res.json({err:estackstring(err)});
  });
*/
});

console.log('Production routes registered');

/***
 E006 END PRODUCTION ROUTES
 ***/

https.createServer({key:fs.readFileSync('serverkey.pem'),passphrase:CRTPAS,cert:fs.readFileSync('servercrt.pem')},app).listen(PORT, () => {
  pools[0] = mysql.createPool(poolconf('ptoemployee',EMPPAS));
  pools[1] = mysql.createPool(poolconf('ptoboss',BOSPAS));
  console.log('Server listening on '+PORT);
});
