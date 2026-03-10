# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# 🔐 Encrypted Vault – Password Manager (Electron + React + TypeScript)

Aplicación de escritorio para **guardar contraseñas de forma cifrada** utilizando **Electron, React y TypeScript**.

Las contraseñas se almacenan en un **vault cifrado localmente**, protegido por una **master password**.
La aplicación **no utiliza servidores ni almacenamiento remoto**: todos los datos quedan en tu computadora.

---

# ✨ Características

* 🔑 Login de usuario
* 🔐 Master password para desbloquear el vault
* 🔒 Cifrado AES-256-GCM
* 🧂 Derivación de clave con `scrypt`
* 🧂 Hash de contraseñas con `bcrypt`
* 🗂 Vault local por usuario
* 👁 Mostrar / ocultar contraseñas
* 📋 Copiar contraseña al portapapeles
* ➕ Agregar / editar / eliminar cuentas
* 👤 Eliminación completa de usuario (incluye su vault)

---

# 🧠 Arquitectura

La aplicación utiliza la arquitectura estándar de Electron:

```
React UI (Renderer)
        │
        │ window.api
        ▼
Preload (puente seguro)
        │
        │ IPC
        ▼
Main process (Node)
        │
        ├─ auth.ts   → gestión de usuarios
        │
        └─ vault.ts  → cifrado y almacenamiento
```

### Seguridad

* `contextIsolation` activado
* `nodeIntegration` desactivado
* acceso a Node solo a través de `preload`
* contraseñas hasheadas con **bcrypt**
* vault cifrado con **AES-256-GCM**

---

# 📦 Estructura del proyecto

```
project/
│
├─ electron/
│   ├─ main.ts
│   ├─ preload.ts
│   ├─ auth.ts
│   └─ vault.ts
│
├─ src/
│   ├─ App.tsx
│   ├─ main.tsx
│   └─ electron.d.ts
│
├─ dist/
├─ dist-electron/
│
├─ package.json
└─ tsconfig.json
```

---

# 💾 Dónde se guardan los datos

Los archivos se guardan en la carpeta de datos de la aplicación.

### Windows

```
C:\Users\TU_USUARIO\AppData\Roaming\NOMBRE_APP\
```

Ejemplo:

```
auth.json
vaults/
   gabriel.vault
```

---

# 🔐 Cómo funciona el cifrado

El vault se cifra usando:

```
AES-256-GCM
```

La clave se deriva con:

```
scrypt(masterPassword, salt)
```

Cada vault contiene:

```
{
  salt
  iv
  tag
  data (ciphertext)
}
```

Las entradas reales:

```
{
  account
  username
  password
}
```

están dentro de `data` **cifradas**.

---

# 🚀 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/TU_USUARIO/encrypted-vault.git
cd encrypted-vault
```

Instalar dependencias:

```bash
npm install
```

---

# ▶ Ejecutar en desarrollo

```bash
npm run dev
```

Esto inicia:

* Vite
* Electron
* React

---

# 📦 Build

Para generar el build:

```bash
npm run build
```

---

# ⚠ Importante

* La aplicación **no sincroniza datos**.
* Todo el vault se guarda **localmente**.
* Si se pierde la **master password**, **no hay forma de recuperar las contraseñas**.

---

# 🛠 Tecnologías

* Electron
* React
* TypeScript
* Vite
* bcryptjs
* Node Crypto

---

# 📜 Licencia

MIT
