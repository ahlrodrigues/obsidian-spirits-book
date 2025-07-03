// spiritsbookView.ts
import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import * as fs from 'fs/promises';
import * as path from 'path';

export const VIEW_TYPE_SPIRITSBOOK = "spiritsbook-view";

const i18n = {
	"pt-BR": {
		all: "📖 Todas",
		favorites: "⭐ Favoritas",
		previous: "⬅️ Anterior",
		next: "Próxima ➡️",
		favorite: "⭐ Favoritar",
		random: "🎲 Aleatória",
		removedFromFavorites: "❌ Removido dos favoritos",
		addedToFavorites: "⭐ Adicionado aos favoritos",
		randomShown: "🎲 Pergunta aleatória exibida",
		errorLoading: "Erro ao carregar o conteúdo do livro."
	},
	en: {
		all: "📖 All",
		favorites: "⭐ Favorites",
		previous: "⬅️ Previous",
		next: "Next ➡️",
		favorite: "⭐ Favorite",
		random: "🎲 Random",
		removedFromFavorites: "❌ Removed from favorites",
		addedToFavorites: "⭐ Added to favorites",
		randomShown: "🎲 Random question shown",
		errorLoading: "Failed to load book content."
	},
	es: {
		all: "📖 Todas",
		favorites: "⭐ Favoritas",
		previous: "⬅️ Anterior",
		next: "Siguiente ➡️",
		favorite: "⭐ Favorita",
		random: "🎲 Aleatoria",
		removedFromFavorites: "❌ Eliminado de favoritos",
		addedToFavorites: "⭐ Añadido a favoritos",
		randomShown: "🎲 Pregunta aleatoria mostrada",
		errorLoading: "Error al cargar el contenido del libro."
	},
	fr: {
		all: "📖 Toutes",
		favorites: "⭐ Favoris",
		previous: "⬅️ Précédente",
		next: "Suivante ➡️",
		favorite: "⭐ Favori",
		random: "🎲 Aléatoire",
		removedFromFavorites: "❌ Supprimé des favoris",
		addedToFavorites: "⭐ Ajouté aux favoris",
		randomShown: "🎲 Question aléatoire affichée",
		errorLoading: "Échec du chargement du contenu du livre."
	},
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
		return "The Spirit's Book";
	}

	getIcon() {
		return "book";
	}

	// Called when the view is opened
	async onOpen() {
		console.log("[SpiritsBook] View opened");
		this.container = this.containerEl.children[1] as HTMLElement;
		this.container.empty();

		// Load questions
		await this.loadQuestions();

		// Render UI
		this.renderUI();
	}

	// Loads the JSON file containing the questions
	async loadQuestions() {
		const lang = this.plugin.settings.language || "en";
		try {
			let basePath = this.plugin.app.vault.adapter.getBasePath();
			let dataPath: string;

			// Check if an external path override file exists
			try {
				const overridePathRaw = await fs.readFile(path.join(basePath, ".obsidian/plugins/obsisdian-spirits-book/path.json"), "utf-8");
				const override = JSON.parse(overridePathRaw);
				dataPath = path.isAbsolute(override.path)
					? override.path
					: path.join(basePath, override.path);
				console.log("[SpiritsBook] Using override path from path.json:", dataPath);
			} catch {
				// Default data folder
				dataPath = path.join(basePath, ".obsidian/plugins/obsisdian-spirits-book/data");
			}

			const fullPath = path.join(dataPath, `livro_${lang}.json`);
			console.log("[SpiritsBook] Reading local file:", fullPath);

			const content = await fs.readFile(fullPath, "utf-8");
			this.questions = JSON.parse(content);
			console.log(`[SpiritsBook] ${this.questions.length} questions loaded.`);
		} catch (e) {
			console.error("[SpiritsBook] Failed to load questions:", e);
			new Notice(i18n[this.plugin.settings.language as keyof typeof i18n].errorLoading);
		}
	}

	// Renders the plugin UI
	renderUI() {
		if (!this.questions.length) return;
		const t = i18n[this.plugin.settings.language as keyof typeof i18n];
		const wrapper = this.container.createDiv("spiritsbook-wrapper");

		// Tabs: All and Favorites
		const tabs = wrapper.createDiv("spiritsbook-tabs");
		const tabAll = tabs.createEl("button", { text: t.all });
		const tabFav = tabs.createEl("button", { text: t.favorites });

		// Dropdown: Select question
		const select = wrapper.createEl("select") as HTMLSelectElement;
		this.questions.forEach((q, i) => {
			select.add(new Option(`#${q.numero} - ${q.pergunta?.substring(0, 50) || "..."}`, i.toString()));
		});
		select.onchange = () => this.showQuestion(parseInt(select.value));

		// Display area
		const display = wrapper.createDiv("spiritsbook-display") as HTMLDivElement;

		// Navigation buttons
		const nav = wrapper.createDiv("spiritsbook-nav");
		const prevBtn = nav.createEl("button", { text: t.previous });
		const nextBtn = nav.createEl("button", { text: t.next });
		const favBtn = nav.createEl("button", { text: t.favorite });
		const rndBtn = nav.createEl("button", { text: t.random });

		prevBtn.onclick = () => this.showQuestion(this.currentIndex - 1);
		nextBtn.onclick = () => this.showQuestion(this.currentIndex + 1);
		favBtn.onclick = () => this.toggleFavorite();
		rndBtn.onclick = () => this.showRandom();

		// Show first question
		this.showQuestion(0);
	}

	// Displays a question by index
	showQuestion(index: number) {
		if (index < 0 || index >= this.questions.length) return;
		this.currentIndex = index;
		const q = this.questions[index];

		const display = this.container.querySelector(".spiritsbook-display") as HTMLDivElement;
		display.empty();
		display.createEl("h2", { text: `#${q.numero}` });
		display.createEl("p", { text: q.pergunta });
		display.createEl("blockquote", { text: q.resposta });

		console.log(`[SpiritsBook] Displaying question #${q.numero}`);
	}

	// Toggles favorite status for the current question
	toggleFavorite() {
		const t = i18n[this.plugin.settings.language as keyof typeof i18n];
		const q = this.questions[this.currentIndex];
		if (this.favorites.has(q.numero)) {
			this.favorites.delete(q.numero);
			new Notice(`${t.removedFromFavorites}: #${q.numero}`);
		} else {
			this.favorites.add(q.numero);
			new Notice(`${t.addedToFavorites}: #${q.numero}`);
		}
	}

	// Displays a random question
	showRandom() {
		const index = Math.floor(Math.random() * this.questions.length);
		this.showQuestion(index);
		new Notice(i18n[this.plugin.settings.language as keyof typeof i18n].randomShown);
	}

	// Called when the view is closed
	async onClose() {
		console.log("[SpiritsBook] View closed");
	}
}
