import{d as g,w as x,f as n}from"./index-CBkNipma.js";const y=new Set(["txt","md","json","js","ts","jsx","tsx","html","css","scss","less","py","rs","go","java","c","cpp","h","hpp","cs","php","rb","swift","kt","scala","sh","bash","zsh","fish","ps1","bat","cmd","xml","yaml","yml","toml","ini","conf","cfg","log","sql","graphql","vue","svelte","dart","lua","r","pl","pm","dockerfile","gitignore","env","properties"]);function w(l){const i=l.lastIndexOf(".");return i>0?l.slice(i+1).toLowerCase():""}function b(l){return y.has(w(l))}function I(l){return l.split(`
`).map(t=>{let e=t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return e=e.replace(/("(?:[^"\\]|\\.)*")/g,'<span class="hl-string">$1</span>'),e=e.replace(/('(?:[^'\\]|\\.)*')/g,'<span class="hl-string">$1</span>'),e=e.replace(/(\/\/.*$)/gm,'<span class="hl-comment">$1</span>'),e=e.replace(/(\/\*[\s\S]*?\*\/)/g,'<span class="hl-comment">$1</span>'),e=e.replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="hl-number">$1</span>'),e}).join(`
`)}const S=g({name:"EverythingSearchPlugin",props:{context:{type:Object,required:!0}},setup(l){const i=n(""),t=n([]),e=n(-1),r=n(""),u=n(""),v=n(!1),c=n(!1);let d;async function o(){if(!i.value.trim()){t.value=[],e.value=-1;return}c.value=!0;try{const s=await l.context.invoke("search",{query:i.value}),a=JSON.parse(s);a.error?(r.value=a.error,t.value=[]):(r.value="",t.value=a.results||[]),e.value=t.value.length>0?0:-1}catch(s){r.value="搜索出错: "+s,t.value=[]}finally{c.value=!1}}function m(s){s.key==="ArrowDown"?(s.preventDefault(),t.value.length>0&&(e.value=Math.min(e.value+1,t.value.length-1),f())):s.key==="ArrowUp"?(s.preventDefault(),t.value.length>0&&(e.value=Math.max(e.value-1,0),f())):s.key==="Enter"&&(s.preventDefault(),e.value>=0&&p(e.value))}async function f(){const s=t.value[e.value];if(!s){v.value=!1;return}if(!b(s.subtitle)){v.value=!1;return}try{const a=await l.context.invoke("read_file",{path:a.subtitle}),h=JSON.parse(a);h.error?v.value=!1:(u.value=I(h.content),v.value=!0)}catch{v.value=!1}}async function p(s){const a=t.value[s];a&&(await l.context.openFile(a.subtitle),await l.context.hideWindow())}return x(()=>l.context.query,s=>{i.value=s,clearTimeout(d),d=setTimeout(o,80)}),{query:i,results:t,selectedIndex:e,status:r,previewContent:u,previewVisible:v,loading:c,search:o,onKeyDown:m,openResult:p}},template:`
    <div class="everything-search">
      <div class="ev-main">
        <div class="ev-results">
          <div v-if="results.length === 0" class="ev-empty">
            {{ loading ? '搜索中...' : '输入关键词搜索文件和文件夹' }}
          </div>
          <div
            v-for="(result, index) in results"
            :key="index"
            class="ev-item"
            :class="{ selected: index === selectedIndex }"
            @click="selectedIndex = index; openResult(index)"
          >
            <img v-if="result.icon" class="ev-icon-img" :src="result.icon" />
            <span v-else class="ev-icon">{{ result.is_folder ? '📁' : '📄' }}</span>
            <div class="ev-info">
              <div class="ev-title">{{ result.title }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="ev-sidebar">
        <div v-if="status" class="ev-status">{{ status }}</div>
        <div v-if="previewVisible" class="ev-preview" v-html="previewContent"></div>
        <div class="ev-file-info">
          <div v-if="results[selectedIndex]?.size">
            <div class="ev-info-label">大小</div>
            <div class="ev-info-value">{{ results[selectedIndex].size }}</div>
          </div>
          <div v-if="results[selectedIndex]">
            <div class="ev-info-label">类型</div>
            <div class="ev-info-value">{{ results[selectedIndex].is_folder ? '文件夹' : '文件' }}</div>
          </div>
        </div>
      </div>
      <div v-if="results[selectedIndex]" class="ev-path-bar">
        {{ results[selectedIndex].subtitle }}
      </div>
    </div>
  `});export{S as default};
