import { Cite, mountDeck, Slide, sourcesSlide } from '../shell/index.jsx'
import './deck.css'

const DECK_META = {
  title: 'An LLM-maintained wiki',
  asOf: '2026-10-04',
  sources: [
    { slug: 'llm-wiki-kit', title: 'llm-wiki-kit' },
    { slug: 'agent-maintainers', title: 'Agent maintainers' },
    { slug: 'human-readers', title: 'Human readers' },
    { slug: 'update-over-create', title: 'Update over create' },
    { slug: 'raw-layer', title: 'Raw layer' },
    { slug: 'wiki-layer', title: 'Wiki layer' },
    { slug: 'reader-app', title: 'Reader app' },
    { slug: 'typed-edges', title: 'Typed edges' },
    { slug: 'known-unknowns', title: 'Known unknowns' },
    { slug: 'canon-map', title: 'Canon map' },
    { slug: 'fact-registry', title: 'Fact registry' },
    { slug: 'wiki-linter', title: 'Wiki linter' },
    { slug: 'pre-commit-hook', title: 'Pre-commit hook' },
    { slug: 'ingest', title: 'Ingest' },
  ],
}

const FRONTMATTER = (
  <pre className="code">
    <span className="c">---</span>
    {'\n'}
    <span className="k">type</span>: concept{'\n'}
    <span className="k">edges</span>:{'\n'}
    {'  '}
    <span className="k">part-of</span>: [ingest]{'\n'}
    {'  '}
    <span className="k">depends-on</span>: [raw-layer]{'\n'}
    <span className="k">last-verified</span>: 2026-10-04{'\n'}
    <span className="c">---</span>
    {'\n'}# Page title{'\n'}## Known Unknowns{'\n'}- What the sources don't settle
  </pre>
)

const REPO = [
  ['raw/', 'Sources as markdown, append-only'],
  ['wiki/', 'Compiled pages, index, log, schema, canon map'],
  ['scripts/', 'Linter and its tests'],
  ['.githooks/', 'Pre-commit gates'],
  ['app/', 'Reader with search, graph and decks'],
  ['presentations/', 'Slide decks built from wiki pages'],
  ['docs/', 'Guide, hygiene standard, design brief'],
  ['references/', 'Page templates'],
]

const COMMANDS = `npm run setup
npm run lint:wiki
npm test
npm --prefix app run dev
npm --prefix app run export
npm run verify`

const SLIDES = [
  // 1. The idea
  () => (
    <div className="slide-content anim">
      <p className="wordmark">llm-wiki-kit</p>
      <h1>{DECK_META.title}</h1>
      <p className="subtitle">A knowledge base that coding agents write and people read.</p>
      <div className="cards origin" data-cascade>
        <div className="card card--accent">
          <h3>Andrej Karpathy</h3>
          <p>The LLM writes and maintains the wiki. The human reads it and asks questions.</p>
        </div>
        <div className="card card--accent">
          <h3>Garry Tan, gbrain</h3>
          <p>
            Every page is an entity with typed edges. Answers are cited. Every page says what it
            does not know yet.
          </p>
        </div>
      </div>
      <Cite from={['docs/GUIDE.md', 'agent-maintainers', 'human-readers']} />
    </div>
  ),

  // 2. Why
  () => (
    <Slide
      legend="Why"
      title="Chat forgets, wikis rot, and agents left alone make a mess"
      cite={['docs/GUIDE.md', 'update-over-create']}
    >
      <div className="ledger" data-cascade>
        <div className="ledger-row">
          <span className="ledger-label">Chat</span>
          <span className="ledger-txt">
            Answers vanish when the session ends. A wiki compounds: every ingest makes the next
            answer better.
          </span>
        </div>
        <div className="ledger-row">
          <span className="ledger-label">A normal wiki</span>
          <span className="ledger-txt">
            Rots because updating it is a chore nobody owns. Here the agent does the chore.
          </span>
        </div>
        <div className="ledger-row">
          <span className="ledger-label">Agents alone</span>
          <span className="ledger-txt">
            Create a new page for every insight, copy the same table onto four pages, and leave
            “next week we will” in present tense forever.
          </span>
        </div>
      </div>
      <p className="takeaway">
        Once the agent does the chore, the hard part is <strong>keeping it from making a mess</strong>.
        Most of the kit exists for that.
      </p>
    </Slide>
  ),

  // 3. Layers
  () => (
    <Slide
      legend="How it works"
      title="Sources land in raw, knowledge lives in wiki, the app only renders it"
      cite={['raw-layer', 'wiki-layer', 'reader-app']}
      wide
    >
      <div className="layers" data-cascade>
        <div className="layer">
          <p className="layer-path">raw/</p>
          <p>Every source as markdown, one file each. History, not knowledge.</p>
          <p className="layer-who">Append-only. The hook blocks edits to committed files.</p>
        </div>
        <div className="layer-arrow">→</div>
        <div className="layer">
          <p className="layer-path">wiki/</p>
          <p>Compiled entity pages with typed edges. The single source of truth.</p>
          <p className="layer-who">Agents write it through ingest.</p>
        </div>
        <div className="layer-arrow">→</div>
        <div className="layer">
          <p className="layer-path">app/</p>
          <p>Reader with search, backlinks, citation popovers and a graph. Builds to one HTML file.</p>
          <p className="layer-who">Code only. It may not hold knowledge.</p>
        </div>
      </div>
      <p className="takeaway">
        If a fact is not in the wiki or citable from raw, <strong>treat it as unknown</strong>.
      </p>
    </Slide>
  ),

  // 4. A page
  () => (
    <Slide
      legend="A page"
      title="A page is markdown with typed edges and a list of what it does not know"
      cite={['wiki-layer', 'typed-edges', 'known-unknowns']}
      wide
    >
      <div className="cols">
        <div>
          {FRONTMATTER}
          <p className="fine-note">
            The folder fixes the type. Inverse edges appear on both pages. There is no graph
            database: the files are the graph.
          </p>
        </div>
        <div className="ledger" data-cascade>
          <div className="ledger-row">
            <span className="ledger-label">Known Unknowns</span>
            <span className="ledger-txt">Last section of any page: what its sources don’t settle.</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Question</span>
            <span className="ledger-txt">A page in questions/ with a status and a horizon.</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Working claim</span>
            <span className="ledger-txt">The best current answer, one falsifiable sentence.</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Evidence ledger</span>
            <span className="ledger-txt">Raw paths for and against the claim. Never wiki pages.</span>
          </div>
        </div>
      </div>
    </Slide>
  ),

  // 5. What keeps it clean
  () => (
    <Slide
      legend="What keeps it clean"
      title="Rules an agent must remember get broken. Rules a commit checks hold."
      cite={['canon-map', 'fact-registry', 'wiki-linter', 'pre-commit-hook']}
    >
      <div className="ledger" data-cascade>
        <div className="ledger-row">
          <span className="ledger-label">Canon map</span>
          <span className="ledger-txt">
            <code>wiki/_canon.json</code> names the one page that owns each idea. A registered hot
            fact fails lint anywhere off its home page.
          </span>
        </div>
        <div className="ledger-row">
          <span className="ledger-label">Linter</span>
          <span className="ledger-txt">
            Checks frontmatter, edges and their inverses, links, the index, registered facts and the
            log. Errors fail the commit.
          </span>
        </div>
        <div className="ledger-row">
          <span className="ledger-label">Pre-commit hook</span>
          <span className="ledger-txt">
            Four gates: committed raw files stay unedited, staged code and pages need a log entry,
            wiki lint, markdown lint.
          </span>
        </div>
      </div>
      <p className="takeaway">
        Every gate replaced a written rule that agents broke. The one-home rule{' '}
        <strong>kept regressing until lint enforced it</strong>.
      </p>
    </Slide>
  ),

  // 6. The repo
  () => (
    <Slide
      legend="The repo"
      title="Everything is plain files, readable without the app"
      cite={['README.md', 'wiki-layer', 'llm-wiki-kit']}
      wide
    >
      <div className="cols repo">
        <div className="ledger" data-cascade>
          {REPO.map(([path, what]) => (
            <div className="ledger-row" key={path}>
              <span className="ledger-label">
                <code>{path}</code>
              </span>
              <span className="ledger-txt">{what}</span>
            </div>
          ))}
        </div>
        <div>
          <pre className="code">{COMMANDS}</pre>
          <p className="fine-note">
            The wiki in this repo documents the kit itself. Obsidian, GitHub and a text editor can
            all read it.
          </p>
        </div>
      </div>
    </Slide>
  ),

  // 7. How to start
  () => (
    <Slide
      legend="Start"
      title="Run setup, then hand an agent a source"
      cite={['llm-wiki-kit', 'ingest', 'docs/GUIDE.md']}
    >
      <ol className="steps" data-cascade>
        <li>
          <span>
            <code>npm run setup</code> points git at <code>.githooks/</code> and installs the root,
            app and deck dependencies. Needs Node 22 or newer.
          </span>
        </li>
        <li>
          <span>
            <code>npm --prefix app run dev</code> opens the reader on the example wiki.
          </span>
        </li>
        <li>
          <span>
            Paste a source into Claude Code and say “add this to the wiki”. The agent saves it to{' '}
            <code>raw/</code>, updates the pages that own the idea, re-reads the questions it
            touches, logs the change and runs lint.
          </span>
        </li>
        <li>
          <span>
            For your own wiki: delete the pages except <code>index.md</code> and{' '}
            <code>log.md</code>, empty <code>concerns</code> and <code>facts</code> in{' '}
            <code>_canon.json</code>, set <code>_schema.json</code> to your domain, and ingest your
            first source.
          </span>
        </li>
      </ol>
      <p className="takeaway">Then try to make it break a rule. The hook should stop it.</p>
    </Slide>
  ),

  // 8. Sources (appendix)
  sourcesSlide(DECK_META),
]

mountDeck({ slides: SLIDES, meta: DECK_META })
