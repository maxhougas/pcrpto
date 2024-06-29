'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import {Si,Ii,Bb,Sb} from "./components.js"
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const SCHECK = 'Start';
  const [status,setstatus] = React.useState(SCHECK);

/***
 S001 START PAGE FUNCTIONS
 ***/

  function testpair(){
    fetch('http://localhost:5000/pair')
  }

  function switchpage(s,p){
    if(s){setstatus(s);}
    if(p){setpage(p);}
  }

  function genbhandle(eve){
    let props = JSON.parse(eve.target.getAttribute('req'));
    setstatus(props.status);

    if(props.cb){
      eval(props.cb+'(fun.genreq(props.m,props.u,props.b)').then(
      
      );
    }
    else{
      fun.genreq(props.m,props.u,props.b).then(
        suc => switchpage(props.nstatus,eval(props.npage)),
        err => {setstatus(props.fstatus);generr(props.fstatus,err);}
      );
    }
  }

  function cback(){
    setstatus('Checking...');
    fun.genreq('POST','echo',{echo:'echo'})
    .then(
      jso=>switchpage(SWILLK,PLOGIN),
      err=>{setstatus('Back End Not Found');generr('JSON Error: '+fun.BACKEND+'echo',err);}
    )
  }

  function logout(){ //must rfactor
    setstatus(SLOGOUT);

    fun.genreq('GET','logout',null)
    .then(
      jso => switchpage(SWILLK,PLOGIN),
      err => {setstatus('Logout Failed');generr('JSON Error: '+fun.BACKEND+'logout',err);}
    );
  }

  function login(){
    let uname = document.getElementById('ii0').value;
    let pass = document.getElementById('ii1').value;

    return fun.getkey()
    .then(
      key => fun.encrypt(key,pass),
      err => {throw generr('Failed to Import Key',err);}
    ).then(
      enc => fun.genreq('POST','login',{uname:uname,pass:Buffer.from(enc).toString('Base64')}),
      err => {generr('Failed to encrypt',err);}
    );
  }

  function loginemp(){
  }

  function loginboss(){
    login()
    .then(
      jso => switchpage(SBOSS,PBOSS),
      err => {setstatus(SLOGINF);fun.generr('JSON Error: '+fun.BACKEND+'login',err);}
    );
  }  

  function lemp(){
    genreq('GET','lemp',null)
    .then(
      jso => setstatus(jso),
      err => {generr('JSON Error: '+fun.BACKEND+'lemp',err);}
    )
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

  const BLOGOUT = {
    type:Sb,
    props:{
      key:'logout',
      bc:logout,
      bl:'Log Out',
  }};

  const PCONTEST = [{
    type:Sb,
    props:{
      key:0,
      bc:cback,
      bl:'Check Connection',
    }
  }];

  const PLOGIN = [
    {
      type:Ii,
      props:{
        key:0,
        p:[false,true],
        text:['User Name','Password']
    }},{
      type:Bb,
      props:{
        key:1,
        bc:[loginboss,testpair],
        bl:['Admin Log In','Employee Log In'],
    }},
    BLOGOUT
  ];

  const PEMP = [
    {type:'Si',props:{key:0,p:false,text:'Request ID'}},
    {type:'Ii',props:{
      key:1,p:[false,false],text:['S: YYYY MM DD HH MM','E: YYYY MM DD HH MM']}},
    {type:'Bb',props:{
      key:2,bc:[spreq,rpreq],bl:['Submit PTO Request','Revoke PTO Request']}},
    {type:'Bb',props:{key:3,bc:[vpreq,cpass],bl:['View PTO Requests','Change Password']}},
    {type:'Sb',props:{key:4,bc:logout,bl:'Log Out'}}
  ];

  const PBOSS = [
    {type:Si,props:{key:0,p:false,text:'Employee ID'}},
    {
      type:Bb,props:{
        key:1,
        bc:[lemp,duser],
        bl:['List Employees','Delete Employee'],
    }},{
      type:Bb,props:{
        key:2,
        bc:[vallreqs,termconns],
        bl:['View All Requests','Terminate Connections']}},
    BLOGOUT
  ];

  const SNOCON = 'No Connection';
  const SWILLK = 'Willkommen';
  const SLOGIN = 'Logging In';
  const SLOGOUT = 'Logging Out';
  const SEMP = 'Employee Mode';
  const SBOSS = 'Admin Mode';
  const SLOGINF = 'Login Failed';

/***
 E002 END PAGE DEFS
 S003 START RENDER
 ***/

  const [page,setpage] = React.useState(PCONTEST);
  
  return (<comps.Page page={page} status={status} />);
}
