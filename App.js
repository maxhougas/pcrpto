import React from "react";
import './App.css';
//const { scryptSync,createCipheriv } = require("crypto-browserify");
const { scryptSync } = require("crypto-browserify");

function App() {

  function encrypt(pass)
  {
    let tinycat;
    let smallcat;

    fetch('https://localhost/mustard')
      .then((res) => res.json())
      .then((data) => tinycat=data.kitten);
    fetch('https://localhost/ivreq')
      .then((res) => res.json())
      .then((data) => smallcat=data.kitten);
 
    let key = scryptSync('!PCR_PLAYERS_CLUB&',tinycat,24);
/*    let cipher = createCipheriv('aes-192-cbc',key,smallcat);
    let encrypted = cipher.update(pass,'utf8','hex');
    encrypted += cipher.final('hex');

*/    return [key,smallcat,tinycat];
  }

  function loginBoss()
  {
    setstatus('twocats');
    let uname = document.getElementById('unamebox').value;
    let pass = document.getElementById('passbox').value;
    document.getElementById('passbox').value = '';
    let encrypted = encrypt(pass);
    pass = '';

    fetch(`http://localhost:5000/login/${uname}.${encrypted}`)
      .then((res) => res.json())
      .then((data) => setstatus( data.message === 0 ? 'Login Accpeted' : 'Login Failed '+data.message ));
    return encrypt('cat');
  }

  function loginEmp()
  {

  }

  const [status,setstatus] = React.useState("Wilkommen");

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <p id="status">{status}</p>
        </div>
        <div>
         <input type="text" id="unamebox" placeholder="User Name" />
         <input type="password" id="passbox" placeholder="Password" />
        </div>
        <div>
          <button onClick={loginBoss}>Log In Supervisor</button>
          <button onClick={loginEmp}>Log In Employee</button>
        </div>
      </header>
    </div>
  );
}

export default App;
