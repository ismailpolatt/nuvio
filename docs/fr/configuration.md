[English](../configuration.md) · [Polski](../pl/configuration.md) · **Français**

# Configuration

Réglages facultatifs de Nuvio. Retour au [README](../../README.fr.md).

Options facultatives de la stratégie :

```yaml
strategy:
  type: custom:nuvio
  language: fr        # tout code de langue disponible (en, pl, fr …) : langue par défaut du tableau de bord (un choix personnel dans les Paramètres reste prioritaire)
```

## Organisation des paramètres

Ouvrez **Paramètres** depuis le mode édition ou le menu utilisateur. La fenêtre des paramètres a une barre latérale avec des pages groupées :

- **Général** : Général (langue, performances)
- **Apparence** : Thème (style du tableau de bord, fond des panneaux, accent), Arrière-plan (arrière-plan, assombrissement, galerie), En-tête (en-tête et navigation)
- **Tableau de bord** : Vues et navigation (vues, réglages des vues), Pièces et climat
- **Tablette murale** : Économiseur d’écran, PIN et verrous (verrouillage PIN de l’économiseur et des vues)
- **Système** : Assist, Utilisateurs, Intégrations, Sauvegarde et import, À propos de Nuvio

Saisissez du texte dans le champ de recherche en haut de la barre latérale pour afficher tous les paramètres correspondants de toutes les pages ; chaque page indique son nombre de résultats. Échap efface la recherche. Dans la barre latérale, les flèches, Début et Fin passent d’une page à l’autre. Sur un téléphone, la barre latérale est une liste : touchez une page pour l’ouvrir et utilisez la flèche retour pour revenir. La détection d’activité de chaque appareil de climat dans **Pièces et climat** est repliée dans un bloc avancé qui s’ouvre tout seul quand une source personnalisée est définie. En mode édition, les changements sont un brouillon : rien n’est enregistré et le tableau de bord n’est pas rechargé avant que vous touchiez **Terminé**, qui enregistre une seule fois et recharge au plus une fois. **Annuler** abandonne le brouillon. Tous les paramètres gardent leurs clés enregistrées, les configurations existantes fonctionnent donc sans changement.

## Langue

Nuvio est disponible en plusieurs langues : aujourd’hui en anglais, en polonais et en français, ainsi que dans toute langue ajoutée sous forme de catalogue (voir plus bas). Chaque personne choisit sa langue dans **Paramètres → Apparence → Langue** (*Automatique*, puis un bouton par langue disponible) ou avec l’élément de langue du menu utilisateur, accessible à tous, y compris aux personnes sans accès aux paramètres. Tout le tableau de bord change d’un coup, sans recharger la page : navigation, cartes, paramètres, mode édition, notifications, nombres et dates. Le choix est enregistré sur cet appareil et dans votre compte Home Assistant, et vous suit donc sur vos autres appareils.

Langue utilisée, la première qui correspond l’emporte :

1. Votre propre choix dans les Paramètres ou le menu utilisateur.
2. L’option de stratégie `language:` (langue par défaut du tableau de bord, définie en YAML). Elle accepte tout code de langue dont dispose Nuvio (`en`, `pl`, `fr` …) ; un code régional comme `fr-CA` se ramène à `fr`.
3. La langue choisie dans l’assistant de première configuration. Seule compte une langue sur laquelle vous avez réellement appuyé : une langue enregistrée automatiquement par les versions précédentes (souvent l’anglais quand le navigateur n’était ni en polonais ni en anglais) est ignorée, et c’est le navigateur qui décide.
4. Les langues de votre navigateur, par ordre de préférence : d’abord le code complet (`pt-br`), puis la langue seule (`pt`). Si aucune n’est disponible, l’anglais.

Les textes non traduits dans la langue choisie s’affichent en anglais.

### Ajouter une langue

Une langue tient dans un seul fichier JSON. Aucune modification du code n’est nécessaire.

1. Créez `src/locales/<code>.json`, où `<code>` est le code de la langue en minuscules (`de`, `pt-br` …) ; le contrôle et la compilation refusent tout autre nom de fichier. Le plus simple est de partir d’une copie de `src/locales/en.json`, le catalogue de référence.
2. Complétez son bloc `_meta` :

   ```json
   "_meta": {
     "name": "Deutsch",
     "locale": "de-DE",
     "flag": "🇩🇪",
     "intro": "Oberfläche auf Deutsch"
   }
   ```

   `name` (le nom de la langue dans cette langue, affiché dans les sélecteurs de langue) et `locale` (dates, nombres et règles du pluriel) sont obligatoires. `flag` et `intro` sont facultatifs : l’assistant de première configuration les affiche à l’étape de la langue (sinon, un globe et le nom).
3. Traduisez les valeurs. Gardez tels quels les clés, les `{variables}` et les suffixes de pluriel, et fournissez toutes les formes de pluriel dont votre langue a besoin (voir [Développement](development.md#traductions)). Une clé absente s’affiche en anglais. Écrivez du texte brut : pas de balises HTML et, hors de l’anglais, pas de guillemet droit `"` (utilisez les guillemets typographiques de votre langue) ; le contrôle les refuse, car le texte des catalogues est inséré dans la page en HTML.
4. Vérifiez le catalogue : `python3 tools/i18n_check.py --lang <code>` liste les clés manquantes et obsolètes, et `python3 tools/i18n_check.py` contrôle les variables, les formes de pluriel et `_meta`.
5. Compilez avec `python3 tools/build.py`. Le catalogue est compilé dans `dist/nuvio-locale-<code>.<hash>.json` et la langue est ajoutée au manifeste intégré au bundle : elle apparaît dans les Paramètres, le menu utilisateur et l’assistant, et `language: <code>` comme la détection du navigateur la reconnaissent.

L’anglais, le polonais et le français doivent rester complets (`REQUIRED` dans `tools/i18n_check.py`) ; une autre langue peut être partielle, et le contrôle se contente alors d’un avertissement indiquant sa couverture.

> [!TIP]
> Pour reprendre un tableau de bord généré sous forme de YAML ordinaire, utilisez *Prendre le contrôle* dans l’éditeur du tableau de bord. Toutes les cartes `custom:nuvio-*` continuent de fonctionner.

## Préréglages

La configuration (disposition + apparence) peut être exportée et importée en JSON. Les préréglages personnels sont conservés hors du dépôt.


## Horloge, pastilles d’onglets et barre latérale masquée

- **Horloge dans l’en-tête.** Mettez `{time}` ou `{date}` dans le titre ou le sous-titre d’une vue (éditeur d’en-tête, ou **Ajouter une horloge**). L’heure suit le format 12 ou 24 h du profil Home Assistant et se met à jour chaque minute.
- **Pastilles d’onglets.** Dans **Paramètres > Vues**, la colonne **Pastille** choisit quoi compter pour chaque vue : lumières, interrupteurs, ventilateurs, climatisation ou personnes allumés ou présents, médias en lecture, ou **Entités choisies** (identifiants séparés par des virgules). Le nombre apparaît sur l’onglet du haut seulement s’il dépasse 0. Stocké dans `wiz.vx.<vue>.badge` = `{ m: on | active, d: <domaine> }` ou `{ m: on, e: [<entités>] }`.
- **Masquer la barre latérale.** Activez **Masquer la barre latérale** dans **Paramètres > Vues** : la barre et son bouton Paramètres disparaissent sur ordinateur et tablette quels que soient les interrupteurs **Barre latérale** des vues (la barre du téléphone reste). Les vues absentes des onglets du haut passent dans le menu du profil. Pour revenir aux paramètres : menu du profil, crayon, ou `?nuvio_settings` à la fin de l’adresse d’une vue Nuvio. Cela n’ouvre les paramètres qu’aux personnes autorisées à modifier, jamais sur une vue verrouillée par PIN. C’est la barre de Nuvio ; celle de Home Assistant se masque avec Kiosk Mode (**Intégrations**).
