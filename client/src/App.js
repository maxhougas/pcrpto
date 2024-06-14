import React from "react";
import './App.css';

function loginBoss()
{

}

function loginEmp()
{

}

function App() {
  return (
    <div className="App">
      <header className="App-header">
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
