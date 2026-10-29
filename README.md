# Aurelia – Monster-Chroniken

Ein Monster-Sammel-Abenteuer im Stil klassischer Handheld-Rollenspiele – komplett im Browser, optimiert fürs iPhone.
Alle Kreaturen, Namen, Grafiken (prozedurale Pixel-Art) und Musik (WebAudio-Chiptune) sind **eigene Inhalte**.
Es werden keine ROMs oder Originalinhalte anderer Spiele verwendet.

## Version 0.1 – Region 1 „Heideland“

- **Welt:** Morgentau (Startdorf, Zuhause, Nachbarhaus, Labor), Route 1, Kieselstadt (Heilstation, Laden, Arena)
- **27 eigene Monster** mit 10 Typen, Fähigkeiten, Lernsets und Entwicklungen (bis zu 3 Stufen)
- **Kampfsystem:** rundenbasiert, Typ-Effektivität, STAB, Volltreffer, Status (Verbrennung, Gift, Paralyse, Schlaf), Statuswert-Stufen, Priorität, Rückstoß/Entzug, Wetter (Regen), Fähigkeiten wie *Felsenfest*, *Statik*, *Schwebe*
- **KI:** wilde Monster zufällig, Trainer taktisch, Arenaleiterin/Rivale mit Heilitems und K.-o.-Erkennung
- **Fangen** mit Fangkapseln/Superkapseln, Wackel-Animation, Team (6) + PC-Box
- **Erfahrung, Level-Aufstieg, neue Attacken (mit Vergessen-Dialog), Entwicklungs-Animation**
- **Story:** Starterwahl, Rivalenkampf, 2 Routen-Trainer, Arena mit Trainer + Leiterin, Felsorden
- **Optional/Endgame:** Revanche gegen Rivale Kai, seltenes Geister-Monster am Teich, seltene Monster im Gras (Mondohr, Moosmolch)
- **Versteckte Gegenstände**, Schilder, NPCs mit Tipps, Laden, Heilstation
- **Touch-Steuerung:** Steuerkreuz, A/B (B halten = rennen), Menü-Taste, *Antippen = automatisch hinlaufen*
- **Speichern:** Autosave bei Kartenwechsel & nach Kämpfen, 3 Speicherplätze, Versionierung + Migration, Export/Import als Code
- **Menüs:** Team (Details, Reihenfolge), Tasche, Bestiarium, Regionskarte, Speichern, Optionen (Lautstärke, Textgeschwindigkeit)

## Auf GitHub Pages veröffentlichen (vom iPhone aus)

Die `index.html` im Hauptordner ist der fertige Einzeldatei-Build (alles eingebettet) und wird von GitHub Pages direkt ausgeliefert. Für die Entwicklung gibt es `dev.html`, die die Module einzeln lädt.

1. Auf github.com einloggen → oben rechts **+** → **New repository**.
2. Name z. B. `aurelia`, Sichtbarkeit **Public**, Haken bei **Add a README file** → **Create repository**.
3. Im Repo: **Add file → Upload files** → **choose your files** → die Datei `index.html` (aus `dist`) auswählen → unten **Commit changes**.
4. **Settings → Pages** → bei *Branch* `main` und `/ (root)` wählen → **Save**.
5. Nach 1–2 Minuten ist das Spiel erreichbar unter: `https://DEIN-NAME.github.io/aurelia/`
6. Tipp: In Safari **Teilen → Zum Home-Bildschirm** – dann startet das Spiel wie eine App im Vollbild.
   (Achtung: Die Home-Bildschirm-App hat einen eigenen Speicher – Spielstand ggf. per Export-Code übertragen.)

Optional kann zusätzlich der komplette Quellcode (Ordner `css`, `js`, `tools`) hochgeladen werden – am einfachsten vom Computer per Drag & Drop.

## Projektstruktur

```
index.html            Einzeldatei-Build (läuft auf GitHub Pages)
dev.html              Entwicklungsversion, lädt die Module einzeln
css/style.css         Mobile-First-UI, Safe Areas, Kampf- und Menü-Layout
js/core.js            Namespace, Hilfsfunktionen, Tween-Manager
js/data/              Typen, Attacken, Monster, Items, Karten + Trainer (reine Daten → leicht erweiterbar)
js/gfx/               Prozedurale Pixel-Art: Kacheln/Gebäude, Figuren, Monster-Generator
js/engine/            Eingabe (Touch/Tastatur), Audio (Chiptune + SFX), Speichern
js/game/              Monster-Logik, UI, Story-Skripte, Oberwelt, Kampf, Menüs
js/main.js            Bildschirm, Spiel-Loop, Titelbildschirm
tools/build.js        node tools/build.js → erzeugt index.html aus dev.html
```

### Erweitern
- **Neue Karte:** Eintrag in `js/data/maps.js` (Kachel-Zeilen, Warps, NPCs, Items, Begegnungen) – Warps der Nachbarkarte ergänzen.
- **Neues Monster:** Eintrag in `js/data/monsters.js` inkl. `look` (Körperbau + Merkmale) – der Sprite wird automatisch erzeugt.
- **Neue Attacke:** `js/data/moves.js`.

## Bekannte Einschränkungen (v0.1)
- Nur Region 1 spielbar; der Weg nach Norden ist (absichtlich) durch einen Erdrutsch versperrt.
- Keine Spitznamen, kein Verkaufen im Laden, keine gehaltenen Items.
- Safari löscht Website-Daten nach längerer Inaktivität → Export-Code regelmäßig sichern.
- Die Schrift „Pixelify Sans“ kommt von Google Fonts; ohne Internet wird eine Systemschrift verwendet.
