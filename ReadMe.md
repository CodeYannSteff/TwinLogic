<h2>Chronos Guardian — Documentație Tehnică și Manual de Arhitectură</h2>

<p>Bine ai venit în documentația oficială a proiectului <strong>Chronos Guardian</strong>, un joc 2D RPG de acțiune și combat bazat pe deck-building, implementat cu ajutorul motorului grafic <strong>Phaser</strong> și optimizat pentru rulare în browser prin <strong>Vite</strong>.</p>

<p>Acest manual este conceput pentru a oferi o înțelegere clară și profundă a tuturor structurilor, modulelor și sistemelor matematice și procedurale care aduc jocul la viață.</p>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>1. Introducere & Conceptul Jocului</h2>

<p>În <strong>Chronos Guardian</strong>, jucătorul preia rolul lui <strong>Kael</strong>, un protector străvechi al liniilor temporale. Misiunea lui Kael este de a călători prin trei ere istorice marcate de distorsiuni temporale, de a învinge forțele corupte și de a colecta fragmente de lore pentru a repara „Riftul Temporal”.</p>

<div style="background: rgba(200, 168, 78, 0.05); border-left: 4px solid #c8a84e; padding: 12px; margin: 16px 0; border-radius: 4px; color: #eeddbb;">
  <strong>Erele Jocului:</strong>
  <ul>
    <li><strong>Ancient Egypt (Egiptul Antic)</strong>: O eră dominată de nisip, gardieni corupți și forțe mistice locale, culminând cu înfruntarea căpitanului Medjay corupt, <strong>Captain Amenhotep</strong>.</li>
    <li><strong>Ancient Rome (Roma Antică)</strong>: O eră a templelor de marmură, legionarilor distorsionați și a anomaliei centurionului, <strong>Anomaly Centurion</strong>.</li>
    <li><strong>Modern Lab (Era Modernă / Lab)</strong>: Un laborator tech avansat plin de fragmente de void și entități de tip glitch, culminând cu entitatea supremă de alterare a realității, <strong>The Eraser</strong>.</li>
  </ul>
</div>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>2. Structura Proiectului (Arhitectura)</h2>

<p>Aplicația este structurată modular, respectând bunele practici în dezvoltarea jocurilor Phaser.</p>

<pre style="background: #111; color: #88ffcc; padding: 12px; border-radius: 6px; font-family: monospace; overflow-x: auto; font-size: 13px; line-height: 1.4;">
c:/Games/Vianu/
├── index.html            &lt;- Punctul de intrare HTML (conține div-ul 'game-container')
├── package.json          &lt;- Configurația npm și dependințele (Phaser, Vite)
├── vite.config.js        &lt;- Configurația serverului de dezvoltare Vite
├── DOCUMENTATIE.html     &lt;- Această documentație tehnică în format HTML
└── src/
    ├── main.js           &lt;- Inițializarea Phaser și configurarea scenelor
    ├── data/             &lt;- Datele structurate în format JSON (cards, dialogue, enemies, lore)
    ├── entities/         &lt;- Entitățile fizice ale jocului (Player, Enemy, NPC)
    ├── scenes/           &lt;- Scenele Phaser (Boot, Menu, Hub, Egypt, Rome, Modern, DeckBuild)
    ├── systems/          &lt;- Core-ul logic (CardManager, CombatSystem, DialogSystem, LoreSystem, SoundManager)
    ├── ui/               &lt;- Interfața grafică din joc (HUD.js)
    └── utils/            &lt;- Utilitare (MapBuilder.js, SpriteFactory.js)
</pre>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>3. Sistemul de Combat (Card & Combat System)</h2>

<p>Combatul din <strong>Chronos Guardian</strong> este în întregime bazat pe utilizarea de cărți din hotbar. Jucătorul poate avea maxim <strong>4 cărți echipate simultan</strong> (activate prin tastele <code>1</code>, <code>2</code>, <code>3</code>, <code>4</code>).</p>

<div style="background: rgba(68, 255, 204, 0.05); border-left: 4px solid #44ffcc; padding: 12px; margin: 16px 0; border-radius: 4px; color: #bbeeaa;">
  <strong>Gestiunea Cărților & Cooldown dinamic:</strong>
  <p>Cărțile descoperite prin explorare sunt adăugate în inventarul jucătorului și pot fi echipate în hotbar prin Deck Builder. Fiecare carte are un cooldown specific. <code>CardManager</code> calculează procentul de cooldown rămas, iar <code>HUD</code> scalează pe axa Y un overlay negru semitransparent pe slotul respectiv, oferind jucătorului un feedback vizual excelent.</p>
</div>

<h3>Cele 12 Abilități Unice (CombatSystem.js)</h3>

<ul>
  <li><strong>Spread Shot (Pharaoh's Flame)</strong>: Trage mai multe proiectile rotunde de energie sub formă de evantai (implicit 3 proiectile, unghi de împrăștiere de 0.3 radiani). Lasă în urmă o dâră fină de particule.</li>
  <li><strong>Tornado (Sandstorm Veil)</strong>: Jucătorul devine invulnerabil timp de câteva secunde (alpha scade la 50%) și creează o furtună de nisip care împinge violent inamicii din raza de acțiune (push force 200px/s).</li>
  <li><strong>Heal Wave (Nile's Blessing)</strong>: Vindecă instantaneu jucătorul cu 25 HP și creează o undă distructivă care înaintează în direcția în care privește Kael, însoțită de un inel luminos verde care se dilată.</li>
  <li><strong>Orbiting Shield (Ankh of Life)</strong>: Oferă invulnerabilitate totală și generează 3 sfere de energie care orbitează în jurul jucătorului, lovind continuu inamicii apropiați.</li>
  <li><strong>Beam (Gladius Strike)</strong>: Canalizează o rază masivă de energie în linie dreaptă, lovind instantaneu inamicii pe direcție, acompaniată de camera shake și scântei electrice.</li>
  <li><strong>Gravity Well (Centurion's Resolve)</strong>: Lansează o singularitate gravitațională care atrage toți inamicii din apropiere spre centru, explodând la final cu un cutremur intens de ecran.</li>
  <li><strong>Dash Strike (Legion's Advance)</strong>: Proiectează rapid jucătorul înainte (dash de 60px) într-o stare invulnerabilă, lăsând imagini fantomatice (afterimages) în urmă și lovind toți inamicii pe drum.</li>
  <li><strong>Freeze Shatter (Temporal Bubble)</strong>: Îngheață toți inamicii din zonă (viteza devine 0, sunt colorați în albastru). La expirare, produce un efect de spargere (shatter) ce aplică daune masive și proiectează bucăți de gheață.</li>
  <li><strong>Exploding Orb (Void Pulse)</strong>: Lansează o sferă lentă de energie instabilă care explodează la contact sau distanță maximă, creând 3 inele concentrice de foc void.</li>
  <li><strong>Homing Swarm (Quantum Shield)</strong>: Invocă 6 particule inteligente de crono-energie care scanează terenul, găsesc cel mai apropiat inamic și accelerează direct spre el pentru a exploda.</li>
  <li><strong>Meteor Rain (Reality Warp)</strong>: Invocă o ploaie de 5 meteori distructivi. Fiecare meteor este telegrafiat la sol printr-o umbră neagră concentrică înainte de impactul ce produce un inel de foc masiv.</li>
  <li><strong>Chain Lightning (Chronos Rift)</strong>: Lansează un arc electric ce sare de la o țintă la alta (maxim 4 inamici) pe o rază de 50px. Fiecare salt succesiv reduce daunele provocate cu 15%.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>4. Procedural Audio Design (SoundManager)</h2>

<p>Jocul nu încarcă niciun fișier audio extern. Toate efectele sonore sunt <strong>sintetizate direct în timp real</strong> folosind API-ul nativ <strong>Web Audio API</strong> (<code>SoundManager.js</code>).</p>

<div style="background: rgba(136, 68, 204, 0.05); border-left: 4px solid #8844cc; padding: 12px; margin: 16px 0; border-radius: 4px; color: #eeddff;">
  <strong>Sinteză Audio Procedurală:</strong>
  <ul>
    <li><strong>OscillatorNode</strong>: Generează unde pure cu forme diferite: <code>sine</code> (vindecări, click-uri), <code>sawtooth</code> (atacuri, explozii), <code>triangle</code> (dialoguri), și <code>square</code> (impacturi retro, inamici).</li>
    <li><strong>Rampă Exponențială</strong>: Folosită pentru a asigura o tranziție lină a frecvenței și volumului, prevenind zgomotele de tip „click” digital și imitând stingerea naturală a sunetului.</li>
    <li><strong>White Noise Buffer</strong>: Canal audio temporar umplut cu valori aleatorii între -1 și 1, ideal pentru explozii, vânt ambient, fâsâituri și moartea inamicilor.</li>
  </ul>
</div>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>5. Procedural Graphics & Pixel Art (SpriteFactory)</h2>

<p>Unul dintre cele mai avansate sistem din proiect este <strong>SpriteFactory</strong>, responsabil de <strong>desenarea direct în memorie</strong> a tuturor elementelor grafice, la pornirea jocului (<code>BootScene</code>).</p>

<ul>
  <li><strong>Jucătorul Kael</strong>: Foaie de sprite-uri de 128x128 px cu 4 direcții x 4 cadre de mișcare. Se calculează oscilația capului (bobbing) și picioarelor în funcție de cadru.</li>
  <li><strong>Boșii</strong>:
    <ul>
      <li><strong>Captain Amenhotep</strong>: Purtător de coif nemes pharaonic albastru/auriu și sabie Khopesh.</li>
      <li><strong>Anomaly Centurion</strong>: Corp spectral transparent violet cu armură segmentată romană clasică.</li>
      <li><strong>The Eraser</strong>: O entitate amorfă a voidului desenată ca elipse concentrice purpurii cu linii tip „glitch” cyan/roz.</li>
    </ul>
  </li>
  <li><strong>Tilesets & Decor</strong>: Podele și pereți personalizați pentru fiecare eră (gresie cu hieroglife, marmură, metal tech). Include decorări precum palmieri, coloane romane, console tech animate și torțe cu flacără dinamică.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>6. Sistemul de Dialog & Lore</h2>

<p>Jocul pune accent pe poveste și coerență istorică.</p>

<ul>
  <li><strong>Sistemul de Dialog (DialogSystem.js)</strong>: Caseta de dialog este realizată în stil premium (Stardew Valley), cu o textură maro de lemn și o plăcuță aurie pentru speaker. Literele apar una câte una la 25ms, acompaniate de un „tick” audio procedural de mașină de scris.</li>
  <li><strong>Lore System (LoreSystem.js)</strong>: Jucătorul colectează scroll-uri de lore pe parcursul nivelurilor, declanșând un sunet de harpe și notificări elegante în partea de sus a ecranului.</li>
  <li><strong>Salvare Automată</strong>: Starea jocului (cărțile descoperite, lore-ul și viața jucătorului) este stocată automat în browser prin <code>SaveSystem</code>.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<h2>7. Generatorul de Niveluri (MapBuilder)</h2>

<p>Nivelurile sunt stocate în scene ca matrice simple de caractere, făcând designul de hărți extrem de intuitiv.</p>

<pre style="background: #111; color: #ffcc44; padding: 12px; border-radius: 6px; font-family: monospace; overflow-x: auto; font-size: 13px;">
Legendă Hărți:
  # = Perete static cu coliziune
  . = Podea simplă accesibilă
  S = Punctul de Spawn al jucătorului (Kael)
  E = Inamic comun (citit automat din JSON)
  N = NPC interactiv (interacțiune cu tasta E)
  L = Scroll de Lore cules
  C = Carte de abilitate plasată pe jos (pickup)
  B = Boss-ul principal al zonei
  P = Portalul de întoarcere în Hub (activ după boss)
</pre>

<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />

<div style="text-align: center; color: #44ffcc; font-weight: bold; margin-top: 20px;">
  Chronos Guardian © 2026 — Defend the Timeline in Style!
</div>
