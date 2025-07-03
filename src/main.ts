// main.ts

import {
	App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab,
	Setting, DropdownComponent
} from 'obsidian';
import { VIEW_TYPE_SPIRITSBOOK, SpiritsBookView } from '../spiritsbookView';

/**
 * Plugin settings interface.
 */
interface SpiritsBookSettings {
	mySetting: string;
	language: 'pt-BR' | 'en' | 'es' | 'fr';
}

/**
 * Default plugin settings.
 */
const DEFAULT_SETTINGS: SpiritsBookSettings = {
	mySetting: 'default',
	language: 'en' // default language: English
};

/**
 * Main class for the SpiritsBook plugin.
 */
export default class SpiritsBookPlugin extends Plugin {
	settings: SpiritsBookSettings;

	/**
	 * Called when the plugin is loaded.
	 */
	async onload() {
		console.log('[SpiritsBook] Plugin started');

		await this.loadSettings();
		console.log('[SpiritsBook] Settings loaded:', this.settings);

		// Adds icon to the left sidebar
		const ribbonIconEl = this.addRibbonIcon('book', 'Open The Spirit\'s Book', () => {
			new Notice('SpiritsBook activated!');
			this.activateView();
		});
		ribbonIconEl.addClass('spiritsbook-ribbon-class');

		// Adds item to the status bar
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('📘 SpiritsBook active');

		// Command: open a simple modal
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open simple modal (SpiritsBook)',
			callback: () => {
				new SpiritsBookModal(this.app, this.settings.language).open();
			}
		});

		// Command: insert text into the editor
		this.addCommand({
			id: 'insert-text-editor',
			name: 'Insert text in editor',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection('Text inserted by SpiritsBook');
			}
		});

		// Command: open modal only if Markdown editor is active
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

		// Add settings tab
		this.addSettingTab(new SpiritsBookSettingTab(this.app, this));

		// Register sidebar view
		this.registerView(VIEW_TYPE_SPIRITSBOOK, (leaf) => new SpiritsBookView(leaf, this));

		// Automatically open view after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.activateView();
		});
	}

	/**
	 * Opens the SpiritsBook sidebar view.
	 */
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

	/**
	 * Called when the plugin is unloaded.
	 */
	onunload() {
		console.log('[SpiritsBook] Plugin unloaded');
	}

	/**
	 * Load plugin settings.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save plugin settings.
	 */
	async saveSettings() {
		console.log('[SpiritsBook] Saving settings:', this.settings);
		await this.saveData(this.settings);
	}
}

/**
 * Simple modal displaying the current language.
 */
class SpiritsBookModal extends Modal {
	language: string;

	constructor(app: App, language: string) {
		super(app);
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText(`Current language: ${this.language}`);
	}

	onClose() {
		this.contentEl.empty();
	}
}

/**
 * Plugin settings tab.
 */
class SpiritsBookSettingTab extends PluginSettingTab {
	plugin: SpiritsBookPlugin;

	constructor(app: App, plugin: SpiritsBookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Text setting
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

		// Language setting
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

						// Reload view if open
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