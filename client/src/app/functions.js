export function api(){
  let r = null;
  return fetch(`http://localhost:5000/api/kitty.cat`)
    .then(res=>res.json())
    .then(
      j => r=j,
      e => {throw e;console.log('API Echo Failed "reqs/api"');}
    );
  return r;
}

async function getkey(){
  let r;
  fetch('http://localhost:5000/getkey')
  .then((res) => res.json())
  .then(jso => {return jso}, e=>{
    let E = 'Failed to retrieve key';
    console.log(E+ ' "reqs/getkey"');
    console.error(e);
  });
}

async function processkey(k){
  let keyb = Uint8Array.from(Buffer.from(k,'base64'));
  let key;

  try{
    key = await crypto.subtle.importKey(
      'spki',
      keyb,
      {name:'RSA-OAEP',hash:'SHA-256'},
      true,
      ['encrypt']
    );
  }catch(e){
    console.error('Failed to process key "reqs/processKey"');
    throw e;
  }

  return key;
}

async function encrypt(k,pass){
  let encrypted;

  try{
    encrypted = Buffer.from(new Uint8Array(
      await crypto.subtle.encrypt({name:'RSA-OAEP'},k,Buffer.from(pass))
    )).toString('base64');
  }catch(e){
    console.error('Failed to encrypt "reqs/encrypt"');
    throw e;
  }

  pass = null; k = null;
  return encrypted;
}

export function sendlogin(uname,pass){
  let r = null;
  fetch('http://localhost:5000/login/',{
    method:'POST',
    headers:{"Content-type":"application/json"},
    body:JSON.stringify({
      uname:uname,
      pass: encrypt(processkey((getkey()).k),pass)
    })
  })
    .then(res => res.json())
    .then(
      j => r=j,
      e => {throw e;console.log('Failed to connect to backend "reqs/sendlogin"');
    });

  return r;
}

export function logout(){
  let r = null;
  fetch('http://localhost:5000/logout')
    .then(res => res.json())
    .then(
      j => r=j,
      e => {throw e;console.log('Failed Log Out "reqs/logout');}
  );
  return r;
}

/***
 S001 START ERROR FUNCTIONS
 ***/

export function FtCError(calling,err){
  let E = 'Failed to Connect '+calling;
  console.error(err);
  console.log(E);
  return E;
}

export fun
