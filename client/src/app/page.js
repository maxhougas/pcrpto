'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import {Si,Ii,Bb,Sb} from "./components.js"
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const SCHECK = ['Start'];
  const [status,setstatus] = React.useState(SCHECK);

/***
 S001 START PAGE FUNCTIONS
 ***/

  function testpair(){
    fetch('http://localhost:5000/pair')
  }

  function switchpage(s,g,p){
    if(s){setstatus(Array.isArray(s)?s:[s]);}
    if(g){setogrid(g);}
    if(p){setpage(p);}
  }

  function genbhandle(eve){
    let props = JSON.parse(eve.target.getAttribute('req'));
    switchpage(props.status,null,null);

    if(props.cb){
      eval(props.cb+'(fun.genreq(props.m,props.u,props.b)').then(
      
      );
    }
    else{
      fun.genreq(props.m,props.u,props.b).then(
        suc => switchpage(props.nstatus,eval(props.npage)),
        err => {switchpage(props.fstatus,null,null);fun.generr(props.fstatus,err);}
      );
    }
  }

  function cback(){
    switchpage('Checking...',G1BY1,null);
    fun.genreq('POST','echo',{echo:'echo'})
    .then(
      jso=>switchpage(SWILLK,G1BY1,PLOGIN),
      err=>{switchpage('Back End Not Found',null,null);fun.generr('JSON Error: '+fun.BACKEND+'echo',err);}
    )
  }

  function logout(){ //must refactor... might be fine
    switchpage(SLOGOUT,G1BY1,null);

    fun.genreq('GET','logout',null)
    .then(
      jso => switchpage(SWILLK,G1BY1,PLOGIN),
      err => {switchpage('Logout Failed',G1BY1,null);fun.generr('JSON Error: '+fun.BACKEND+'logout',err);}
    );
  }

  function login(){
    let uname = document.getElementById('ii0').value;
    let pass = document.getElementById('ii1').value;

    return fun.getkey()
    .then(
      key => fun.encrypt(key,pass),
      err => {throw fun.generr('Failed to Import Key',err);}
    ).then(
      enc => fun.genreq('POST','login',{uname:uname,pass:Buffer.from(enc).toString('Base64')}),
      err => {fun.generr('Failed to encrypt',err);}
    );
  }

  function loginemp(){
    switchpage('Logging In...',G1BY1,null);

    login()
    .then(
      jso => switchpage('Employee Mode',null,PEMP),
      err => {
        switchpage('Login Failed',null,null);
        fun.generr('JSON Error: '+fun.BACKEND+'login',err);
    });
  }

  function loginboss(){
    switchpage('Logging In...',G1BY1,null);

    login()
    .then(
      jso => switchpage(jso.mode === 'admin' ? SBOSS : 'Bad User Name' ,null,jso.mode ==='admin' ? PBOSS : null),
      err => {switchpage(SLOGINF,null,null);fun.generr('JSON Error: '+fun.BACKEND+'login',err);}
    );
  }  

  function lemp(){
    let url = 'lemp';
    switchpage('Retrieving Data...',G1BY1,null);

    function mklist(usrs){
      let stat = 
        usrs.map(e => e.User);
//        .filter(e => e && e !== '' && e !== 'PUBLIC' && e !== 'mariadb.sys' && e !== 'mysql' && e !== 'root');
      return stat;
    }

    fun.genreq('GET',url,null)
    .then(
      jso => switchpage(mklist(jso[0]),G1BY2,PEMPMAN),
      err => {
        switchpage('Get Users Failed',null,null);
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
    switchpage ('Creating User...',G1BY1,null);

    fun.genreq('POST','cuser',{nuname:document.getElementById('si0').value})
    .then(
      jso => switchpage('User Created',null,null),
      err => {
        switchpage('Create user failed',null,null);
        fun.generr('JSON Error '+fun.BACKEND+url,err);
    })
  }

  function duser(){
    if(document.getElementById('si0').value === 'ptoboss'){
      switchpage('DUMM IDEE!',G1BY1,null);
      console.error('Attempted to delete admin user');
    }else{
      let url = 'duser';
      switchpage('Deleting User...',G1BY1,null);
      fun.genreq('POST',url,{uname:document.getElementById('si0').value})
      .then(
        jso => switchpage('User Deleted',null,null),
        err => {
          switchpage('Delete User Failed',null,null);
          fun.generr('JSON Error: '+fun.BACKEND+url,err);
    })}
  }

  function toadmin(){
    switchpage(SBOSS,G1BY1,PBOSS);
  }

  function denyp(){
  }

  function termconns(){
    let url='reset';
    switchpage('Terminating...',G1BY1,null);

    fun.genreq('POST',url,{checkphrase:'reset'})
    .then(
      jso => switchpage('Conns Reset',G1BY1,PLOGIN),
      err => {
        switchpage('Reset Failed',G1BY1,null);
        fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });
  }

  function vallreqs(){
    let url = 'allreqs';
    switchpage('Getting Requests...',G1BY1,null);

    fun.genreq('GET',url,null)
    .then(
      jso => switchpage(JSON.stringify(jso[0]),G1BY1,null),
      err => {
        switchpage('Get Requests Failed',G1BY1,null);
        generr('JSON Error '+fun.BACKEND+url,err);
    });
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
        bc:[loginboss,loginemp],
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
    {
      type:Bb,props:{
        key:1,
        bc:[lemp,vallreqs],
        bl:['List Employees','List Requests'],
    }},{
      type:Bb,props:{
        key:2,
        bc:[termconns,logout],
        bl:['Terminate Connections','Log Out']}}
  ];

  const PEMPMAN = [
    {type:Si,props:{key:0,p:false,text:'Employee ID'}},
    {
      type:Bb,props:{
        key:1,
        bc:[lemp,cuser],
        bl:['List Users','Create User']
    }},{
      type:Bb,props:{
        key:2,
        bc:[duser,toadmin],
        bl:['Delete User','Back'],
    }},
    BLOGOUT
  ];

  const SNOCON = ['No Connection'];
  const SWILLK = ['Willkommen'];
  const SLOGIN = ['Logging In...'];
  const SLOGOUT = ['Logging Out...'];
  const SEMP = ['Employee Mode'];
  const SBOSS = ['Admin Mode'];
  const SLOGINF = ['Login Failed'];

  const G1BY1 = '1fr / 1fr';
  const G1BY2 = '1fr / 1fr 1fr';

/***
 E002 END PAGE DEFS
 S003 START RENDER
 ***/

  const [page,setpage] = React.useState(PCONTEST);
  const [ogrid,setogrid] = React.useState(G1BY1);
  
  return (<comps.Page page={page} ogrid={ogrid} status={status} />);
}
