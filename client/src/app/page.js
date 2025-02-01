'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const [sprops,setsprops] = React.useState({grid:'1fr',status:['Start']});
  const [iprops,setiprops] = React.useState(null);
  const [bprops,setbprops] = React.useState({grid:'1fr',handler:[cback],btxt:['Check Connection']})
  React.useEffect(() => {
    function tabclose(e){
      e.preventDefault();
      console.log('Logging out on tab closure');
      logout();
      return 'Logging Out';
    }
    window.addEventListener('beforeunload',tabclose);

    return () => {window.removeEventListener('beforeunload',tabclose);};
  }, []);

  let pkey;

/***
 S001 START HELPER FUNCTIONS
 ***/

  function testpair(){
    fetch('http://localhost:5000/pair')
  }

  function s(grid,status){
    return ({grid:grid,status:status});
  }
  function i(grid,type,itxt){
    return({grid:grid,type:type,itxt:itxt});
  }
  function b(grid,handler,btxt){
    return({grid:grid,handler:handler,btxt:btxt});
  }

  function loginpage(){
    setsprops({grid:1,status:['Willkommen']});
    setiprops({grid:2,type:['text','password'],itxt:['Username','Password']});
    setbprops({grid:2,handler:[login],btxt:['Log In']});
  }

  function bossmode(){
   setsprops({grid:1,status:['Admin Mode']});
   setiprops({grid:1,type:['text'],itxt:['Ausweis']});
   setbprops({
     grid:3,
     handler:[ lemp,            cuser,        duser,        vreqs,          rpreq,
               preqs,           conflicts,  cpasspage,        termconns,              logout],
     btxt:   ['List Employees','Create User','Delete User','View Requests','Remove Request',
              'Purge Requests','Conflicts','Change Password','Terminate Connections','Log Out']
   });
  }

  function employeemode(){
    setsprops({grid:1,status:['Employee Mode']});
    setiprops({
      grid:2,
      type:['datetime-local',      'datetime-local',    'number'],
      itxt:['Start:YYYYMMDDHHMMSS','End:YYYYMMDDHHMMSS','Request ID']
    });
    setbprops({
      grid:2,
      handler:[ spreq,           rpreq,           vreqs,          cpasspage,        logout],
      btxt:['Submit Request','Revoke Request','View Requests','Change Password','Log Out']
    });
  }

  function cpasspage(){
    setsprops({grid:1,status:['Change Password']});
    setiprops({grid:2,type:['text','password','password','password'],itxt:['Username','Old Password','New Password','Confirm Password']});
    setbprops({grid:2,handler:[cpass,mainpage,logout],btxt:['Confirm','Back','Log Out']});
  }

/***
 E001 END HELPER FUNCTIONS
 S002 START BUTTON FUNCTIONS
 ***/

  function cback(){
    let url = 'echo';
    setsprops(s(1,'Checking...'));

    fun.genreq('POST',url,{echo:'echo'}).then(
      jso=> loginpage(),
      err=>{setsprops(s(1,'Back End Not Found')); throw Error(fun.BACKEND+url,{cause:err});}
    ).catch(err =>{
      console.error(err);
    });
  }

  function mainpage(){
    let url = 'whoami';
    let errmsg = 'Determine User Mode Failed'
    setsprops(s(1,['Who Am I?']));

    fun.genreq('GET',url,null).then(
      jso => {if (jso.mode === 'admin') bossmode(); else employeemode();},
      err => {throw Error(fun.BACKEND+url,{cause:err});}
    ).catch(err => {
      setsprops(s(1,errmsg));
      console.error(err);
    });
  }

  function login(){
    let url = 'login';
    let errmsg = 'Login Failed';
    let uname = document.getElementById('i0').value;
    let pass = document.getElementById('i1').value;
    document.getElementById('i1').value = '';
    setsprops(s(1,['Logging In...']));

    fun.getkey().then(
      key => {pkey = key; return fun.encrypt(key,pass);},
      err => {throw Error('Get key failed',{cause:err});}
    ).then(
      enc => fun.genreq('POST',url,{uname:uname,pass:fun.tobase64(enc)}),
      err => {throw Error('Encryption failed',{cause:err});}
    ).then(
      jso => mainpage(),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function logout(){
    let url = 'logout';
    let errmsg = 'Logout Failed';
    setsprops(s(1,['Logging Out...']));

    fun.genreq('GET',url,null).then(
      jso => loginpage(),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function conflicts(){
    let url = 'vreqs';
    let errmsg = 'Get Requests Failed';
    setsprops(s(1,['Getting Requests...']));

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(4,fun.checkconflicts(jso[0]))),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function lemp(){
    let url = 'lemp';
    let errmsg = 'Get Users Failed';
    setsprops(s(1,['Retrieving Data...']));

    function mklist(usrs){
      return usrs.map(e => e.User);
    }

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(2,mklist(jso[0]))),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function preqs(){
    let url = 'preqs'
    let errmsg = 'Purge Failed';
    let conf = document.getElementById('i0').value

    if(conf !== 'PURGE')
      setsprops(s(1,['Type "PURGE" and press button again']));
    else{
      setsprops(s(1,['Purging...']));
      fun.genreq('POST',url,{checkphrase:conf}).then(
        jso => setsprops(s(1,['Requests Purged'])),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(err => {
        setsprops(s(1,[errmsg]));
        console.error(err);
      });
    }
  }

  function rpreq(){
    let id = document.getElementById('inputs').children.item(document.getElementById('inputs').children.length - 1).value;

    if(id){
      let url = 'rpreq'
      let errmsg = 'Delete Failed';
      setsprops(s(1,['Deleting...']));

      fun.genreq('POST',url,{id:id}).then(
        jso => setsprops(s(1,['Request Deleted'])),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(err => {
          setsprops(s(1,[errmsg]));
          console.error(err);
      });
    }
    else setsprops(s(1,['Failed: Empty String']));
  }

  function cpass(){
    let url = 'cpass'
    let errmsg = 'Password Change Failed';
    let uname = document.getElementById('i0').value;
    let opass = document.getElementById('i1').value;
    let npass = document.getElementById('i2').value;
    let cpass = document.getElementById('i3').value;
    document.getElementById('i0').value = '';
    document.getElementById('i1').value = '';
    document.getElementById('i2').value = '';
    document.getElementById('i3').value = '';
    setsprops(s(1,['Changing Password...']));

    if(uname && opass && npass && cpass && npass == cpass){
      Promise.all([fun.encrypt(pkey,opass),fun.encrypt(pkey,npass)]).then(
        pas => fun.genreq('POST',url,{uname:uname,opass:fun.tobase64(pas[0]),npass:fun.tobase64(pas[1])}),
        err => {throw Error('Encryption failed',{cause:err});}
      ).then(
        jso => mainpage(),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(err => {
        setsprops(s(1,[errmsg]));
        console.error(err);
      });
    }
    else setsprops(s(1,['Failed: Empty String or Mismatch']));
  }

  function cuser(){
    if(document.getElementById('i0').value === '')
      setsprops(s(1,['Failed: Empty String']));
    else{
      let url = 'cuser';
      setsprops(s(1,['Creating User...']));

      fun.genreq('POST',url,{nuname:document.getElementById('i0').value}).then(
        jso => setsprops(s(1,['User Created'])),
        err => {throw Error('Create User Failed',{cause:err});}
      ).catch(err => {
        setsprops(s(1,['Create User Failed']));
        console.error(err);
      });
    }
  }

  function duser(){
    let url = 'duser';
    setsprops(s(1,'Deleting User...'));

    fun.genreq('POST',url,{uname:document.getElementById('i0').value}).then(
      jso => setsprops(s(1,['User Deleted'])),
      err => {throw Error('Delete User Failed',{cause:err});}
    ).catch(err => {
      setsprops(s(1,['Delete User Failed']));
      console.error(err);
    });
  }

  function termconns(){
    let url='reset';
    setsprops(s(1,['Terminating...']));

    fun.genreq('POST',url,{checkphrase:'reset'}).then(
      jso => loginpage(),
      err => {throw Error('Reset Failed',{cause:err});}
    ).catch(err => {
      setsprops(s(1,['Reset Failed']));
      console.error(err);
    });
  }

  function vreqs(){
    let url = 'vreqs';
    setsprops(s(1,['Getting Requests...']));

    function mklist(jso){
      let lst = ['Request ID','Employee ID','Start','End'];
      jso.forEach(e => lst = lst.concat([e.id,e.empid,fun.fixtime(e.startdate),fun.fixtime(e.enddate)]));
      return(lst);
    }

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(4,mklist(jso[0]))),
      err => {throw Error('',{cause:err});}
    ).catch(err => {
      setsprops(s(1,['Get Requests Failed']));
      console.error(err);
    });
  }

  function spreq(){
    let start = document.getElementById('i0').value
    let end = document.getElementById('i1').value

    if((start) && (end)){
      let url = 'spreq'
      setsprops(s(1,['Submitting...']));

      fun.genreq('POST',url,{start:start,end:end}).then(
        jso => setsprops(s(1,['Request Submitted'])),
        err => {throw Error('Request Submission Failed',{cause:err});}
      ).catch(err => {
         setsprops(s(1,['Request Submission Failed']));
         console.error(err);
      });
    } else setsprops(s(1,['Failed: Empty String']));
  }

/***
 E002 END BUTTON FUNCTIONS
 ***/

  /*window.beforeunload = logout;*/
  
  return (<comps.Page sprops={sprops} iprops={iprops} bprops={bprops}/>);
}
