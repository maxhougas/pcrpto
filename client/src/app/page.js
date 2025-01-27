'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import {Si,Ii,Bb,Sb} from "./components.js"
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const G1BY1 = '1fr / 1fr';
  const G1BY2 = '1fr / 1fr 1fr';
  const G2BY2 = '1fr 1fr / 1fr 1fr';

  const [sprops,setsprops] = React.useState({grid:G1BY1,status:['Start']});
  const [iprops,setiprops] = React.useState(null);
  const [bprops,setbprops] = React.useState({grid:G1BY1,handler:[cback],btxt:['Check Connection']})

/***
 S001 START PAGE FUNCTIONS
 ***/

  function testpair(){
    fetch('http://localhost:5000/pair')
  }

  function s(grid,status){
    return ({grid:grid,status:status});
  }
  function i(grid,isp,itxt){
    return({grid:grid,isp:isp,itxt:itxt});
  }
  function b(grid,handler,btxt){
    return({grid:grid,handler:handler,btxt:btxt});
  }

  function loginpage()
  {
    setsprops({grid:G1BY1,status:['Willkommen']});
    setiprops({grid:G1BY2,isp:[false,true],itxt:['Username','Password']});
    setbprops({grid:G1BY2,handler:[loginemp,loginboss],btxt:['Employee Log In','Admin Log In']});
  }

  function cback(){
    setsprops(s(G1BY1,'Checking...'));
    fun.genreq('POST','echo',{echo:'echo'})
    .then(
      jso=> loginpage(),
      err=>{
        setsprops(s(G1BY1,'Back End Not Found'));
        fun.generr('JSON Error: '+fun.BACKEND+'echo',err);
      }
    )
  }

  function logout(){ //must refactor... might be fine
    setsprops(s(G1BY1,['Logging Out...']));

    fun.genreq('GET','logout',null).then(
      jso => loginpage(),
      err => {
        setsprops(s(G1BY1,['Logout Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'logout',err);
      }
    );
  }

  function login(){
    let uname = document.getElementById('i0').value;
    let pass = document.getElementById('i1').value;

    return fun.getkey().then(
      key => fun.encrypt(key,pass),
      err => fun.generr('Failed to Import Key',err)
    ).then(
      enc => fun.genreq('POST','login',{uname:uname,pass:Buffer.from(enc).toString('Base64')}),
      err => fun.generr('Failed to encrypt',err)
    );
  }

  function loginemp(){
    setsprops(s(G1BY1,['Logging In...']));

    login().then(
      jso => {
        setsprops(s(G1BY1,['Employee Mode']));
        setiprops(s(G1BY2,[false,false,false],['Start Date','End Date','Request ID']));
        setbprops(b(G1BY2,[spreq,rpreq,vpreq,cpass,logout],['Submit Request','Revoke Request','View Requests','Change Password','Log Out']));
      },
      err => {
        setsprops(s(G1BY1,['Login Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'login',err);
    });
  }

  function loginboss(){
    setsprops(s(G1BY1,['Logging In...']));

    login().then(
      jso => {
        if(jso.mode === 'admin') {
          setsprops(s(G1BY1,['Admin Mode']));
          setiprops(null);
          setbprops(b(G1BY2,[lemp,vallreqs,termconns,logout],['List Employees','View Requests','Terminate Connections','Log Out']));
        }
        else {setsprops(s(G1BY1,['Bad Username']));}
      },
      err => {
        setsprops(s(G1BY1,['Login Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'login',err);
     });
  }  

  function lemp(){
    let url = 'lemp';
    setsprops(s(G1BY1,['Retrieving Data...']));

    function mklist(usrs){
      return usrs.map(e => e.User);
    }

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(G1BY2,mklist(jso[0]))),
      err => {
        setsprops(s(G1BY1,['Get Users Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });
  }

  function spreq(){
  }

  function rpreq(){
  }

  function vpreq(){
  }

  function cpass(){
  }

  function cuser(){
    let url = 'cuser';
    setsprops(s(G1BY1,['Creating User...']));

    fun.genreq('POST','cuser',{nuname:document.getElementById('i0').value}).then(
      jso => setsprops(s(G1BY1,['User Created'])),
      err => {
        setsprops(s(G1BY1,['Create User Failed']));
        fun.generr('JSON Error '+fun.BACKEND+url,err);
    });
  }

  function duser(){
    if(document.getElementById('i0').value === 'ptoboss'){
      setsprops(s(G1BY1,['DUMM IDEE!']));
      console.error('Attempted to delete admin');
    }else{
      let url = 'duser';
      setsprops(s(G1BY1,'Deleting User...'));
      fun.genreq('POST',url,{uname:document.getElementById('si0').value}).then(
        jso => setsprops(s(G1BY1,['User Deleted'])),
        err => {
          setsprops(s(G1BY1,['Delete User Failed']));
          fun.generr('JSON Error: '+fun.BACKEND+url,err);
    })}
  }

  function toadmin(){
  }

  function denyp(){
  }

  function termconns(){
    let url='reset';
    setsprops(s(G1BY1,['Terminating...']));

    fun.genreq('POST',url,{checkphrase:'reset'}).then(
      jso => loginpage(),
      err => {
        setsprops(s(G1BY1,['Reset Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });
  }

  function vallreqs(){
    let url = 'allreqs';
    setsprops(s(G1BY1,['Getting Requests...']));

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(G1BY1,[JSON.stringify(jso[0])])),
      err => {
        setsprops(s(G1BY1,['Get Requests Failed']));
        generr('JSON Error '+fun.BACKEND+url,err);
    });
  }

/***
 E001 END PAGE FUNCTIONS
 S002 START PAGE DEFS
 ***/

/***
 E002 END PAGE DEFS
 S003 START RENDER
 ***/
  
  return (<comps.Page sprops={sprops} iprops={iprops} bprops={bprops}/>);
}
