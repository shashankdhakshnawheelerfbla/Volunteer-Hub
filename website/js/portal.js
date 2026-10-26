
(() => {
  const STORE_EVENTS='vh_events_v1', STORE_SIGNUPS='vh_signups_v1', STORE_PROFILE='vh_profile_v1';
  const seedEvents=[
    {id:'garden',title:'Community Garden Workday',category:'Environment',date:'2026-11-07',time:'9:00 AM – 12:00 PM',location:'Oak Street Community Garden',spots:8,icon:'🌿',tone:'',details:'Help prepare garden beds, plant seedlings, and tidy up shared green space.'},
    {id:'food',title:'Neighborhood Food Pantry',category:'Food',date:'2026-11-10',time:'10:00 AM – 1:00 PM',location:'Community Food Center',spots:12,icon:'🥕',tone:'orange-bg',details:'Sort donations and pack grocery boxes for local families.'},
    {id:'tutor',title:'After-School Reading Buddies',category:'Education',date:'2026-11-12',time:'3:30 PM – 5:00 PM',location:'Maplewood Learning Center',spots:5,icon:'📚',tone:'blue-bg',details:'Read with students and help build confidence with books.'},
    {id:'cleanup',title:'Park Clean-Up Morning',category:'Environment',date:'2026-11-14',time:'8:30 AM – 11:00 AM',location:'Riverside Park',spots:16,icon:'🌎',tone:'',details:'Help keep local trails and green spaces clean and welcoming.'},
    {id:'animals',title:'Shelter Pet Care',category:'Animals',date:'2026-11-15',time:'11:00 AM – 1:00 PM',location:'Paws & Friends Shelter',spots:6,icon:'🐾',tone:'pink-bg',details:'Help prepare enrichment activities and spend time with shelter pets.'},
    {id:'community',title:'Community Welcome Table',category:'Community',date:'2026-11-18',time:'4:00 PM – 6:00 PM',location:'Town Hall Plaza',spots:10,icon:'🏡',tone:'yellow-bg',details:'Welcome neighbors, share local resources, and help visitors find support.'}
  ];
  const read=(key,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(fallback)?(Array.isArray(v)?v:fallback):(v&&typeof v==='object'?v:fallback)}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const allEvents=()=>[...seedEvents.filter(e=>!read(STORE_EVENTS,[]).some(x=>x.id===e.id)),...read(STORE_EVENTS,[])];
  const dateText=(date)=>{if(!date)return 'Date to be confirmed';const d=new Date(date+'T12:00:00');return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})};
  const card=(e)=>`<article class="event-card"><div class="event-cover ${e.tone||''}"><span>${e.icon||'♡'}</span><span class="pill">${e.category||'Community'}</span></div><div class="event-card-body"><h3>${esc(e.title)}</h3><p>${esc(e.details||'Join your community and make a difference.')}</p><div class="event-meta"><span>📅 ${dateText(e.date)} · ${esc(e.time||'Time to be confirmed')}</span><span>📍 ${esc(e.location||'Location to be confirmed')}</span><span>🙌 ${Number(e.spots)||0} spots available</span></div><div class="event-footer"><span class="spots">Open to everyone</span><a href="event-details.html?id=${encodeURIComponent(e.id)}">View event →</a></div></div></article>`;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function renderEvents(targetId,featured=false){
    const target=document.getElementById(targetId);if(!target)return;
    let list=allEvents();
    if(featured)list=list.slice(0,3);
    else{
      const q=(document.getElementById('event-search')?.value||'').toLowerCase();
      const category=document.getElementById('category-filter')?.value||'';
      const timing=document.getElementById('date-filter')?.value||'';
      list=list.filter(e=>(!q||[e.title,e.category,e.location,e.details].join(' ').toLowerCase().includes(q))&&(!category||e.category===category)&&(!timing||((new Date((e.date||'2026-01-01')+'T12:00:00').getDay()===0||new Date((e.date||'2026-01-01')+'T12:00:00').getDay()===6)===(timing==='weekend'))));
    }
    target.innerHTML=list.length?list.map(card).join(''):'';
    const empty=document.getElementById('empty-state');if(empty)empty.hidden=!!list.length;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    renderEvents('featured-events',true);renderEvents('all-events');
    ['event-search','category-filter','date-filter'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>renderEvents('all-events')));
    const params=new URLSearchParams(location.search),eventId=params.get('id');
    if(eventId){
      const event=allEvents().find(e=>e.id===eventId);
      if(event&&document.querySelector('.detail-layout')){
        const title=document.querySelector('.detail-layout h1');if(title)title.textContent=event.title;
        const pill=document.querySelector('.detail-layout .pill');if(pill)pill.textContent=event.category;
        const lead=document.querySelector('.detail-layout .lead');if(lead)lead.textContent=event.details||'Join your community and make a difference.';
        const facts=document.querySelectorAll('.detail-facts b');if(facts[0])facts[0].textContent=dateText(event.date);if(facts[1])facts[1].textContent=event.location||'Location to be confirmed';if(facts[2])facts[2].textContent=(Number(event.spots)||0)+' spots available';
      }
    }
    document.getElementById('signup-event')?.addEventListener('click',()=>{
      const name=document.getElementById('volunteer-name').value.trim(),email=document.getElementById('volunteer-email').value.trim();
      const msg=document.getElementById('signup-message');if(!name||!email){msg.textContent='Please enter your name and a valid email to continue.';return}
      const id=eventId||'garden',event=allEvents().find(e=>e.id===id)||seedEvents[0],signups=read(STORE_SIGNUPS,[]);
      if(signups.some(s=>s.eventId===id&&s.email.toLowerCase()===email.toLowerCase())){msg.textContent='This email is already signed up for this event.';return}
      signups.push({eventId:id,title:event.title,date:event.date,time:document.getElementById('volunteer-shift')?.value||event.time,location:event.location,name,email});write(STORE_SIGNUPS,signups);msg.textContent='You’re signed up! Your commitment is saved in this browser.';const spots=document.getElementById('detail-spots');if(spots)spots.textContent=Math.max(0,(Number(event.spots)||1)-1);
    });
    const signupsTarget=document.getElementById('my-signups-list');
    if(signupsTarget){const list=read(STORE_SIGNUPS,[]);signupsTarget.innerHTML=list.length?list.map((s,i)=>`<article class="signup-row"><span class="row-icon">♡</span><div><h3>${esc(s.title)}</h3><p>📅 ${dateText(s.date)} · ${esc(s.time||'Time not set')}<br>📍 ${esc(s.location||'Location not set')}</p></div><button data-cancel="${i}">Cancel sign-up</button></article>`).join(''):'<div class="form-card"><h2>No sign-ups yet</h2><p class="muted">When you sign up for an event, it will appear here.</p><a class="btn btn-primary" href="opportunities.html">Find an opportunity →</a></div>';
      signupsTarget.addEventListener('click',e=>{const b=e.target.closest('[data-cancel]');if(!b)return;const ix=Number(b.dataset.cancel),items=read(STORE_SIGNUPS,[]);items.splice(ix,1);write(STORE_SIGNUPS,items);location.reload()});
    }
    const metric=document.getElementById('metric-signups');if(metric)metric.textContent=read(STORE_SIGNUPS,[]).length;
    const created=document.getElementById('metric-created');if(created)created.textContent=read(STORE_EVENTS,[]).length;
    document.getElementById('create-event-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),event={id:'custom-'+Date.now(),title:f.get('title'),category:f.get('category'),location:f.get('location'),date:f.get('date'),time:f.get('time'),spots:Number(f.get('spots'))||10,icon:'♡',tone:'',details:f.get('details')};const list=read(STORE_EVENTS,[]);list.push(event);write(STORE_EVENTS,list);document.getElementById('create-message').textContent='Event saved in this browser. You can find it on the Events page.';e.currentTarget.reset();});
    const profile=read(STORE_PROFILE,{});for(const [id,key] of [['profile-name','name'],['profile-email','email'],['profile-cause','cause']]){const el=document.getElementById(id);if(el&&profile[key])el.value=profile[key]}
    document.getElementById('profile-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);write(STORE_PROFILE,{name:f.get('name'),email:f.get('email'),cause:f.get('cause')});document.getElementById('profile-message').textContent='Profile saved in this browser.'});
    document.getElementById('register-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const users=read('vh_demo_users',[]);if(users.some(u=>u.email.toLowerCase()===String(f.get('email')).toLowerCase())){document.getElementById('auth-message').textContent='An account with this email already exists in this browser.';return}users.push({name:f.get('name'),email:f.get('email'),password:f.get('password')});write('vh_demo_users',users);write(STORE_PROFILE,{name:f.get('name'),email:f.get('email')});document.getElementById('auth-message').textContent='Demo account created in this browser. This is not a secure production login.';});
    document.getElementById('login-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),users=read('vh_demo_users',[]),u=users.find(x=>x.email.toLowerCase()===String(f.get('email')).toLowerCase()&&x.password===f.get('password'));document.getElementById('auth-message').textContent=u?'Logged in for this browser demo.':'No matching demo account found. Create an account first.';});
    document.getElementById('contact-form')?.addEventListener('submit',e=>{e.preventDefault();document.getElementById('contact-message').textContent='Thanks for your message. This front-end demo does not send messages to a server.';e.currentTarget.reset()});
    document.getElementById('settings-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);write('vh_settings',{reminders:f.has('reminders'),updates:f.has('updates')});document.getElementById('settings-message').textContent='Preferences saved in this browser.'});
  });
})();
