const { app, BrowserWindow, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let server;

const EMPRESA_JGL = {
  configurada: true,
  nomeFantasia: 'JGL',
  razaoSocial: 'JGL - Instalações Elétricas e Ar-Condicionado',
  documento: '36.359.331/0001-60',
  telefone: '',
  email: '',
  endereco: '',
  atividade: 'Instalações Elétricas e Ar-Condicionado',
  dadosPagamento: '',
  rodape: '',
  corPrimaria: '#0b3d91',
  logoDataUrl: '',
  usarLogoPadrao: true
};

function copiarSeExistir(origem, destino) {
  if (!fs.existsSync(destino) && fs.existsSync(origem)) {
    fs.copyFileSync(origem, destino);
    return true;
  }

  return false;
}

function prepararDiretorioDeDados() {
  const appData = app.getPath('appData');
  const dataDir = path.join(appData, 'OrcaFacil');
  const arquivoOrcamentos = path.join(dataDir, 'orcamentos.json');
  const arquivoEmpresa = path.join(dataDir, 'empresa.json');

  fs.mkdirSync(dataDir, { recursive: true });

  const pastasLegadas = [
    path.join(appData, 'JGL Orcamentos'),
    path.join(appData, 'jgl-orcamentos'),
    path.join(appData, 'JGLORCAMENTOS')
  ];

  let migrouJgl = false;

  for (const pastaLegada of pastasLegadas) {
    const orcamentosLegados = path.join(pastaLegada, 'orcamentos.json');
    const empresaLegada = path.join(pastaLegada, 'empresa.json');

    if (copiarSeExistir(orcamentosLegados, arquivoOrcamentos)) {
      migrouJgl = true;
    }

    copiarSeExistir(empresaLegada, arquivoEmpresa);
  }

  if (migrouJgl && !fs.existsSync(arquivoEmpresa)) {
    fs.writeFileSync(
      arquivoEmpresa,
      JSON.stringify(EMPRESA_JGL, null, 2),
      'utf8'
    );
  }

  app.setPath('userData', dataDir);
  process.env.ORCAFACIL_DATA_DIR = dataDir;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1220,
    height: 840,
    minWidth: 900,
    minHeight: 680,
    title: 'OrçaFácil',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#f4f6f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

app.whenReady().then(() => {
  prepararDiretorioDeDados();
  server = require('../backend/src/server').startServer(0);
  const mainWindow = createWindow();

  server.on('listening', () => {
    const { port } = server.address();
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  });

  server.on('error', error => {
    dialog.showErrorBox(
      'Erro ao abrir o OrçaFácil',
      `Não foi possível iniciar o servidor local.\n\n${error.message}`
    );
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const mainWindow = createWindow();

      if (server && server.listening) {
        const { port } = server.address();
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});
