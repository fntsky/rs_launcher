import{d as u,f as n}from"./index-CBkNipma.js";const c=u({name:"HelloPlugin",props:{context:{type:Object,required:!0}},setup(r){const o=n(""),e=n(""),t=n(!1);async function s(){t.value=!0;try{const a=await r.context.invoke("greet",{name:o.value||"World"}),l=JSON.parse(a);e.value=l.message||l.error||"No response"}catch(a){e.value="Error: "+a}finally{t.value=!1}}return{name:o,message:e,loading:t,greet:s}},template:`
    <div class="hello-plugin">
      <h3>Hello Plugin</h3>
      <p>{{ message || 'Click the button to greet!' }}</p>
      <input v-model="name" type="text" placeholder="Enter name..." />
      <button @click="greet" :disabled="loading">Greet</button>
    </div>
  `});export{c as default};
