import { ItemView, WorkspaceLeaf, Notice, FileSystemAdapter } from "obsidian";
import * as fs from 'fs/promises';
import * as path from 'path';

// Unique view type identifier for the plugin
export const VIEW_TYPE_SPIRITSBOOK = "spiritsbook-view";

// Type representing supported language codes
type SupportedLanguage = 'pt-BR' | 'en' | 'es' | 'fr';

// Internationalization strings for each language
const i18n: Record<SupportedLanguage, { [key: string]: string }> = {
  "pt-BR": {
    title: "Livro dos Espíritos",
    question: "Pergunta",
    all: "📖 Todas",
    favorites: "⭐ Favoritas",
    previous: "⬅️ Anterior",
    next: "Próxima ➡️",
    favorite: "⭐ Favoritar",
    random: "🎲 Aleatória",
    removedFromFavorites: "❌ Removido dos favoritos",
    addedToFavorites: "⭐ Adicionado aos favoritos",
    randomShown: "🎲 Pergunta aleatória exibida",
    errorLoading: "Erro ao carregar o conteúdo do livro.",
    noFavorites: "Nenhuma pergunta favorita ainda."
  },
  "en": {
    title: "The Spirits' Book",
    question: "Question",
    all: "📖 All",
    favorites: "⭐ Favorites",
    previous: "⬅️ Previous",
    next: "Next ➡️",
    favorite: "⭐ Favorite",
    random: "🎲 Random",
    removedFromFavorites: "❌ Removed from favorites",
    addedToFavorites: "⭐ Added to favorites",
    randomShown: "🎲 Random question shown",
    errorLoading: "Failed to load book content.",
    noFavorites: "No favorite questions yet."
  },
  "es": {
    title: "El Libro de los Espíritus",
    question: "Pregunta",
    all: "📖 Todas",
    favorites: "⭐ Favoritas",
    previous: "⬅️ Anterior",
    next: "Siguiente ➡️",
    favorite: "⭐ Favorita",
    random: "🎲 Aleatoria",
    removedFromFavorites: "❌ Eliminado de favoritos",
    addedToFavorites: "⭐ Añadido a favoritos",
    randomShown: "🎲 Pregunta aleatoria mostrada",
    errorLoading: "Error al cargar el contenido del libro.",
    noFavorites: "Aún no hay preguntas favoritas."
  },
  "fr": {
    title: "Le Livre des Esprits",
    question: "Question",
    all: "📖 Toutes",
    favorites: "⭐ Favoris",
    previous: "⬅️ Précédente",
    next: "Suivante ➡️",
    favorite: "⭐ Favori",
    random: "🎲 Aléatoire",
    removedFromFavorites: "❌ Supprimé des favoris",
    addedToFavorites: "⭐ Ajouté aux favoris",
    randomShown: "🎲 Question aléatoire affichée",
    errorLoading: "Échec du chargement du contenu du livre.",
    noFavorites: "Aucune question favorite pour le moment."
  }
};

export class SpiritsBookView extends ItemView {
  plugin: any;
  container: HTMLElement;
  questions: any[] = [];
  currentIndex: number = 0;
  favorites: Set<number> = new Set();

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_SPIRITSBOOK;
  }

  getDisplayText() {
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    return i18n[lang].title;
  }

  getIcon() {
    return "book";
  }

  async onOpen() {
    this.injectStyles();
    this.container = this.containerEl.children[1] as HTMLElement;
    this.container.empty();
    await this.loadQuestions();
    this.renderUI();
  }

  async loadQuestions() {
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    try {
      const adapter = this.plugin.app.vault.adapter;
      if (!(adapter instanceof FileSystemAdapter)) {
        new Notice("Incompatible storage adapter.");
        return;
      }
      const basePath = adapter.getBasePath();
      let dataPath: string;
      try {
        const overridePathRaw = await fs.readFile(path.join(basePath, ".obsidian/plugins/obsisdian-spirits-book/path.json"), "utf-8");
        const override = JSON.parse(overridePathRaw);
        dataPath = path.isAbsolute(override.path) ? override.path : path.join(basePath, override.path);
      } catch {
        dataPath = path.join(basePath, ".obsidian/plugins/obsisdian-spirits-book/data");
      }
      const fullPath = path.join(dataPath, `livro_${lang}.json`);
      const content = await fs.readFile(fullPath, "utf-8");
      this.questions = JSON.parse(content);
    } catch (e) {
      new Notice(i18n[lang].errorLoading);
    }
  }

  renderUI() {
    if (!this.questions.length) return;
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    const t = i18n[lang];
    this.container.empty();

    const wrapper = this.container.createDiv("spiritsbook-wrapper");
    const title = wrapper.createEl("h1", { text: "📘 " + this.getDisplayText() });
    title.style.textAlign = "center";

    const tabs = wrapper.createDiv("spiritsbook-tabs");
    tabs.style.marginTop = "1em";
    tabs.style.marginBottom = "1.5em";
    tabs.style.textAlign = "center";
    tabs.style.gap = "1em";
    tabs.style.display = "flex";
    tabs.style.justifyContent = "center";

    const tabAll = tabs.createEl("button", { text: t.all });
    const tabFav = tabs.createEl("button", { text: t.favorites });
    tabAll.onclick = () => this.renderUI();
    tabFav.onclick = () => this.renderFavorites();

    const display = wrapper.createDiv("spiritsbook-display") as HTMLDivElement;

    const nav = wrapper.createDiv("spiritsbook-nav");
    const prevBtn = nav.createEl("button", { text: t.previous });
    const nextBtn = nav.createEl("button", { text: t.next });
    prevBtn.onclick = () => this.showQuestion(this.currentIndex - 1);
    nextBtn.onclick = () => this.showQuestion(this.currentIndex + 1);

    const favContainer = wrapper.createDiv("spiritsbook-fav-container");
    const favBtn = favContainer.createEl("button", { text: t.favorite });
    const rndBtn = favContainer.createEl("button", { text: t.random });
    favBtn.onclick = () => this.toggleFavorite();
    rndBtn.onclick = () => this.showRandom();

    const footer = wrapper.createDiv("spiritsbook-footer");
    footer.style.textAlign = "center";
    const select = footer.createEl("select") as HTMLSelectElement;
    this.questions.forEach((q, i) => {
      select.add(new Option(`#${q.numero} - ${q.pergunta?.substring(0, 50) || "..."}`, i.toString()));
    });
    select.onchange = () => this.showQuestion(parseInt(select.value));

    this.showQuestion(0);
  }

  renderFavorites() {
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    const t = i18n[lang];
    this.container.empty();

    const wrapper = this.container.createDiv("spiritsbook-wrapper");
    const tabs = wrapper.createDiv("spiritsbook-tabs");
    const tabAll = tabs.createEl("button", { text: t.all });
    const tabFav = tabs.createEl("button", { text: t.favorites });
    tabAll.onclick = () => this.renderUI();
    tabFav.onclick = () => this.renderFavorites();

    const favs = this.questions.filter(q => this.favorites.has(q.numero));
    if (!favs.length) {
      wrapper.createEl("p", { text: t.noFavorites });
      return;
    }

    const list = wrapper.createEl("ul", { cls: "favorites-list" });
    favs.forEach((q) => {
      const li = list.createEl("li");
      li.createEl("a", {
        text: `#${q.numero} - ${q.pergunta?.substring(0, 50) || "..."}`,
        href: "#"
      }).onclick = (e) => {
        e.preventDefault();
        const index = this.questions.findIndex(item => item.numero === q.numero);
        this.renderUI();
        setTimeout(() => this.showQuestion(index), 10);
      };
    });
  }

  showQuestion(index: number) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    const q = this.questions[index];

    const display = this.container.querySelector(".spiritsbook-display") as HTMLDivElement;
    if (!display) return;
    display.empty();

    const questionEl = display.createDiv({ cls: 'spiritsbook-question' });
    questionEl.createEl("h2", { text: `${this.translate("question", this.plugin.settings.language)} ${q.numero}`, attr: { style: "text-align: center;" } });
    questionEl.createEl("p", { text: q.pergunta });

    const answerEl = display.createEl("blockquote", { text: q.resposta });
    answerEl.addClass("spiritsbook-answer");
  }

  toggleFavorite() {
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    const t = i18n[lang];
    const q = this.questions[this.currentIndex];
    if (this.favorites.has(q.numero)) {
      this.favorites.delete(q.numero);
      new Notice(`${t.removedFromFavorites}: #${q.numero}`);
    } else {
      this.favorites.add(q.numero);
      new Notice(`${t.addedToFavorites}: #${q.numero}`);
    }
  }

  showRandom() {
    const lang = (this.plugin.settings.language || "en") as SupportedLanguage;
    const t = i18n[lang];
    const index = Math.floor(Math.random() * this.questions.length);
    this.showQuestion(index);
    new Notice(t.randomShown);
  }

  async onClose() {
    console.log("[SpiritsBook] View closed");
  }

  private translate(key: string, lang: SupportedLanguage = "en") {
    return i18n[lang]?.[key] || key;
  }

  injectStyles() {
    const styleId = "spiritsbook-inline-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .spiritsbook-wrapper {
        padding: 1em 0.5em;
      }
      .spiritsbook-answer {
        background-color: var(--background-primary-alt);
        color: var(--text-normal);
        padding: 1em;
        border-radius: 8px;
        margin-top: 1em;
        font-style: italic;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        width: 100%;
        box-sizing: border-box;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }
      .spiritsbook-question {
        margin-bottom: 1em;
      }
      .spiritsbook-nav,
      .spiritsbook-fav-container,
      .spiritsbook-tabs {
        text-align: center;
        margin-top: 1em;
      }
      .spiritsbook-tabs button:not(:last-child),
      .spiritsbook-nav button:not(:last-child),
      .spiritsbook-fav-container button:not(:last-child) {
        margin-right: 0.5em;
      }
      .spiritsbook-footer {
        margin-top: 2em;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }
}