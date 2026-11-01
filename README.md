# MOMENT – Realms of Adventure

**Version 0.2 – spielbare Offline-PWA (Prototyp Kapitel I)**

Ein kleines Fantasy-Action-RPG für das Handy: Ein-Finger-Steuerung, Angriffe im Stillstand, zwei Klassen, Ausweichen, Spezialfähigkeiten, fünf Räume, ein Endboss, permanente Upgrades, ruhiger Garten, lokaler Spielstand mit Sicherung und Wiederherstellung.

## Starten

**Am Windows-PC zum Ausprobieren:** `index.html` doppelklicken. Das eigentliche Spiel benötigt keine Internetverbindung. Der PWA-Offline-Cache funktioniert allerdings nur über HTTPS oder localhost.

**Auf iPhone als richtige Offline-App:**

1. Einen neuen **öffentlichen** GitHub-Repository-Namen `moment-adventure` erstellen: https://github.com/new (zuerst bei GitHub anmelden). Für GitHub Pages in einem kostenlosen Konto ist ein öffentliches Repository nötig.
2. Den **Inhalt dieses Ordners** (nicht den Ordner als Unterordner) ins Repository-Hauptverzeichnis hochladen; z. B. über `Add file → Upload files`, dann committen.
3. In GitHub `Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save` auswählen.
4. Die anschließend angezeigte Website-Adresse in **Safari** auf dem iPhone öffnen. Bei einem Projekt-Repository ist sie normalerweise `https://BENUTZERNAME.github.io/moment-adventure/`. Keine URL annehmen, bevor GitHub die Veröffentlichung bestätigt.
5. In Safari `Teilen → Zum Home-Bildschirm` wählen. Das Spiel über das neue Icon starten, **bei bestehender Verbindung einmal vollständig laden lassen**.
6. In `Einstellungen & Spielstand → Offline-Status prüfen` nachsehen. Dann den Flugmodus aktivieren, die App vollständig schließen und erneut über das Icon starten.

**Alternative:** Den gesamten Ordner bei einem anderen statischen HTTPS-Host veröffentlichen. Es ist kein PHP, Node-Server, Konto im Spiel oder externer Dienst für die Spielmechanik nötig.

## Dateien

- `index.html`: App-Oberfläche und Mobile-Metadaten
- `style.css`: Responsive Touch-Design mit iPhone-Safe-Area
- `game.js`: vollständige Spiellogik, Canvas-Grafik und Save-/Load-System
- `sw.js`: Offline-Cache sämtlicher PWA-Ressourcen
- `manifest.webmanifest`: Name, Icon, Start-URL, Standalone-Modus
- `icon-*.png`: installierbare App-Icons
- `favicon.svg`: Browser-Icon
- `PUBLISH_GITHUB_PAGES.ps1`: Optionales Upload-Skript für Windows mit Git/GitHub CLI

## Spielregeln

- Joystick links bewegen. Stehen bleiben = automatischer Angriff auf den nächsten Gegner.
- Rechts **SPRINT** zum Ausweichen, **MAGIE** für Klassenfähigkeit.
- Gegner besiegen und zufällige Fähigkeiten wählen, wenn ein Level aufsteigt.
- Nach jedem Raum Gold erhalten. Zwischen den Räumen darfst du in die Zuflucht zurückkehren.
- Beim Tod behältst du Gold und permanente Verbesserungen.
- Wächter: mehr Leben, schützt sich mit Schildruf. Arkanist: schnellerer Fernkampf und magischer Flächenschaden.
- Zuhause: Schmiede, Abenteuerbuch, ruhiger Garten und Einstellungen.
- Tastatur am PC: WASD/Pfeile, Leertaste = Magie, Shift = Sprint, Esc = Pause.

## Datenschutz und Einschränkungen

Alle Spielstände liegen **nur lokal** in `localStorage` im Browser. Es gibt keine Telemetrie, Werbung, Login-Pflicht, Tracking und keine Requests an Spiel-APIs. `Spielstand exportieren` als Sicherung verwenden. Bei Löschen von Website-Daten oder einer Neuinstallation kann sonst dein Fortschritt verloren gehen.

Der Offline-Modus muss nach dem **ersten erfolgreichen HTTPS-Aufruf** gecacht werden. Browser können Cache/Website-Daten unter Umständen löschen. Ein aktueller Durchlauf wird nicht nach Schließen/Neustart wiederhergestellt; Gold, Siege und Verbesserungen schon.

**Nicht enthalten:** die geplanten fünf vollständigen Welten, alle vier Klassen, frei erkundbare große Karte, NPC-Dialogsystem oder komplexe RPG-Story. Diese Version ist ein spielbarer und bewusst begrenzter erster Abschnitt, kein fertiges großes RPG.
