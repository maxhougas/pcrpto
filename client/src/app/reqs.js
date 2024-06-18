export async function api(){
  let data;

  try{
    data = (
      await fetch(`http://localhost:5000/api/kitty.cat`)
      .then((res) => res.json())
    ).params;
  }catch(e){
    console.error('O NOES ECHO FAILED! reqs.js/api');
    throw e;
  }

  return data;
}

export async function getkey(){
  let key;

  try{
    key = await fetch('http://localhost:5000/getkey')
      .then((res) => res.json());
  }catch(e){
    console.error('Failed to retrieve key from backend: "reqs.js/getkey")');
    throw e;
  }

  return key.k;
}

export async function processkey(k){
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
    console.error('Failed to process key "reqs.js/processKey"');
    throw e;
  }

  return key;
}

export async function encrypt(k,pass){
  let encrypted;

  try{
    encrypted = Buffer.from(new Uint8Array(
      await crypto.subtle.encrypt({name:'RSA-OAEP'},k,Buffer.from(pass))
    )).toString('base64');
  }catch(e){
    console.error('Failed to encrypt "reqs.js/encrypt"');
    throw e;
  }

  pass = null; k = null;
  return encrypted;
}

export async function sendlogin(uname,pass){
  let didlogin = {s:4,e:'Failed to connect to backend "reqs.js/sendlogin"'};

/*  let k = await getkey();
  console.log(k);
  let key = await processkey(k);
  console.log(key);
  let epass = await encrypt(key,pass);
  console.log(epass);
*/
  try {
    didlogin = await fetch('http://localhost:5000/login/',{
      method:'POST',
      headers:{"Content-type":"application/json"},
      body:JSON.stringify({
        uname:uname,
        pass:await encrypt(await processkey(await getkey()),pass)
      })
    }).then((res) => res.json());
  }catch(e){
    console.error('Failed to connect to backend "reqs/sendlogin"');
    throw e;
  }

  return didlogin;
}
