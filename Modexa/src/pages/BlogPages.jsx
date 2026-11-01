import {useEffect,useMemo,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {ArrowRight,Clock3,BookOpen,ChevronRight,AlertCircle,Search,Gamepad2} from 'lucide-react'
import {supabase,supabaseConfigured} from '../lib/supabase'
import SEO from '../components/SEO'
import SafeImg from '../components/SafeImg'
import ShareButton from '../components/ShareButton'
import ContentHtml from '../components/ContentHtml'
import PageBlocks from '../components/PageBlocks'
import {contentHeadings,headingSlug} from '../lib/contentHtml'
import {postHref} from '../lib/useSearchItems'
import {useModsState} from '../lib/useMods'
import AdBlock from '../components/AdBlock'
import {CardSkeletons,PageSkeleton} from '../components/Skeleton'
import {readingTime} from '../lib/format'
import {usePostsState} from '../lib/usePosts'
import {useAdUnits} from '../lib/useAds'
import SeoContent from '../components/SeoContent'
import FaqSection from '../components/FaqSection'
import {LISTING} from '../content/seo'
import {usePageContent} from '../lib/siteContent'

function Intro({title,description,eyebrow}){return <section className="page-hero"><div className="container"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></section>}
const NAMES={blog:'Blog',guide:'Guide'}

export function BlogIndex({type='blog'}){
  const L=usePageContent('listing:'+type,LISTING[type])
  const {items:all,loading}=usePostsState()
  const posts=all.filter(p=>(p.post_type==='guide'?'guide':'blog')===type)
  const [q,setQ]=useState(''),[cat,setCat]=useState('All')
  const cats=useMemo(()=>['All',...new Set(posts.map(p=>p.category).filter(Boolean))],[posts])
  const shown=posts.filter(p=>(cat==='All'||p.category===cat)&&(!q.trim()||[p.title,p.excerpt,p.category].join(' ').toLowerCase().includes(q.toLowerCase())))
  return <><SEO fullTitle={L.seoTitle} description={L.description} pageType="CollectionPage" breadcrumbs={[{label:'Home',to:'/'},{label:NAMES[type],to:'/'+type}]}/>
  <Intro eyebrow={NAMES[type].toUpperCase()} title={L.h1||NAMES[type]} description={L.description}/>
  <section className="section-block"><div className="container">
    <div className="blog-toolbar"><div className="directory-search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${NAMES[type].toLowerCase()}…`} aria-label="Search"/></div>{cats.length>2&&<div className="chip-row" role="tablist">{cats.map(c=><button key={c} role="tab" aria-selected={cat===c} className={`chip ${cat===c?'active':''}`} onClick={()=>setCat(c)}>{c}</button>)}</div>}</div>
    {loading?<CardSkeletons/>:shown.length===0?<div className="empty-state"><h3>Nothing here yet</h3><p>Check back soon.</p></div>:<div className="blog-list-grid">{shown.map(p=><article className="blog-list-card" key={p.id}><Link to={postHref(p)} className="blog-list-image"><SafeImg src={p.cover_image} loading="lazy"/></Link><div className="blog-list-content"><div className="blog-list-meta"><span>{p.category||NAMES[type]}</span><span><Clock3 size={13}/>{readingTime(p.content)} min read</span></div><Link to={postHref(p)}><h2>{p.title}</h2></Link><p>{p.excerpt||p.seo_description}</p><Link className="text-link" to={postHref(p)}>Read more <ArrowRight size={15}/></Link></div></article>)}</div>}
  </div></section><SeoContent data={L}/></>
}

export function BlogDetail({type='blog'}){
  const {slug}=useParams(),{items:posts,loading}=usePostsState(),{items:mods}=useModsState(),post=posts.find(p=>p.slug===slug)
  const ctx={postSlug:slug,gameSlug:post?.game_slug||''}
  const topU=useAdUnits('blog_top',ctx),botU=useAdUnits('blog_bottom',ctx),inU=useAdUnits('blog_in_content',ctx),allU=useAdUnits('',ctx,{ignoreScope:true})
  if(loading)return <PageSkeleton/>
  if(!post)return <div className="container not-found-page"><BookOpen size={30}/><h1>Article not found</h1><p>This article may have moved or no longer exists.</p><Link className="button button-primary" to={'/'+type}>Back to {NAMES[type].toLowerCase()}</Link></div>
  const realType=post.post_type==='guide'?'guide':'blog'
  const adsOn=post.ads_enabled!==false
  const game=mods.find(m=>m.type==='game'&&m.slug===post.game_slug)
  const headings=contentHeadings(post.content)
  const faqs=Array.isArray(post.faqs)?post.faqs.filter(f=>f&&f.q&&f.a):[]
  const sameGame=post.game_slug?posts.filter(p=>p.id!==post.id&&p.game_slug===post.game_slug):[]
  const related=(sameGame.length?sameGame:posts.filter(p=>p.id!==post.id&&(p.post_type==='guide'?'guide':'blog')===realType)).slice(0,3)
  const crumbs=[{label:'Home',to:'/'},{label:NAMES[realType],to:'/'+realType},...(game?[{label:game.title,to:game.href}]:[]),{label:post.title}]
  const jsonLd=[{'@type':'Article',headline:post.title,description:post.excerpt||post.seo_description,image:post.cover_image||undefined,datePublished:post.published_at||undefined,dateModified:post.updated_at||post.published_at||undefined,author:{'@type':'Organization',name:'Modexa'},...(game?{about:{'@type':'VideoGame',name:game.title}}:{})}]
  return <><SEO fullTitle={post.seo_title?`${post.seo_title} | Modexa`:`${post.title} | Modexa`} description={post.seo_description||post.excerpt} noindex={post.noindex} canonical={post.canonical_url} image={post.cover_image} type="article" pageType="WebPage" modified={post.updated_at} breadcrumbs={crumbs} jsonLd={jsonLd} faqs={faqs}/>
  <article className="container blog-article">
    <div className="breadcrumbs"><nav aria-label="Breadcrumb"><ol>{crumbs.map((c,i)=><li key={c.label}>{i>0&&<ChevronRight size={13} aria-hidden="true"/>}{c.to&&i<crumbs.length-1?<Link to={c.to}>{c.label}</Link>:<span aria-current="page">{c.label}</span>}</li>)}</ol></nav></div>
    <div className="blog-article-head"><span>{post.category||NAMES[realType]}</span><h1>{post.title}</h1>{(post.excerpt||post.seo_description)&&<p>{post.excerpt||post.seo_description}</p>}<small>{game?`${game.title.toUpperCase()} · `:''}{post.published_at||''}{post.published_at?' · ':''}{readingTime(post.content)} MIN READ</small><div className="article-actions"><ShareButton title={post.title} text={post.excerpt}/>{game&&<Link className="button button-outline" to={game.href}><Gamepad2 size={16}/> {game.title}</Link>}</div></div>
    {post.cover_image&&<SafeImg className="blog-article-cover" src={post.cover_image}/>}
    {adsOn&&<AdBlock units={topU} className="ad-in-article"/>}
    {headings.length>2&&<nav className="article-toc" aria-label="On this page"><b>On this page</b>{headings.map(h=><a key={h} href={`#${headingSlug(h)}`}>{h}</a>)}</nav>}
    <div className="blog-article-body"><ContentHtml content={post.content} ads={allU} inContent={inU} adsOn={adsOn}/></div>
    <FaqSection faqs={faqs}/>
    {adsOn&&<AdBlock units={botU} className="ad-in-article"/>}
    {related.length>0&&<section className="related-posts"><h2>{sameGame.length&&game?`More about ${game.title}`:'Keep reading'}</h2><div className="blog-list-grid">{related.map(p=><article className="blog-list-card" key={p.id}><Link to={postHref(p)} className="blog-list-image"><SafeImg src={p.cover_image} loading="lazy"/></Link><div className="blog-list-content"><div className="blog-list-meta"><span>{p.category||'Guide'}</span></div><Link to={postHref(p)}><h2>{p.title}</h2></Link></div></article>)}</div></section>}
  </article></>
}

export function CustomPage({savedIds=[],onToggleSave}){
  const {slug}=useParams(),preview=new URLSearchParams(window.location.search).get('preview')==='1',[page,setPage]=useState(null),[loading,setLoading]=useState(true),allAds=useAdUnits('',{},{ignoreScope:true})
  useEffect(()=>{setLoading(true);let alive=true;(preview?supabase.from('pages').select('*').eq('slug',slug):supabase.from('pages').select('*').eq('slug',slug).eq('status','published')).maybeSingle().then(({data})=>{if(alive){setPage(data);setLoading(false)}});return()=>{alive=false}},[slug])
  if(loading)return <PageSkeleton/>
  if(!page)return <div className="container not-found-page"><h1>Page not found</h1><p>This page may have moved or no longer exists.</p><Link className="button button-primary" to="/">Back home</Link></div>
  const blocks=Array.isArray(page.blocks)?page.blocks:[]
  return <><SEO fullTitle={`${page.seo_title||page.title} | Modexa`} description={page.seo_description||page.excerpt} noindex={page.noindex||preview} canonical={page.canonical_url} image={page.cover_image} breadcrumbs={[{label:'Home',to:'/'},{label:page.title}]}/>
  {preview&&<div style={{background:'#fef3c7',color:'#78350f',padding:'8px 16px',textAlign:'center',fontWeight:700,fontSize:14}}>Preview mode{page.status!=='published'?' (draft, only you can see this)':''}</div>}
  {blocks.length&&page.settings?.show_title&&<section className="page-hero"><div className="container"><h1>{page.title}</h1>{page.excerpt&&<p>{page.excerpt}</p>}</div></section>}
  {blocks.length?<PageBlocks blocks={blocks} ads={allAds} savedIds={savedIds} onToggleSave={onToggleSave} layout={page.settings?.layout}/>:<><section className="page-hero"><div className="container"><h1>{page.title}</h1>{page.excerpt&&<p>{page.excerpt}</p>}</div></section><article className="container blog-article-body custom-page-body"><ContentHtml content={page.content} ads={allAds}/></article></>}</>
}
