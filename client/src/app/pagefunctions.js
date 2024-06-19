import * as reqs from "./reqs.js"
//import * as 

export function logout(){
  setstatus('Logging out');
  reqs.logout();
  setstatus('Logged out');
  setpage(LOGIN_PAGE);
}

export function loginboss(){
  setstatus('Attempting login');
  reqs.sendlogin(
    document.getElementById('i0').value,
    document.getElementById('i1').value
  );
  setpage(BOSS_VIEW);
  setstatus('Boss Mode');
}

export function loginemp(setstatus,setpage){
//  sendLogin();
  setstatus('Request PTO');
  setpage(EMP_VIEW);
}

export function spreq(){
}

export function rpreq(){
}

export function vpreq(){
}

export function cpass(){
}

export function cuser(){
}

export function duser(){
}

export function denyp(){
}

export function termconns(){
}

export function vallreqs(){
}
