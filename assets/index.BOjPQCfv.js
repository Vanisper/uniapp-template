import{n as t,d as e,r as a,k as l,l as o,m as n,p as i,s,o as u,c as p,w as f,q as v,x as c,y as m,z as d,M as r,a as h,g as x,A as g,F as y,B as T,b,C as w,e as _,t as k,D as C,f as L}from"./index-DnLojIBr.js";const M=(t,e)=>{const a=t.__vccOpts||t;for(const[l,o]of e)a[l]=o;return a};function I(e){t({url:e})}const $=M(e({options:{addGlobalClass:!0,virtualHost:!0,styleIsolation:"shared"},__name:"index",props:{position:{type:String,default:"right-bottom"},gap:{type:Object,default:()=>({top:0,left:16,right:16,bottom:0})}},setup(t){const e=t,M=a(),I=a(!1),$=a(!1),P=a(!1),A=a("left"),j="main-ball-pos-cache";function z(){const t=m(j);t&&(G.top=t.top,G.left=t.left,H.top=t.top,H.left=t.left,W())}const G=l({top:0,left:0}),H=l({top:0,left:0}),O=l({width:0,height:0}),q=a(64),B=o((()=>3*q.value/4)),D=o((()=>q.value-B.value)),F=o((()=>1.2*q.value)),R=l({minTop:0,minLeft:0,maxTop:0,maxLeft:0});function S(){var t;const a=d(),{top:l,left:o,right:n,bottom:i}=e.gap,s=(null==(t=a.safeAreaInsets)?void 0:t.bottom)??50;O.width=a.windowWidth,O.height=a.windowHeight-a.windowTop-0,R.minLeft=D.value+o,R.maxLeft=O.width-B.value-n,R.minTop=D.value+F.value+l,R.maxTop=O.height-B.value-F.value-i-s}function V(){const t=e.position,{minLeft:a,minTop:l,maxLeft:o,maxTop:n}=R;"left-top"===t?(G.top=l,G.left=a):"right-top"===t?(G.top=l,G.left=o):"left-bottom"===t?(G.top=n,G.left=a):"right-bottom"===t&&(G.top=n,G.left=o)}function W(t){(t=void 0===t?G.left:t)<O.width/2+D.value-q.value/2?A.value="left":A.value="right"}function E(){$.value=!$.value,$.value?(H.left<R.minLeft&&(G.left=R.minLeft),H.left>R.maxLeft&&(G.left=R.maxLeft),H.top<R.minTop&&(G.top=R.minTop),H.top>R.maxTop&&(G.top=R.maxTop)):K()}n((()=>{S(),V(),z(),I.value=!0})),i((()=>{I.value&&(S(),V(),z())}));const J=a(null);function K(t){(!$.value&&t||!t)&&($.value=!1,G.left="left"===A.value?0:O.width,H.top<R.minTop&&(G.top=R.minTop-F.value),H.top>R.maxTop&&(G.top=R.maxTop+F.value),setTimeout((()=>{P.value=!1}),30))}function N(t){J.value&&(clearTimeout(J.value),J.value=null)}function Q(){G.top=H.top,G.left=H.left,P.value=!0,J.value=setTimeout(K,1500,!0)}const U=t=>{!function({top:t,left:e}){C(j,{top:t,left:e})}({top:t.detail.y,left:t.detail.x}),H.top=t.detail.y,H.left=t.detail.x,W(H.left)},X=a({name:"工具",icon:"icon",onClick:()=>{K(),s({title:"工具",icon:"none"})}}),Y=Array.from({length:3},((t,e)=>({name:`工具${e+1}`,icon:`icon${e+1}`,onClick:()=>{K(),s({title:`工具${e+1}`,icon:"none"})}}))),Z=o((()=>[X.value,...Y]));return(t,e)=>{const a=b,l=L,o=w,n=r;return I.value?(u(),p(n,{key:0,class:"movable-area",style:v({"--button-size":`${q.value}px`,"--shrink-width":`${B.value}px`,"--aside-expand-width":`${D.value}px`,"pointer-events":$.value?"all":"none"}),onClick:E},{default:f((()=>[h(o,{ref_key:"MovableViewRef",ref:M,class:"movable-view ball-wrap",animation:P.value,x:G.left,y:G.top,direction:"all",onClick:T(E,["stop"]),onTouchstart:N,onChange:U,onTouchend:Q,onTouchcancel:Q},{default:f((()=>[h(a,{style:{position:"relative"}},{default:f((()=>[h(a,{class:"ball-core"}),$.value?(u(),p(a,{key:0,class:"float-ball-items",style:v(`--deta-distance: ${F.value}px;`)},{default:f((()=>[(u(!0),x(y,null,g(Z.value,((t,e)=>(u(),p(a,{key:e,"data-index":e,class:"ball-item",style:v({"--item-theta":180/(Z.value.length-1||1)*e+"deg","--item-x":Math.cos(180/(Z.value.length-1||1)*e*Math.PI/180-Math.PI/2)*F.value*("right"===A.value?-1:1)+"px","--item-y":Math.sin(180/(Z.value.length-1||1)*e*Math.PI/180-Math.PI/2)*F.value*("right"===A.value?-1:1)+"px",left:"var(--item-x)",top:"var(--item-y)"}),onClick:T(t.onClick,["stop"])},{default:f((()=>[h(l,null,{default:f((()=>[_(k(t.icon),1)])),_:2},1024)])),_:2},1032,["data-index","style","onClick"])))),128))])),_:1},8,["style"])):c("",!0)])),_:1})])),_:1},8,["animation","x","y"])])),_:1},8,["style"])):c("",!0)}}}),[["__scopeId","data-v-e8895031"]]);export{$ as G,M as _,I as n};