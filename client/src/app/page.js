'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
//import {Si,Ii,Bb,Sb} from "./components.js"
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const SCHECK = 'Start';
  const [status,setstatus] = React.useState(SCHECK);

/***
 S001 START PAGE FUNCTIONS
 ***/

  function switchpage(s,p){
    if(s){setstatus(s);}
    if(p){setpage(p);}
  }

  function tnp(jso){
    setstatus(JSON.stringify(jso));
  }

  function nop(prom){
    return prom;
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

  function logout(){ //must rfactor
    let me = 'page.logout';
    setstatus(SLOGOUT);

    function switch_page(){
      setstatus(SWILLK);
      setpage(PLOGIN);
    }

    fetch('http://localhost:5000/logout')
    .then(
      res => setstatus(JSON.stringify(res)),
      err => {
        setstatus(fun.ftcerr(me,err));
        console.error(err);
        console.log(fun.ftcerr(me,err));
     })
    .then(
      jso => switch_page(),
      err => setstatus(fun.jsonerr(me,err))
    );
  }

  function loginemp(){
  }

  function loginboss(){

    function logger(thing,){
      console.log('key: '+Uint8Array.from(Buffer.from(thing)));
      return fun.processkey(Uint8Array.from(Buffer.from(key,'base64')));
    }

    fun.genreq('GET','getkey',null)
    .then(
      jso => crypto.subtle.importKey(
        'spki',
        Uint8Array.from(Buffer.from(jso,'Base64')),
        {name:'RSA-OAEP',hash:'SHA-256'},
        true,
        ['encrypt']
      ),
      err => {throw fun.generr('JSON Error: '+fun.BACKEND+'getkey',err);}
    ).then(
      key => fun.encrypt(key,document.getElementById('ii1').value),
      err => {throw fun.generr('Failed to import public key');}
    ).then(
      enc => fun.genreq('POST','login',{uname:document.getElementById('ii0').value,pass:enc}),
      err => {throw fun.generr('Failed to encrypt');}
    ).then(
      jso => switchpage(SBOSS,PBOSS),
      err => {setstatus(SLOGINF);fun.generr('JSON Error: '+fun.BACKEND+'login',err);}
    )
  }  

/*
  function loginboss(){
    setstatus(SLOGIN);

    function switch_page()
    {
      setstatus(SBOSS);
      setpage(PBOSS);
    }

    fun.login()
    .then(
      r => switch_page(),
      e => setstatus(SLOGINF)
    );
  }
*/

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
    type:'Sb',
    props:{
      key:'logout',
      bc:genbhandle,
      bl:'Log Out',
      req:JSON.stringify({
        m:'GET',
        u:'logout',
        b:null,
        status:'Logging Out...',
        cb:null,
        fstatus:'Logout Failed',
        nstatus:'Logged Out',
        npage:'PLOGIN'
  })}};

  const PCONTEST = [{
    type:'Sb',
    props:{
      key:0,
      bc:genbhandle,
      bl:'Check Connection',
      req:JSON.stringify({
        m:'POST',
        u:'echo',
        b:{echo:'echo'},
        status:'Checking...',
        cb:null,
        fstatus:'Failed to Connect',
        nstatus:'Willkommen',
        npage:'PLOGIN'
      }),
  }}];

  const PLOGIN = [{
    type:'Ii',
    props:{
      key:0,
      p:[false,true],
      text:['User Name','Password']
    }
  },{
    type:'Bb',
    props:{
      key:1,
      bc:[loginboss,fun.api],
      bl:['Admin Log In','Employee Log In'],
      req:[JSON.stringify({
        m:'GET',
        u:'getkey',
        b:null,
        status:'Logging In...',
        cb:fun.login,
        fstatus:'Login Failed',
        nstatus:'Admin Mode',
        npage:'PBOSS'
      }),JSON.stringify({
      })]
  }},BLOGOUT/*{
    type:'Sb',
    props:{key:2,bc:logout,bl:'Log Out'}
  }*/];


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
    {type:'Si',props:{key:0,p:false,text:'Employee ID'}},
/*    {type:'Bb',props:{
      key:1,bc:[cuser,duser],bl:['Create Employee','Delete Employee']}},
    {type:'Bb',props:{
      key:2,bc:[vallreqs,termconns],bl:['View All Requests','Terminate Connections']}},
*/    {type:'Sb',props:{key:3,bc:logout,bl:'Log Out'}}
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
