# MyVault

![Electron](https://img.shields.io/badge/Electron-App-blue)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-Code-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**MyVault** es un gestor **local, privado y seguro** de contraseñas y
notas desarrollado con **Electron, React y TypeScript**.

La aplicación está diseñada para que el usuario mantenga el **control
total de sus datos**, sin depender de servicios en la nube ni
sincronización externa. Toda la información se guarda **cifrada
localmente en el dispositivo**.

------------------------------------------------------------------------

# Características

-   🔐 Almacenamiento **cifrado local**
-   👤 **Sistema de usuarios**
-   🔑 Vault protegido con contraseña independiente
-   📝 Gestor de **notas seguras**
-   🌙 Interfaz moderna con **tema oscuro**
-   💻 Aplicación de **escritorio**
-   📂 Datos almacenados **solo en el dispositivo**
-   🚫 **Sin conexión obligatoria a internet**

------------------------------------------------------------------------

# Tecnologías utilizadas

-   Electron
-   React
-   TypeScript
-   Vite
-   bcryptjs

Arquitectura simplificada:

    Electron (Main Process)
            │
            │ IPC
            ▼
    Preload (contextBridge)
            │
            ▼
    React Renderer

La aplicación utiliza:

-   `contextIsolation`
-   `sandbox`
-   `nodeIntegration: false`

para mejorar la seguridad.

------------------------------------------------------------------------

# Seguridad

MyVault fue desarrollado siguiendo buenas prácticas de seguridad:

-   cifrado del vault protegido por contraseña
-   aislamiento de contexto en Electron
-   bloqueo de navegación externa dentro de la aplicación
-   apertura de enlaces externos mediante el navegador del sistema
-   sandbox habilitado
-   comunicación controlada mediante IPC

Los datos se almacenan localmente en:

    AppData/Roaming/MyVault

Cada usuario posee sus propios archivos cifrados:

    username.vault
    username.notes.vault

------------------------------------------------------------------------

# Instalación

## Descargar ejecutable

Desde la sección **Releases** del repositorio.

Instalador:

    MyVault-Setup-x.x.x.exe

Versión portable:

    MyVault-Portable-x.x.x.exe

------------------------------------------------------------------------

# Open Source

La build es open source y puede mostrar advertencia de Windows por no estar firmada con certificado reconocido.

------------------------------------------------------------------------

# Compilar desde el código fuente

Requisitos:

-   Node.js 18 o superior
-   npm

Clonar repositorio:

``` bash
git clone https://github.com/SurvilaDeveloper/MyVault.git
cd MyVault
```

Instalar dependencias:

``` bash
npm install
```

Modo desarrollo:

``` bash
npm run dev
```

Construir aplicación:

``` bash
npm run dist
```

Los binarios se generarán en:

    /release

------------------------------------------------------------------------

# Estructura del proyecto

    electron/
     ├ main.ts
     ├ preload.ts

    src/
     ├ App.tsx
     ├ components/

    public/
     ├ myvault.png

    dist-electron/
    dist-renderer/
    release/

------------------------------------------------------------------------

# Roadmap

Funciones planificadas:

-   generador de contraseñas seguras
-   auto‑bloqueo del vault por inactividad
-   autodestrucción del portapapeles
-   importación y exportación de vault
-   mejoras de interfaz
-   soporte multiplataforma (Linux y macOS)

------------------------------------------------------------------------

# Licencia

Este proyecto es **software libre y de código abierto**.

Licencia sugerida: **MIT**

------------------------------------------------------------------------

# Autor

**Gabriel Survila**

Email:

surviladeveloper@gmail.com

Repositorio:

https://github.com/SurvilaDeveloper/MyVault

------------------------------------------------------------------------

# Filosofía del proyecto

MyVault sigue un principio simple:

> Tus contraseñas deben estar bajo tu control, no en un servidor
> externo.

La aplicación funciona completamente **offline** y los datos permanecen
**únicamente en el dispositivo del usuario**.

------------------------------------------------------------------------

# Contribuciones

Las contribuciones son bienvenidas.

Puedes colaborar con:

-   mejoras de seguridad
-   mejoras de interfaz
-   auditorías de código
-   nuevas funcionalidades
