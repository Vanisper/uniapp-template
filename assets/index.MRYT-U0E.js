import{n as t,d as e,r as a,k as l,l as o,m as n,p as i,s,o as u,c as p,w as f,q as v,x as c,y as m,z as d,M as r,a as h,g as x,A as g,F as y,B as T,b,C as w,e as _,t as k,D as C,f as L}from"./index-D04Z0yum.js";const M=(t,e)=>{const a=t.__vccOpts||t;for(const[l,o]of e)a[l]=o;return a};function $(e){t({url:e})}const I=M(e({options:{addGlobalClass:!0,virtualHost:!0,styleIsolation:"shared"},__name:"index",props:{position:{type:String,default:"right-bottom"},gap:{type:Object,default:()=>({top:0,left:16,right:16,bottom:0})}},setup(t){const e=t,M=a(),$=a(!1),I=a(!1),P=a(!1),A=a("left"),H="main-ball-pos-cache";function j(){const t=m(H);t&&(z.top=t.top,z.left=t.left,B.top=t.top,B.left=t.left,E())}const z=l({top:0,left:0}),B=l({top:0,left:0}),G=l({width:0,height:0}),O=a(64),q=o((()=>3*O.value/4)),D=o((()=>O.value-q.value)),F=o((()=>1.2*O.value)),R=l({minTop:0,minLeft:0,maxTop:0,maxLeft:0}),S=a(20);function V(){var t;const a=d();S.value=a.statusBarHeight||0;const{top:l,left:o,right:n,bottom:i}=e.gap,s=(null==(t=a.safeAreaInsets)?void 0:t.bottom)??50;G.width=a.windowWidth,G.height=a.windowHeight-a.windowTop-0,R.minLeft=D.value+o,R.maxLeft=G.width-q.value-n,R.minTop=D.value+F.value+l,R.maxTop=G.height-q.value-F.value-i-s}function W(){const t=e.position,{minLeft:a,minTop:l,maxLeft:o,maxTop:n}=R;"left-top"===t?(z.top=l,z.left=a):"right-top"===t?(z.top=l,z.left=o):"left-bottom"===t?(z.top=n,z.left=a):"right-bottom"===t&&(z.top=n,z.left=o)}function E(t){(t=void 0===t?z.left:t)<G.width/2+D.value-O.value/2?A.value="left":A.value="right"}function J(){I.value=!I.value,I.value?(B.left<R.minLeft&&(z.left=R.minLeft),B.left>R.maxLeft&&(z.left=R.maxLeft),B.top<R.minTop&&(z.top=R.minTop),B.top>R.maxTop&&(z.top=R.maxTop)):N()}n((()=>{V(),W(),j(),$.value=!0})),i((()=>{$.value&&(V(),W(),j())}));const K=a(null);function N(t){(!I.value&&t||!t)&&(I.value=!1,z.left="left"===A.value?0:G.width,B.top<R.minTop&&(z.top=R.minTop-F.value),B.top>R.maxTop&&(z.top=R.maxTop+F.value),setTimeout((()=>{P.value=!1}),30))}function Q(t){K.value&&(clearTimeout(K.value),K.value=null)}function U(){z.top=B.top,z.left=B.left,P.value=!0,K.value=setTimeout(N,1500,!0)}const X=t=>{!function({top:t,left:e}){C(H,{top:t,left:e})}({top:t.detail.y,left:t.detail.x}),B.top=t.detail.y,B.left=t.detail.x,E(B.left)},Y=a({name:"工具",icon:"icon",onClick:()=>{N(),s({title:"工具",icon:"none"})}}),Z=Array.from({length:3},((t,e)=>({name:`工具${e+1}`,icon:`icon${e+1}`,onClick:()=>{N(),s({title:`工具${e+1}`,icon:"none"})}}))),tt=o((()=>[Y.value,...Z]));return(t,e)=>{const a=b,l=L,o=w,n=r;return $.value?(u(),p(n,{key:0,class:"movable-area",style:v({"--button-size":`${O.value}px`,"--shrink-width":`${q.value}px`,"--aside-expand-width":`${D.value}px`,"--window-top":`${S.value}px`,"pointer-events":I.value?"all":"none"}),onClick:J},{default:f((()=>[h(o,{ref_key:"MovableViewRef",ref:M,class:"movable-view ball-wrap",animation:P.value,x:z.left,y:z.top,direction:"all",onClick:T(J,["stop"]),onTouchstart:Q,onChange:X,onTouchend:U,onTouchcancel:U},{default:f((()=>[h(a,{style:{position:"relative"}},{default:f((()=>[h(a,{class:"ball-core"}),I.value?(u(),p(a,{key:0,class:"float-ball-items",style:v(`--deta-distance: ${F.value}px;`)},{default:f((()=>[(u(!0),x(y,null,g(tt.value,((t,e)=>(u(),p(a,{key:e,"data-index":e,class:"ball-item",style:v({"--item-theta":180/(tt.value.length-1||1)*e+"deg","--item-x":Math.cos(180/(tt.value.length-1||1)*e*Math.PI/180-Math.PI/2)*F.value*("right"===A.value?-1:1)+"px","--item-y":Math.sin(180/(tt.value.length-1||1)*e*Math.PI/180-Math.PI/2)*F.value*("right"===A.value?-1:1)+"px",left:"var(--item-x)",top:"var(--item-y)"}),onClick:T(t.onClick,["stop"])},{default:f((()=>[h(l,null,{default:f((()=>[_(k(t.icon),1)])),_:2},1024)])),_:2},1032,["data-index","style","onClick"])))),128))])),_:1},8,["style"])):c("",!0)])),_:1})])),_:1},8,["animation","x","y"])])),_:1},8,["style"])):c("",!0)}}}),[["__scopeId","data-v-a8be2225"]]);export{I as G,M as _,$ as n};
