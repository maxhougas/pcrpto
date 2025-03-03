'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const [sprops,setsprops] = React.useState({grid:1,status:['Willkommen']});
  const [oprops,setoprops] = React.useState(null);
  const [iprops,setiprops] = React.useState({grid:2,type:['text','password'],itxt:['Username','Password']});
  const [bprops,setbprops] = React.useState({grid:1,handler:[login],btxt:['Log In']});

/***
 S001 START HELPER FUNCTIONS
 ***/

  function closeHandle(e){
    e.preventDefault();
    logout();
  }

  function s(grid,status){
    return ({grid:grid,status:status});
  }
  function o(grid,outputs){
    return ({grid:grid,outputs:outputs});
  }
  function i(grid,type,itxt){
    return({grid:grid,type:type,itxt:itxt});
  }
  function b(grid,handler,btxt){
    return({grid:grid,handler:handler,btxt:btxt});
  }

  function loginpage(){
    setsprops({grid:1,status:['Willkommen']});
    setoprops(null);
    setiprops({grid:2,type:['text','password'],itxt:['Username','Password']});
    setbprops({grid:1,handler:[login],btxt:['Log In']});
  }

  function bossmode(){
   setsprops({grid:1,status:['Admin Mode']});
   setoprops(null);
   setiprops(null);
   setbprops({grid:3,
     handler:[ memp,              mreq,             mstore,         mshifts,        cpasspage,        termconns,              logout],
     btxt:   ['Manage Employees','Manage Requests','Manage Stores','Manage Shifts','Change Password','Terminate Connections','Log Out']
   });
  }

  function cpasspage(){
    setsprops({grid:1,status:['Change Password']});
    setoprops(null);
    setiprops({grid:2,type:['text','password','password','password'],itxt:['Username','Old Password','New Password','Confirm Password']});
    setbprops({grid:2,handler:[cpass,mainpage,logout],btxt:['Confirm','Back','Log Out']});
  }

  function employeemode(){
    setsprops({grid:1,status:['Employee Mode']});
    setoprops(null);
    setiprops({grid:2,
      type:['datetime-local',      'datetime-local',    'text'],
      itxt:['Start:YYYYMMDDHHMMSS','End:YYYYMMDDHHMMSS','Ausweis']
    });
    setbprops({grid:2,
      handler:[ reqs,            reqr,            reql,           cpasspage,        logout],
      btxt   :['Submit Request','Revoke Request','View Requests','Change Password','Log Out']
    });
  }

  function memp(){
    setsprops({grid:1,status:['Manage Employees']});
    setoprops(null);
    setiprops({grid:2,type:['text','text','date','date','number'],itxt:['Employee','Store','Start Date','End Date','Shift']});
    setbprops({grid:3,
      handler:[ empl,            empc,             empd,             shiftlas,          shiftasg,      shiftuas,        bossmode,logout],
      btxt   :['List Employees','Create Employee','Delete Employee','List Assignments','Assign Shift','Unassign Shift','Back',  'Log Out']
    });
  }

  function mreq(){
    setsprops({grid:1,status:['Manage Requests']});
    setoprops(null);
    setiprops({grid:1,type:['text'],itxt:['Ausweis']});
    setbprops({grid:3,handler:[reql,reqr,reqp,bossmode,logout],btxt:['List Requests','Remove Request','Purge Requests','Back','Log Out']});
  }

  function mstore(){
    setsprops({grid:1,status:['Manage Stores']});
    setoprops(null);
    setiprops({grid:2,type:['text','text'],itxt:['Employee','Store']});
    setbprops({grid:3,
      handler:[ storel,       storec,        stored,        storelas,            storeasg,         storeuas,           bossmode,logout],
      btxt   :['List Stores','Create Store','Delete Store','List Employee Assg','Assign Employee','Unassign Employee','Back',  'Log Out']
    });
  }

  function mshifts(){
    setsprops({grid:1,status:['Manage Shifts']});
    setoprops({grid:3,outputs:['Holiday','Weekday','Sunday']});
    setiprops({grid:3,
      type:['time',        'time',         'time',          'time',     'time',       'time',      
            'time',       'time',        'time',         'date',      'text'],
      itxt:['Holiday Start','Weekday Start','Sunday Start','Holiday SC','Weekday SC','Sunday SC',
            'Holiday Ende','Weekday Ende','Sunday Ende','Start Date','Store']
    });
    setbprops({grid:3,
      handler:[ defshiftload, defshiftsave, monthgen,        dayl,           days,          dayd,            mainpage,logout],
      btxt   :['Load Shifts','Save Shifts','Generate Month','List Holidays','Save Holiday','Delete Holiday','Back',  'Log Out']
    });
  }

  function rsuc(status = null,ogrid = null,oarr = null){
    setsprops(status?s(1,status):null);
    setoprops(ogrid?o(ogrid,oarr):(ogrid===null?null:oprops));
  }
  function rfail(err){
     setsprops(s(1,err.message));
     setoprops(null);
     console.error(err);
  }

/***
 E001 END HELPER FUNCTIONS
 S002 START REQUEST FUNCTIONS
 ***/

  function login(){
    let url = 'login';
    let errmsg = 'Login Failed';
    fun.G.uname = fun.txtbox('i0');
    let pass = fun.txtbox('i1');
    document.getElementById('i1').value = '';
    setsprops(s(1,['Logging In...']));

    fun.getkey().then(
      key => {fun.G.pkey = key; return fun.encrypt(key,pass);},
      err => {throw Error('Get key failed',{cause:err});}
    ).then(
      enc => fun.genreq(url,{pass:fun.tobase64(enc)}),
      err => {throw Error('Encryption failed',{cause:err});}
    ).then(
      jso => {window.addEventListener('beforeunload',closeHandle,false);mainpage();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function logout(){
    let url = 'logout';
    let errmsg = 'Logout Failed';
    setsprops(s(1,['Logging Out...']));

   fun.genreq(url,null).then(
      jso => {window.removeEventListener('beforeunload',closeHandle,false);loginpage();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function mainpage(){
    let url = 'whoami';
    let errmsg = 'Determine User Mode Failed'
    setsprops(s(1,['Who Am I?']));

    fun.genreq(url,null).then(
      jso => {if (jso.mode === 'admin') bossmode(); else employeemode();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

/*  function conflicts(){
    let url = 'vreqs';
    let errmsg = 'Get Requests Failed';
    setsprops(s(1,['Getting Requests...']));

    fun.genreq(url,null).then(
      jso => rsuc('PTO Conflicts',4,fun.checkconflicts(jso)),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }
*/
  function cpass(){
    let url = 'cpass'
    let errmsg = 'Password Change Failed';
    let cname = fun.txtbox('i0');
    let opass = fun.txtbox('i1');
    let npass = fun.txtbox('i2');
    let cpass = fun.txtbox('i3');
    document.getElementById('i0').value = '';
    document.getElementById('i1').value = '';
    document.getElementById('i2').value = '';
    document.getElementById('i3').value = '';
    setsprops(s(1,['Changing Password...']));

    Promise.all([fun.encrypt(fun.G.pkey,opass),fun.encrypt(fun.G.pkey,npass),fun.encrypt(fun.G.pkey,cpass)]).then(
      pas => fun.genreq(url,{cname:cname,opass:fun.tobase64(pas[0]),npass:fun.tobase64(pas[1]),cpass:fun.tobase64(pas[2])}),
      err => {throw Error('Encryption failed',{cause:err});}
    ).then(
      jso => rsuc('Password Changed'),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function dayd(){
    setsprops(s(1,['Deleting Holiday...']));

    fun.genreq('dayd',{date:fun.txtbox('i9'),store:fun.txtbox('i10')}).then(
      jso => rsuc(['Holiday Deleted']),
      err => {throw Error('Save Failed',{cause:err});}
    ).catch(rfail);
  }

  function dayl(){

    function mklist(jso){
       let out = ['Date D-M-Y','Store','Start','Shift Change','End'];
       jso.forEach(e => out = out.concat([fun.yurptime(e.date).slice(0,10),e.store,e.start,e.sc,e.end]));
       return out;
    }

    setsprops(s(1,['Getting Holidays...']));

    fun.genreq('dayl',null).then(
      jso => rsuc(['Registered Holidays'],5,mklist(jso)),
      err => {throw Error('Get Holidays Failed',{cause:err});}
    ).catch(rfail)
  }

  function days(){
    setsprops(s(1,['Saving Holiday...']));

    fun.genreq('days',{date:fun.txtbox('i9'),store:fun.txtbox('i10'),start:fun.txtbox('i0'),sc:fun.txtbox('i3'),end:fun.txtbox('i6')}).then(
      jso => rsuc(['Holiday Saved']),
      err => {throw Error('Save Holiday Failed',{cause:err});}
    ).catch(rfail);
  }

  function defshiftload(){
		function putvals(jso){
		  fun.txtbox('i1',jso.wstart);
			fun.txtbox('i4',jso.wsc);
			fun.txtbox('i7',jso.wend);
			fun.txtbox('i2',jso.ustart);
			fun.txtbox('i5',jso.usc);
			fun.txtbox('i8',jso.uend);
		}
    setsprops(s(1,['Getting Shifts...']));

    fun.genreq('defshiftload',{store:fun.txtbox('i10')}).then(
      jso => {putvals(jso[0]);rsuc('Shifts Loaded',3,['Holiday','Weekday','Sunday']);},
      err => {throw Error('Get Shifts Failed',{cause:err});}
    ).catch(rfail);
  }

  function defshiftsave(){
		let dg = {
		  wstart:fun.txtbox('i1'),
			wsc   :fun.txtbox('i4'),
			wend  :fun.txtbox('i7'),
			ustart:fun.txtbox('i2'),
			usc   :fun.txtbox('i5'),
			uend  :fun.txtbox('i8'),
			store :fun.txtbox('i10')
	  }
    setsprops(s(1,'Saving Shifts...'));

    fun.genreq('defshiftsave',dg).then(
      jso => setsprops(s(1,['Shifts Saved'])),
      err => {throw Error('Save Failed',{cause:err});}
    ).catch(rfail);
  }

  function empc(){
    setsprops(s(1,['Creating Employee...']));

    fun.genreq('empc',{nuname:fun.txtbox('i0')}).then(
      jso => rsuc(['Employee Created']),
      err => {throw Error('Create Employee Failed',{cause:err});}
    ).catch(rfail);
  }

  function empd(){
    setsprops(s(1,'Deleting Employee...'));

    fun.genreq('empd',{dname:fun.txtbox('i0')}).then(
      jso => rsuc(['Employee Deleted']),
      err => {throw Error('Delete Employee Failed',{cause:err});}
    ).catch(rfail);
  }

  function empl(){
    setsprops(s(1,['Getting Employees...']));

    function mklist(usrs){
      return usrs.map(e => e.id);
    }

    fun.genreq('empl',null).then(
      jso => rsuc('Registered Employees',3,jso.map(e=>e.id)),
      err => {throw Error('Get Employees Failed',{cause:err});}
    ).catch(rfail);
  }

  function monthgen(){
    function mklist(cnfs,storeemps){
      let lst = ['Date (D-M-Y)','Shift 1','Shift 2'];
      cnfs.forEach(e => {
				lst = lst.concat(e.date);
				lst = lst.concat([<comps.Ynemplist ja={fun.invert(storeemps,e.shift0)} nein={e.shift0}/>]);
				lst = lst.concat([<comps.Ynemplist ja={fun.invert(storeemps,e.shift1)} nein={e.shift1}/>]);
			});
      return lst;
    }

    setsprops(s(1,['Generating Conflicts...']));
		let st = fun.txtbox('i10');

    Promise.all([fun.genreq('defshiftload',{store:st}),fun.genreq('reqbystore',{store:st}),fun.genreq('dayl',{store:st})]).then(
      jso => Promise.all([fun.shiftconfs(fun.genshifts(fun.txtbox('i9'),Object.values(jso[0][0]),jso[2]),jso[1]),fun.genreq('storelas',{store:st})]),
      err => {throw Error('Get default shifts failed',{cause:err});}
    ).then(
      cnf => rsuc(fun.txtbox('i10')+' conflicts',3,mklist(cnf[0],cnf[1].map(e=>e.emp))),
      err => {throw Error('Data Formatting Failed',{cause:err});}
    ).catch(rfail);
  }

  function reql(){
    setsprops(s(1,['Getting Requests...']));

    function mklist(jso){
      let lst = ['Request ID','Employee ID','Start (D-M-Y H:M)','End (D-M-Y H:M)'];
      jso.forEach((e,i) => lst = lst.concat([e.id,e.emp,fun.yurptime(e.startdate),fun.yurptime(e.enddate)]));
      return(lst);
    }

    fun.genreq('reql',null).then(
      jso => rsuc(['Active PTO Requests'],4,mklist(jso)),
      err => {throw Error('Get Requests Failed',{cause:err});}
    ).catch(rfail);
  }

  function reqp(){

    if(fun.txtbox('i0') !== 'PURGE')
      setsprops(s(1,['Type "PURGE" and press button again']));
    else{
      setsprops(s(1,['Purging...']));
      fun.genreq('reqp',{checkphrase:fun.txtbox('i0')}).then(
        jso => rsuc(['Requests Purged']),
        err => {throw Error('Purge Failed',{cause:err});}
      ).catch(rfail);
    }
  }

  function reqr(){
    let id = document.getElementById('inputs').children.item(document.getElementById('inputs').children.length - 1).value;

    let url = 'reqr'
    let errmsg = 'Delete Failed';
    setsprops(s(1,['Deleting...']));

    fun.genreq('reqr',{id:id}).then(
      jso => rsuc(['Request Deleted']),
      err => {throw Error('Delete Failed',{cause:err});}
    ).catch(rfail);
  }

  function reqs(){
    setsprops(s(1,['Submitting...']));

    fun.genreq('reqs',{start:fun.txtbox('i0'),end:fun.txtbox('i1')}).then(
      jso => rsuc(['Request Submitted']),
      err => {throw Error('Request Submission Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftasg(){
    setsprops(s(1,['Assigning Shift...']));

    fun.genreq('shiftasg',{emp:fun.txtbox('i0'),store:fun.txtbox('i1'),date:fun.txtbox('i2'),shift:fun.txtbox('i4')}).then(
      jso => rsuc(['Shift Assigned']),
      err => {throw Error('Assign Shift Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftlas(){
    setsprops(s(1,['Getting Shift Assignments...']));

    function mklist(jso){
      let out = ['Employee','Store','Date (D-M-Y)','Shift'];
      jso.forEach(e => out = out.concat([e.emp,e.store,fun.yurptime(e.date).slice(0,10),e.shift]));
      return out;
    }

    let d = {
      emp  :fun.txtbox('i1'),
      store:fun.txtbox('i1'),
      date :fun.txtbox('i2'),
      shift:fun.txtbox('i4')
    };

    fun.genreq('shiftlas',d).then(
      jso => rsuc(['Registered Shift Assignments'],4,mklist(jso)),
      err => {throw Error('Get Shift Assignments Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftuas(){
    setsprops(s(1,['Unassigning...']));

    let d = {
      emp  :fun.txtbox('i0'),
      store:fun.txtbox('i1'),
      date :fun.txtbox('i2'),
      shift:fun.txtbox('i4')
    };

    fun.genreq('storeuas',d).then(
      jso => rsuc(['Shift Unassigned']),
      err => {throw Error('Unassign Shift Failed',{cause:err});}
    ).catch(rfail);
  }

  function storeasg(){
    setsprops(s(1,['Assigning...']));

    fun.genreq('storeasg',{emp:fun.txtbox('i0'),store:fun.txtbox('i1')}).then(
      jso => rsuc('Assigned',null,null),
      err => {throw Error('Assignment Failed',{cause:err});}
    ).catch(rfail);
  }

  function storec(){
    setsprops(s(1,['Creating Store...']));

    fun.genreq('storec',{store:fun.txtbox('i1')}).then(
      jso => rsuc('Created',null,null),
      err => {throw Error('Create Failed',{cause:err});}
    ).catch(rfail);
  }

  function stored(){
    setsprops(s(1,['Deleting Store...']));

    fun.genreq('stored',{store:fun.txtbox('i1')}).then(
      jso => rsuc('Deleted',null,null),
      err => {throw Error('Delete Failed',{cause:err});}
    ).catch(rfail);
  }

  function storel(){
    setsprops(s(1,['Getting Stores...']));

    fun.genreq('storel',null).then(
      jso => rsuc('Stores',3,jso.map(e => e.id)),
      err => {throw Error('Get Stores Failed',{cause:err});}
    ).catch(rfail);
  }

  function storelas(){

    function mklist(jso){
      let out = ['Employee','Store'];
      jso.forEach(e => {out = out.concat([e.emp,e.store]);});
      return out;
    }

    setsprops(s(1,['Getting Assignments...']));

    fun.genreq('storelas',{store:fun.txtbox('i1'),emp:fun.txtbox('i0')}).then(
      jso => rsuc('Store Assignments',2,mklist(jso)),
      err => {throw Error('Get stores failed',{cause:err});}
    ).catch(rfail);
  }

  function storeuas(){
    setsprops(s(1,['Unassigning...']));

    fun.genreq('storeuas',{emp:fun.txtbox('i0'),store:fun.txtbox('i1')}).then(
      jso => rsuc('Unassigned',null,null),
      err => {throw Error('Unassignment Failed',{cause:err});}
    ).catch(rfail);
  }

  function termconns(){

    setsprops(s(1,['Terminating...']));

    fun.genreq('reset',{checkphrase:'RESET'}).then(
      jso => loginpage(),
      err => {throw Error('Reset Failed',{cause:err});}
    ).catch(rfail);
  }

/***
 E002 END REQUEST FUNCTIONS
 ***/

  return (<comps.Page sprops={sprops} oprops={oprops} iprops={iprops} bprops={bprops}/>);
}
