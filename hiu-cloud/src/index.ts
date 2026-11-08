import type {FeaturePlugin,UiEffect,UiNode,UiResult,Json} from '../../../sdk';

// ---------- MD5（RFC 1321，公有领域 md5cycle 展开式实现的移植；已用 RFC 已知向量验证） ----------
// 效果层没有通用 crypto 能力，且 auth.prompt 凭据句柄的 transform 不含 MD5，
// 而验证码需要把「key:code」拼接进表单，因此密码在页面收集后在此计算 MD5。
function add32(a:number,b:number):number{return (a+b)|0;}
function cmn(q:number,a:number,b:number,x:number,s:number,t:number):number{a=add32(add32(a,q),add32(x,t));return (((a<<s)|(a>>>(32-s)))+b)|0;}
function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number):number{return cmn((b&c)|(~b&d),a,b,x,s,t);}
function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number):number{return cmn((b&d)|(c&~d),a,b,x,s,t);}
function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number):number{return cmn(b^c^d,a,b,x,s,t);}
function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number):number{return cmn(c^(b|~d),a,b,x,s,t);}
function md5cycle(x:number[],k:number[]):void{
 let a=x[0],b=x[1],c=x[2],d=x[3];
 a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
 a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
 a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
 a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
 a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
 a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
 a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
 a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
 a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
 a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
 a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
 a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
 a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
 a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
 a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
 a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
 x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);
}
function toUtf8(input:string):number[]{
 const out:number[]=[];
 for(let i=0;i<input.length;i++){
  let c=input.charCodeAt(i);
  if(c<0x80)out.push(c);
  else if(c<0x800)out.push(0xc0|(c>>6),0x80|(c&63));
  else if(c>=0xd800&&c<=0xdbff&&i+1<input.length){
   const lo=input.charCodeAt(++i);
   c=0x10000+((c-0xd800)<<10)+(lo-0xdc00);
   out.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));
  }else out.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));
 }
 return out;
}
function md5(input:string):string{
 const bytes=toUtf8(input),n=bytes.length;
 const state=[1732584193,-271733879,-1732584194,271733878];
 let i=0;
 for(i=64;i<=n;i+=64){
  const blk=new Array<number>(16);
  for(let j=0;j<16;j++)blk[j]=bytes[i-64+j*4]|(bytes[i-64+j*4+1]<<8)|(bytes[i-64+j*4+2]<<16)|(bytes[i-64+j*4+3]<<24);
  md5cycle(state,blk);
 }
 const tail=new Array<number>(16).fill(0);
 const rest=n-(i-64);
 for(let j=0;j<rest;j++)tail[j>>2]|=bytes[i-64+j]<<((j%4)<<3);
 tail[rest>>2]|=0x80<<((rest%4)<<3);
 if(rest>55){md5cycle(state,tail);for(let j=0;j<16;j++)tail[j]=0;}
 tail[14]=n*8;
 md5cycle(state,tail);
 const hexCh='0123456789abcdef';
 const rhex=(v:number)=>{let s='';for(let j=0;j<4;j++)s+=hexCh[(v>>(j*8+4))&15]+hexCh[(v>>(j*8))&15];return s;};
 return state.map(rhex).join('');
}

// ---------- 云平台协议常量（BladeX；jxypt.hiu.edu.cn） ----------
const BASE='https://jxypt.hiu.edu.cn';
// 平台网络契约只放行 accept/content-type/x-requested-with/referer/authorization(Bearer)/x-token 头，
// 无法发送 BladeX 门户的 Basic 认证与 Tenant-Id 头，改用 Spring OAuth 的表单参数回退
// （client_id/client_secret/tenantId），与 Bearer 携带令牌；真机验证待进行。
const PORTAL_CLIENT_ID='portal';
const PORTAL_CLIENT_SECRET='portal_secret';
const TENANT_ID='000000';

type Todo={id:string;title:string;course:string;due:string;kind:string;begin:string;body:string};
type Live={id:string;title:string;course:string;time:string;url:string};
type Screen='login'|'home'|'todos'|'detail'|'lives'|'study';
type State={
 screen:Screen;status:string;errorNote:string;serial:number;pending:string;
 user:string;pass:string;code:string;
 captchaKey:string;capHandle:string;capB64:string;
 token:string;who:string;wantStudy:boolean;
 todos:Todo[];detail:Todo|null;
 lives:Live[];studyNote:string;
};
const initial=(status:string):State=>({screen:'login',status,errorNote:'',serial:0,pending:'',user:'',pass:'',code:'',captchaKey:'',capHandle:'',capB64:'',token:'',who:'',wantStudy:false,todos:[],detail:null,lives:[],studyNote:''});

function apiHeaders(token:string):Record<string,string>{
 const headers:Record<string,string>={accept:'application/json'};
 if(token)headers.authorization='Bearer '+token;
 return headers;
}
function pick(o:Record<string,Json>,...keys:string[]):string{
 for(const key of keys){const value=o?.[key];if(typeof value==='string'&&value)return value;if(typeof value==='number')return String(value);}
 return '';
}
function payloadOf(body:string):Json{
 const parsed=JSON.parse(body) as Record<string,Json>;
 return parsed&&typeof parsed==='object'&&parsed.data!==undefined?parsed.data:parsed;
}
function listOf(data:Json):Record<string,Json>[]{
 if(Array.isArray(data))return data as Record<string,Json>[];
 if(data&&typeof data==='object'&&Array.isArray((data as Record<string,Json>).records))return (data as Record<string,Json>).records as Record<string,Json>[];
 return [];
}
function todoOf(item:Record<string,Json>):Todo{
 return {id:pick(item,'id','assignmentId'),title:pick(item,'title','name','homeworkName')||'未命名作业',
  course:pick(item,'courseName','course'),due:pick(item,'endTime','deadline','due'),
  kind:pick(item,'type','assignmentType')||'作业',begin:pick(item,'beginTime','startTime'),body:pick(item,'description','content')};
}
function studyNoteOf(todos:Todo[]):string{
 if(!todos.length)return '当前没有待办作业与测验记录。';
 const kinds=new Map<string,number>(),courses=new Map<string,number>();
 for(const todo of todos){kinds.set(todo.kind,(kinds.get(todo.kind)||0)+1);courses.set(todo.course||'未分课程',(courses.get(todo.course||'未分课程')||0)+1);}
 const soon=todos.map(t=>t.due).filter(Boolean).sort()[0]||'暂无';
 return `待办共 ${todos.length} 项：${[...kinds].map(([k,n])=>`${k} ${n} 项`).join('，')}；最近截止 ${soon}。`
  +`涉及 ${courses.size} 门课程：${[...courses].map(([c,n])=>`${c}(${n})`).join('、')}。详细学情报告接口待真实账号确认。`;
}
function view(state:State,effects:UiEffect[]=[]):UiResult<State>{
 const busy=!!state.pending,children:UiNode[]=[];
 if(state.screen==='login'){
  children.push(
   {id:'title',type:'text',style:'title',text:'龙外教学云平台'},
   {id:'status',type:'text',text:state.status});
  if(state.errorNote)children.push({id:'error',type:'text',tone:'error',text:state.errorNote});
  if(state.capHandle)children.push({id:'captcha',type:'image',handle:state.capHandle,label:'登录验证码'});
  else children.push({id:'capwait',type:'text',text:busy?'正在获取验证码…':'验证码未加载。'});
  children.push(
   {id:'user',type:'input',label:'账号',value:state.user,event:'user',inputType:'text',placeholder:'云平台学号/工号'},
   {id:'pass',type:'input',label:'密码',value:state.pass,event:'pass',inputType:'password'},
   {id:'code',type:'input',label:'图片验证码',value:state.code,event:'code',inputType:'text',placeholder:'不分大小写'},
   {id:'login',type:'button',label:'登录',event:'login',variant:'primary',enabled:!busy},
   {id:'caprefresh',type:'button',label:'刷新验证码',event:'captchaRefresh',variant:'secondary',enabled:!busy},
   {id:'notice',type:'text',style:'caption',text:'密码仅用于本次 MD5 摘要提交，不会保存在插件数据中。'});
 }else if(state.screen==='home'){
  children.push(
   {id:'status',type:'text',style:'title',text:state.who?`已登录：${state.who}`:'教学云平台'},
   {id:'hint',type:'text',text:state.status},
   {id:'todos',type:'button',label:'待办作业与测验',event:'todos',variant:'primary',enabled:!busy},
   {id:'lives',type:'button',label:'直播课程',event:'lives',enabled:!busy},
   {id:'study',type:'button',label:'学情概览',event:'study',enabled:!busy},
   {id:'logout',type:'button',label:'退出登录',event:'logout',variant:'secondary',enabled:!busy});
 }else if(state.screen==='todos'){
  children.push({id:'back',type:'button',label:'返回',event:'back',variant:'plain',enabled:!busy},{id:'status',type:'text',text:state.status});
  if(!state.todos.length)children.push({id:'empty',type:'text',text:'没有待办作业。'});
  for(const todo of state.todos)children.push({id:'todo-'+todo.id,type:'listItem',title:todo.title,
   subtitle:todo.course,detail:todo.due?('截止 '+todo.due):undefined,badge:todo.kind,event:'open',divider:true});
 }else if(state.screen==='detail'){
  children.push({id:'back',type:'button',label:'返回',event:'back',variant:'plain',enabled:!busy});
  const d=state.detail;
  children.push({id:'dtitle',type:'text',style:'title',text:d?.title||'作业详情'},
   {id:'dcourse',type:'text',text:d?.course?`课程：${d.course}`:''},
   {id:'dkind',type:'text',text:`类型：${d?.kind||'作业'}${d?.begin?` · 开始 ${d.begin}`:''}`},
   {id:'ddue',type:'text',text:d?.due?`截止：${d.due}`:'截止时间待学校发布'},
   {id:'dbody',type:'text',text:d?.body||'暂无详细说明。'});
 }else if(state.screen==='lives'){
  children.push({id:'back',type:'button',label:'返回',event:'back',variant:'plain',enabled:!busy},{id:'status',type:'text',text:state.status});
  if(!state.lives.length)children.push({id:'empty',type:'text',text:'当前没有直播课程。'});
  for(const [index,live] of state.lives.entries())children.push({id:'live-'+index,type:'listItem',title:live.title,
   subtitle:live.course,detail:live.time||'时间待定',badge:'直播',event:'watch',divider:true});
  children.push({id:'livenote',type:'text',style:'caption',text:'点击直播将通过系统浏览器打开云课堂页面观看。'});
 }else{
  children.push({id:'back',type:'button',label:'返回',event:'back',variant:'plain',enabled:!busy},
   {id:'status',type:'text',style:'title',text:'学情概览'},
   {id:'note',type:'text',text:state.studyNote});
 }
 return {state,view:{id:'root',type:'scroll',padding:16,gap:12,children},effects};
}
const plugin:FeaturePlugin<State>={
 ui:{
  init:()=>{
   const start=initial('正在读取登录状态…');
   start.serial=1;start.pending='load.1';
   return view(start,[{id:'load.1',capability:'storage.get',version:1,input:{key:'token'}}]);
  },
  reduce:({state,event})=>{
   const next={...state},effects:UiEffect[]=[];
   const send=(capability:string,version:number,input:Record<string,Json>,tag:string)=>{
    next.pending=tag+'.'+(++next.serial);
    effects.push({id:next.pending,capability,version,input});
   };
   const sendNet=(input:Record<string,Json>,tag:string)=>send('network.request',4,input,tag);
   const fetchCaptcha=()=>{next.capHandle='';next.capB64='';sendNet({url:BASE+'/api/ykt-basics/oauth/captcha',purpose:'auth',headers:{accept:'application/json'}},'cap');};
   if(event.type==='effect.result'){
    if(event.effectId!==next.pending)return view(next);
    next.pending='';
    if(!event.result?.ok){next.status='操作未完成：'+(event.result?.error.message||'请稍后重试');return view(next);}
    const data=event.result.data as unknown;
    const tag=event.effectId.split('.')[0];
    try{
     if(tag==='load'){
      if(typeof data==='string'&&data){next.token=data;next.screen='home';next.status='已恢复登录状态。点击下方入口查看云平台数据。';}
      else fetchCaptcha();
     }else if(tag==='cap'){
      const body=JSON.parse(String((data as {body:string}).body)) as Record<string,Json>;
      // BladeX 统一 R 包装：{code,success,data:{key,image}}；兼容直接返回顶层字段的情况。
      const envelope=(body.data&&typeof body.data==='object'?body.data:body) as {key?:Json;image?:Json};
      if(typeof envelope.key!=='string'||!envelope.key||typeof envelope.image!=='string'||!envelope.image)throw new Error('响应缺少验证码');
      next.captchaKey=envelope.key;
      next.capB64=envelope.image.replace(/^data:image\/[a-z+]+;base64,/,'');
      send('files.create',1,{name:'captcha.png',mime:'image/png'},'capfile');
     }else if(tag==='capfile'){
      next.capHandle=(data as {handle:string}).handle;
      send('files.write',1,{handle:next.capHandle,base64:next.capB64},'capwrite');
     }else if(tag==='capwrite'){
      next.capB64='';
      next.status='请输入账号、密码和图片验证码。';
     }else if(tag==='token'){
      const body=JSON.parse(String((data as {body:string}).body)) as Record<string,Json>;
      const inner=(body.data&&typeof body.data==='object'?body.data:body) as Record<string,Json>;
      const token=typeof inner.access_token==='string'?inner.access_token:typeof inner.token==='string'?inner.token:'';
      if(!token)throw new Error(pick(body,'error_description','errorMsg','msg')||'学校未返回访问令牌');
      next.token=token;next.who=next.user;next.pass='';next.code='';
      next.status='正在保存登录状态…';
      send('storage.set',1,{key:'token',value:token},'save');
     }else if(tag==='save'){
      next.screen='home';next.errorNote='';next.status='已登录 '+next.who+'。待办、直播与学情数据以学校云平台为准。';
     }else if(tag==='undone'){
      next.todos=listOf(payloadOf(String((data as {body:string}).body))).map(todoOf);
      if(next.wantStudy){next.wantStudy=false;next.studyNote=studyNoteOf(next.todos);next.screen='study';next.status='学情概览已按待办数据汇总。';}
      else{next.screen='todos';next.status=`云平台待办 ${next.todos.length} 项。点击条目查看详情与截止时间。`;}
     }else if(tag==='detail'){
      const d=todoOf(payloadOf(String((data as {body:string}).body)) as Record<string,Json>);
      next.detail={...d,id:next.detail?next.detail.id:d.id};
      next.screen='detail';
     }else if(tag==='lives'){
      next.lives=listOf(payloadOf(String((data as {body:string}).body))).map((item,index)=>({
       id:pick(item,'id','liveId')||String(index),
       title:pick(item,'name','title','liveName')||'未命名直播',
       course:pick(item,'courseName','course'),
       time:pick(item,'liveBeginTime','beginTime','time'),
       url:pick(item,'url','viewUrl','liveUrl')}));
      next.screen='lives';
      next.status=`云课堂直播 ${next.lives.length} 场。点击条目跳转浏览器观看。`;
     }else if(tag==='nav'){
      next.status='已在系统浏览器打开直播页面。';
     }else if(tag==='rm'){
      const serial=next.serial;
      Object.assign(next,initial('已退出登录。正在获取验证码…'));
      next.serial=serial;
      fetchCaptcha();
     }
     }catch(error){
      if(tag==='token'){
       next.errorNote='登录失败：'+(error as Error).message;
       next.status='请核对账号、密码与验证码后重试。';
       fetchCaptcha();
      }else next.status='云平台数据格式异常：'+(error as Error).message;
     }
    return view(next,effects);
   }
   if(next.pending)return view(next);
   if(event.type==='input'&&event.name==='user')next.user=String(event.value??'').slice(0,64);
   else if(event.type==='input'&&event.name==='pass')next.pass=String(event.value??'').slice(0,64);
   else if(event.type==='input'&&event.name==='code')next.code=String(event.value??'').slice(0,16);
   else if(event.type==='click'&&event.name==='captchaRefresh')fetchCaptcha();
   else if(event.type==='click'&&event.name==='login'){
    next.errorNote='';
    if(!next.user||!next.pass||!next.code)next.status='请填写账号、密码和图片验证码。';
    else if(!next.captchaKey){next.status='验证码尚未加载。';fetchCaptcha();}
    else{
     next.status='正在登录教学云平台…';
     sendNet({url:BASE+'/api/ykt-basics/oauth/token',method:'POST',purpose:'auth',headers:{accept:'application/json'},
      form:{grant_type:'password',scope:'all',client_id:PORTAL_CLIENT_ID,client_secret:PORTAL_CLIENT_SECRET,tenantId:TENANT_ID,
       username:next.user,password:md5(next.pass),captcha:next.captchaKey+':'+next.code}},'token');
    }
   }else if(event.type==='click'&&event.name==='todos'){
    next.wantStudy=false;
    next.status='正在获取待办作业…';
    sendNet({url:BASE+'/api/ykt-site/site/student/undone',purpose:'query',headers:apiHeaders(next.token)},'undone');
   }else if(event.type==='click'&&event.name==='study'){
    if(next.todos.length){next.studyNote=studyNoteOf(next.todos);next.screen='study';}
    else{next.wantStudy=true;next.status='正在获取学情数据…';sendNet({url:BASE+'/api/ykt-site/site/student/undone',purpose:'query',headers:apiHeaders(next.token)},'undone');}
   }else if(event.type==='click'&&event.name==='lives'){
    next.status='正在获取直播课程…';
    sendNet({url:BASE+'/api/ykt-site/web/live/course-list',purpose:'query',headers:apiHeaders(next.token)},'lives');
   }else if(event.type==='click'&&event.name==='open'&&event.nodeId?.startsWith('todo-')){
    const id=event.nodeId.slice(5);
    const known=next.todos.find(t=>t.id===id);
    next.detail=known?{...known,body:''}:null;
    next.status='正在获取作业详情…';
    sendNet({url:BASE+'/api/ykt-site/assignment/student-detail?assignmentId='+encodeURIComponent(id),purpose:'query',headers:apiHeaders(next.token)},'detail');
   }else if(event.type==='click'&&event.name==='watch'&&event.nodeId?.startsWith('live-')){
    const live=next.lives[Number(event.nodeId.slice(5))];
    if(live&&live.url){next.status='正在打开直播页面…';send('navigation.url',1,{url:live.url},'nav');}
    else next.status='该直播暂无可用的观看地址。';
   }else if(event.type==='click'&&event.name==='back'){
    if(next.screen==='detail')next.screen='todos';
    else if(next.screen!=='home')next.screen='home';
   }else if(event.type==='click'&&event.name==='logout'){
    next.status='正在退出登录…';
    send('storage.remove',1,{key:'token'},'rm');
   }
   return view(next,effects);
  }
 }
} satisfies FeaturePlugin<State>;
export default plugin;
