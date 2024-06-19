'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import {Si,Ii,Bb,Sb} from "./components.js"
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

 const [status,setstatus] = React.useState("Willkommen");

/***
 S001 START PAGE FUNCTIONS
 ***/

  function logout(){
    setstatus('Logging Out');

    fetch(https://localhost:5000/logout)
      .then(
        res => res.json(),
        err => setstatus(FtCError('page.logout',err))
      )
      .then(
        jso => setstatus(),
        err => 
      )

/*    reqs.logout().then(
      r=>{setpage(PAGE_LOGIN);setstatus('Logged Out\n'+r);},
      e=>{
        let E = 'Log Out Failed';
        console.error(e);
        console.log(E);setstatus(E);
      });
*/

  }

  function login(ele){
    setstatus('Logging In');

    reqs.sendlogin(
      document.getElementById('ii0').value,
      document.getElementById('ii1').value
    ).then(
      r=>{setstatus('Logged In');},
      e=>{setstatus('Log In Failed');throw e;}
    );
  }

  function loginemp(){
    let l = true;
    try{login();
    }catch(e){
      setstatus('Caught login error');
      console.error(e);l = false;
    }
      setstatus('did not catch error');
  }

  function loginboss(){
    if(!login()){
      setpage(BOSS);
      setstatus('Boss Mode');
    }
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
  }

  function duser(){
  }

  function denyp(){
  }

  function termconns(){
  }

  function vallreqs(){
  }

/***
 E001 END PAGE FUNCTIONS
 S002 START PAGE DEFS
 ***/

  const PAGE_LOGIN = [
    {type:Ii,props:{key:0,p:[false,true],text:['User Name','Password']}},
    {type:Bb,props:{
      key:1,bc:[loginboss,loginemp],bl:['Admin Log In','Employee Log In']}},
    {type:Sb,props:{key:2,bc:logout,bl:'Log Out'}}
  ];
  const PAGE_EMP = [
    {type:Si,props:{key:0,p:false,text:'Request ID'}},
    {type:Ii,props:{
      key:1,p:[false,false],text:['S: YYYY MM DD HH MM','E: YYYY MM DD HH MM']}},
    {type:Bb,props:{
      key:2,bc:[spreq,rpreq],bl:['Submit PTO Request','Revoke PTO Request']}},
    {type:Bb,props:{key:3,bc:[vpreq,cpass],bl:['View PTO Requests','Change Password']}},
    {type:Sb,props:{key:4,bc:logout,bl:'Log Out'}}
  ];
  const PAGE_BOSS = [
    {type:Si,props:{key:0,p:false,text:'Employee ID'}},
    {type:Bb,props:{
      key:1,bc:[cuser,duser],Bl:['Create Employee','Delete Employee']}},
    {type:Bb,props:{
      key:2,bc:[vallreqs,termconns],Bl:['View All Requests','Terminate All Connections']}},
    {type:Sb,props:{key:3,bc:logout,bl:'Log Out'}}
  ];

/***
 E002 END PAGE DEFS
 ***/

  const [page,setpage] = React.useState(PAGE_LOGIN);

  return (<comps.Page page={page} status={status} />);
}
