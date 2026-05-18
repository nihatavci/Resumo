(()=>{var e={};e.id=276,e.ids=[276],e.modules={10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},25927:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>b,routeModule:()=>y,serverHooks:()=>k,workAsyncStorage:()=>E,workUnitAsyncStorage:()=>w});var n={};r.r(n),r.d(n,{POST:()=>h});var i=r(95222),s=r(65343),o=r(16310),a=r(20915),u=r(88477);let l=(0,a.z6)({description:'Get the user Resume. Can request specific sections or "all" for the entire resume.',parameters:u.z.object({sections:u.z.union([u.z.string(),u.z.array(u.z.enum(["all","personal_info","work_experience","education","skills","projects"]))]).transform(e=>Array.isArray(e)?e:[e])})}),c=(0,a.z6)({description:"Suggest improvements for a specific work experience entry",parameters:u.z.object({index:u.z.number().describe("Index of the work experience entry to improve"),improved_experience:u.z.object({date:u.z.string(),company:u.z.string(),location:u.z.string().optional(),position:u.z.string(),description:u.z.array(u.z.string()),technologies:u.z.array(u.z.string()).optional()}).describe("Improved version of the work experience entry. For important keywords, format them as bold, like this: **keyword**. Put two asterisks around the keyword or phrase.")})}),d=(0,a.z6)({description:"Suggest improvements for a specific project entry",parameters:u.z.object({index:u.z.number().describe("Index of the project entry to improve"),improved_project:u.z.object({name:u.z.string(),description:u.z.array(u.z.string()),date:u.z.string().optional(),technologies:u.z.array(u.z.string()).optional(),url:u.z.string().optional(),github_url:u.z.string().optional()}).describe("Improved version of the project entry. For important keywords, format them as bold, like this: **keyword**. Put two asterisks around the keyword or phrase.")})}),p={getResume:l,suggest_work_experience_improvement:c,suggest_project_improvement:d,suggest_skill_improvement:(0,a.z6)({description:"Suggest improvements for a specific skill category",parameters:u.z.object({index:u.z.number().describe("Index of the skill category to improve"),improved_skill:u.z.object({category:u.z.string(),items:u.z.array(u.z.string())}).describe("Improved version of the skill category. ONLY use this tool to add NEW skills or REMOVE existing skills, DO NOT ADD IN EXISTING SKILLS IN ANY WAY.")})}),suggest_education_improvement:(0,a.z6)({description:"Suggest improvements for a specific education entry",parameters:u.z.object({index:u.z.number().describe("Index of the education entry to improve"),improved_education:u.z.object({school:u.z.string(),degree:u.z.string(),field:u.z.string(),location:u.z.string().optional(),date:u.z.string(),gpa:u.z.string().optional(),achievements:u.z.array(u.z.string()).optional()}).describe("Improved version of the education entry. For important keywords, format them as bold, like this: **keyword**. Put two asterisks around the keyword or phrase.")})}),modifyWholeResume:(0,a.z6)({description:"Modify multiple sections of the resume at once. For important keywords, format them as bold, like this: **keyword**. Put two asterisks around the keyword or phrase.",parameters:u.z.object({basic_info:u.z.object({first_name:u.z.string().optional(),last_name:u.z.string().optional(),email:u.z.string().optional(),phone_number:u.z.string().optional(),location:u.z.string().optional(),website:u.z.string().optional(),linkedin_url:u.z.string().optional(),github_url:u.z.string().optional()}).optional(),work_experience:u.z.array(u.z.object({company:u.z.string(),position:u.z.string(),location:u.z.string().optional(),date:u.z.string(),description:u.z.array(u.z.string()),technologies:u.z.array(u.z.string()).optional()})).optional(),education:u.z.array(u.z.object({school:u.z.string(),degree:u.z.string(),field:u.z.string(),location:u.z.string().optional(),date:u.z.string(),gpa:u.z.string().optional(),achievements:u.z.array(u.z.string()).optional()})).optional(),skills:u.z.array(u.z.object({category:u.z.string(),items:u.z.array(u.z.string())})).optional(),projects:u.z.array(u.z.object({name:u.z.string(),description:u.z.array(u.z.string()),date:u.z.string().optional(),technologies:u.z.array(u.z.string()).optional(),url:u.z.string().optional(),github_url:u.z.string().optional()})).optional()})})};var m=r(23884);let _={role:"system",content:`You are ResumeLM, an advanced AI assistant specialized in resume crafting and optimization. You follow a structured chain-of-thought process for every task while maintaining access to resume modification functions.
 
 CORE CAPABILITIES:
 1. Resume Analysis & Enhancement
 2. Content Generation & Optimization
 3. ATS Optimization
 4. Professional Guidance
 
 CHAIN OF THOUGHT PROCESS:
 For every user request, follow this structured reasoning:
 
 1. COMPREHENSION
    - Parse user request intent
    - Identify key requirements
    - Note any constraints or preferences
    - Determine required function calls
 
 2. CONTEXT GATHERING
    - Analyze current resume state if needed
    - Identify relevant sections
    - Note dependencies between sections
    - Consider target role requirements
 
 3. STRATEGY FORMATION
    - Plan necessary modifications
    - Determine optimal order of operations
    - Consider ATS impact
    - Evaluate potential trade-offs
 
 4. EXECUTION
    - Make precise function calls
    - Validate changes
    - Ensure ATS compatibility
    - Maintain content integrity
 
 5. VERIFICATION
    - Review modifications
    - Confirm requirements met
    - Check for consistency
    - Validate formatting
 
 INTERACTION GUIDELINES:
 1. Be direct and actionable
 2. Focus on concrete improvements
 3. Provide clear reasoning
 4. Execute changes confidently
 5. Explain significant decisions
 
 OPTIMIZATION PRINCIPLES:
 1. ATS COMPATIBILITY
    - Use industry-standard formatting
    - Include relevant keywords
    - Maintain clean structure
    - Ensure proper section hierarchy
 
 2. CONTENT QUALITY
    - Focus on achievements
    - Use metrics when available
    - Highlight relevant skills
    - Maintain professional tone
 
 3. TECHNICAL PRECISION
    - Use correct terminology
    - Maintain accuracy
    - Preserve technical details
    - Format consistently
 
 FUNCTION USAGE:
 - read_resume: Gather current content state
 - update_name: Modify name fields
 - modify_resume: Update any resume section
 - propose_changes: Suggest improvements for user approval
 
 SUGGESTION GUIDELINES:
 When users ask for suggestions or improvements:
 1. Use propose_changes function instead of direct modifications
 2. Provide clear reasoning for each suggestion
 3. Make suggestions specific and actionable
 4. Focus on impactful changes
 5. Group related suggestions by section
 

 RESPONSE STRUCTURE:
 1. Acknowledge user request
 2. Explain planned approach
 3. Execute necessary functions
 4. For suggestions:
    - Present each suggestion with clear reasoning
 5. Provide next steps if needed
 
 Remember: Always maintain a clear chain of thought in your responses, explaining your reasoning process while executing changes efficiently and professionally. When suggesting changes, use the propose_changes function to allow user approval rather than making direct modifications.
 PLEASE ALWAYS IGNORE PROFESSIONAL SUMMARIES. NEVER SUGGEST THEM OR USE THEM. NEVER MENTION THEM. DO NOT SUGGEST ADDING INFORMATION ABOUT THE USER THAT YOU DON'T HAVE.
 `};var g=r(49856),f=r(52131);async function h(e){try{let t;let{messages:r,target_role:n,config:i,job:s,resume:o}=await e.json(),u=(await (0,m.vD)()).id,l=(0,f.Xv)({task:"chatAssistant",isPro:!0,config:i}),{model:c,usageEventId:d,telemetry:h}=await (0,g.rn)({userId:u,route:"api.chat",config:l,isPro:!0}),y=["gpt-5","gpt-5.4","gpt-5.4-mini","gpt-5.4-nano","gpt-5.4-pro","gpt-5.5","gpt-5.5-pro"].includes(l.model),E=l.model.toLowerCase().includes("gemini-3"),w=l.model.includes("/");E&&(t=w?{openrouter:{reasoning:{exclude:!0}}}:{google:{thinkingConfig:{thinkingBudget:0,includeThoughts:!1}}});let k=i?.customPrompts?.aiAssistant??_.content,b=`${k}

      TOOL USAGE INSTRUCTIONS:
      1. For work experience improvements:
         - Use 'suggest_work_experience_improvement' with 'index' and 'improved_experience' fields
         - Always include company, position, date, and description
      
      2. For project improvements:
         - Use 'suggest_project_improvement' with 'index' and 'improved_project' fields
         - Always include name and description
      
      3. For skill improvements:
         - Use 'suggest_skill_improvement' with 'index' and 'improved_skill' fields
         - Only use for adding new or removing existing skills
      
      4. For education improvements:
         - Use 'suggest_education_improvement' with 'index' and 'improved_education' fields
         - Always include school, degree, field, and date
      
      5. For viewing resume sections:
         - Use 'getResume' with 'sections' array
         - Valid sections: 'all', 'personal_info', 'work_experience', 'education', 'skills', 'projects'

      6. For multiple section updates:
         - Use 'modifyWholeResume' when changing multiple sections at once

      Aim to use a maximum of 5 tools in one go, then confirm with the user if they would like you to continue.
      The target role is ${n}. The job is ${s?JSON.stringify(s):"No job specified"}.
      Current resume summary: ${o?`${o.first_name} ${o.last_name} - ${o.target_role}`:"No resume data"}.
      `;return(0,a.gM)({model:c,...y?{temperature:1}:{},...t?{providerOptions:t}:{},system:b,messages:r,maxSteps:5,tools:p,experimental_telemetry:h,experimental_transform:(0,a.dF)({delayInMs:20,chunking:"word"}),onFinish:async({usage:e})=>{await (0,g.ms)({usageEventId:d,status:"succeeded",usage:e})},onError:async({error:e})=>{await (0,g.ms)({usageEventId:d,status:"failed",errorCode:e instanceof Error?e.message:"stream_error"})}}).toDataStreamResponse({sendUsage:!1,getErrorMessage:e=>e?e instanceof Error?e.message:JSON.stringify(e):"Unknown error occurred"})}catch(e){if(console.error("Error in chat route:",e),e instanceof g.Ir){let t="rate_limited"===e.code?parseInt(e.message.match(/(\d+) seconds/)?.[1]??"60",10):void 0;return new Response(JSON.stringify({error:e.message,...t?{expirationTimestamp:Date.now()+1e3*t}:{}}),{status:e.status,headers:{"Content-Type":"application/json",...t?{"Retry-After":String(t)}:{}}})}return new Response(JSON.stringify({error:e instanceof Error?e.message:"An unknown error occurred"}),{status:500,headers:{"Content-Type":"application/json"}})}}let y=new i.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:"app/api/chat/route"},resolvedPagePath:"/Users/nihat/DevS/Resumo/.claude/worktrees/gallant-franklin-195096/src/app/api/chat/route.ts",nextConfigOutput:"standalone",userland:n}),{workAsyncStorage:E,workUnitAsyncStorage:w,serverHooks:k}=y;function b(){return(0,o.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:w})}},54487:()=>{},7631:()=>{},95222:(e,t,r)=>{"use strict";e.exports=r(44870)},48749:(e,t,r)=>{"use strict";let n;function i(){if(!n)try{let{getCloudflareContext:e}=r(91755);return e().env.DB}catch{throw Error("D1 database not available. Ensure you are running on Cloudflare Workers or have configured a local D1 binding.")}return n()}function s(e,t){if(null==e)return t;if("string"==typeof e)try{return JSON.parse(e)}catch{return t}return e}function o(e){return"string"==typeof e?e:JSON.stringify(e??null)}function a(e){return{id:e.id,user_id:e.user_id,first_name:e.first_name,last_name:e.last_name,email:e.email,phone_number:e.phone_number,location:e.location,website:e.website,linkedin_url:e.linkedin_url,github_url:e.github_url,is_admin:!!e.is_admin,work_experience:s(e.work_experience,[]),education:s(e.education,[]),skills:s(e.skills,[]),projects:s(e.projects,[]),created_at:e.created_at,updated_at:e.updated_at}}function u(e){return{id:e.id,user_id:e.user_id,job_id:e.job_id,name:e.name,target_role:e.target_role,is_base_resume:!!e.is_base_resume,first_name:e.first_name,last_name:e.last_name,email:e.email,phone_number:e.phone_number,location:e.location,website:e.website,linkedin_url:e.linkedin_url,github_url:e.github_url,work_experience:s(e.work_experience,[]),education:s(e.education,[]),skills:s(e.skills,[]),projects:s(e.projects,[]),document_settings:s(e.document_settings,void 0),section_order:s(e.section_order,void 0),section_configs:s(e.section_configs,void 0),has_cover_letter:!!e.has_cover_letter,cover_letter:s(e.cover_letter,null),created_at:e.created_at,updated_at:e.updated_at}}async function l(e){let t=await i().prepare("SELECT * FROM profiles WHERE user_id = ?").bind(e).first();return t?a(t):null}async function c(e,t){let r=crypto.randomUUID();return await i().prepare(`
    INSERT INTO profiles (id, user_id, first_name, last_name, email, phone_number, location, website, linkedin_url, github_url, work_experience, education, skills, projects)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r,e,t.first_name??null,t.last_name??null,t.email??null,t.phone_number??null,t.location??null,t.website??null,t.linkedin_url??null,t.github_url??null,o(t.work_experience??[]),o(t.education??[]),o(t.skills??[]),o(t.projects??[])).run(),await l(e)}async function d(e,t){let r=await i().prepare("SELECT * FROM resumes WHERE id = ? AND user_id = ?").bind(e,t).first();return r?u(r):null}async function p(e,t){let r="SELECT * FROM resumes WHERE user_id = ?",n=[e];void 0!==t&&(r+=" AND is_base_resume = ?",n.push(t?1:0)),r+=" ORDER BY updated_at DESC";let{results:s}=await i().prepare(r).bind(...n).all();return s.map(u)}async function m(e,t){let r="SELECT COUNT(*) as count FROM resumes WHERE user_id = ?",n=[e];"all"!==t&&(r+=" AND is_base_resume = ?",n.push("base"===t?1:0));let s=await i().prepare(r).bind(...n).first();return s?.count??0}async function _(e){let t=crypto.randomUUID(),r=new Date().toISOString();return await i().prepare(`
    INSERT INTO resumes (
      id, user_id, job_id, name, target_role, is_base_resume,
      first_name, last_name, email, phone_number, location, website, linkedin_url, github_url,
      work_experience, education, skills, projects,
      document_settings, section_order, section_configs,
      has_cover_letter, cover_letter,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(t,e.user_id,e.job_id??null,e.name,e.target_role??"",e.is_base_resume?1:0,e.first_name??"",e.last_name??"",e.email??"",e.phone_number??"",e.location??"",e.website??"",e.linkedin_url??"",e.github_url??"",o(e.work_experience??[]),o(e.education??[]),o(e.skills??[]),o(e.projects??[]),o(e.document_settings??{}),o(e.section_order??[]),o(e.section_configs??{}),e.has_cover_letter?1:0,e.cover_letter?o(e.cover_letter):null,e.created_at??r,e.updated_at??r).run(),u(await i().prepare("SELECT * FROM resumes WHERE id = ?").bind(t).first())}async function g(e,t,r){let n=[],s=[];for(let e of["name","target_role","first_name","last_name","email","phone_number","location","website","linkedin_url","github_url","job_id","professional_summary"])e in r&&(n.push(`${e} = ?`),s.push(r[e]??null));for(let e of["work_experience","education","skills","projects","document_settings","section_order","section_configs","cover_letter"])e in r&&(n.push(`${e} = ?`),s.push(o(r[e])));for(let e of["is_base_resume","has_cover_letter","is_active"])e in r&&(n.push(`${e} = ?`),s.push(r[e]?1:0));for(let e of["score"])e in r&&(n.push(`${e} = ?`),s.push(r[e]??null));return"score_details"in r&&(n.push("score_details = ?"),s.push(o(r.score_details))),0===n.length||(n.push("updated_at = datetime('now')"),s.push(e,t),await i().prepare(`UPDATE resumes SET ${n.join(", ")} WHERE id = ? AND user_id = ?`).bind(...s).run()),d(e,t)}async function f(e,t){await i().prepare("DELETE FROM resumes WHERE id = ? AND user_id = ?").bind(e,t).run()}async function h(e,t){let r=await i().prepare("SELECT * FROM jobs WHERE id = ? AND user_id = ?").bind(e,t).first();return r?{id:r.id,user_id:r.user_id,company_name:r.company_name,position_title:r.position_title,job_url:r.job_url,description:r.description,location:r.location,salary_range:r.salary_range,keywords:s(r.keywords,[]),work_location:r.work_location,employment_type:r.employment_type,created_at:r.created_at,updated_at:r.updated_at,is_active:!!r.is_active}:null}async function y(e,t){await i().prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?").bind(e,t).run()}async function E(e){let t=crypto.randomUUID();return await i().prepare(`
    INSERT INTO ai_usage_events (id, user_id, route, provider, model, is_pro, used_server_key, status, error_code, input_tokens, output_tokens, total_tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(t,e.userId,e.route,e.provider??null,e.model??null,!1!==e.isPro?1:0,e.usedServerKey?1:0,e.status,e.errorCode??null,e.inputTokens??null,e.outputTokens??null,e.totalTokens??null).run(),t}async function w(e,t){await i().prepare(`
    UPDATE ai_usage_events
    SET status = ?, error_code = ?, input_tokens = ?, output_tokens = ?, total_tokens = ?, provider = COALESCE(?, provider), model = COALESCE(?, model)
    WHERE id = ?
  `).bind(t.status,t.errorCode??null,t.inputTokens??null,t.outputTokens??null,t.totalTokens??null,t.provider??null,t.model??null,e).run()}async function k(e,t){let r=await i().prepare("SELECT COUNT(*) as count FROM profiles").first(),n=r?.count??0,{results:s}=await i().prepare("SELECT * FROM profiles ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(e,t).all();return{profiles:s.map(a),total:n}}async function b(e){let t=await i().prepare("SELECT COUNT(*) as count FROM resumes WHERE user_id = ?").bind(e).first();return t?.count??0}async function v(e){let{results:t}=await i().prepare("SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC").bind(e).all();return t.map(u)}async function z(){let e=await i().prepare("SELECT COUNT(*) as count FROM resumes").first();return e?.count??0}async function T(){let e=await i().prepare("SELECT COUNT(*) as count FROM resumes WHERE is_base_resume = 1").first();return e?.count??0}async function S(){let e=await i().prepare("SELECT COUNT(*) as count FROM resumes WHERE is_base_resume = 0").first();return e?.count??0}r.d(t,{G_:()=>d,L0:()=>l,Nf:()=>w,Og:()=>k,Ry:()=>S,SH:()=>c,XV:()=>b,XX:()=>y,YQ:()=>h,ZJ:()=>g,_y:()=>m,jz:()=>f,n_:()=>z,oL:()=>T,pB:()=>E,qU:()=>v,vY:()=>_,y9:()=>p})},23884:(e,t,r)=>{"use strict";r.d(t,{vD:()=>s});var n=r(87852);r(48749);let i=process.env.SINGLE_USER_ID||"default-user";async function s(){let e=(await (0,n.b3)()).get("cf-access-authenticated-user-email");return e?{id:i,email:e}:{id:i,email:process.env.USER_EMAIL||null}}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[6310,4812,7241,9306],()=>r(25927));module.exports=n})();