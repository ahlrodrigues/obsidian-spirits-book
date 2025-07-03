import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

/**
 * Interface para armazenar as configurações do plugin.
 * Aqui você define os campos que o usuário poderá configurar.
 */
interface SpiritsBookSettings {
	mySetting: string;
}

/**
 * Configurações padrão do plugin.
 */
const DEFAULT_SETTINGS: SpiritsBookSettings = {
	mySetting: 'default'
}

/**
 * Classe principal do plugin. Herda da classe Plugin do Obsidian.
 */
export default class SpiritsBookPlugin extends Plugin {
	settings: SpiritsBookSettings;

	/**
	 * Este método é chamado automaticamente quando o plugin é carregado.
	 */
	async onload() {
		// Carrega as configurações salvas pelo usuário, ou aplica os padrões.
		await this.loadSettings();

		// Cria um ícone na barra lateral esquerda do Obsidian.
		const ribbonIconEl = this.addRibbonIcon('dice', 'SpiritsBook Plugin', (evt: MouseEvent) => {
			// Executado quando o usuário clica no ícone.
			new Notice('SpiritsBook ativado!');
		});
		// Adiciona uma classe CSS opcional (pode ser usada para estilizar o botão).
		ribbonIconEl.addClass('spiritsbook-ribbon-class');

		// Adiciona um item de status na barra inferior (não funciona em apps móveis).
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('SpiritsBook ativo');

		// Comando simples que abre um modal (sem condições)
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Abrir modal simples (SpiritsBook)',
			callback: () => {
				new SpiritsBookModal(this.app).open();
			}
		});

		// Comando de editor: insere texto onde o cursor estiver
		this.addCommand({
			id: 'insert-text-editor',
			name: 'Inserir texto no editor',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection()); // Exibe a seleção atual no console
				editor.replaceSelection('Texto inserido pelo SpiritsBook');
			}
		});

		// Comando condicional: só aparece se o usuário estiver em uma nota Markdown
		this.addCommand({
			id: 'open-modal-markdown',
			name: 'Abrir modal se Markdown ativo',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new SpiritsBookModal(this.app).open();
					}
					return true; // Só mostra o comando se Markdown estiver ativo
				}
			}
		});

		// Adiciona a aba de configurações do plugin
		this.addSettingTab(new SpiritsBookSettingTab(this.app, this));

		// Exemplo de listener global (pode ser removido se não for usado)
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt); // Apenas exemplo, remove se não for necessário
		});

		// Exemplo de intervalo (a cada 5 minutos). Pode ser removido também.
		this.registerInterval(window.setInterval(() => console.log('setInterval ativo'), 5 * 60 * 1000));
	}

	/**
	 * Chamado automaticamente quando o plugin é descarregado/desativado.
	 */
	onunload() {
		// Pode adicionar lógica de limpeza se necessário
	}

	/**
	 * Carrega as configurações salvas do armazenamento local do Obsidian.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Salva as configurações no armazenamento local.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

/**
 * Modal personalizado que aparece quando o comando é ativado.
 */
class SpiritsBookModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Olá! Este é o SpiritsBook.');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Aba de configurações do plugin, visível nas configurações do Obsidian.
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

		// Cria um campo de texto nas configurações
		new Setting(containerEl)
			.setName('Chave do SpiritsBook')
			.setDesc('Configure aqui o valor que será usado pelo plugin')
			.addText(text => text
				.setPlaceholder('Digite algo...')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
