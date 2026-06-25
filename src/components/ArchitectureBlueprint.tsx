/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Server, Database, Network, Shield, Cpu, Layers, 
  Code, Key, Image, FileCode, CheckCircle2, ChevronRight, 
  HelpCircle, Sparkles, Terminal, Copy, Check 
} from 'lucide-react';

export default function ArchitectureBlueprint() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections = [
    { id: 'architecture', name: '1. Arquitectura del Sistema', icon: Server },
    { id: 'database', name: '2. Diseño de Base de Datos', icon: Database },
    { id: 'diagrams', name: '3. Diagrama de Módulos', icon: Network },
    { id: 'stack', name: '4. Tecnologías Recomendadas', icon: Cpu },
    { id: 'api', name: '5. Diseño de API REST', icon: Terminal },
    { id: 'folders', name: '6. Estructura de Proyecto', icon: FileCode },
    { id: 'rbac', name: '7. Roles y Permisos (RBAC)', icon: Shield },
    { id: 'auth', name: '8. Flujo de Autenticación', icon: Key },
    { id: 'storage', name: '9. Almacenamiento Multimedia', icon: Image },
    { id: 'editor', name: '10. Diseño del Editor Visual', icon: Layers },
    { id: 'code', name: '11. Ejemplos de Código Real', icon: Code },
    { id: 'scalability', name: '12. Escalabilidad y Rendimiento', icon: Cpu },
    { id: 'security', name: '13. Seguridad de Producción', icon: Shield },
    { id: 'roadmap', name: '14. Roadmap de Desarrollo', icon: CheckCircle2 },
    { id: 'troubleshooting', name: '15. Retos y Soluciones', icon: HelpCircle },
  ];

  const codeSnippets = {
    fastapi_main: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas import PageCreate, PageResponse, BlockSchema
from app.services import cms_service
from app.core.auth import get_current_active_user

app = FastAPI(
    title="CMS Enterprise Engine",
    description="Backend de alto rendimiento para gestión dinámica de contenido modular",
    version="1.0.0"
)

# Configuración de CORS para Seguridad
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.post("/api/v1/pages", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def create_page(
    page_data: PageCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Crea una nueva página con sus bloques asociados dentro de una transacción relacional.
    Requiere rol de Editor o Administrador.
    """
    if "pages:create" not in current_user.role.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permisos insuficientes para realizar esta acción"
        )
    return cms_service.create_page_with_blocks(db, page_data, created_by=current_user.id)`,

    fastapi_models: `from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(String(255))
    is_published = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relaciones relacionales (cascada completa)
    blocks = relationship("Block", back_populates="page", cascade="all, delete-orphan", order_by="Block.position")
    history = relationship("PageVersion", back_populates="page", cascade="all, delete-orphan")

class Block(Base):
    __tablename__ = "blocks"

    id = Column(String(36), primary_key=True, index=True)
    page_id = Column(String(36), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(30), nullable=False)  # text, image, video, table, chart, kpi, button, form...
    position = Column(Integer, nullable=False, index=True)
    properties = Column(JSON, nullable=False)  # Configuración JSON específica del tipo de bloque
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    page = relationship("Page", back_populates="blocks")`
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
      {/* Sidebar de navegación */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Blueprint Técnico</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Propuesta de Nivel de Producción</p>
            </div>
          </div>
          <nav className="space-y-1">
            {sections.map((sect) => {
              const Icon = sect.icon;
              return (
                <button
                  key={sect.id}
                  onClick={() => setActiveTab(sect.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-colors ${
                    activeTab === sect.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{sect.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow space-y-6">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm">
          {/* SECCIÓN 1: ARQUITECTURA DEL SISTEMA */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">1. Arquitectura Completa del Sistema</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Desglose de la arquitectura web de tres capas orientada a microservicios/serverless y distribución global.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">Capa 1: Frontend & Edge</span>
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1">Next.js + Vercel / Cloudflare</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Las páginas públicas utilizan **ISG (Incremental Static Regeneration)** con un tiempo de revalidación corto o bajo demanda mediante Webhooks cuando un editor publica cambios. Esto garantiza que el tiempo de respuesta para usuarios finales sea de **&lt;50ms** directo desde el CDN.
                  </p>
                </div>
                <div className="p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-[10px] font-bold tracking-wider text-purple-600 dark:text-purple-400 uppercase">Capa 2: API Gateway & Backend</span>
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1">FastAPI + Python</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Backend asíncrono asombrosamente rápido con validación estricta de datos mediante **Pydantic**. Expone endpoints de API REST para el panel administrativo, estructurando los bloques visuales como un Árbol Abstracto de Sintaxis (AST) serializado en formato relacional y JSON.
                  </p>
                </div>
                <div className="p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Capa 3: Datos y Almacenamiento</span>
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1">PostgreSQL + Redis + S3</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Base de datos PostgreSQL en la nube para garantizar integridad transaccional (ACID) y soporte nativo de tipo de datos JSONB. **Redis** se sitúa en medio para cachear las consultas complejas y configuraciones de bloques frecuentes de las páginas activas.
                  </p>
                </div>
              </div>

              <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-3">Flujo de Procesamiento y Carga de Trabajo</h3>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] text-center font-bold mt-0.5">1</span>
                    <span>**Panel Administrativo (SSR/CSR)**: El editor arrastra y suelta un nuevo bloque en el lienzo de Next.js, guardando borradores automáticamente en localStorage y sincronizándolos mediante llamadas REST asíncronas optimizadas contra FastAPI.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] text-center font-bold mt-0.5">2</span>
                    <span>**Publicación Transaccional**: Al pulsar 'Publicar', se genera un registro inmutable en el historial de versiones, se actualiza el estado de la página a publicado, y se emite un evento de invalidación de caché.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] text-center font-bold mt-0.5">3</span>
                    <span>**Invalidación Inteligente (On-Demand ISR ISR)**: Next.js recibe un webhook firmado de FastAPI, purga la caché CDN de esa ruta específica, regenera estáticamente la página en segundo plano y la entrega al instante a todos los usuarios del mundo.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: DISEÑO DE BASE DE DATOS */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">2. Diseño de Base de Datos Relacional</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estructura SQL altamente normalizada para garantizar la integridad y escalabilidad del CMS.</p>
                </div>
              </div>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-gray-200 font-mono text-[10px] space-y-4 overflow-x-auto">
                <div className="border-b border-gray-800 pb-2">
                  <span className="text-blue-400">-- 1. TABLA DE ROLES Y PERMISOS (RBAC)</span>
                  <p className="text-emerald-400">CREATE TABLE permissions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);</p>
                </div>

                <div className="border-b border-gray-800 pb-2">
                  <span className="text-blue-400">-- 2. TABLA DE USUARIOS ADMINISTRATIVOS</span>
                  <p className="text-emerald-400">CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);</p>
                </div>

                <div className="border-b border-gray-800 pb-2">
                  <span className="text-blue-400">-- 3. TABLA DE PÁGINAS Y CONTENIDOS</span>
                  <p className="text-emerald-400">CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    current_version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'text', 'image', 'video', 'table', 'chart'
    position INT NOT NULL,
    properties JSONB NOT NULL, -- Atributos dinámicos del bloque
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);</p>
                </div>

                <div>
                  <span className="text-blue-400">-- 4. HISTORIAL DE VERSIONES (INMUTABLE)</span>
                  <p className="text-emerald-400">CREATE TABLE page_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    blocks_snapshot JSONB NOT NULL, -- Copia completa inmutable de los bloques en ese momento
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);</p>
                </div>
              </div>

              <div className="p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl space-y-2">
                <h4 className="font-semibold text-xs text-blue-800 dark:text-blue-300">¿Por qué JSONB para bloques en lugar de tablas separadas?</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Utilizamos una estrategia híbrida. La estructura base (Páginas, Versiones, Roles) es estrictamente relacional para garantizar integridad referencial y velocidad de consulta. Sin embargo, los atributos de los **Bloques Visuales** se almacenan en un campo **JSONB**. Esto permite:
                </p>
                <ul className="list-disc pl-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>**Flexibilidad Total**: Añadir nuevos bloques en el futuro sin realizar costosas migraciones de base de datos o modificar el esquema de tablas físico.</li>
                  <li>**Consultas Rápidas**: El formato JSONB binario en PostgreSQL soporta indexación GIN para realizar búsquedas rápidas dentro del árbol de contenido.</li>
                  <li>**Simplicidad Transaccional**: Guarda el lienzo completo de un página en una sola operación atómica.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: DIAGRAMA DE MÓDULOS */}
          {activeTab === 'diagrams' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Network className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">3. Diagramas de Módulos</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mapa de relaciones lógicas e interactividad entre las partes de la plataforma web.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Flujo de Datos y Componentes Clave:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">FE</div>
                    <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">Editor Web (UI)</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Constructor drag-and-drop, validadores de entrada, controles de columnas.</p>
                  </div>

                  <div className="flex items-center justify-center py-2 md:py-0">
                    <div className="h-px w-full md:w-12 bg-gray-300 dark:bg-gray-800 relative">
                      <ChevronRight className="absolute -right-2 -top-2.5 text-gray-400 h-5 w-5 hidden md:block" />
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">API</div>
                    <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">FastAPI Gateway</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Endpoints protegidos por JWT, verificadores de roles, serializadores Pydantic.</p>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">DB</div>
                    <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">PostgreSQL Relational</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Inmutabilidad transaccional, cascada de bloques, registros de logs.</p>
                  </div>
                </div>

                <div className="p-5 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl">
                  <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200 mb-2">Interacciones Clave del Backend:</h4>
                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <li>💡 **Módulo de Publicación**: Encargado de empaquetar los bloques actuales en un Snapshot JSON, incrementar la versión física de la página, registrar el log, e invalidar la caché Redis y CDN de forma simultánea.</li>
                    <li>💡 **Módulo RBAC (Role-Based Access Control)**: Decorador de FastAPI personalizado que intercepta solicitudes entrantes, decodifica el token de sesión, recupera los permisos asignados en caché y valida contra la firma del endpoint.</li>
                    <li>💡 **Módulo de Media**: Genera credenciales o URLs firmadas temporales para que el editor web suba las imágenes directamente al cubo S3 de forma rápida sin sobrecargar la memoria de las APIs de FastAPI.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: TECNOLOGÍAS RECOMENDADAS */}
          {activeTab === 'stack' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">4. Stack Tecnológico de Producción</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tecnologías de punta seleccionadas para maximizar rendimiento, robustez y facilidad de mantenimiento.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Frontend / Capa de Usuario</h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <li>🚀 **Next.js 15 (React 19)**: Framework líder que brinda soporte nativo para Server Components, ISG optimizado para SEO, y enrutamiento ágil.</li>
                    <li>🚀 **Tailwind CSS v4**: El motor de estilos utilitarios más optimizado para garantizar cargas CSS de apenas unos pocos kilobytes.</li>
                    <li>🚀 **D3.js / Recharts**: Biblioteca ultra personalizable para la representación interactiva de datos y analíticas complejas.</li>
                    <li>🚀 **Lucide React**: Biblioteca moderna de iconos vectoriales ligeros y consistentes.</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Backend & API</h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <li>🐍 **FastAPI + Python 3.12**: El framework web moderno de mayor rendimiento, basado en tipado estático nativo y programación asíncrona.</li>
                    <li>🐍 **SQLAlchemy + Alembic**: ORM robusto y herramientas de migración para garantizar un versionado transparente del esquema físico de la base de datos.</li>
                    <li>🐍 **Pydantic v2**: Motor de análisis y validación de datos ultra rápido programado sobre Rust.</li>
                    <li>🐍 **PyJWT / Passlib**: Librerías criptográficas de alta seguridad para cifrado bcrypt y firmas seguras de tokens JWT.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: DISEÑO DE API REST */}
          {activeTab === 'api' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">5. Diseño de API REST</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Catálogo estructurado de endpoints con entrada/salida para comunicación asíncrona.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-900 p-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <div>MÉTODO / RUTA</div>
                    <div>PERMISOS</div>
                    <div>DESCRIPCIÓN</div>
                    <div>RESPUESTA (HTTP)</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 border-b border-gray-100 dark:border-gray-800 items-center">
                    <div className="font-mono text-[10px]"><span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">POST</span> /api/v1/auth/login</div>
                    <div className="text-gray-500 dark:text-gray-400">Público</div>
                    <div>Inicio de sesión administrativo, emite token JWT y cookie HttpOnly.</div>
                    <div className="font-mono text-[10px] text-emerald-600">200 OK (Set-Cookie)</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 border-b border-gray-100 dark:border-gray-800 items-center">
                    <div className="font-mono text-[10px]"><span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">GET</span> /api/v1/pages</div>
                    <div className="text-gray-500 dark:text-gray-400">Público</div>
                    <div>Retorna lista de páginas publicadas para el portal web final.</div>
                    <div className="font-mono text-[10px] text-emerald-600">200 OK (List [Page])</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 border-b border-gray-100 dark:border-gray-800 items-center">
                    <div className="font-mono text-[10px]"><span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">POST</span> /api/v1/pages</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 font-mono text-[10px]">pages:create</div>
                    <div>Crea una nueva página con bloques vacíos o iniciales.</div>
                    <div className="font-mono text-[10px] text-emerald-600">201 Created</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 border-b border-gray-100 dark:border-gray-800 items-center">
                    <div className="font-mono text-[10px]"><span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">PUT</span> /api/v1/pages/{"{id}"}</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 font-mono text-[10px]">pages:edit</div>
                    <div>Guarda cambios y actualiza el árbol de bloques JSONB de la página.</div>
                    <div className="font-mono text-[10px] text-emerald-600">200 OK</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 border-b border-gray-100 dark:border-gray-800 items-center">
                    <div className="font-mono text-[10px]"><span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">POST</span> /api/v1/pages/{"{id}"}/publish</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 font-mono text-[10px]">pages:publish</div>
                    <div>Publica cambios reales de la página, congela la versión actual e invalida ISR.</div>
                    <div className="font-mono text-[10px] text-emerald-600">200 OK (Snapshot)</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 items-center">
                    <div className="font-mono text-[10px]"><span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">POST</span> /api/v1/media/upload</div>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 font-mono text-[10px]">media:upload</div>
                    <div>Sube imágenes/videos al almacenamiento permanente S3.</div>
                    <div className="font-mono text-[10px] text-emerald-600">201 Created</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 6: ESTRUCTURA DE PROYECTO */}
          {activeTab === 'folders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileCode className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">6. Estructura de Proyecto Recomendada</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Organización modular y mantenible alineada a estándares modernos de desarrollo de software.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-2">📁 FRONTEND (Next.js App Router)</h4>
                  <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 leading-normal">
{`/src
  /app
    /(public)
      /layout.tsx
      /[slug]                <-- Renderizador dinámico con ISR
        /page.tsx
    /(admin)
      /layout.tsx
      /login
        /page.tsx
      /dashboard             <-- Panel administrativo
        /page.tsx
  /components
    /editor                  <-- Editor drag & drop
      /BlockSelector.tsx
      /Canvas.tsx
      /SidebarSettings.tsx
    /blocks                  <-- Componentes para cada bloque
      /TextBlock.tsx
      /ChartBlock.tsx
      /FormBlock.tsx
  /lib
    /api.ts                  <-- Cliente HTTP Axios / Ky
    /utils.ts                <-- Funciones utilitarias (cn, math)`}
                  </pre>
                </div>

                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <h4 className="font-semibold text-xs text-purple-600 dark:text-purple-400 mb-2">📁 BACKEND (FastAPI Core)</h4>
                  <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 leading-normal">
{`/app
  /core
    /config.py               <-- Ajustes env con Pydantic Settings
    /security.py             <-- Hashes bcrypt y JWT tokens
    /auth.py                 <-- Dependencias de autenticación
  /db
    /base.py                 <-- Base del ORM
    /database.py             <-- Configuración sesión SQLAlchemy
    /models.py               <-- Definición de modelos SQLAlchemy
  /schemas
    /auth.py                 <-- Modelos de validación autenticación
    /pages.py                <-- Pydantic para páginas y bloques
  /routers
    /auth.py
    /pages.py                <-- Controladores del CMS
    /media.py                <-- Carga y administración multimedia
  /services
    /cms_service.py          <-- Transacciones de negocio complejas
    /storage_service.py      <-- Adaptador S3 Cloud`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 7: ROLES Y PERMISOS */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">7. Modelo de Roles y Permisos (RBAC)</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Control de acceso granular para mitigar fugas de datos y sobreescrituras accidentales.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                El sistema de roles utiliza una arquitectura **RBAC (Role-Based Access Control)** jerárquica y totalmente desacoplada. Los usuarios no tienen permisos asignados directamente, sino que se vinculan a un **Rol**, el cual posee un conjunto determinado de **Permisos** (Tokens de Permiso). Esto facilita auditorías de seguridad rápidas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2 bg-red-50/20 dark:bg-red-950/10">
                  <span className="font-semibold text-xs text-red-600 dark:text-red-400">Super Administrador (Owner)</span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Acceso sin restricciones a todos los endpoints del sistema. El único rol capaz de gestionar el personal de administración y auditar logs.</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2 bg-blue-50/20 dark:bg-blue-950/10">
                  <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">Editor de Contenidos</span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Permisos para crear, editar, eliminar páginas y cargar archivos multimedia. No puede acceder a auditoría de logs ni asignar permisos.</p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2 bg-gray-50/50 dark:bg-gray-900/40">
                  <span className="font-semibold text-xs text-gray-600 dark:text-gray-400">Analista / Lector</span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Permisos de solo lectura para monitorizar KPIs, visualizar los borradores del CMS y exportar formularios de contacto recibidos.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 8: FLUJO DE AUTENTICACIÓN */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">8. Flujo de Autenticación de Alta Seguridad</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estrategias robustas de resguardo de sesiones corporativas en entornos distribuidos.</p>
                </div>
              </div>

              <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40 space-y-4">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">JWT + Cookie HttpOnly (Protegido contra XSS y CSRF)</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
                  <p>
                    1. El usuario envía su `username` y `password` de manera cifrada mediante HTTPS.
                  </p>
                  <p>
                    2. FastAPI valida las credenciales y genera dos tokens: un **Access Token** de vida corta (15 minutos) y un **Refresh Token** de vida larga (7 días) guardado de forma segura en una base de datos de tokens activos para revocaciones dinámicas.
                  </p>
                  <p>
                    3. El **Refresh Token** se inyecta en el navegador a través de la cabecera `Set-Cookie` utilizando las banderas de máxima seguridad: **`HttpOnly`** (impide que Javascript de terceros lo extraiga), **`Secure`** (exclusivo para HTTPS), y **`SameSite=Strict`** (neutraliza ataques CSRF).
                  </p>
                  <p>
                    4. El **Access Token** se devuelve en el cuerpo JSON para que el cliente web lo almacene únicamente en memoria activa (estado de React). El cliente realiza un refresh transparente antes de expirar el token.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 9: ALMACENAMIENTO MULTIMEDIA */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Image className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">9. Estrategia de Almacenamiento Multimedia</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Carga escalable y procesamiento automático de imágenes y videos en producción.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2">
                  <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">1. Flujo de Carga Directa (Presigned URLs)</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Para evitar saturar la memoria de los servidores del backend, el cliente solicita un **Presigned URL** firmado por FastAPI. El navegador realiza la subida directa en binario al cubo de Amazon S3 o Google Cloud Storage.
                  </p>
                </div>
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2">
                  <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">2. CDN e Imagen bajo demanda (Edge Resize)</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Las imágenes se sirven a través de **Cloudflare / CloudFront CDN**. Integramos un microservicio de redimensionamiento sobre la marcha (como sharp en Node, o Cloudflare Images) que transforma las fotos automáticamente al formato ultra-comprimido **WebP o AVIF** según las dimensiones que requiera el dispositivo del usuario final.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 10: DISEÑO DEL EDITOR VISUAL */}
          {activeTab === 'editor' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">10. Diseño del Editor Visual Drag-and-Drop</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cómo se gestiona el árbol de bloques visuales de manera fluida y tolerante a fallos.</p>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-3">
                <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200">Estructura del Lienzo de Bloques (JSON AST)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  El editor representa la página como un **árbol de nodos JSON jerárquicos**. Un contenedor de columnas es un bloque especial que aloja a su vez más bloques en sus ramas internas, permitiendo anidamientos dinámicos infinitos.
                </p>

                <div className="bg-gray-950 p-4 rounded-lg text-emerald-400 font-mono text-[9px] overflow-x-auto">
{`{
  "page_id": "pag-101",
  "blocks": [
    {
      "id": "blk-title",
      "type": "text",
      "properties": {
        "content": "Portal de Energía",
        "style": "heading-1",
        "alignment": "center"
      }
    },
    {
      "id": "blk-grid",
      "type": "columns",
      "properties": {
        "layout": "1-1",
        "cols": [
          {
            "id": "col-left",
            "blocks": [
              { "id": "blk-desc", "type": "text", "properties": { "content": "Detalle técnico..." } }
            ]
          },
          {
            "id": "col-right",
            "blocks": [
              { "id": "blk-img", "type": "image", "properties": { "url": "https://..." } }
            ]
          }
        ]
      }
    }
  ]
}`}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 11: EJEMPLOS DE CÓDIGO REAL */}
          {activeTab === 'code' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">11. Ejemplos de Código para Producción</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Implementaciones reales utilizando FastAPI y SQLAlchemy para el motor del CMS.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Código de FastAPI Main */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300">app/main.py (FastAPI App Entry)</span>
                    <button 
                      onClick={() => handleCopy(codeSnippets.fastapi_main, 'main')}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    >
                      {copiedText === 'main' ? (
                        <>
                          <Check className="h-3 w-3" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[10px] font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-gray-50/50 dark:bg-gray-950 max-h-80 overflow-y-auto leading-relaxed">
                    {codeSnippets.fastapi_main}
                  </pre>
                </div>

                {/* Código de Modelos SQLAlchemy */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300">app/db/models.py (SQLAlchemy Schema)</span>
                    <button 
                      onClick={() => handleCopy(codeSnippets.fastapi_models, 'models')}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    >
                      {copiedText === 'models' ? (
                        <>
                          <Check className="h-3 w-3" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[10px] font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-gray-50/50 dark:bg-gray-950 max-h-80 overflow-y-auto leading-relaxed">
                    {codeSnippets.fastapi_models}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 12: ESCALABILIDAD Y RENDIMIENTO */}
          {activeTab === 'scalability' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">12. Escalabilidad de Nivel Corporativo</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cómo lograr tolerancia y servicio ultra veloz ante miles de usuarios simultáneos.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Caché Redis Multicapa (Write-Through Caching)</h4>
                  <p>
                    Para evitar latencias innecesarias de base de datos, las páginas publicadas se serializan completamente en formato JSON dentro de una base de datos **Redis** en memoria. Cuando un usuario final accede a una página, Next.js lee de su CDN o, en caso de regeneración estática, FastAPI responde desde Redis en **&lt;2 milisegundos**, sin tocar PostgreSQL.
                  </p>
                </div>
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">PostgreSQL Replicado (Lectura vs Escritura)</h4>
                  <p>
                    Se configura un clúster de base de datos con una base de datos **Primaria (Escritura)** y múltiples **Replicas de Lectura** de escalado elástico. FastAPI direcciona todas las consultas del portal público (Lectura) a las réplicas mediante un middleware inteligente de pooling de conexiones (como PgBouncer), reservando la base de datos primaria exclusivamente para transacciones administrativas críticas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 13: SEGURIDAD DE PRODUCCIÓN */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">13. Estrategias de Seguridad (OWASP Top 10)</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Garantizando la integridad, confidencialidad y resiliencia de la plataforma ante ataques externos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5 rounded-xl space-y-2">
                  <h4 className="font-semibold text-red-800 dark:text-red-400">Mitigación de Inyección SQL e Inyección NoSQL</h4>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Utilizamos parámetros enlazados (Prepared Statements) nativos de SQLAlchemy. Toda la entrada enviada a través de propiedades JSONB se sanea y valida rigurosamente contra esquemas estrictos de Pydantic antes de tocar el motor SQL de Postgres.
                  </p>
                </div>
                <div className="p-4 border border-orange-100 dark:border-orange-950/20 bg-orange-50/10 dark:bg-orange-950/5 rounded-xl space-y-2">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-400">Neutralización de Cross-Site Scripting (XSS)</h4>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Al renderizar bloques de texto editados por los administradores, utilizamos sanitizadores robustos como **DOMPurify** tanto en el editor como en el renderizador del frontend. Además, configuramos políticas CSP (Content Security Policy) restrictivas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 14: ROADMAP DE DESARROLLO */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">14. Roadmap de Desarrollo por Fases</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Plan estratégico incremental para llevar el producto desde la mesa de diseño hasta producción masiva.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative border-l-2 border-blue-100 dark:border-blue-900 pl-6 space-y-6 text-xs">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-950" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fase 1: Núcleo Relacional e Identidad (Semanas 1-4)</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Implementación de esquemas Postgres, autenticación JWT, flujo RBAC inicial y subida multimedia simple. API REST de FastAPI testeada al 100%.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-950" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fase 2: Motor Visual de Bloques y Árbol JSON (Semanas 5-8)</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Creación del canvas interactivo, controles de columnas y bloques iniciales (Texto, Imagen, Video, Tabla, Gráfico). Borradores automáticos locales.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-white dark:border-gray-950" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fase 3: Publicación e Invalidation en Edge (Semanas 9-12)</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Estrategias de versionado inmutable snapshot, webhooks de invalidación instantánea de caché CDN y revalidación ISR selectiva de Next.js.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-white dark:border-gray-950" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fase 4: Optimización Avanzada y Analíticas (Semanas 13-16)</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Caché Write-Through en Redis, réplicas de lectura de Postgres, exportador de formularios a Excel/CSV, auditorías y logs de accesos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 15: RETOS Y SOLUCIONES */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">15. Posibles Problemas Técnicos y Soluciones</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Identificación de cuellos de botella preventivos y sus correctivos inmediatos.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">🛑 Problema: Inconsistencia por Edición Simultánea</span>
                  <p className="text-gray-500 dark:text-gray-400">Si dos editores modifican la misma página al mismo tiempo, el que guarde último sobreescribirá silenciosamente el trabajo del otro.</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">✔️ Solución: Bloqueo Optimista de Versión (Optimistic Locking) mediante el campo `version` de la página. Antes de escribir el cambio, FastAPI verifica que el número de versión enviado por el cliente sea igual al actual en la base de datos; de lo contrario, cancela y avisa al usuario.</p>
                </div>

                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">🛑 Problema: Lentitud del Editor al Gestionar Árboles JSON Gigantes</span>
                  <p className="text-gray-500 dark:text-gray-400">El editor sufre retrasos al redibujar el canvas interactivo con cientos de bloques anidados.</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">✔️ Solución: Virtualización de Canvas y renderizado perezoso (Lazy Loading). También aislamos las mutaciones locales mediante un reducer optimizado, evitando re-renderizados masivos innecesarios.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
