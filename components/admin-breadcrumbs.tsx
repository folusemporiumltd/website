import Link from 'next/link'

type Crumb = { label: string; href?: string }

export default function AdminBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{margin:'0 0 22px',fontSize:14,color:'var(--muted)'}}>
      <ol style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',listStyle:'none',padding:0,margin:0}}>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} style={{display:'flex',alignItems:'center',gap:8}}>
              {index > 0 ? <span aria-hidden="true" style={{opacity:.55}}>›</span> : null}
              {item.href && !current ? <Link href={item.href} style={{color:'var(--burgundy)',fontWeight:700,textDecoration:'none'}}>{item.label}</Link> : <span aria-current={current ? 'page' : undefined} style={{fontWeight:current ? 700 : 500,color:current ? 'var(--text)' : 'inherit'}}>{item.label}</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
