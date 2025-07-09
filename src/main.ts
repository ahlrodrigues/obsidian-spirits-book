// main.ts

import {
	App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab,
	Setting, DropdownComponent
} from 'obsidian';
import { VIEW_TYPE_SPIRITSBOOK, SpiritsBookView } from '../spiritsbookView';

// Interface for plugin settings stored in settings.json
interface SpiritsBookSettings {
	mySetting: string;
	language: 'pt-BR' | 'en' | 'es' | 'fr';
}

// Default values for plugin settings
const DEFAULT_SETTINGS: SpiritsBookSettings = {
	mySetting: 'default',
	language: 'en'
};

export default class SpiritsBookPlugin extends Plugin {
	settings: SpiritsBookSettings;

	// Called when the plugin is loaded
	async onload() {

		await this.loadSettings();
		this.registerStylesheet();


		// Add ribbon icon to sidebar
		const ribbonIconEl = this.addRibbonIcon('book', 'Open The Spirit\'s Book', () => {
			new Notice('SpiritsBook activated!');
			this.activateView();
		});
		ribbonIconEl.addClass('spiritsbook-ribbon-class');

		// Add sample commands
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open simple modal (SpiritsBook)',
			callback: () => {
				new SpiritsBookModal(this.app, this.settings.language).open();
			}
		});

		this.addCommand({
			id: 'insert-text-editor',
			name: 'Insert text in editor',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection('Text inserted by SpiritsBook');
			}
		});

		this.addCommand({
			id: 'open-modal-markdown',
			name: 'Open modal if Markdown active',
			checkCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					if (!checking) {
						new SpiritsBookModal(this.app, this.settings.language).open();
					}
					return true;
				}
				return false;
			}
		});

		// Register plugin setting tab
		this.addSettingTab(new SpiritsBookSettingTab(this.app, this));

		// Register custom view
		this.registerView(VIEW_TYPE_SPIRITSBOOK, (leaf) => new SpiritsBookView(leaf, this));

		// Auto-activate view when layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.activateView();
		});
	}

	// Called when the plugin is unloaded
	onunload() {
	}

	async registerStylesheet() {
		const adapter = this.app.vault.adapter;
		const cssPath = `${this.manifest.dir}/style.css`;
		try {
			const cssContent = await adapter.read(cssPath);
			const style = document.createElement("style");
			style.id = "spiritsbook-style";
			style.textContent = cssContent;
			document.head.appendChild(style);
		} catch (e) {
			console.error("[SpiritsBook] Failed to load style.css:", e);
		}
	}
	
	
	// Open the sidebar view, creating it if necessary
	async activateView() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_SPIRITSBOOK)[0];

		if (existing) {
			await this.app.workspace.revealLeaf(existing);
		} else {
			const leaf = this.app.workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_SPIRITSBOOK,
					active: true
				});
			} else {
				console.warn('[SpiritsBook] Could not obtain a right-side leaf.');
			}
		}
	}

	// Load settings from internal Obsidian storage (settings.json)
	async loadSettings() {
		const savedSettings = await this.loadData(); // 👈 this does NOT create data.json if used only here
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);
	}

	// Save settings to internal storage
	async saveSettings() {
		await this.saveData(this.settings); // 👈 centralized and safe
	}
}

// Modal window with question, answer, and close button
class SpiritsBookModal extends Modal {
	language: string;

	constructor(app: App, language: string) {
		super(app);
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const container = contentEl.createDiv({ cls: 'spiritsbook-container' });

		container.createEl('div', {
			cls: 'spiritsbook-question',
			text: '1019. Where is the law of God written?'
		});

		container.createEl('div', {
			cls: 'spiritsbook-answer',
			text: 'In the conscience.'
		});

		const buttons = container.createDiv({ cls: 'spiritsbook-buttons' });
		const closeBtn = buttons.createEl('button', {
			cls: 'spiritsbook-button',
			text: 'Close'
		});
		closeBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}

// Settings tab for configuring plugin options
class SpiritsBookSettingTab extends PluginSettingTab {
	plugin: SpiritsBookPlugin;

	constructor(app: App, plugin: SpiritsBookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Example setting input
		new Setting(containerEl)
			.setName('SpiritsBook Key')
			.setDesc('Example configurable text')
			.addText(text => text
				.setPlaceholder('Type something...')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		// Language selection dropdown
		new Setting(containerEl)
			.setName('Language')
			.setDesc('Select content language')
			.addDropdown((dropdown: DropdownComponent) => {
				dropdown
					.addOption('pt-BR', 'Portuguese')
					.addOption('en', 'English')
					.addOption('es', 'Spanish')
					.addOption('fr', 'French')
					.setValue(this.plugin.settings.language)
					.onChange(async (value: 'pt-BR' | 'en' | 'es' | 'fr') => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();

						// Reload the view to apply the new language
						const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SPIRITSBOOK)[0];
						if (existingLeaf != null) {
							await existingLeaf.detach();
						}

						const newLeaf = this.app.workspace.getRightLeaf(false);
						if (newLeaf) {
							await newLeaf.setViewState({
								type: VIEW_TYPE_SPIRITSBOOK,
								active: true
							});
						}
					});
			});
	}
}
