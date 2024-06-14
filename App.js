import logo from './logo.svg';
import './App.css';

function App() {

 const [uname, setuname] = React.useState("User Name");
 const [pass, setpass] = React.useState("Password");

  return (
    <div className="App">
      <header className="App-header">
        <div>
         <input type="text" id="unamebox" value={uname} onChange{(e) => (setuname(e.target.value))} />
         <input type="password" id="passbox" value={pass} onChange{(e) => (setpass(e.target.value))} />
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
