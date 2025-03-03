// server/index.js

const express = require("express");
const app = express();
const https = require('https');
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const { Buffer } = require("buffer");
const fs = require('fs');

const PRODUCTION = 0;

const MIP = process.env.MIP || '172.17.0.1';
const MPORT = process.env.MPORT || '3306';
const NIP = process.env.NIP || '%';
const NPORT = process.env.NPORT || 5000;
const BOSPAS = process.env.BOSPAS || 'bospas';
const EMPPAS = process.env.EMPPAS || 'emppas';
const CRTPAS = process.env.CRTPAS || 'crtpas';
const CLIPATH = process.env.CLIPATH || '/home/user/pcrpto/client/out';
const DEFPAS = process.env.DEFPAS || 'defpas';

/***
 S001 START NON-ROUTE MIDDLEWARE
 ***/

app.use((req,res,next) => {
  if(req.secure) return next();
  else res.redirect('https://'+req.hostname+req.originalUrl);
});
app.use((req,res,next) => {
  if(!PRODUCTION){res.setHeader('Access-Control-Allow-Origin', '*');}//'https://10.0.1.49:3000');}
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

const usr = {
   uid:[],
   typ:[],
   ips:[],
   iks:[],
   tok:[]
};

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

function generr(err,res){
  console.error(err);
  res.json({err:estackstring(err)});
}

function gensuc(d,res){
  res.json({d:d,err:null});
}

function gusr(req){
  let i = usr.uid.indexOf(req.body.uname);
  if(i !== -1 &&  req.body.tok === usr.tok[i])
    return [usr.uid[i],usr.typ[i],usr.ips[i],usr.iks[i],usr.tok[i]];
  else
    return [];
}

function mktok(){
  let tok;
  let inuse;

  do {
    tok = Math.random();
    inuse = 0;
    usr.tok.forEach(e => {if(e === tok) inuse = 1;});
  } while(inuse);

  return tok;
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

function rfail(res,err = Error('No available information')){
  console.error(err);
  res.json({err:estackstring(err)});
}

function rsuc(res,d = null){
  res.json({d:d,err:null});
}

function sanitize(q){
  if(q) return q.replaceAll(' ','_');
  else return '_';
};

function vals(body){
  let {tok,uname,...v} = body;
  let out = "(";
  Object.keys(v).forEach(e=>{if(v[e]) out = out+e+',';});
  out = out.slice(0,-1)+") VALUES('";
  Object.values(v).forEach(e=>{if(e) out = out+sanitize(e)+"','"});
  return out.slice(0,-2)+")";
}

function wheres(body){
  let {tok,uname,...w} = body;
  let out = ' WHERE';
  Object.keys(w).forEach(e=>{if(w[e]) out = out+' '+e+" = '"+sanitize(w[e])+"' AND";});
  return (out === ' WHERE' ? '' : out.slice(0,-4));
}

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

function genq(req,res,q,pool = null){
  console.log(req.url+': '+(req.body.uname||'unknown')+' @ '+req.ip);

  return gtok(req).then(
    tok => pools[pool || tok[1]].query(q),
    err => {throw Error('Token failed',{cause:err});}
  ).then(
    sql => rsuc(res,sql[0]), /*res.json({d:sql[0],err:null}),*/
    err => {throw Error('Query failed',{cause:err});}
  ).catch(err => rfail(res,err));
}

function gtok(req){
  let i = usr.uid.indexOf(req.body.uname);

  return Promise.resolve(i !== -1 && usr.tok[i] === req.body.tok).then(
    fnd => {if(fnd) return [usr.uid[i],usr.typ[i],usr.ips[i],usr.iks[i]]; else throw Error('Request-token mismatch');},
    err => {throw Error('Equlaity test should not fail');}
  );
}

function isadmin(empid){
  return pools[1].query("SELECT adm FROM employees WHERE id = '"+sanitize(empid)+"'").then(
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
  usr.tok[i] = mktok();

  isadmin(req.body.uname).then(
    adm => {usr.typ[i] = adm;return mkeys();},
    err => {throw Error('User typing failed',{cause:err});}
  ).then(
    kp => {usr.iks[i]=kp.privateKey;return exp(kp.publicKey);},
    err => {throw Error('Generate key pair failed',{cause:err});}
  ).then(
    uk => res.json({d:uk,t:usr.tok[i],err:null}),
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
    pas => pools[1].query("SELECT id FROM employees WHERE id = '"+sanitize(req.body.uname)+"' AND pass = PASSWORD('"+sanitize(pas)+sanitize(req.body.uname)+"')"),
    err => {throw Error('Decrypt failed',{cause:err});}
  ).then(
    jso => {if (jso[0] && jso[0][0] && jso[0][0].id === req.body.uname) res.json({d:null,err:null}); else throw Error('User name or password incorrect');},
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
    pas => {if(pas[0] && pas[1] && pas[2] && pas[1] === pas[2] && req.body.cname === req.body.uname) return pools[1].query("UPDATE employees SET pass=PASSWORD('"+sanitize(pas[1])+sanitize(req.body.uname)+"') WHERE id = '"+sanitize(req.body.uname)+"' AND pass = PASSWORD('"+sanitize(pas[0])+sanitize(req.body.uname)+"')"); else throw Error('User name or password mismatch');},
    err => {throw Error('Decryption failed',{cause:err});}
  ).then(
    jso => res.json({d:null,err:null}),
    err => {throw Error('Password change failed',{cause:err});}
  ).catch(err => {
    console.error(err)
    res.json({err:estackstring(err)});
  });
});

app.post("/dayd",(req,res)=>{
  genq(req,res,"DELETE FROM holiday WHERE date = '"+sanitize(req.body.date)+"' AND store = '"+sanitize(req.body.store)+"'");
});

app.post("/dayl",(req,res)=>{
  genq(req,res,'SELECT * FROM holiday'+(req.body.store?" WHERE store = '"+sanitize(req.body.store)+"'":'')+' ORDER BY date,store');
});

app.post("/days",(req,res)=>{
  genq(req,res,"REPLACE holiday(date,store,start,sc,end) VALUES ('"+sanitize(req.body.date)+"','"+sanitize(req.body.store)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.sc)+"','"+sanitize(req.body.end)+"')");
});

app.post("/defshiftload",(req,res)=>{
  genq(req,res,"SELECT ustart,wstart,sstart,usc,wsc,ssc,uend,wend,send FROM stores WHERE id = '"+sanitize(req.body.store)+"'");
});

app.post("/defshiftsave",(req,res)=>{
  genq(req,res,"UPDATE stores SET ustart='"+sanitize(req.body.ustart)+
                               "',wstart='"+sanitize(req.body.wstart)+
                               "',sstart='"+sanitize(req.body.wstart)+
                               "',usc   ='"+sanitize(req.body.usc   )+
                               "',wsc   ='"+sanitize(req.body.wsc   )+
                               "',ssc   ='"+sanitize(req.body.wsc   )+
                               "',uend  ='"+sanitize(req.body.uend  )+
                               "',wend  ='"+sanitize(req.body.wend  )+
                               "',send  ='"+sanitize(req.body.wend  )+"' WHERE id = '"+sanitize(req.body.store)+"'");
});

app.post("/empc",(req,res)=>{
  genq(req,res,"INSERT INTO employees(id,pass) VALUES ('"+sanitize(req.body.nuname)+"', PASSWORD('"+DEFPAS+sanitize(req.body.nuname)+"'))");
});

app.post("/empd",(req,res)=>{
  genq(req,res,"DELETE FROM employees WHERE id = '"+sanitize(req.body.dname)+"' AND adm = FALSE");
});

app.post("/empl",(req,res)=>{
  genq(req,res,'SELECT id FROM employees WHERE adm = FALSE');
});

app.post("/reqp",(req,res)=>{
  if(req.body.checkphrase === 'PURGE')
    genq(req,res,'TRUNCATE pto');
  else 
    rfail(res,Error('Checkphrase mismatch'));
});

app.post("/reqr",(req,res)=>{
  genq(req,res,'DELETE FROM pto WHERE id = '+sanitize(req.body.id)+(gusr(req)[1]?'':" AND emp = '"+sanitize(req.body.uname)+"'"));
});

app.post("/reqs",(req,res)=>{
 if(gusr(req)[1])
   rfail(res,Error('Blocked admin submission'));
 else
   genq(req,res,"INSERT INTO pto (emp,startdate,enddate) values ('"+sanitize(req.body.uname)+"','"+sanitize(req.body.start)+"','"+sanitize(req.body.end)+"')");
});

app.post("/reql",(req,res)=>{
  genq(req,res,'SELECT * FROM pto'+ (gusr(req)[1]?'':" WHERE emp = '"+sanitize(req.body.uname)+"'"));
});

app.post("/reqbystore",(req,res)=>{
  genq(req,res,"SELECT pto.emp,pto.startdate,pto.enddate FROM pto JOIN storeemps ON (pto.emp = storeemps.emp) WHERE storeemps.store = '"+sanitize(req.body.store)+"'");
});

app.post("/reset",(req,res)=>{
  console.log('Reset: '+(req.body.uname||'unknown')+' @ '+req.ip);

  if(gusr(req)[1] && eq.body.checkphrase === 'RESET'){
    purgr();
    rsuc(res,null);
  }else
    rfail(res,Error('Nonadmin user or checkphrase mismatch'));
});

app.post("/shiftasg",(req,res)=>{
  genq(req,res,'INSERT INTO shiftasg'+vals(req.body));
});

app.post("/shiftlas",(req,res)=>{
  console.log(wheres(req.body));
  genq(req,res,'SELECT * FROM shiftasg'+wheres(req.body)+' ORDER BY date,shift,emp');
});

app.post("/shiftuas",(req,res)=>{
  genq(req,res,'DELETE FROM shiftasg'+wheres(req.body));
});

app.post("/storeasg",(req,res)=>{
  genq(req,res,"INSERT INTO storeemps(store,emp) VALUES ('"+sanitize(req.body.store)+"','"+sanitize(req.body.emp)+"')");
});

app.post("/storec",(req,res)=>{
  genq(req,res,"INSERT INTO stores(id) VALUES('"+sanitize(req.body.store)+"')");
});

app.post("/stored",(req,res)=>{
  genq(req,res,"DELETE FROM stores WHERE id = '"+sanitize(req.body.store)+"'");
});

app.post("/storel",(req,res)=>{
  genq(req,res,'SELECT id FROM stores');
});

app.post("/storelas",(req,res)=>{
  let w = wheres(req.body);
  genq(req,res,'SELECT * FROM storeemps'+w);
});

app.post("/storeuas",(req,res)=>{
  genq(req,res,"DELETE FROM storeemps WHERE store = '"+sanitize(req.body.store)+"' AND emp = '"+sanitize(req.body.emp)+"'");
});

app.post("/storevas",(req,res)=>{

});

app.post("/whoami",(req,res)=>{
  console.log('Who is: '+req.ip);

  rsuc(res,{mode:(gusr(req)[1]?'admin':'employee')});
});

console.log('Production routes registered');

/***
 E006 END PRODUCTION ROUTES
 ***/

https.createServer({key:fs.readFileSync('serverkey.pem'),passphrase:CRTPAS,cert:fs.readFileSync('servercrt.pem')},app).listen(NPORT, () => {
  pools[0] = mysql.createPool(poolconf('ptoemployee',EMPPAS));
  pools[1] = mysql.createPool(poolconf('ptoboss',BOSPAS));
  console.log('Server listening on '+NPORT);
});
