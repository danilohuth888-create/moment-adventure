# MOMENT 1.0 – Realms of Adventure

Ein eigenständiges, kostenloses Pixel-Fantasy-Survivors-RPG für Smartphone und Desktop, komplett ohne externe Abhängigkeiten.

## Spielinhalte

- **Drei Gebiete und drei verschiedene Bosskämpfe**: Flüsterwald, Frostzitadelle, Glutschmiede.
- **Zusammenhängende Geschichte** über die drei Siegel mit NPC-Texten und Epilog.
- **Vier Klassen**: Arkanist, Wächter, Waldläufer und Schattenläufer.
- **Acht automatisch kämpfende Waffen**, aufwertbar bis Stufe 5.
- **Sieben passive Talente**, ebenfalls aufwertbar bis Stufe 5.
- **Survivors-Kampf**: bewegen, automatisch angreifen, XP sammeln, Level-Up-Upgrades wählen, bis zum Boss überleben.
- Spezialangriff und Ausweich-Sprint, fünf normale Gegnertypen pro Kapitel.
- Schmiede mit permanenten Upgrades, Gold, freischaltbare Welten, acht Erfolge, Chronik.
- Ruhiger Garten und freiwillige Alltags-Missionen, die das Spiel nicht voraussetzt.
- **Offline-PWA**: Keine externen Bilder, Fonts, Frameworks, Netzwerk-APIs oder Werbung.
- Automatischer Checkpoint und **Run fortsetzen**, Spielstand-Export/Import.
- Eigene Pixelgrafik und Sounds; Spielwelt wird vollständig prozedural gezeichnet.

## Lokal testen

Die HTML-Datei kann auch direkt am Rechner geöffnet werden. Für den vollständigen PWA-Service-Worker muss die App jedoch unter HTTPS (GitHub Pages) oder localhost bereitgestellt werden.

Auf Windows mit Python: `python -m http.server 8080`, dann `http://localhost:8080/` öffnen.

## GitHub-Update

`UPDATE_GITHUB.ps1` nach dem Entpacken ausführen. Das Skript nutzt das vorhandene Repository unter `$HOME\MOMENT`, ohne bestehende Dateien vor dem Sicherheitscheck zu überschreiben.

## Bedienung

- Smartphone: linker Joystick, Sprint und Ulti rechts.
- Desktop: WASD/Pfeiltasten, Shift = Sprint, Leertaste = Ulti, Escape = Pause.
- Nach dem ersten vollständigen Online-Laden: über Safari zum Home-Bildschirm hinzufügen und offline spielen.

## Daten

Speicherung ausschließlich in `localStorage` unter `moment-aetheria-save-v1`.
Migration aus MOMENT v0.3/v0.4 übernimmt Gold und alte Schmiedewerte, sofern der Browser die bisherigen Daten noch hat. Die alte Version bleibt unverändert gespeichert.

WICHTIG: iOS kann Website-Daten entfernen. Darum regelmäßig über **Einstellungen → Spielstand exportieren** sichern.

## Version und Umfang

Das ist ein spielbares Release 1.0 mit drei abgeschlossenen Welten – kein vollständig offenes Rollenspiel mit Dialogbäumen oder 3D-Grafik. Erweiterungen können später folgen.
