# Sablier – Shopify-Theme (Online Store 2.0)

Dunkles, editoriales Theme für ein Parfum-Haus mit zwei Düften (Zeus, Pharaon). Es baut auf dem
bisherigen Theme dieses Repos auf (Ebenen-System, AJAX-Warenkorb, Seitenwechsel, Kundenkonto-Templates).

## Einrichten im Shop

1. **Theme hochladen**: `shopify theme push --unpublished` oder `shopify theme package` und die ZIP-Datei unter
   *Onlineshop › Themes › Theme hinzufügen › ZIP-Datei hochladen* einspielen.
2. **Produkte** mit den Handles `zeus` und `pharaon` anlegen (Preis, Varianten, Lagerbestand, Bilder kommen
   direkt aus Shopify). Startseite, Story-Seite und Produktseiten finden sie über den Handle automatisch;
   im Theme-Editor kann jedes Produkt auch direkt gewählt werden.
3. **Produkt-Templates**: im Produkt unter *Theme-Vorlage* `zeus` bzw. `pharaon` wählen
   (eigene Ersatz-Illustration und eigener Editor-Inhalt je Duft). `product.json` ist die allgemeine Vorlage.
4. **Seiten** anlegen: „The Story“ (Handle `the-story`, Vorlage `page.story`) und „Contact“
   (Handle `contact`, Vorlage `page.contact`).
5. **Menü** `main-menu`: Zeus → `/products/zeus`, Pharaon → `/products/pharaon`, The Story → `/pages/the-story`,
   Contact → `/pages/contact`. Das Menü `footer` erscheint in der Footer-Spalte „Policies“, dazu die
   rechtlichen Seiten aus *Einstellungen › Richtlinien*.
6. **Metafelder** (Einstellungen › Benutzerdefinierte Daten › Produkte, Namespace `custom`):

   | Schlüssel | Typ | Verwendung |
   |---|---|---|
   | `era` | Einzeiliger Text | kleine Zeile über dem Produktnamen |
   | `subtitle` | Einzeiliger Text | Unterzeile (sonst Produkttyp) |
   | `top_notes`, `heart_notes`, `base_notes` | Liste einzeiliger Texte oder Text | Duftnoten |

7. **Ausverkauft / Coming soon**: „Sold out“ ergibt sich aus dem Lagerbestand. Für noch nicht erschienene Düfte
   das Produkt-Tag `coming-soon` setzen (änderbar unter *Theme-Einstellungen › Produktstatus*).
   Ein Countdown erscheint nur, wenn in der Section „Nächster Drop“ ein Datum eingetragen ist.
8. **Formulare** nutzen Shopifys native Formulare: Kontaktanfragen gehen an die Shop-E-Mail, Newsletter- und
   „Benachrichtigen“-Anmeldungen landen unter *Kunden* (Tags `newsletter`, `next-drop`, `notify-<handle>`).

## Bilder und Texte

Alle Bilder im Theme (`assets/art-*.svg`) sind eigene Ersatz-Illustrationen, alle Texte sind Platzhalter.
Eigene Fotos und Texte werden im Theme-Editor in den jeweiligen Sections gesetzt; Produktbilder kommen aus
den Produktmedien.

## Prüfen

```bash
shopify theme check
shopify theme dev --store <dein-shop>.myshopify.com
```
