<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DCA Pattern Gallery</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0b0b;
            --card-bg: #1a1a1a;
            --text-color: #f0f0f0;
            --accent-color: #00bcd4;
            --secondary-text: #b0b0b0;
        }
        body { font-family: 'Montserrat', sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 0; line-height: 1.7; scroll-behavior: smooth; }
        header { height: 40vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('GalleryPatterns/Home002DCA_TTL-007.png'); background-size: cover; background-position: center; border-bottom: 3px solid var(--accent-color); }
        header h1 { font-size: 2.5rem; margin: 0; text-transform: uppercase; letter-spacing: 5px; font-weight: 700; }
        header p { font-size: 1.1rem; color: var(--accent-color); font-weight: 300; margin-top: 10px; }
        nav { position: sticky; top: 0; background: rgba(11, 11, 11, 0.98); padding: 1rem; text-align: center; z-index: 1000; border-bottom: 1px solid #333; }
        nav a { color: var(--text-color); text-decoration: none; margin: 0 15px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; transition: 0.3s; }
        nav a:hover { color: var(--accent-color); }
        .container { max-width: 1200px; margin: 40px auto; padding: 0 30px; }
        section { margin-bottom: 80px; }
        h2 { border-left: 6px solid var(--accent-color); padding-left: 20px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; font-size: 1.8rem; }
        .sub-header { color: var(--accent-color); margin-top: 50px; font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px; width: 100%; clear: both; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-top: 20px; }
        .card { background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 1px solid #222; cursor: pointer; transition: 0.3s; }
        .card:hover { transform: translateY(-5px); border-color: var(--accent-color); }
        .card img { width: 100%; display: block; aspect-ratio: 1/1; object-fit: cover; }
        .card-body { padding: 12px; text-align: left; }
        .card-title { font-size: 0.85rem; font-weight: 700; color: var(--accent-color); margin-bottom: 5px; }
        .card-text { font-size: 0.75rem; color: var(--secondary-text); }
        .plain-img { border-radius: 8px; overflow: hidden; border: 1px solid #333; cursor: pointer; transition: 0.3s; }
        .plain-img:hover { transform: scale(1.03); border-color: var(--accent-color); }
        .plain-img img { width: 100%; display: block; aspect-ratio: 1/1; object-fit: cover; }
        footer { text-align: center; padding: 40px; background: #000; font-size: 0.8rem; border-top: 1px solid #222; }
    </style>
</head>
<body>

<header>
    <h1>DCA Pattern Gallery</h1>
    <p>Exploring the Mathematical Beauty of Life</p>
</header>

<nav>
    <a href="#intro">Dynamics</a>
    <a href="#masterpieces">Masterpieces</a>
    <a href="#monochrome">Monochrome</a>
    <a href="#voronoi">Voronoi</a>
</nav>

<div class="container">
    <section id="intro">
        <h2>Introduction</h2>
        <div style="background:#111; padding:25px; border-radius:15px; margin-bottom:30px;">
            <p>DCA (Division Cellular Automata) emulates the miracle of life's growth[cite: 148]. Through recursive division, simple genomes evolve into sophisticated geometric masterpieces[cite: 149, 156].</p>
        </div>
        <div id="intro-target" style="text-align: center;"></div>
    </section>

    <section id="masterpieces">
        <h2>Representative Masterpieces</h2>
        <div class="sub-header">Pattern 1: The Iconic Star</div>
        <div class="gallery-grid" id="p1-target"></div>

        <div class="sub-header">Pattern 2: Complex Lattice</div>
        <div class="gallery-grid" id="p2-target"></div>

        <div class="sub-header">Pattern 3: Geometric Symmetry</div>
        <div class="gallery-grid" id="p3-target"></div>

        <div class="sub-header">Pattern 4: Ornate Framework</div>
        <div class="gallery-grid" id="p4-target"></div>
    </section>

    <section id="monochrome">
        <h2>Monochrome Analysis</h2>
        <div class="gallery-grid" id="mono-target"></div>
    </section>

    <section id="voronoi">
        <h2>Voronoi Applications</h2>
        <div class="gallery-grid" id="voronoi-target"></div>
    </section>
</div>

<footer><p>Curator: J. K. Shin | jkshin@yu.ac.kr</p></footer>

<script>
    const dcaData = [
        { "f": "Home001Growth.png", "s": "intro" },
        // P1
        { "f": "Home002DCA_TTL-007.png", "t": "Iconic Star", "c": "I=1111", "s": "p1" },
        { "f": "Home003DCA_TTL-007_1111.png", "t": "Var", "c": "I=1111", "s": "p1" },
        { "f": "Home004DCA_TTL-007_2222.png", "t": "Var", "c": "I=2222", "s": "p1" },
        { "f": "Home005DCA_TTL-007_3333.png", "t": "Var", "c": "I=3333", "s": "p1" },
        { "f": "Home006DCA_TTL-007_1414.png", "t": "Var", "c": "I=1414", "s": "p1" },
        { "f": "Home007DCA_TTL-007_2233.png", "t": "Var", "c": "I=2233", "s": "p1" },
        { "f": "Home008DCA_TTL-007_1332.png", "t": "Var", "c": "I=1332", "s": "p1" },
        // P2
        { "f": "Home009DCA_TTL-004.png", "t": "Lattice", "c": "I=1111", "s": "p2" },
        { "f": "Home010DCA_TTL-004_1111.png", "t": "Var", "c": "I=1111", "s": "p2" },
        { "f": "Home011DCA_TTL-004_3333.png", "t": "Var", "c": "I=3333", "s": "p2" },
        { "f": "Home012DCA_TTL-004_4444.png", "t": "Var", "c": "I=4444", "s": "p2" },
        // P3
        { "f": "Home013DCA_TTL-012.png", "t": "Symmetry", "c": "I=1111", "s": "p3" },
        { "f": "Home014DCA_TTL-012_1111.png", "t": "Var", "c": "I=1111", "s": "p3" },
        // P4
        { "f": "Home015DCA_TTL-015.png", "t": "Framework", "c": "I=1122", "s": "p4" },
        { "f": "Home016DCA_TTL-015_1122.png", "t": "Var", "c": "I=1122", "s": "p4" },
        { "f": "Home017DCA_TTL-015_1111.png", "t": "Var", "c": "I=1111", "s": "p4" },
        { "f": "Home018DCA_TTL-015_1133.png", "t": "Var", "c": "I=1133", "s": "p4" },
        // Mono
        { "f": "Home019.png", "s": "mono" }, { "f": "Home020.png", "s": "mono" },
        { "f": "Home021.png", "s": "mono" }, { "f": "Home022.png", "s": "mono" },
        { "f": "Home023.png", "s": "mono" }, { "f": "Home024.png", "s": "mono" },
        { "f": "Home025.png", "s": "mono" }, { "f": "Home026.png", "s": "mono" },
        { "f": "Home027.png", "s": "mono" },
        // Voronoi
        { "f": "Home028.png", "s": "voronoi" }, { "f": "Home029.png", "s": "voronoi" },
        { "f": "Home030.png", "s": "voronoi" }, { "f": "Home031DCA_TTL-102.png", "s": "voronoi" },
        { "f": "Home032DCA_TTL-110.png", "s": "voronoi" }, { "f": "Home033.png", "s": "voronoi" },
        { "f": "Home034.png", "s": "voronoi" }, { "f": "Home035.png", "s": "voronoi" },
        { "f": "Home036.png", "s": "voronoi" }
    ];

    const targets = {
        intro: document.getElementById('intro-target'),
        p1: document.getElementById('p1-target'), p2: document.getElementById('p2-target'),
        p3: document.getElementById('p3-target'), p4: document.getElementById('p4-target'),
        mono: document.getElementById('mono-target'), voronoi: document.getElementById('voronoi-target')
    };

    dcaData.forEach(i => {
        const path = 'GalleryPatterns/' + i.f;
        if (i.s === 'intro') {
            targets.intro.innerHTML = `<img src="${path}" style="width:70%; border-radius:15px; cursor:pointer;" onclick="window.open(this.src)">`;
        } else if (i.s === 'mono' || i.s === 'voronoi') {
            const d = document.createElement('div'); d.className = 'plain-img';
            d.innerHTML = `<img src="${path}" onclick="window.open(this.src)">`;
            targets[i.s].appendChild(d);
        } else {
            const c = document.createElement('div'); c.className = 'card';
            c.innerHTML = `<img src="${path}" onclick="window.open(this.src)"><div class="card-body"><div class="card-title">${i.t}</div><div class="card-text">${i.c}</div></div>`;
            targets[i.s].appendChild(c);
        }
    });
</script>
</body>
</html>