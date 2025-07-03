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
		console.log('[SpiritsBook] Plugin started');

		await this.loadSettings();
		console.log('[SpiritsBook] Settings loaded:', this.settings);

		// Inject custom styles for modals and views
		this.injectStyles();

		// Add ribbon icon to sidebar
		const ribbonIconEl = this.addRibbonIcon('book', 'Open The Spirit\'s Book', () => {
			new Notice('SpiritsBook activated!');
			this.activateView();
		});
		ribbonIconEl.addClass('spiritsbook-ribbon-class');

		// Status bar info
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('📘 SpiritsBook active');

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
		console.log('[SpiritsBook] Plugin unloaded');
	}

	// Inject CSS styles for modals and layout
	injectStyles() {
		const style = document.createElement("style");
		style.textContent = `
			.spiritsbook-container {
				font-size: 16px;
				font-family: 'Segoe UI', sans-serif;
				background-color: var(--background-primary);
				color: var(--text-normal);
				padding: 20px;
				border-radius: 8px;
				max-width: 600px;
				margin: auto;
			}
			.spiritsbook-question {
				font-weight: bold;
				margin-bottom: 10px;
				font-size: 1.1em;
			}
			.spiritsbook-answer {
				background-color: var(--background-secondary);
				padding: 15px;
				border-radius: 6px;
				margin-top: 10px;
				white-space: pre-wrap;
				font-size: 15px;
				line-height: 1.5;
			}
			.spiritsbook-buttons {
				display: flex;
				justify-content: flex-end;
				margin-top: 20px;
			}
			.spiritsbook-button {
				background-color: var(--interactive-accent);
				color: white;
				border: none;
				padding: 8px 16px;
				border-radius: 6px;
				cursor: pointer;
				font-size: 14px;
			}
			.spiritsbook-button:hover {
				background-color: var(--interactive-accent-hover);
			}
		`;
		document.head.appendChild(style);
	}

	// Open the sidebar view, creating it if necessary
	async activateView() {
		console.log('[SpiritsBook] Attempting to open sidebar view...');
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_SPIRITSBOOK)[0];

		if (existing) {
			console.log('[SpiritsBook] View already exists, revealing...');
			await this.app.workspace.revealLeaf(existing);
		} else {
			const leaf = this.app.workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_SPIRITSBOOK,
					active: true
				});
				console.log('[SpiritsBook] View created on the right sidebar.');
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
		console.log('[SpiritsBook] Saving settings:', this.settings);
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
						console.log('[SpiritsBook] Language changed to:', value);
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();

						// Reload the view to apply the new language
						const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SPIRITSBOOK)[0];
						if (existingLeaf != null) {
							console.log('[SpiritsBook] Closing existing view to apply new language...');
							await existingLeaf.detach();
						}

						const newLeaf = this.app.workspace.getRightLeaf(false);
						if (newLeaf) {
							console.log('[SpiritsBook] Opening new view with updated language...');
							await newLeaf.setViewState({
								type: VIEW_TYPE_SPIRITSBOOK,
								active: true
							});
						}
					});
			});
	}
}
