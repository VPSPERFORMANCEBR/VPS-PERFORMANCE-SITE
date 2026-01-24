import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, collection, query, getDoc } from 'firebase/firestore';
import { 
  Settings, Lock, Edit3, Trash2, Plus, Move, Image as ImageIcon, 
  Video, Type, MessageCircle, X, ChevronDown, ChevronLeft,
  ChevronUp, Save, Layout, Upload, User, Trophy, MapPin, Clock, Phone, Globe,
  Calendar, Gauge, Eye, EyeOff, Grip, ArrowLeft, ArrowRight, Mail, AlertTriangle,
  Link as LinkIcon, FileText, List, LogOut, Check, Camera, Share2, Loader,
  Palette, MousePointerClick, Home as HomeIcon, Maximize, AlignLeft, AlignCenter,
  AlignRight, DollarSign, Grid3X3, Grid2X2, Folder, Layers, Columns, Printer,
  Download, Send, AlertOctagon, ArrowUp, ArrowDown, File, Save as SaveIcon,
  Scale, Grid, Copy, ChevronRight, Menu, Play, Weight, Move as MoveIcon,
  CheckSquare, Type as TypeIcon, MousePointer2, Bold, Italic, Underline, Strikethrough,
  Highlighter, Link as LucideLink, Scissors, Clipboard, PaintBucket, AlignJustify
} from 'lucide-react';

// --- INICIALIZAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let auth;
let db;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.error("CONFIGURAÇÃO DO FIREBASE NÃO ENCONTRADA! Verifique se o arquivo .env existe na raiz do projeto e se as variáveis começam com VITE_");
}

const appId = 'vps-performance-elite';

// --- UTILITÁRIOS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getToday = () => {
  const d = new Date();
  return d.toISOString().split('T')[0]; // YYYY-MM-DD para o input de data
};

const compressImage = (base64Str, maxWidth = 1200, quality = 0.98, section = null) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Para cards de serviços e marcas especialistas, use tamanho menor
            let targetMaxWidth = maxWidth;
            if (section === 'services' || section === 'specialistBrands') {
                targetMaxWidth = 500; // Tamanho ideal para cards 250x250px
            } else if (section === 'partners' || section === 'brands') {
                targetMaxWidth = 300; // Tamanho ideal para cards 150x150px
            }

            // Redução proporcional
            if (width > targetMaxWidth || height > targetMaxWidth) {
                const scale = Math.min(targetMaxWidth / width, targetMaxWidth / height);
                width = width * scale;
                height = height * scale;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Preencher fundo branco para JPEGs (evita transparência preta)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);
            // Qualidade alta para cards menores
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str);
    });
};

const handleImageUpload = (e, callback, section = null) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result, 1500, 0.98, section);
            callback(compressed);
        };
        reader.readAsDataURL(file);
    }
};

const fontOptions = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino",
    "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact",
    "Racing Sans One", "Lucida Sans Unicode", "Tahoma", "Geneva", "Courier",
    "Lucida Console", "Monaco", "Brush Script MT", "Lucida Handwriting", "Copperplate", "Papyrus",
    "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway", "Merriweather", "Noto Sans", "Poppins",
    "Playfair Display"
];

const hexToRgba = (hex, alpha) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length=== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return hex;
}

const SpecPresetModal = ({ isOpen, onClose, onSave, preset = null }) => {
    const [label, setLabel] = useState(preset ? preset.label : "");
    const [items, setItems] = useState(preset ? preset.items : [""]);
    
    useEffect(() => {
        if (preset) {
            setLabel(preset.label);
            setItems(preset.items);
        } else {
            setLabel("");
            setItems([""]);
        }
    }, [preset, isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border-4 border-black">
                <h3 className="text-black font-black uppercase italic mb-6 text-xl tracking-tighter">{preset ? 'Editar Modelo' : 'Novo Modelo de Specs'}</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Botão / Título</label>
                        <input 
                            value={label} 
                            onChange={e=>setLabel(e.target.value.toUpperCase())} 
                            className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-red-600 font-bold placeholder:text-gray-300" 
                            placeholder="EX: MOTOR" 
                            style={{ color: 'black' }}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Itens da Lista</label>
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input 
                                    value={item} 
                                    onChange={e => {
                                        const n = [...items];
                                        n[idx] = e.target.value.toUpperCase();
                                        setItems(n);
                                    }} 
                                    className="flex-1 border-2 border-gray-100 p-2 rounded-lg text-xs font-bold outline-none focus:border-red-600 placeholder:text-gray-300" 
                                    placeholder="EX: PISTÕES" 
                                    style={{ color: 'black' }}
                                />
                                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-600 p-2 hover:bg-red-50 rounded-full"><X size={14}/></button>
                            </div>
                        ))}
                        <button onClick={() => setItems([...items, ""])} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800">+ Adicionar Item</button>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                    <button onClick={onClose} className="text-gray-400 font-black uppercase text-xs px-4 py-2 hover:text-black">Cancelar</button>
                    <button onClick={() => { onSave({ id: preset ? preset.id : generateId(), label, items: items.filter(i => i.trim() !== "") }); onClose(); }} className="bg-black text-white font-black uppercase text-xs px-8 py-3 rounded-xl shadow-lg hover:bg-gray-800">SALVAR MODELO</button>
                </div>
            </div>
        </div>
    );
};

const extractIframeSrc = (input) => {
    if (input && input.includes('<iframe')) {
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : input;
    }
    return input;
};

const normalizeHex = (hex) => {
    if (!hex) return '#ffffff';
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3 || cleanHex.length === 6) {
        return '#' + cleanHex;
    }
    return hex;
};



const VideoModal = ({ isOpen, onClose, onSave }) => {
    const [url, setUrl] = useState("");
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border-4 border-black">
                <h3 className="text-black font-black uppercase italic mb-6 text-xl tracking-tighter">Adicionar Vídeo do YouTube</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">URL ou Código Embed</label>
                        <textarea 
                            value={url} 
                            onChange={e=>setUrl(e.target.value)} 
                            className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-red-600 font-bold placeholder:text-gray-300 h-32" 
                            placeholder="Cole aqui o link do vídeo..." 
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                    <button onClick={() => { setUrl(""); onClose(); }} className="text-gray-400 font-black uppercase text-xs px-4 py-2 hover:text-black">Cancelar</button>
                    <button onClick={() => { onSave(url); setUrl(""); onClose(); }} className="bg-black text-white font-black uppercase text-xs px-8 py-3 rounded-xl shadow-lg hover:bg-gray-800">ADICIONAR VÍDEO</button>
                </div>
            </div>
        </div>
    );
};

// --- NOVA TOOLBAR RECONSTRUÍDA DO ZERO ---
const FormattingToolbar = ({ onAction }) => {
    const [fontSize, setFontSize] = useState("16");
    const colorInputRef = useRef(null);
    const savedSelectionRef = useRef(null);
    const btnClass = "p-2 hover:bg-white hover:shadow-sm rounded text-gray-600 flex items-center justify-center border border-transparent hover:border-gray-300";
    
    // Captura a seleção antes de abrir o dropdown
    const captureSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let node = range.commonAncestorContainer;
          if (node.nodeType === 3) node = node.parentNode;
          if (node.closest('[contenteditable="true"]')) {
            savedSelectionRef.current = range.cloneRange();
          }
        }
    };
    
    // Restaura a seleção após fechar o dropdown
    const restoreSelection = () => {
        if (savedSelectionRef.current) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
          let node = savedSelectionRef.current.commonAncestorContainer;
          if (node.nodeType === 3) node = node.parentNode;
          const editable = node.closest('[contenteditable="true"]');
          if (editable) editable.focus();
        }
    };
    
    // Bloqueia perda de foco no mousedown
    const handleToolClick = (e, cmd, val) => {
        e.preventDefault();
        e.stopPropagation();
        onAction(cmd, val);
    };

    // Manipula a mudança de cor
    const handleColorChange = (e) => {
        const newColor = e.target.value;
        if (savedSelectionRef.current) {
            restoreSelection();
            setTimeout(() => {
                document.execCommand('foreColor', false, newColor);
            }, 0);
        }
    };

    return (
        <div className="control-pane no-print">
            <div className="control-section tbar-control-section bg-[#eeeeee] p-2 border-x border-t border-gray-300 rounded-t-xl shadow-inner">
                <h1 style={{ fontSize: '11px', fontWeight: '900', marginBottom: '8px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Editor de Texto</h1>
                <div className="flex flex-wrap items-center gap-1">
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'bold')} className={btnClass}><Bold size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'underline')} className={btnClass}><Underline size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'italic')} className={btnClass}><Italic size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'strikethrough')} className={btnClass}><Strikethrough size={16}/></button>
                    
                    <div className="relative">
                        <button 
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                captureSelection();
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (colorInputRef.current) {
                                    colorInputRef.current.click();
                                }
                            }}
                            className={btnClass}
                            title="Cor do Texto"
                        >
                            <PaintBucket size={16}/>
                        </button>
                        
                        {/* O INPUT AGORA OCUPA O MESMO ESPAÇO DO BOTÃO, MAS FICA INVISÍVEL */}
                        <input 
                            ref={colorInputRef}
                            type="color" 
                            onChange={handleColorChange}
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                            style={{ padding: 0, border: 'none' }}
                        />
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 h-8">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Tamanho</span>
                        <select 
                            value={fontSize}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                captureSelection();
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFontSize(val);
                                restoreSelection();
                                onAction('fontSize', val);
                            }}
                            className="bg-transparent text-xs outline-none text-black font-bold h-full cursor-pointer"
                        >
                            {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    <select 
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            captureSelection();
                        }} 
                        onChange={(e) => {
                            restoreSelection();
                            onAction('fontName', e.target.value);
                        }}
                        className="bg-white border border-gray-300 rounded text-[10px] px-2 outline-none text-black font-bold h-8 max-w-[100px] cursor-pointer"
                    >
                        <option value="">Fonte</option>
                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'justifyLeft')} className={btnClass}><AlignLeft size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'justifyCenter')} className={btnClass}><AlignCenter size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'justifyRight')} className={btnClass}><AlignRight size={16}/></button>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'justifyFull')} className={btnClass}><AlignJustify size={16}/></button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button type="button" onMouseDown={(e) => handleToolClick(e, 'createLink')} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 shadow-sm text-[9px] font-black px-3">
                        <LucideLink size={12}/> LINK
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE LINK ---
const LinkInsertModal = ({ isOpen, onClose, onConfirm }) => {
    const [word, setWord] = useState("");
    const [url, setUrl] = useState("");
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-blue-600">
                <h3 className="text-black font-black uppercase italic mb-6 text-xl tracking-tighter">Inserir Link Externo</h3>
                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Palavra que será clicável</label>
                        <input value={word} onChange={e=>setWord(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-blue-600 font-bold" />
                    </div>
                    <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Link de Destino (URL)</label>
                        <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-blue-600 font-bold" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={onClose} className="text-gray-400 font-black uppercase text-xs px-4 py-2 hover:text-black">Cancelar</button>
                        <button onClick={() => { onConfirm(word, url); setWord(""); setUrl(""); onClose(); }} className="bg-blue-600 text-white font-black uppercase text-xs px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700">ADICIONAR LINK</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const defaultContent = {
  header: {
    title: { content: "VPS PERFORMANCE", style: { font: "Racing Sans One", color: "#ffffff", size: "28px" } }, 
    subtitle: { content: "PREPARAÇÃO AUTOMOTIVA DE ELITE", style: { font: "Arial", color: "#ef4444", size: "11px" } },
    logoUrl: null,
    logoSize: 100,
    bgColor: "rgba(0,0,0,0.9)"
  },
  social: [], 
  styles: {
    bgColor: "#0a0a0a",
    primaryColor: "#ef4444",
    fontFamily: "sans-serif"
  },
  tabs: [
    { id: 'home', label: 'Home', type: 'home', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'projects', label: 'Nossos Projetos', type: 'projects', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'faq', label: 'Perguntas Frequentes', type: 'faq', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'ranking', label: 'RANKING PREPARADOS', type: 'ranking', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'shop', label: 'VPS SHOP', type: 'shop', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'contact', label: 'Contato', type: 'contact', style: { color: '#ffffff', font: 'Arial' } },
    { id: 'techSheet', label: 'Gerador Ficha Técnica', type: 'techSheet', style: { color: '#22c55e', font: 'Arial' } }
  ],
  projects: [],
  projectsDraft: [],
  specPresets: [
    { id: 'motor', label: 'MOTOR', items: ['PISTÕES', 'BIELAS', 'VIRABREQUIM', 'CABEÇOTE', 'TURBINA', 'INJEÇÃO'] },
    { id: 'suspensao', label: 'SUSPENSÃO', items: ['AMORTECEDORES', 'MOLAS', 'BUCHAS', 'BARRA ESTABILIZADORA'] }
  ],
        categoryTags: [
    { id: 'rua', label: 'PROJETO DE RUA', color: '#3b82f6', group: 'PROJECT CARS' },
    { id: 'circuito', label: 'PROJETO DE CIRCUITO', color: '#22c55e', group: 'PROJECT CARS' },
    { id: 'arrancada', label: 'PROJETO DE ARRANCADA', color: '#eab308', group: 'PROJECT CARS' },
    { id: 'drift', label: 'PROJETO DE DRIFT', color: '#ef4444', group: 'PROJECT CARS' },
    { id: 'projeto-experimental', label: 'PROJETO EXPERIMENTAL', color: '#a855f7', group: 'PROJECT CARS' },
    { id: 'uso-misto', label: 'PROJETO DE USO MISTO', color: '#ec4899', group: 'PROJECT CARS' },
    { id: 'projeto-proprio', label: 'PROJETO PRÓPRIO', color: '#f97316', group: 'PROJECT CARS' },
    { id: 'projeto-de-cliente', label: 'PROJETO DE CLIENTE', color: '#14b8a6', group: 'PROJECT CARS' },
    { id: 'show-car', label: 'PROJETO SHOW CAR', color: '#06b6d4', group: 'PROJECT CARS' },
    { id: 'projeto-sleeper', label: 'PROJETO SLEEPER', color: '#475569', group: 'PROJECT CARS' },
    { id: 'teste', label: 'TESTE', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'tecnica', label: 'TÉCNICA', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'montagem', label: 'MONTAGEM', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'dyno-day', label: 'DYNO DAY', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'calibracao', label: 'CALIBRAÇÃO', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'comparativo', label: 'COMPARATIVO', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'erros-aprendizados', label: 'ERROS & APRENDIZADOS', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'manutencao', label: 'MANUTENÇÃO', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'antes-depois', label: 'ANTES E DEPOIS', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'dica-rapida', label: 'DICA RÁPIDA', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'evolucao-projeto', label: 'EVOLUÇÃO DO PROJETO', color: '#94a3b8', group: 'SUB CATEGORIAS' },
    { id: 'visita', label: 'VISITA', color: '#64748b', group: 'OUTROS ASSUNTOS' },
    { id: 'evento', label: 'EVENTO', color: '#64748b', group: 'OUTROS ASSUNTOS' },
    { id: 'bastidores-vps', label: 'BASTIDORES VPS', color: '#64748b', group: 'OUTROS ASSUNTOS' },
    { id: 'ferramentas-equipamentos', label: 'FERRAMENTAS & EQUIPAMENTOS', color: '#64748b', group: 'OUTROS ASSUNTOS' },
    { id: 'opiniao', label: 'OPINIÃO', color: '#64748b', group: 'OUTROS ASSUNTOS' }
  ],
  projectsFeedTitleMain: { content: "Project", style: { font: "Racing Sans One", color: "#ffffff", size: "48px" } },
  projectsFeedTitleHighlight: { content: "Cars", style: { font: "Racing Sans One", color: "#ef4444", size: "48px" } },
  projectsFeedSubtitle: { content: "Acompanhe os projetos exclusivos da VPS", style: { font: "Arial", color: "#6b7280", size: "12px" } },
  subTabsConfig: {
    'projects': { label: 'PROJECT CARS', titleMain: { content: "Project", style: { font: "Racing Sans One", color: "#ffffff", size: "48px" } }, titleHighlight: { content: "Cars", style: { font: "Racing Sans One", color: "#ef4444", size: "48px" } }, subtitle: { content: "Acompanhe os projetos exclusivos da VPS", style: { font: "Arial", color: "#6b7280", size: "12px" } } },
    'materias': { label: 'MATÉRIAS', titleMain: { content: "MATÉRIAS", style: { font: "Racing Sans One", color: "#ffffff", size: "48px" } }, titleHighlight: { content: "", style: { font: "Racing Sans One", color: "#ef4444", size: "48px" } }, subtitle: { content: "Acompanhe as publicações exclusivas", style: { font: "Arial", color: "#6b7280", size: "12px" } } }
  },
  home: {
    bannerImages: [],
    aboutTitle: { content: "SOBRE A OFICINA", style: { font: "Racing Sans One", color: "#ef4444", size: "24px" } },
    aboutText: { content: "Especialistas em extrair o máximo do seu motor.", style: { font: "Verdana", color: "#d1d5db", size: "14px" } },
    aboutImage: null,
    structureTitleMain: { content: "DIFERENCIAIS E", style: { font: "Racing Sans One", color: "#ffffff", size: "24px" } },
    structureTitleHighlight: { content: "INSTALAÇÕES", style: { font: "Racing Sans One", color: "#ef4444", size: "24px" } },
    structureBanner: null, 
    structureBannerHeight: 300,
    structureGallery: { items: { 'main': [] } }, 
    structurePartnersTitle: { content: "NOSSOS PARCEIROS", style: { font: "Racing Sans One", color: "#ffffff", size: "24px" } },
    structureBrandsTitle: { content: "MARCAS", style: { font: "Racing Sans One", color: "#ffffff", size: "24px" } },
    disclaimer: { 
      type: 'text', 
      title: { content: "AVISO LEGAL", style: { font: "Arial Black", color: "#eab308", size: "16px" } }, 
      text: { content: "Todas as modificações são para uso exclusivo em pista fechada.", style: { font: "Arial", color: "#ef4444", size: "11px" } },
      icon: null,
      bgColor: "#2a0a0a", 
      opacity: 0.2,
      imageUrl: null
    }
  },
  techSheet: {
      buttonColors: {
          standard: "#2563eb",
          weight: "#16a34a",
          project: "#9333ea",
          review: "#f59e0b"
      },
      templates: {
          standard: {
              headerConfig: { bgColor: "#111111", titleColor: "#ffffff", subtitleColor: "#9ca3af", lineColor: "#ef4444", logoUrl: null, logoSize: 60 },
              textStyle: { font: "Arial", size: "14px", color: "#1f2937" },
              pages: []
          },
          weight: {
              headerConfig: { bgColor: "#111111", titleColor: "#ffffff", subtitleColor: "#9ca3af", lineColor: "#ef4444", logoUrl: null, logoSize: 60 },
              textStyle: { font: "Arial", size: "14px", color: "#1f2937" },
              pages: []
          },
          project: {
              headerConfig: { bgColor: "#111111", titleColor: "#ffffff", subtitleColor: "#9ca3af", lineColor: "#ef4444", logoUrl: null, logoSize: 60 },
              textStyle: { font: "Arial", size: "14px", color: "#1f2937" },
              pages: []
          },
          review: {
              headerConfig: { bgColor: "#111111", titleColor: "#ffffff", subtitleColor: "#9ca3af", lineColor: "#ef4444", logoUrl: null, logoSize: 60 },
              textStyle: { font: "Arial", size: "14px", color: "#1f2937" },
              pages: []
          }
      }
  },
  savedSheets: [],
  folders: [],
  services: { 
      titleMain: { content: "NOSSOS", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
      titleHighlight: { content: "SERVIÇOS", style: { font: "Racing Sans One", color: "#ef4444", size: "36px" } },
      items: [],
      layout: 'banner' 
  },
  specialistBrands: {
      titleMain: { content: "MARCAS", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
      titleHighlight: { content: "ESPECIALISTAS", style: { font: "Racing Sans One", color: "#ef4444", size: "36px" } },
      items: [],
      layout: 'banner'
  },
  partners: {
    title: { content: "PARCEIROS", style: { font: "Racing Sans One", color: "#ffffff", size: "28px", align: "center" } },
    subtitle: { content: "Confiança e Qualidade", style: { font: "Arial", color: "#9ca3af", size: "14px", align: "center" } },
    items: [],
    speed: 50
  },
  brands: {
    title: { content: "MARCAS", style: { font: "Racing Sans One", color: "#ffffff", size: "28px", align: "center" } },
    subtitle: { content: "Trabalhamos com as Melhores", style: { font: "Arial", color: "#9ca3af", size: "14px", align: "center" } },
    items: [],
    speed: 50
  },
  faq: {
    list: [],
    titleMain: { content: "PERGUNTAS", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
    titleHighlight: { content: "FREQUENTES", style: { font: "Racing Sans One", color: "#ef4444", size: "36px" } }
  },
  ranking: {
    title: { content: "HALL DA FAMA", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
    subtitle: { content: "Os mais fortes da VPS Performance", style: { font: "Arial", color: "#9ca3af", size: "16px" } },
    transparency: 0.2,
    colors: { top5: '#16a34a', top10: '#ca8a04', rest: '#6b7280' },
    styles: { 
        header: { color: '#6b7280', font: 'Arial', size: '12px', bgColor: '#111111' },
        row: { color: '#ffffff', font: 'Arial', size: '18px' }
    },
    columns: {
        pos: "Pos.",
        car: "Carro / Piloto",
        power: "Potência",
        torque: "Torque",
        media: "FOTOS",
        date: "Data/Dyno"
    },
    list: []
  },
  shop: {
    title: { content: "VITRINE", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
    subtitle: { content: "PEÇAS", style: { font: "Racing Sans One", color: "#ef4444", size: "36px" } },
    desc: { content: "Componentes de alta performance à pronta entrega", style: { font: "Arial", color: "#9ca3af", size: "14px" } },
    items: [] 
  },
  contact: {
    titleMain: { content: "ENTRE EM", style: { font: "Racing Sans One", color: "#ffffff", size: "36px" } },
    titleHighlight: { content: "CONTATO", style: { font: "Racing Sans One", color: "#ef4444", size: "36px" } },
    labels: {
      whatsapp: { content: "Enviar Mensagem no WhatsApp", style: { font: "Arial Black", color: "#ffffff", size: "14px" } },
      email: { content: "Escreva um Email", style: { font: "Arial Black", color: "#ffffff", size: "14px" } },
      address: { content: "ENDEREÇO", style: { font: "Arial Black", color: "#ef4444", size: "18px" } },
      hours: { content: "HORÁRIO DE FUNCIONAMENTO", style: { font: "Arial Black", color: "#ef4444", size: "18px" } }
    },
    colors: { whatsapp: '#16a34a', email: '#2563eb' },
    showAddress: true,
    showMap: true,
    showForm: false,
    formUrl: "", 
    formColor: "#ef4444",
    formLabel: { content: "ACESSAR FORMULÁRIO", style: { font: "Arial Black", color: "#ffffff", size: "14px" } },
    mapEmbed: "", 
    whatsapp: { content: "5511999999999", style: { font: "Arial", color: "#ffffff", size: "14px" } },
    email: { content: "contato@vpsperformance.com.br", style: { font: "Arial", color: "#ffffff", size: "14px" } },
    address: { content: "Rua da Performance, 123 - SP", style: { font: "Arial", color: "#ffffff", size: "14px" } },
    hours: { content: "Seg a Sex: 09:00 - 18:00", style: { font: "Arial", color: "#ffffff", size: "14px" } },
  },
  footer: {
    text: { content: "VPS PERFORMANCE", style: { font: "Racing Sans One", color: "#ffffff", size: "18px" } },
    copyright: { content: "Todos os direitos reservados.", style: { font: "Arial", color: "#6b7280", size: "10px" } },
  },
  users: [
    { 
      username: import.meta.env.VITE_ADMIN_USERNAME || "admin", 
      password: import.meta.env.VITE_ADMIN_PASSWORD || "123", 
      role: "admin" 
    }
  ]
};

// --- COMPONENTES AUXILIARES ---

const TabManagerModal = ({ isOpen, onClose, tabs, onSave }) => {
    const [localTabs, setLocalTabs] = useState(tabs || []);
    
    useEffect(() => { 
        if(isOpen) setLocalTabs(JSON.parse(JSON.stringify(tabs || []))); 
    }, [tabs, isOpen]);

    const handleAddTab = () => {
        const newTab = { 
            id: generateId(), 
            label: 'Nova Aba', 
            type: 'home', 
            style: { color: '#ffffff', font: 'Arial' } 
        };
        setLocalTabs([...localTabs, newTab]);
    };

    const handleDeleteTab = (idx) => {
        if(localTabs.length <= 1) {
            alert("O menu deve ter pelo menos uma aba.");
            return;
        }
        if(confirm("ATENÇÃO: Deseja mesmo excluir esta aba e todo seu conteúdo vinculado?")) {
            setLocalTabs(localTabs.filter((_, i) => i !== idx));
        }
    };

    const handleSave = () => {
        onSave(localTabs);
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg border border-gray-700 shadow-2xl h-[80vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-white font-bold text-xl uppercase italic">Gerenciar Menu Principal</h3>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {localTabs.map((tab, idx) => (
                        <div key={tab.id} className="bg-black p-3 rounded border border-gray-800 flex gap-4 items-center group">
                            <div className="flex-1 space-y-2">
                                <input value={tab.label} onChange={(e) => { const n = [...localTabs]; n[idx].label = e.target.value; setLocalTabs(n); }} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm" placeholder="Nome da Aba"/>
                                <select value={tab.type} onChange={(e)=>{const n=[...localTabs]; n[idx].type=e.target.value; setLocalTabs(n);}} className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-[10px] text-white">
                                    <option value="home">Home</option>
                                    <option value="projects">Nossos Projetos</option>
                                    <option value="faq">FAQ</option>
                                    <option value="ranking">Ranking</option>
                                    <option value="shop">Loja</option>
                                    <option value="contact">Contato</option>
                                    <option value="techSheet">Ficha Técnica</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => {
                                    const n = [...localTabs];
                                    if(idx > 0) [n[idx], n[idx-1]] = [n[idx-1], n[idx]];
                                    setLocalTabs(n);
                                }} className="p-1 hover:text-white text-gray-500"><ChevronUp size={16}/></button>
                                <button onClick={() => {
                                    const n = [...localTabs];
                                    if(idx < n.length - 1) [n[idx], n[idx+1]] = [n[idx+1], n[idx]];
                                    setLocalTabs(n);
                                }} className="p-1 hover:text-white text-gray-500"><ChevronDown size={16}/></button>
                                <button onClick={() => handleDeleteTab(idx)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddTab} className="w-full py-4 border-2 border-dashed border-gray-700 rounded text-gray-500 hover:text-white hover:border-gray-500 font-bold flex items-center justify-center gap-2"><Plus/> Adicionar Nova Aba</button>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-bold rounded">Salvar Menu</button>
                </div>
            </div>
        </div>
    );
};

const InfiniteCarousel = React.memo(({ items, sectionId, speed }) => {
    const displayItems = useMemo(() => items.length > 0 ? [...items, ...items, ...items, ...items] : [], [items]);
    const duration = speed && speed > 0 ? (1500 / speed) : 40;
    if (items.length === 0) return <div className="text-gray-500 italic p-10 w-full text-center">Nenhum item. Adicione na engrenagem.</div>;
    return (
        <div className="w-full overflow-hidden relative group/carousel">
             <div className="flex gap-12 w-max animate-scroll" style={{ animationDuration: `${duration}s` }}>
                 {displayItems.map((item, idx) => (
                       <div key={`${item.id}-${idx}`} className="flex flex-col items-center gap-3 min-w-[220px] group/item cursor-pointer" onClick={() => { if(item.link) window.open(item.link, '_blank'); }}>
                           <div className="h-40 w-56 bg-white/5 md:rounded-xl md:border md:border-white/10 flex items-center justify-center p-4 overflow-hidden relative md:shadow-lg">
                               {item.image ? (
                                   <img src={item.image} className="w-full h-full object-contain" alt="Parceiro"/>
                              ) : <ImageIcon className="text-gray-700 w-12 h-12"/>}
                          </div>
                          <div className="text-center w-full">
                              <span className="text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{item.title?.content}</span>
                          </div>
                      </div>
                 ))}
             </div>
             <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-25%); } 
                }
                .animate-scroll {
                    animation-name: scroll;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
             `}</style>
        </div>
    )
});

const CarouselManagerModal = ({ isOpen, onClose, items, onSave, title, speed, onSpeedChange }) => {
    const [localItems, setLocalItems] = useState(items || []);
    useEffect(() => { setLocalItems(items || []); }, [items, isOpen]);
    if (!isOpen) return null;
    const addItem = () => {
        setLocalItems([...localItems, { 
            id: generateId(), 
            image: null, 
            link: '', 
            title: { content: "Nome Parceiro", style: { font: "Arial", color: "#9ca3af", size: "14px", align: "center" } } 
        }]);
    };
    const updateItem = (index, field, value) => {
        const n = [...localItems];
        if(field === 'title') n[index].title = { ...n[index].title, content: value };
        else if(field === 'link') n[index].link = value;
        else if(field === 'image') n[index].image = value;
        setLocalItems(n);
    };
    const moveItem = (index, dir) => {
        const n = [...localItems];
        if(dir === -1 && index > 0) [n[index], n[index-1]] = [n[index-1], n[index]];
        if(dir === 1 && index < n.length - 1) [n[index], n[index+1]] = [n[index+1], n[index]];
        setLocalItems(n);
    };
    const deleteItem = (index) => {
        const n = [...localItems];
        n.splice(index, 1);
        setLocalItems(n);
    };
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-2xl border border-gray-700 shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-white font-bold text-xl">Gerenciar {title}</h3>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white"/></button>
                </div>
                <div className="bg-gray-900 p-3 rounded mb-4 border border-gray-700 flex items-center gap-4">
                    <Gauge className="text-green-500" size={20}/>
                    <span className="text-white text-sm font-bold uppercase">Velocidade</span>
                    <input 
                        type="number" 
                        value={speed || ''} 
                        onChange={(e) => onSpeedChange(Number(e.target.value))} 
                        className="bg-black border border-gray-600 rounded text-white p-1 w-20 text-center"
                    />
                    <span className="text-xs text-gray-500">Quanto maior, mais rápido</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {localItems.map((item, idx) => (
                        <div key={item.id} className="bg-black p-3 rounded border border-gray-800 flex gap-4 items-center">
                            <div className="w-20 h-20 bg-gray-900 rounded border border-gray-700 flex-shrink-0 flex items-center justify-center relative group">
                                {item.image ? <img src={item.image} className="w-full h-full object-contain" alt="item"/> : <ImageIcon className="text-gray-600"/>}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                                    <Upload size={16} className="text-white"/>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>updateItem(idx,'image',res))}/>
                                </label>
                            </div>
                            <div className="flex-1 space-y-2">
                                <input value={item.title?.content || ''} onChange={(e)=>updateItem(idx, 'title', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm" placeholder="Título/Legenda"/>
                                <input value={item.link || ''} onChange={(e)=>updateItem(idx, 'link', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm" placeholder="Link de Redirecionamento (https://...)"/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={()=>moveItem(idx, -1)} disabled={idx===0} className="p-1 bg-gray-800 rounded hover:bg-white/10 disabled:opacity-30 text-white"><ChevronUp size={16}/></button>
                                <button onClick={()=>moveItem(idx, 1)} disabled={idx===localItems.length-1} className="p-1 bg-gray-800 rounded hover:bg-white/10 disabled:opacity-30 text-white"><ChevronDown size={16}/></button>
                                <button onClick={()=>deleteItem(idx)} className="p-1 bg-red-900 text-red-200 rounded hover:bg-red-700"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-700 rounded text-gray-500 hover:text-white hover:border-gray-500 font-bold flex items-center justify-center gap-2"><Plus/> Adicionar Item</button>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-white">Cancelar</button>
                    <button onClick={()=>{ onSave(localItems); onClose(); }} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500 shadow-lg">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

const BannerManagerModal = ({ isOpen, onClose, banners = [], onUpdate, onStartHotspotEdit }) => {
    const [newImage, setnewImage] = useState(null);
    const [newLink, setnewLink] = useState("");

    if(!isOpen) return null;

    const handleDelete = (index) => {
        const updated = [...banners];
        updated.splice(index, 1);
        onUpdate(updated);
    };

    const handleLinkChange = (index, val) => {
        const updated = [...banners];
        updated[index].link = val;
        onUpdate(updated);
    };

    const handleHotspotLinkChange = (bannerIdx, hotspotIdx, val) => {
        const updated = [...banners];
        updated[bannerIdx].hotspots[hotspotIdx].link = val;
        onUpdate(updated);
    };

    const handleHotspotDelete = (bannerIdx, hotspotIdx) => {
        const updated = [...banners];
        updated[bannerIdx].hotspots.splice(hotspotIdx, 1);
        onUpdate(updated);
    };

    const handleAdd = () => {
        if(newImage) {
             const newItem = { id: generateId(), url: newImage, link: newLink, hotspots: [] };
             onUpdate([...banners, newItem]);
             setnewImage(null);
             setnewLink("");
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-2xl border border-gray-700 shadow-2xl h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                     <h3 className="text-white font-bold text-xl uppercase italic">Gerenciar Banners</h3>
                     <button onClick={onClose}><X className="text-gray-500 hover:text-white"/></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {banners.map((banner, idx) => (
                        <div key={idx} className="bg-black p-4 rounded border border-gray-800 flex flex-col gap-3">
                            <div className="flex gap-4 items-center">
                                <img src={banner.url} className="h-16 w-24 object-contain rounded border border-gray-700" alt="Banner"/>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Link Global da Foto</label>
                                    <input value={banner.link || ''} onChange={(e) => handleLinkChange(idx, e.target.value)} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700 text-sm" placeholder="https://..."/><div className="text-[8px] text-gray-500 mt-1">Tamanho recomendado: 1920x600px</div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => { onStartHotspotEdit(idx); onClose(); }} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500" title="Posicionar Botões na Home"><MoveIcon size={16}/></button>
                                    <button onClick={() => handleDelete(idx)} className="bg-red-600 text-white p-2 rounded hover:bg-red-500" title="Excluir Banner"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            
                            {(banner.hotspots || []).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Links dos Botões Flutuantes:</span>
                                    {banner.hotspots.map((hs, hsIdx) => (
                                        <div key={hs.id} className="flex gap-2 items-center bg-gray-900/50 p-2 rounded border border-gray-800">
                                            <div className="text-[10px] font-black text-gray-500 w-6">#{hsIdx+1}</div>
                                            <input 
                                                value={hs.link || ''} 
                                                onChange={(e) => handleHotspotLinkChange(idx, hsIdx, e.target.value)} 
                                                className="flex-1 bg-black text-white p-1.5 rounded border border-gray-700 text-[11px]" 
                                                placeholder="Link do botão (Ex: WhatsApp, Loja...)"
                                            />
                                            <button onClick={() => handleHotspotDelete(idx, hsIdx)} className="p-1 text-gray-600 hover:text-red-500"><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {banners.length === 0 && <div className="text-gray-600 text-center py-8 text-sm italic">Nenhum banner ativo.</div>}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                     <h4 className="text-white font-bold mb-1 text-xs uppercase">Novo Banner</h4>
                     <p className="text-[9px] text-yellow-500 mb-2 font-bold">TAMANHO RECOMENDADO: 1920x600px (ACEITA QUALQUER TAMANHO)</p>
                     <div className="flex gap-3 items-center bg-black/40 p-3 rounded border border-gray-700">
                         <label className="w-20 h-14 border-2 border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 shrink-0">
                            {newImage ? <img src={newImage} className="w-full h-full object-contain rounded" alt="new"/> : <Upload size={16} className="text-gray-600"/>}
                            <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>setnewImage(res))}/></label>
                         <input value={newLink} onChange={(e)=>setnewLink(e.target.value)} className="flex-1 bg-black text-white p-2 rounded border border-gray-700 text-xs" placeholder="Link Global (Opcional)"/>
                         <button onClick={handleAdd} disabled={!newImage} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 disabled:opacity-50 text-xs uppercase tracking-widest">Salvar</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl border-4 border-red-600 shadow-2xl max-w-sm text-center">
                <AlertTriangle size={48} className="text-red-600 mx-auto mb-4"/>
                <h3 className="text-black font-black text-xl mb-2">Confirmar?</h3>
                <p className="text-gray-600 mb-6 text-sm font-bold">{message || "Essa ação não pode ser desfeita."}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-black font-bold hover:bg-gray-300">Cancelar</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded bg-red-600 text-white font-black hover:bg-red-700">SIM, PROSSEGUIR</button>
                </div>
            </div>
        </div>
    );
};

const InputTextModal = ({ isOpen, onClose, title, value, onConfirm }) => {
    const [val, setVal] = useState(value || '');
    useEffect(()=>setVal(value || ''), [value, isOpen]);
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-700 w-full max-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4">{title}</h3>
                <input autoFocus value={val} onChange={e=>setVal(e.target.value)} className="w-full bg-black text-white p-2 rounded border border-gray-700 mb-4" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-white">Cancelar</button>
                    <button onClick={()=>{onConfirm(val); onClose();}} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Salvar</button>
                </div>
            </div>
        </div>
    )
}

const LogoEditModal = ({ isOpen, onClose, initialImage, initialSize, onSave }) => {
    const [image, setImage] = useState(initialImage);
    const [size, setSize] = useState(initialSize || 100);
    useEffect(() => { setImage(initialImage); setSize(initialSize || 100); }, [initialImage, initialSize, isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-[400px] border border-gray-700 shadow-2xl">
                <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Editar Logo</h3>
                <div className="space-y-4">
                    <label className="block w-full border-2 border-dashed border-gray-700 rounded p-4 text-center cursor-pointer hover:border-gray-500">
                        {image ? <img src={image} className="h-20 mx-auto object-contain" alt="Logo"/> : <span className="text-gray-500 text-xs">Clique para Upload (Rec: 500x500px)</span>}
                        <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>setImage(res))}/>
                    </label>
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase">Tamanho (px)</label>
                        <input type="range" min="50" max="600" step="1" value={size} onChange={(e)=>setSize(Number(e.target.value))} onInput={(e)=>setSize(Number(e.target.value))} className="w-full mt-2 accent-blue-600"/>
                        <div className="text-right text-xs text-gray-400">{size}px</div>
                    </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                    <button onClick={onClose} className="text-gray-500 px-4 py-2 hover:text-white">Cancelar</button>
                    <button onClick={() => { onSave(image, size); onClose(); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500">Concluir</button>
                </div>
            </div>
        </div>
    );
};

const CardDescriptionModal = ({ isOpen, onClose, initialData, onSave }) => {
    const editorRef = useRef(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (isOpen && editorRef.current && !hasLoaded) {
            const safeData = (typeof initialData === 'object' && initialData !== null) ? initialData : { content: initialData || "", style: {} };
            editorRef.current.innerHTML = safeData.content || "";
            setHasLoaded(true);
        }
        if (!isOpen) setHasLoaded(false);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        const content = editorRef.current.innerHTML;
        onSave({ content, style: { font: 'Arial', color: '#ffffff', size: '14px' } });
        onClose();
    };

    // LOGICA DE EDITOR IGUAL A DAS MATÉRIAS
    const handleAction = (cmd, val) => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);

        const applyStyle = (tag, styleProp, value) => {
            if (range.collapsed) {
                const span = document.createElement('span');
                if (styleProp) span.style[styleProp] = value;
                span.innerHTML = '&#8203;'; 
                range.insertNode(span);
                const newRange = document.createRange();
                newRange.setStart(span.firstChild, 1);
                newRange.setEnd(span.firstChild, 1);
                sel.removeAllRanges();
                sel.addRange(newRange);
            } else {
                const span = document.createElement('span');
                if (styleProp) span.style[styleProp] = value;
                try {
                    range.surroundContents(span);
                } catch(e) {
                    const content = range.extractContents();
                    span.appendChild(content);
                    range.insertNode(span);
                }
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        };

        if (cmd === 'fontSize') applyStyle('span', 'fontSize', val + 'px');
        else if (cmd === 'fontName') applyStyle('span', 'fontFamily', val);
        else if (cmd === 'foreColor') applyStyle('span', 'color', val);
        else document.execCommand(cmd, false, val);
    };

    return (
        <div className="fixed inset-0 z-[400000] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-white border border-gray-300 p-6 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden m-4">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-3 flex-shrink-0">
                    <h3 className="text-xl font-bold text-black uppercase italic tracking-widest">Descrição / Informações</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="text-gray-500 hover:text-black"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                    <FormattingToolbar onAction={handleAction} />
                    <div 
                        ref={editorRef}
                        contentEditable={true}
                        suppressContentEditableWarning
                        className="w-full min-h-[300px] bg-white text-black p-6 rounded-b-xl border-x border-b border-gray-300 outline-none focus:border-gray-500 overflow-y-auto"
                        style={{ fontFamily: 'Arial', fontSize: '14px', lineHeight: '1.6' }}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-400 hover:text-black text-sm font-bold uppercase tracking-widest">Cancelar</button>
                    <button onClick={handleSave} className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg shadow-xl uppercase text-xs tracking-widest">Salvar Descrição</button>
                </div>
            </div>
        </div>
    );
};

const RichEditModal = ({ isOpen, onClose, initialData, onSave, title, noLink = false }) => {
    const [content, setContent] = useState("");
    const [style, setStyle] = useState({ 
        font: 'Arial', color: '#ffffff', size: '16px', align: 'left', 
        bold: false, italic: false, underline: false 
    });
    const [link, setLink] = useState("");
    
    useEffect(() => { 
      if(isOpen) { 
        const safeData = (typeof initialData === 'object' && initialData !== null) ? initialData : { content: initialData || "", style: {} };
        setContent(safeData.content || ""); 
        setStyle({ 
            ...style, 
            ...safeData.style, 
            size: (safeData.style?.size || '16px').replace('px', ''),
            bold: !!safeData.style?.bold,
            italic: !!safeData.style?.italic,
            underline: !!safeData.style?.underline
        }); 
        setLink(safeData.link || ""); 
      } 
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e)=>e.stopPropagation()}>
        <div className="bg-[#1a1a1a] border border-gray-700 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden m-4">
          
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3 flex-shrink-0">
             <h3 className="text-xl font-bold text-white uppercase italic tracking-widest">{title || 'Editar Conteúdo'}</h3>
             <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X className="text-gray-500 hover:text-white"/></button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <div className="col-span-2 flex gap-2 items-center mb-2 justify-center border-b border-white/5 pb-3">
                      <button onClick={()=>setStyle({...style, bold: !style.bold})} className={`p-2 rounded border ${style.bold ? 'bg-white text-black' : 'bg-black text-white border-gray-700'}`}><Bold size={16}/></button>
                      <button onClick={()=>setStyle({...style, italic: !style.italic})} className={`p-2 rounded border ${style.italic ? 'bg-white text-black' : 'bg-black text-white border-gray-700'}`}><Italic size={16}/></button>
                      <button onClick={()=>setStyle({...style, underline: !style.underline})} className={`p-2 rounded border ${style.underline ? 'bg-white text-black' : 'bg-black text-white border-gray-700'}`}><Underline size={16}/></button>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Fonte</label>
                    <select className="w-full bg-black text-white p-2 rounded border border-gray-700 text-xs" value={style.font} onChange={(e)=>setStyle({...style, font: e.target.value})}>{fontOptions.map(f => <option key={f} value={f}>{f}</option>)}</select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Cor</label>
                    <div className="flex gap-2">
                        <input type="color" value={style.color || '#ffffff'} onChange={(e)=>setStyle({...style, color: normalizeHex(e.target.value)})} className="w-8 h-8 rounded cursor-pointer shrink-0 border-0 bg-transparent"/>
                        <input type="text" value={style.color} onChange={(e)=>setStyle({...style, color: normalizeHex(e.target.value)})} className="bg-black text-white w-full text-[10px] p-1 rounded border border-gray-700 uppercase"/>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tamanho (Número)</label>
                    <input type="number" value={style.size} onChange={(e)=>setStyle({...style, size: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700 text-xs"/>
                  </div>
                  {!noLink && <div className="col-span-2"><label className="text-[10px] text-gray-500 uppercase font-bold block mb-1 flex items-center gap-2"><LinkIcon size={12}/> Link de Redirecionamento</label><input type="text" value={link} onChange={(e)=>setLink(e.target.value)} className="w-full bg-black text-white p-2 rounded border border-gray-700 text-xs" placeholder="https://..."/><div className="text-[8px] text-gray-500 mt-1">Tamanho recomendado: 1920x600px</div></div>}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Texto Principal</label>
                <textarea className="w-full h-40 bg-black text-white p-4 rounded-xl border border-gray-700 outline-none resize-none focus:border-gray-500" value={content} onChange={(e) => setContent(e.target.value)} style={{ 
                    fontFamily: style.font, 
                    fontSize: `${style.size}px`, 
                    color: style.color, 
                    textAlign: style.align,
                    fontWeight: style.bold ? 'bold' : 'normal',
                    fontStyle: style.italic ? 'italic' : 'normal',
                    textDecoration: style.underline ? 'underline' : 'none'
                }}/>
              </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 flex-shrink-0">
              <button onClick={onClose} className="px-5 py-2 text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest">Cancelar</button>
              <button onClick={()=>{onSave({ content, style: {...style, size: `${style.size}px`}, link }); onClose();}} className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg shadow-xl uppercase text-xs tracking-widest">Salvar Alterações</button>
          </div>
        </div>
      </div>
    );
};

const EditableText = ({ text, onSave, isEditing, className, style: propStyle = {}, tag: Tag = 'div', label = "Editar Texto", noLink = false }) => {
  const [showModal, setShowModal] = useState(false);
  const data = (typeof text === 'object' && text !== null) ? text : { content: (typeof text === 'string' || typeof text === 'number') ? text : "", style: {} };
  const finalStyle = { 
    ...propStyle, 
    fontFamily: data.style?.font || 'inherit', 
    color: data.style?.color || 'inherit', 
    fontSize: data.style?.size || 'inherit', 
    textAlign: data.style?.align || 'inherit',
    fontWeight: data.style?.bold ? 'bold' : (propStyle.fontWeight || 'inherit'),
    fontStyle: data.style?.italic ? 'italic' : (propStyle.fontStyle || 'inherit'),
    textDecoration: data.style?.underline ? 'underline' : (propStyle.textDecoration || 'inherit')
  };
  return (
    <>
        <div className={`group inline-block ${isEditing ? 'cursor-pointer hover:opacity-80 relative' : ''}`} onClick={(e) => { if(isEditing) { e.preventDefault(); e.stopPropagation(); setShowModal(true); } }}>
            <Tag className={`${className} max-w-full`} style={{...finalStyle, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                {data.link && !isEditing ? <a href={data.link} target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">{String(data.content || '')}</a> : (String(data.content || '') || (isEditing ? <span className="text-gray-500 italic text-sm opacity-50">[{label}]</span> : ""))}
            </Tag>
            {isEditing && <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 z-50 shadow-lg border border-white"><Edit3 size={12} /></div>}
        </div>
        <RichEditModal isOpen={showModal} onClose={() => setShowModal(false)} initialData={text} onSave={onSave} title={label} noLink={noLink}/>
    </>
  );
};

const SocialMediaBar = ({ items, isEditing, onUpdate, onDelete, primaryColor }) => {
    const [socialModal, setSocialModal] = useState(null); 
    const safeItems = Array.isArray(items) ? items : [];
    return (
        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
            {safeItems.map((item) => (
                <div key={item.id} className="relative group">
                    <a href={isEditing ? '#' : item.link} target={'_blank'} className="block">
                        {item.icon ? <img src={item.icon} style={{ width: `${item.size}px`, height: `${item.size}px` }} className="object-contain" alt="Social" /> : <div style={{ width: `${item.size}px`, height: `${item.size}px` }} className="bg-gray-700 rounded-full flex items-center justify-center text-xs border border-gray-500">?</div>}
                    </a>
                    {isEditing && (
                        <div className="absolute -top-4 -right-4 flex gap-1 z-50 opacity-0 group-hover:opacity-100">
                            <button onClick={()=>setSocialModal(item)} className="bg-blue-600 text-white p-1 rounded-full"><Edit3 size={10}/></button>
                            <button onClick={()=>onDelete(item.id)} className="bg-red-600 text-white p-1 rounded-full"><X size={10}/></button>
                        </div>
                    )}
                </div>
             ))}
             {isEditing && <button onClick={() => setSocialModal({ id: generateId(), link: '', size: 32, icon: null })} className="bg-gray-800 p-2 rounded-full text-green-500 hover:text-white border border-gray-700" title="Adicionar Nova Mídia"><Plus size={16}/></button>}
             {socialModal && (
                 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                     <div className="bg-[#1a1a1a] p-6 rounded-lg w-80 border border-gray-700">
                         <h4 className="text-white mb-4 font-bold">{socialModal.icon ? 'Editar Mídia' : 'Nova Mídia'}</h4>
                         <label className="block w-full border-2 border-dashed border-gray-700 rounded p-4 text-center cursor-pointer hover:border-gray-500 mb-4">{socialModal.icon ? <img src={socialModal.icon} className="h-10 mx-auto" alt="soc"/> : <span className="text-gray-500 text-xs">Clique para Upload (Ícone 64x64px)</span>}<input type="file" className="hidden" accept="image/*" onChange={(e)=>{ const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onloadend=()=>setSocialModal({...socialModal, icon: r.result}); r.readAsDataURL(f); } }}/></label>
                         <input placeholder="Link (https://...)" value={socialModal.link || ''} onChange={(e)=>setSocialModal({...socialModal, link: e.target.value})} className="w-full bg-black text-white p-2 rounded mb-2 border border-gray-700 text-sm"/>
                         <div className="flex items-center gap-2 mb-4"><span className="text-gray-500 text-xs">Tamanho (px):</span><input type="number" value={socialModal.size} onChange={(e)=>setSocialModal({...socialModal, size: Number(e.target.value)})} className="w-16 bg-black text-white p-1 rounded border border-gray-700 text-sm"/></div>
                         <div className="flex justify-end gap-2"><button onClick={()=>setSocialModal(null)} className="text-gray-500 text-sm">Cancelar</button><button onClick={()=>{ if (socialModal.icon) { const exists = safeItems.find(i => i.id === socialModal.id); const newItems = exists ? safeItems.map(i => i.id === socialModal.id ? socialModal : i) : [...safeItems, socialModal]; onUpdate(newItems); setSocialModal(null); } else { alert("Selecione um ícone!"); } }} className="bg-green-600 text-white px-4 py-1 rounded text-sm font-bold">Salvar</button></div>
                     </div>
                 </div>
             )}
        </div>
    )
}

const UserModal = ({ isOpen, onClose, users, onSave }) => {
    if(!isOpen) return null;
    const [userList, setUserList] = useState(users || []);
    const handleDeleteUser = (indexToDelete) => {
        if (userList.length <= 1) {
            alert("Mantenha pelo menos um usuário!");
        } else {
            setUserList(userList.filter((_, i) => i !== indexToDelete));
        }
    };
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-96 border border-gray-700 shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-white font-bold">Gerenciar Usuários</h3>
                    <button onClick={onClose}><X size={16} className="text-gray-500"/></button>
                </div>
                <div className="space-y-4">
                    {userList.map((u, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-black p-2 rounded border border-gray-800">
                            <div className="flex-1 space-y-1">
                                <input placeholder="Usuário" value={u.username || ''} onChange={e=>{const n=[...userList]; n[idx].username=e.target.value; setUserList(n);}} className="w-full bg-gray-900 text-white p-1 text-xs rounded border border-gray-700"/>
                                <input placeholder="Senha" value={u.password || ''} onChange={e=>{const n=[...userList]; n[idx].password=e.target.value; setUserList(n);}} className="w-full bg-gray-900 text-white p-1 text-xs rounded border border-gray-700"/>
                            </div>
                            <button onClick={()=>{ if(userList.length > 1) setUserList(userList.filter((_,i)=>i!==idx)); else alert("Mantenha pelo menos um usuário!"); }} className="text-red-500 p-2 hover:bg-white/10 rounded"><Trash2 size={14}/></button>
                        </div>
                    ))}
                    <button onClick={()=>setUserList([...userList, {username: 'novo', password: '123', role: 'admin'}])} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2"><Plus size={14}/> Adicionar Usuário</button>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="text-gray-500 text-sm">Cancelar</button>
                    <button onClick={()=>{onSave(userList); onClose();}} className="bg-green-600 px-4 py-1 rounded text-white font-bold text-sm">Salvar Alterações</button>
                </div>
            </div>
        </div>
    )
}

const GlobalSettingsModal = ({ isOpen, onClose, content, updateContent }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-96 border border-gray-700 shadow-2xl">
                <h3 className="text-white font-bold mb-4 border-b pb-2 border-gray-700">Configurações Globais</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Cor Primária</label>
                        <div className="flex gap-2">
                            <input type="color" value={content.styles.primaryColor || '#ef4444'} onChange={(e)=>updateContent('styles.primaryColor', normalizeHex(e.target.value))} className="w-8 h-8 rounded cursor-pointer"/>
                            <input type="text" value={content.styles.primaryColor || '#ef4444'} onChange={(e)=>updateContent('styles.primaryColor', normalizeHex(e.target.value))} className="flex-1 bg-black border border-gray-700 text-white rounded px-2 text-sm"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Cor Fundo Site</label>
                        <div className="flex gap-2">
                            <input type="color" value={content.styles.bgColor || '#0a0a0a'} onChange={(e)=>updateContent('styles.bgColor', normalizeHex(e.target.value))} className="w-8 h-8 rounded cursor-pointer"/>
                            <input type="text" value={content.styles.bgColor || '#0a0a0a'} onChange={(e)=>updateContent('styles.bgColor', normalizeHex(e.target.value))} className="flex-1 bg-black border border-gray-700 text-white rounded px-2 text-sm"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase font-bold block mb-1">Fonte Principal</label>
                        <select value={content.styles.fontFamily} onChange={(e)=>updateContent('styles.fontFamily', normalizeHex(e.target.value))} className="w-full bg-black border border-gray-700 text-white rounded p-2 text-sm">
                            {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Fechar</button>
                </div>
            </div>
        </div>
    )
};

const InterestModal = ({ isOpen, onClose, product, contact, isAdmin, onUpdate }) => {
    const [showCardDescModal, setShowCardDescModal] = useState(false);
    if (!isOpen || !product) return null;
    const waNum = (contact.contact?.whatsapp?.content || "").replace(/\D/g, '');
    const isServiceOrBrand = product.section === 'services' || product.section === 'specialistBrands';
    const waMessage = isServiceOrBrand ? (product.whatsappMessage || `Olá, gostaria de mais informações sobre: ${product.title}`) : `Olá, tenho interesse em ${product.title} e gostaria de mais informações`;
    const showWa = isServiceOrBrand ? (product.showWhatsapp !== false) : true;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-white mb-1">{isServiceOrBrand ? 'Detalhes' : 'Tenho Interesse'}</h3>
                        <p className="text-red-600 text-sm font-black uppercase tracking-widest whitespace-normal break-words">{product.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8">
                    {isServiceOrBrand ? (
                        <>
                            <div className="text-left">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Descrição / Informações</label>
                                <div className="bg-white p-6 rounded-2xl border border-gray-300 min-h-[300px]">
                                    {isAdmin ? (
                                        <div className="relative group cursor-pointer" onClick={() => setShowCardDescModal(true)}>
                                            <div className="text-black leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description?.content || "Nenhuma informação adicional disponível." }} />
                                            <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 z-50 shadow-lg border border-white"><Edit3 size={12} /></div>
                                            <CardDescriptionModal 
                                                isOpen={showCardDescModal} 
                                                onClose={() => setShowCardDescModal(false)} 
                                                initialData={product.description} 
                                                onSave={(v) => {
                                                    const sectionKey = product.section === 'services' ? 'services.items' : (product.section === 'specialistBrands' ? 'specialistBrands.items' : null);
                                                    if (sectionKey) {
                                                        const items = product.section === 'services' ? contact.services.items : contact.specialistBrands.items;
                                                        const newList = items.map(i => i.id === product.id ? {...i, description: v} : i);
                                                        onUpdate(sectionKey, newList);
                                                    }
                                                }} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-black leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description?.content || "Nenhuma informação adicional disponível." }} />
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-black/40 rounded-2xl border border-white/5 text-center">

                                    <div className="mb-4">
                                        <EditableText 
                                            text={product.contactTitle || {content: "Ficou interessado neste serviço? Entre em contato para mais informações", style: {font: "Arial", color: "#ffffff", size: "14px"}}} 
                                            isEditing={isAdmin} 
                                            onSave={(v) => {
                                                const sectionKey = product.section === 'services' ? 'services.items' : 'specialistBrands.items';
                                                const items = product.section === 'services' ? contact.services.items : contact.specialistBrands.items;
                                                const newList = items.map(i => i.id === product.id ? {...i, contactTitle: v} : i);
                                                onUpdate(sectionKey, newList);
                                            }}
                                            className="text-white font-bold text-sm whitespace-normal break-words"
                                        />
                                    </div>
                                {showWa && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noopener noreferrer" className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white font-bold py-1.5 px-4 rounded-full flex items-center gap-2 transition-all text-xs border border-green-600/30">
                                            <MessageCircle size={14}/> WhatsApp
                                        </a>
                                    </div>
                                )}
                                {isAdmin && (
                                        <div className="mt-4 flex justify-center gap-4 border-t border-white/5 pt-4">
                                            <button onClick={() => {
                                                const sectionKey = product.section === 'services' ? 'services.items' : 'specialistBrands.items';
                                                const items = product.section === 'services' ? contact.services.items : contact.specialistBrands.items;
                                                const currentShow = product.showWhatsapp !== false;
                                                const newList = items.map(i => i.id === product.id ? {...i, showWhatsapp: !currentShow} : i);
                                                onUpdate(sectionKey, newList);
                                            }} className={`text-[10px] font-bold uppercase tracking-widest ${product.showWhatsapp !== false ? 'text-green-500' : 'text-red-500'}`}>
                                                {product.showWhatsapp !== false ? 'Ocultar Whats' : 'Mostrar Whats'}
                                            </button>
                                        </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-gray-400 mb-8 text-center whitespace-normal break-words">Olá, tenho interesse em <strong>{product.title}</strong> e gostaria de mais informações</p>
                            <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-105">
                                <MessageCircle size={24}/> Falar no WhatsApp
                            </a>
                        </div>
                    )}
                </div>

                {!isServiceOrBrand && (
                    <div className="pt-6 border-t border-gray-800 flex justify-center">
                        <button onClick={onClose} className="text-gray-500 hover:text-white font-bold py-2 px-8 transition-colors text-sm uppercase tracking-widest">Fechar Janela</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const FullScreenMediaViewer = ({ media, onClose, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    if (!media || media.length === 0) return null;
    const currentItem = media[currentIndex];
    const next = () => setCurrentIndex(prev => (prev + 1) % media.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    return (
        <div className="fixed inset-0 z-[100000] bg-black flex items-center justify-center p-4">
            <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/20 p-3 rounded-full text-white hover:bg-red-600"><X size={24}/></button>
            <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
                <div className="w-full h-full flex items-center justify-center">
                    {currentItem.type === 'video' ? (
                        <video key={currentIndex} src={currentItem.url} controls autoPlay className="max-w-full max-h-full object-contain rounded-lg"/>
                     ) : (
                        <img key={currentIndex} src={currentItem.url} className="max-w-full max-h-full object-contain rounded-lg" alt={`Mídia ${currentIndex + 1}`}/>
                     )}
                </div>
            </div>
            {media.length > 1 && (
               <>
                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full text-white hover:bg-white/40 z-50"><ArrowLeft size={24}/></button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full text-white hover:bg-white/40 z-50"><ArrowRight size={24}/></button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-50">{currentIndex + 1} / {media.length}</div>
               </>
            )}
        </div>
    );
};

const CarMediaModal = ({ car, onClose }) => {
    const [fullScreenMedia, setFullScreenMedia] = useState(null); 
    if(!car) return null;
    const allMedia = (car.media || []).map(m => ({ ...m, url: m.url, type: m.type || 'image' }));
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 text-white">
                    <h3 className="text-2xl font-bold uppercase italic">{typeof car.car === 'object' ? car.car.content : car.car} <span className="text-red-600 text-sm not-italic ml-2">por {typeof car.owner === 'object' ? car.owner.content : car.owner}</span></h3>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 custom-scrollbar pr-2"> 
                    {allMedia.length === 0 && <div className="col-span-full flex items-center justify-center text-gray-500 h-64">Nenhuma mídia disponível.</div>}
                    {allMedia.map((m, i) => (
                        <div key={i} className="bg-gray-900 rounded-xl overflow-hidden border border-white/10 aspect-square relative group cursor-pointer" onClick={() => setFullScreenMedia({ media: allMedia, startIndex: i })}>
                            {m.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-black text-red-500">
                                    <video src={m.url} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 flex items-center justify-center"><Play size={32} /></div>
                                </div>
                            ) : (
                                <img src={m.url} className="w-full h-full object-contain" alt="Mídia de Desempenho"/>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100"><Maximize size={32} className="text-white"/></div>
                        </div>
                    ))}

                </div>
            </div>
            {fullScreenMedia && <FullScreenMediaViewer media={fullScreenMedia.media} startIndex={fullScreenMedia.startIndex} onClose={() => setFullScreenMedia(null)}/>}
        </div>
    )
};

const ProductGalleryModal = ({ product, onClose }) => {
    if(!product) return null;
    const images = product.images || [];
    const [fullScreenMedia, setFullScreenMedia] = useState(null); 
    const allMedia = images.map(url => ({ url, type: 'image' }));
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 text-white">
                    <h3 className="text-2xl font-bold">{product.title}</h3>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {images.length === 0 && <div className="text-center text-gray-500 mt-20">Sem fotos adicionais.</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {images.map((img, i) => (
                            <img key={i} src={img} onClick={() => setFullScreenMedia({ media: allMedia, startIndex: i })} className="w-full h-auto rounded-lg border border-white/10 cursor-pointer" alt="prod"/>
                        ))}
                    </div>
                </div>
            </div>
            {fullScreenMedia && <FullScreenMediaViewer media={fullScreenMedia.media} startIndex={fullScreenMedia.startIndex} onClose={() => setFullScreenMedia(null)}/>}
        </div>
    )
};

const StructurePageModal = ({ isOpen, onClose, content, updateContent, isEditing, setMediaModal, deleteWithConfirm, setInputTextModal }) => {
    if(!isOpen) return null;
    const structureGallery = content.home.structureGallery || { items: { 'main': [] } };
    const items = structureGallery.items['main'] || [];

    const addStructureItem = () => {
        const newItem = {
            id: generateId(),
            type: 'card',
            image: null,
            title: { content: 'Título da Unidade', style: { font: 'Racing Sans One', color: '#ffffff', size: '20px' } },
            desc: { content: 'Breve descrição da nossa estrutura aqui...', style: { font: 'Arial', color: '#9ca3af', size: '14px' } }
        };
        const newList = [...items, newItem];
        updateContent('home.structureGallery.items.main', newList);
    };

    const updateStructureItem = (id, fields) => {
        const newList = items.map(item => item.id === id ? { ...item, ...fields } : item);
        updateContent('home.structureGallery.items.main', newList);
    };

    const removeStructureItem = (id) => {
        const newList = items.filter(item => item.id !== id);
        updateContent('home.structureGallery.items.main', newList);
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black overflow-y-auto">
            <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center z-50">
               <div className="text-2xl font-bold text-white flex items-center gap-2 uppercase tracking-widest">CONHEÇA NOSSA ESTRUTURA</div>
               <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest">Fechar</button>
            </div>
            <div className="max-w-6xl mx-auto p-4 space-y-12 pb-20 mt-8">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                        <div className="flex gap-2 border-l-4 border-red-600 pl-4">
                            <EditableText 
                                text={content.home.structureTitleMain || {content: "DIFERENCIAIS E", style: { font: "Racing Sans One", color: "#ffffff", size: "24px" }}} 
                                isEditing={isEditing} 
                                onSave={(v)=>updateContent('home.structureTitleMain', v)} 
                                className="text-2xl font-black text-white uppercase italic tracking-tighter"
                            />
                            <EditableText 
                                text={content.home.structureTitleHighlight || {content: "INSTALAÇÕES", style: { font: "Racing Sans One", color: "#ef4444", size: "24px" }}} 
                                isEditing={isEditing} 
                                onSave={(v)=>updateContent('home.structureTitleHighlight', v)} 
                                className="text-2xl font-black text-white uppercase italic tracking-tighter"
                            />
                        </div>
                        {isEditing && <button onClick={addStructureItem} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Plus size={16}/> Adicionar Novo Card</button>}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden group/card shadow-xl relative flex flex-col" style={{ width: "calc(50% - 8px)", minWidth: "300px" }}>
                                {/* Título no topo */}
                                <div className="p-4 pb-2">
                                    <EditableText text={item.title} isEditing={isEditing} onSave={(v)=>updateStructureItem(item.id, { title: v })} className="font-bold uppercase italic tracking-widest text-base text-center"/>
                                </div>
                                {/* Galeria de fotos */}
                                <div className="relative">
                                    <div className="aspect-video bg-gray-900 relative">
                                        {Array.isArray(item.images) && item.images.length > 0 ? (
                                            <img src={item.images[item.currentImageIndex || 0]} className="w-full h-full object-contain" alt="est"/>
                                        ) : (
                                            item.image ? <img src={item.image} className="w-full h-full object-contain" alt="est"/> : <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={48}/></div>
                                        )}
                                        {isEditing && (
                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 flex flex-col items-center justify-center cursor-pointer z-20">
                                                <Upload className="text-white mb-2"/>
                                                <span className="text-white font-bold text-xs">Adicionar/Alterar Foto</span>
                                                <input type="file" className="hidden" accept="image/*" multiple onChange={(e)=>{
                                                    const files = Array.from(e.target.files);
                                                    if (files.length === 0) return;
                                                    Promise.all(files.map(file => new Promise((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = async () => {
                                                            try {
                                                                const compressed = await compressImage(reader.result, 1500, 0.98);
                                                                resolve(compressed);
                                                            } catch (err) {
                                                                resolve(reader.result);
                                                            }
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }))).then(results => {
                                                        const currentImages = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
                                                        const newImages = [...currentImages, ...results];
                                                        updateStructureItem(item.id, { 
                                                            images: newImages, 
                                                            currentImageIndex: currentImages.length,
                                                            image: newImages[0] // Fallback para compatibilidade
                                                        });
                                                    }).catch(err => console.error("Erro no upload:", err));
                                                }}/>
                                            </label>
                                        )}
                                    </div>
                                    {/* Navegação do álbum */}
                                    {Array.isArray(item.images) && item.images.length > 1 && (
                                        <>
                                            <button onClick={()=>updateStructureItem(item.id, { currentImageIndex: (item.currentImageIndex || 0) === 0 ? item.images.length - 1 : (item.currentImageIndex || 0) - 1 })} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-30 transition-colors"><ChevronLeft size={24}/></button>
                                            <button onClick={()=>updateStructureItem(item.id, { currentImageIndex: (item.currentImageIndex || 0) === item.images.length - 1 ? 0 : (item.currentImageIndex || 0) + 1 })} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full z-30 transition-colors"><ChevronRight size={24}/></button>
                                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full z-30">
                                                <span className="text-white text-xs font-bold">{(item.currentImageIndex || 0) + 1}/{item.images.length}</span>
                                            </div>
                                        </>
                                    )}
                                    {/* Botão para remover foto do álbum */}
                                    {isEditing && Array.isArray(item.images) && item.images.length > 0 && (
                                        <button onClick={()=>{
                                            const currentIndex = item.currentImageIndex || 0;
                                            const newImages = item.images.filter((_, idx) => idx !== currentIndex);
                                            const newIndex = Math.max(0, currentIndex - 1);
                                            updateStructureItem(item.id, { 
                                                images: newImages, 
                                                currentImageIndex: newIndex,
                                                image: newImages.length > 0 ? newImages[0] : null
                                            });
                                        }} className="absolute top-2 left-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover/card:opacity-100 shadow-lg z-30" title="Remover esta foto"><X size={14}/></button>
                                    )}
                                </div>
                                {/* Descrição abaixo da foto */}
                                <div className="p-4 pt-2 flex flex-col flex-1">
                                    <EditableText text={item.desc} isEditing={isEditing} onSave={(v)=>updateStructureItem(item.id, { desc: v })} className="text-sm leading-relaxed text-center"/>
                                </div>
                                    {isEditing && <button onClick={()=>removeStructureItem(item.id)} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover/card:opacity-100 shadow-lg z-30"><Trash2 size={16}/></button>}
                            </div>
                        ))}
                    </div>
            </div>
        </div>
    );
};

const FieldEditModal = ({ isOpen, onClose, fieldData, onSave, mode = 'template' }) => {
    const [localData, setLocalData] = useState(fieldData);
    useEffect(() => { setLocalData(fieldData); }, [fieldData, isOpen]);
    if (!isOpen) return null;
    const s = localData.style || { font: 'Arial', size: '14px', color: '#000000', labelColor: '#ef4444' };
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-4 rounded-lg w-full max-w-[320px] border border-gray-700 shadow-2xl">
                <h3 className="text-white font-bold mb-3 border-b border-gray-700 pb-1 text-sm uppercase italic">
                    {mode === 'template' ? 'Editar Estrutura' : 'Editar Conteúdo'}
                </h3>
                <div className="space-y-2">
                    {mode === 'template' && (
                        <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Tipo de Campo</label>
                            <select value={localData.type || 'text'} onChange={(e)=>setLocalData({...localData, type: e.target.value})} className="w-full bg-black p-1.5 rounded border border-gray-700 text-white text-xs">
                                <option value="text">Texto</option>
                                <option value="checkbox">Marcação (X)</option>
                                <option value="checkmark">Marcação (✓)</option>
                                <option value="square">Quadrado</option>
                            </select>
                        </div>
                    )}
                    {mode === 'input' && localData.type !== 'checkbox' && localData.type !== 'checkmark' && localData.type !== 'square' && (
                        <div><label className="text-[10px] text-gray-500 font-bold uppercase">Conteúdo</label><textarea value={localData.value || ''} onChange={(e)=>setLocalData({...localData, value: e.target.value})} className="w-full bg-black text-white p-1.5 rounded border border-gray-700 text-xs resize-none overflow-hidden" rows="1" style={{minHeight: "1.5em", height: "auto"}} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}/></div>
                    )}
                    {mode === 'template' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-[10px] text-gray-500 font-bold uppercase">Tam. Fonte</label><input type="number" value={String(s.size || '').replace('px','')} onChange={(e)=>setLocalData({...localData, style: {...s, size: `${e.target.value}px`}})} className="w-full bg-black p-1.5 rounded border border-gray-700 text-white text-xs"/></div>
                                <div><label className="text-[10px] text-gray-500 font-bold uppercase">Cor</label><input type="color" value={localData.valueColor || s.color || '#000000'} onChange={(e)=>{ const color = normalizeHex(e.target.value); setLocalData({...localData, valueColor: color, style: {...s, color: color}}); }} className="w-full h-7 cursor-pointer border rounded border-gray-700 bg-transparent p-0"/></div>
                            </div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase">Fonte</label><select className="w-full bg-black p-1.5 rounded border border-gray-700 text-white text-[10px]" value={s.font || 'Arial'} onChange={(e)=>setLocalData({...localData, style: {...s, font: e.target.value}})}>{fontOptions.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                        </>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-700">
                    <button onClick={onClose} className="text-gray-500 px-3 text-xs font-bold">Cancelar</button>
                    <button onClick={()=>{ onSave(localData); onClose(); }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const TechSheetPage = ({ pageData, pageIndex, headerConfig, textStyle, updatePage, removePage, mode }) => {
    const pageRef = useRef(null);
    const [editingField, setEditingField] = useState(null);
    const [draggingField, setDraggingField] = useState(null);
    const [resizingField, setResizingField] = useState(null);
    const handleMouseDown = (e, fieldIndex) => {
        if(mode !== 'template') return;
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setDraggingField({
            index: fieldIndex,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top
        });
    };
    const handleResizeMouseDown = (e, fieldIndex) => {
        if(mode !== 'template') return;
        e.stopPropagation();
        e.preventDefault();
        const field = pageData.fields[fieldIndex];
        setResizingField({
            index: fieldIndex,
            initialWidth: field.width || 200,
            initialHeight: field.height || 40,
            startX: e.clientX,
            startY: e.clientY
        });
    };
    const handleMouseMove = (e) => {
        if (!pageRef.current || mode !== 'template') return;
        if (draggingField) {
            const pageRect = pageRef.current.getBoundingClientRect();
            let x = e.clientX - pageRect.left - draggingField.offsetX;
            let y = e.clientY - pageRect.top - draggingField.offsetY;
            const newFields = [...pageData.fields];
            newFields[draggingField.index] = { ...newFields[draggingField.index], x, y };
            updatePage(pageIndex, { ...pageData, fields: newFields });
        } else if (resizingField) {
            const deltaX = e.clientX - resizingField.startX;
            const deltaY = e.clientY - resizingField.startY;
            const newFields = [...pageData.fields];
            newFields[resizingField.index] = { 
                ...newFields[resizingField.index], 
                width: Math.max(20, resizingField.initialWidth + deltaX),
                height: Math.max(10, resizingField.initialHeight + deltaY)
            };
            updatePage(pageIndex, { ...pageData, fields: newFields });
        }
    };
    const handleMouseUp = () => { setDraggingField(null); setResizingField(null); };
    const addField = (type = 'text') => { 
        const newFields = [...(pageData.fields || []), { 
            id: generateId(), 
            label: "", 
            value: type === 'checkbox' ? false : "", 
            type: type,
            style: { font: textStyle.font, size: textStyle.size, color: textStyle.color, labelColor: headerConfig.lineColor },
            x: 50, y: 50,
            width: type === 'checkbox' ? 30 : 200,
            height: type === 'checkbox' ? 30 : 40
        }]; 
        updatePage(pageIndex, { ...pageData, fields: newFields }); 
    };
    const updateField = (fIndex, newData) => { 
        const newFields = [...pageData.fields]; 
        newFields[fIndex] = { ...newFields[fIndex], ...newData }; 
        updatePage(pageIndex, { ...pageData, fields: newFields }); 
    };
    const removeField = (fIndex) => { 
        const newFields = pageData.fields.filter((_, i) => i !== fIndex); 
        updatePage(pageIndex, { ...pageData, fields: newFields }); 
    };
	    const toggleCheckbox = (fIndex) => {
			        const newFields = [...(pageData.fields || [])];
			        const field = newFields[fIndex];
			        if (!field.value) {
			            field.value = true;
			        } else {
			            field.value = false;
			        }
			        updatePage(pageIndex, { ...pageData, fields: newFields });
			    };
    return (
        <div className="mb-8 relative flex justify-center group/page" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div ref={pageRef} className="bg-white relative shadow-2xl overflow-hidden page-a4" style={{ width: '210mm', height: '297mm', position: 'relative' }}>
                {pageData.backgroundImage && ( <img src={pageData.backgroundImage} className="absolute inset-0 w-full h-full object-contain z-0 pointer-events-none" alt="bg"/> )}
	                {!pageData.backgroundImage && (
	                    <div className="p-8 flex justify-between items-center relative z-10">
	                        <div className="flex items-center gap-4 w-full">
	                            {headerConfig.logoUrl && <img src={headerConfig.logoUrl} className="object-contain flex-shrink-0" style={{ height: `${headerConfig.logoSize}px`, width: 'auto' }} alt="logo"/>}
	                            <div className="flex-1 min-w-0">
	                                {mode === 'template' ? ( <input value={pageData.title || ''} onChange={(e) => updatePage(pageIndex, { ...pageData, title: e.target.value })} className="bg-transparent font-black text-2xl uppercase tracking-widest border-b border-black/20 w-full outline-none" style={{ color: headerConfig.titleColor }}/> ) : ( <h2 className="font-black text-2xl uppercase tracking-widest whitespace-normal break-words" style={{ color: headerConfig.titleColor }}>{pageData.title}</h2> )}
	                                {mode === 'template' ? ( <input value={pageData.subtitle || ''} onChange={(e)=>updatePage(pageIndex, {...pageData, subtitle: e.target.value})} className="bg-transparent text-sm font-bold uppercase tracking-widest border-b border-black/20 w-full outline-none mt-1" style={{ color: headerConfig.subtitleColor }}/> ) : ( <div className="text-sm mt-1 uppercase tracking-widest font-bold" style={{ color: headerConfig.subtitleColor }}>{pageData.subtitle}</div> )}
	                            </div>
	                        </div>
	                    </div>
	                )}
                <div className={`absolute inset-0 z-30 ${!pageData.backgroundImage ? 'p-10' : ''}`}>
                    {!pageData.backgroundImage && pageData.centerTitle && (
                        <div className="w-full text-center mt-4 mb-4 relative group/ctitle z-20 px-8">
                            {mode === 'template' ? ( <input value={pageData.centerTitle || ''} onChange={(e)=>updatePage(pageIndex, {...pageData, centerTitle: e.target.value})} className="text-3xl font-black uppercase text-center w-full bg-transparent outline-none border-b border-dashed border-gray-300 text-black" style={{ color: '#000000' }}/> ) : ( <h1 className="text-3xl font-black uppercase tracking-widest text-black">{String(pageData.centerTitle || '')}</h1> )}
                            {mode === 'template' && <button onClick={()=>updatePage(pageIndex, {...pageData, centerTitle: ""})} className="absolute -top-6 right-0 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover/ctitle:opacity-100"><X size={12}/></button>}
                        </div>
                    )}
                    {(pageData.fields || []).map((field, fIdx) => {
                        const fStyle = field.style || { font: textStyle.font, size: textStyle.size, color: textStyle.color, labelColor: headerConfig.lineColor };
                        const isCheckbox = field.type === 'checkbox';
                        const posStyle = {
                            position: 'absolute',
                            left: `${field.x || 0}px`,
                            top: `${field.y || 0}px`,
                            width: `${field.width || (isCheckbox ? 30 : 200)}px`,
                            height: `${field.height || (isCheckbox ? 30 : 40)}px`,
                            cursor: mode === 'template' ? 'move' : (isCheckbox ? 'pointer' : 'default'),
                            boxSizing: 'border-box'
                        };
                        return (
                            <div 
                                key={field.id} 
                                style={posStyle}
                                className={`group/field ${mode === 'template' ? 'border border-dashed border-gray-300' : ''} ${mode === 'input' && !isCheckbox ? 'border border-red-500/50' : ''}`}
                                onMouseDown={(e) => handleMouseDown(e, fIdx)}
                            >
			                                {field.type === 'checkbox' || field.type === 'checkmark' || field.type === 'square' ? (
			                                    <div onClick={() => mode !== 'template' && toggleCheckbox(fIdx)} className={`w-full h-full flex items-center justify-center ${mode === 'input' ? 'border border-red-500/50' : ''}`}>
			                                        <div style={{ 
			                                            width: '100%',
			                                            height: '100%',
			                                            color: field.valueColor || fStyle.color,
			                                            fontSize: `${Math.min(field.width || 30, field.height || 30) * 0.8}px`,
			                                            lineHeight: '1',
			                                            fontWeight: 'bold',
			                                            display: 'flex',
			                                            alignItems: 'center',
			                                            justifyContent: 'center',
			                                            backgroundColor: field.type === 'square' && field.value ? (field.valueColor || fStyle.color) : (mode === 'template' ? 'rgba(0, 0, 0, 0.05)' : 'transparent'),
			                                            border: field.type === 'square' ? `2px solid ${field.valueColor || fStyle.color}` : (mode === 'template' ? '2px solid #333' : 'none')
			                                        }}>
			                                            {field.value && field.type !== 'square' ? (field.type === 'checkmark' ? '✓' : 'X') : ''}
			                                        </div>
			                                    </div>
			                                ) : (
                                    <div className="flex flex-col justify-end w-full h-full">
                                        {mode === 'input' ? (
                                            <textarea 
                                                value={field.value || ''} 
                                                onChange={(e) => { 
                                                    updateField(fIdx, { value: e.target.value }); 
                                                    e.target.style.height = 'auto'; 
                                                    e.target.style.height = e.target.scrollHeight + 'px'; 
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.height = 'auto'; 
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                className="bg-transparent outline-none resize-none overflow-hidden border-none focus:ring-0"
                                                style={{ 
                                                    fontFamily: fStyle.font, 
                                                    fontSize: fStyle.size, 
                                                    color: fStyle.color,
                                                    width: '100%',
                                                    height: 'auto',
                                                    minHeight: fStyle.size
                                                }}
                                                rows="1"
                                            />
                                        ) : (
                                            <div className="overflow-hidden" style={{ fontFamily: fStyle.font, fontSize: fStyle.size, color: fStyle.color, backgroundColor: mode === 'template' ? 'rgba(0,0,255,0.05)' : 'transparent', whiteSpace: 'pre-wrap' }}>
                                                {String(field.value || (mode === 'template' ? "Texto" : ""))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {mode === 'template' && (
                                    <>
                                        <div 
                                            onMouseDown={(e) => handleResizeMouseDown(e, fIdx)}
                                            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center hover:text-red-600 z-50 bg-white/50 rounded-tl shadow-sm"
                                        >
                                            <Grip size={10} />
                                        </div>
                                        <div className="absolute -top-6 right-0 bg-gray-900 text-white flex gap-1 p-1 rounded opacity-0 group-hover/field:opacity-100 z-50">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingField({ idx: fIdx, data: field }); }} className="p-1 hover:bg-blue-600 rounded"><Edit3 size={10}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); removeField(fIdx); }} className="p-1 hover:bg-red-600 rounded"><Trash2 size={10}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {mode === 'template' && (<div className="absolute top-2 left-2 no-print z-50"><button onClick={() => removePage(pageIndex)} className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700" title="Remover Página"><Trash2 size={16}/></button></div>)}
            </div>
            <FieldEditModal isOpen={!!editingField} onClose={()=>setEditingField(null)} fieldData={editingField?.data || {}} onSave={(newData) => updateField(editingField.idx, newData)} mode={mode}/>
        </div>
    );
}

const TechSheetGenerator = ({ data, isEditing, onUpdate }) => {
    const [screen, setScreen] = useState('menu'); 
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [activeTemplateType, setActiveTemplateType] = useState('standard');
    const [currentSheet, setCurrentSheet] = useState(data.techSheet.templates.standard);
    const [pdfFileName, setPdfFileName] = useState("");
    const [currentSheetId, setCurrentSheetId] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [newFolderModal, setNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderCar, setNewFolderCar] = useState("");
    const [confirmModal, setConfirmModal] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (!window.html2pdf) { const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"; document.body.appendChild(script); }
    }, []);
    const updatePage = (idx, newData) => { const newPages = [...currentSheet.pages]; newPages[idx] = newData; setCurrentSheet({ ...currentSheet, pages: newPages }); };
    const handleAddPageClick = () => { if(fileInputRef.current) fileInputRef.current.click(); };
    const handlePageUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        // Manter a imagem original se for A4, ou apenas comprimir sem forçar stretch agressivo
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Usar largura de 1240px como base (A4 padrão) e calcular altura proporcional
                    const targetWidth = 1240;
                    const targetHeight = (img.height / img.width) * targetWidth;
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        const newPage = { id: generateId(), type: 'custom', title: "", subtitle: "", fields: [], backgroundImage: base64 };
        setCurrentSheet({ ...currentSheet, pages: [...currentSheet.pages, newPage] });
        e.target.value = null;
    };
    const removePage = (idx) => { const newPages = currentSheet.pages.filter((_, i) => i !== idx); setCurrentSheet({ ...currentSheet, pages: newPages }); };
    const saveTemplate = () => { const newTemplates = { ...data.techSheet.templates, [activeTemplateType]: currentSheet }; onUpdate('techSheet.templates', newTemplates); alert("Template salvo!"); setScreen('menu'); };
    const startInput = (type = 'standard') => { setIsPrintMode(false); setCurrentSheet(JSON.parse(JSON.stringify(data.techSheet.templates[type]))); setActiveTemplateType(type); setCurrentSheetId(null); setSelectedFolder(null); setPdfFileName(''); setScreen('input'); };
    const startTemplateSelection = () => { setIsPrintMode(false); setScreen('template-selection'); }
    const editTemplate = (type) => { setIsPrintMode(false); setCurrentSheet(JSON.parse(JSON.stringify(data.techSheet.templates[type] || data.techSheet.templates.standard))); setActiveTemplateType(type); setScreen('template'); };
    const updateButtonColor = (type, color) => { const newColors = { ...(data.techSheet.buttonColors || {}), [type]: color }; onUpdate('techSheet.buttonColors', newColors); };
    
    const saveSheetToSaved = (isFinalized = false) => {
        const now = new Date();
        const savedSheet = {
            id: currentSheetId || generateId(),
            type: activeTemplateType,
            fileName: pdfFileName,
            sheetData: JSON.parse(JSON.stringify(currentSheet)),
            status: isFinalized ? 'FINALIZADA' : 'EM ABERTO',
            savedAt: now.toISOString(),
            folderId: selectedFolder
        };
        const existingIndex = (data.savedSheets || []).findIndex(s => s.id === savedSheet.id);
        let newSavedSheets = [...(data.savedSheets || [])];
        if (existingIndex >= 0) {
            newSavedSheets[existingIndex] = savedSheet;
        } else {
            newSavedSheets = [savedSheet, ...newSavedSheets];
        }
        onUpdate('savedSheets', newSavedSheets);
        setCurrentSheetId(savedSheet.id);
        setSaveMessage('ARQUIVO SALVO');
        setTimeout(() => setSaveMessage(null), 3000);
        alert(isFinalized ? 'Ficha finalizada e salva!' : 'Ficha salva com sucesso!');
    };
    
    const loadSavedSheet = (sheet) => {
        setCurrentSheet(JSON.parse(JSON.stringify(sheet.sheetData)));
        setActiveTemplateType(sheet.type);
        setPdfFileName(sheet.fileName);
        setCurrentSheetId(sheet.id);
        setSelectedFolder(sheet.folderId);
        setScreen('input');
    };
    
    const deleteSavedSheet = (sheetId) => {
        setConfirmModal({
            message: "Deseja realmente excluir esta ficha?",
            onConfirm: () => {
                const newSavedSheets = (data.savedSheets || []).filter(s => s.id !== sheetId);
                onUpdate('savedSheets', newSavedSheets);
                setConfirmModal(null);
            }
        });
    };
    
    const createFolder = () => {
        if (!newFolderName.trim()) {
            alert('Digite o nome do cliente!');
            return;
        }
        const folder = {
            id: generateId(),
            clientName: newFolderName.trim(),
            carName: newFolderCar.trim(),
            createdAt: new Date().toISOString()
        };
        onUpdate('folders', [...(data.folders || []), folder]);
        setNewFolderName('');
        setNewFolderCar('');
        setNewFolderModal(false);
    };
    
    const deleteFolder = (folderId) => {
        setConfirmModal({
            message: "Deseja excluir esta pasta? As fichas dentro dela não serão excluídas.",
            onConfirm: () => {
                const newFolders = (data.folders || []).filter(f => f.id !== folderId);
                const newSavedSheets = (data.savedSheets || []).map(s => s.folderId === folderId ? { ...s, folderId: null } : s);
                onUpdate('folders', newFolders);
                setTimeout(() => onUpdate('savedSheets', newSavedSheets), 500);
                setConfirmModal(null);
            }
        });
    };
    
    const moveSheetToFolder = (sheetId, folderId) => {
        const newSavedSheets = (data.savedSheets || []).map(s => s.id === sheetId ? { ...s, folderId } : s);
        onUpdate('savedSheets', newSavedSheets);
    };
    const generatePDF = () => { 
        const element = document.getElementById('tech-sheet-export'); 
        if (!window.html2pdf) { alert("Biblioteca carregando..."); return; } 
        const opt = { 
            margin: 0, 
            filename: `${pdfFileName || 'Ficha_VPS'}.pdf`, 
            image: { type: 'jpeg', quality: 0.98 }, 
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, y: 0 }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        }; 
        document.body.classList.add('printing-pdf'); 
        // Forçar escala ligeiramente menor para garantir que caiba no A4 sem transbordar
        window.html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            if (totalPages > currentSheet.pages.length) {
                pdf.deletePage(totalPages);
            }
        }).save().then(() => { 
            document.body.classList.remove('printing-pdf');
            saveSheetToSaved(true);
        }); 
    };
    const generatePDFDataOnly = () => { 
        const element = document.getElementById('tech-sheet-export'); 
        if (!window.html2pdf) { alert("Biblioteca carregando..."); return; } 
        
        // Sincronizar valores dos textareas para o clone (cloneNode não copia valores digitados)
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach(ta => {
            ta.setAttribute('data-current-value', ta.value);
        });

        const clone = element.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.width = '210mm'; // Forçar largura A4
        document.body.appendChild(clone);

        // Restaurar valores nos textareas do clone e converter para divs para melhor renderização no PDF
        const clonedTextareas = clone.querySelectorAll('textarea');
        clonedTextareas.forEach(ta => {
            const val = ta.getAttribute('data-current-value');
            const div = document.createElement('div');
            div.style.cssText = ta.style.cssText;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.innerText = val;
            ta.parentNode.replaceChild(div, ta);
        });

        const pages = clone.querySelectorAll('.tech-sheet-page'); 
        pages.forEach((page, i) => { 
            // Remover apenas as imagens que são fundos ou logos
            const images = page.querySelectorAll('img');
            images.forEach(img => img.remove());
            
            // Limpar fundos e bordas mantendo a estrutura
            page.style.backgroundColor = '#ffffff';
            page.style.backgroundImage = 'none';
            page.style.boxShadow = 'none';
            page.style.border = 'none';
            page.style.margin = '0';
            page.style.padding = '0';
            
            // Limpar cabeçalhos
            const headerArea = page.querySelector('.p-8');
            if (headerArea) {
                headerArea.style.backgroundColor = 'transparent';
                headerArea.style.borderBottom = 'none';
                // Ocultar textos do cabeçalho (Título/Subtítulo da página) se existirem, pois geralmente já estão no papel timbrado
                const headerTexts = headerArea.querySelectorAll('h2, div');
                headerTexts.forEach(t => t.style.visibility = 'hidden');
            }
            
            page.style.pageBreakAfter = i === pages.length - 1 ? 'avoid' : 'always';
        }); 

        const opt = { 
            margin: 0, 
            filename: `${pdfFileName || 'Ficha_VPS_Dados'}.pdf`, 
            image: { type: 'jpeg', quality: 0.98 }, 
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true, 
                backgroundColor: '#ffffff',
                logging: false,
                scrollY: 0,
                y: 0
            }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        }; 

        window.html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            if (totalPages > currentSheet.pages.length) {
                pdf.deletePage(totalPages);
            }
        }).save().then(() => { 
            document.body.removeChild(clone);
        }); 
    };
	    if (screen === 'menu') {
	        return (
	            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
	                <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Gerador de Fichas</h2>
	                <div className="flex flex-wrap justify-center gap-4 w-full" style={{ maxWidth: '1400px' }}>
	                    <button onClick={() => (data.techSheet.templates.standard && data.techSheet.templates.standard.pages && data.techSheet.templates.standard.pages.length > 0) ? startInput('standard') : null} disabled={!data.techSheet.templates.standard || !data.techSheet.templates.standard.pages || data.techSheet.templates.standard.pages.length === 0} className={`text-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 ${(data.techSheet.templates.standard && data.techSheet.templates.standard.pages && data.techSheet.templates.standard.pages.length > 0) ? ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: (data.techSheet.buttonColors && data.techSheet.buttonColors.standard) || "#2563eb", flex: '0 0 calc(15% - 13px)', minWidth: '160px' }}><FileText size={28} /><span className="font-bold text-xs text-center">{(data.techSheet.templates.standard && data.techSheet.templates.standard.pages && data.techSheet.templates.standard.pages.length > 0) ? 'CRIAR FICHA TÉCNICA' : 'SEM FICHA/TEMPLATE SALVA'}</span></button>
	                    <button onClick={() => (data.techSheet.templates.weight && data.techSheet.templates.weight.pages && data.techSheet.templates.weight.pages.length > 0) ? startInput('weight') : null} disabled={!data.techSheet.templates.weight || !data.techSheet.templates.weight.pages || data.techSheet.templates.weight.pages.length === 0} className={`text-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 ${(data.techSheet.templates.weight && data.techSheet.templates.weight.pages && data.techSheet.templates.weight.pages.length > 0) ? ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: (data.techSheet.buttonColors && data.techSheet.buttonColors.weight) || "#16a34a", flex: '0 0 calc(15% - 13px)', minWidth: '160px' }}><Weight size={28} /><span className="font-bold text-xs text-center">{(data.techSheet.templates.weight && data.techSheet.templates.weight.pages && data.techSheet.templates.weight.pages.length > 0) ? 'CRIAR FICHA DE PESO' : 'SEM FICHA/TEMPLATE SALVA'}</span></button>
	                    <button onClick={() => (data.techSheet.templates.project && data.techSheet.templates.project.pages && data.techSheet.templates.project.pages.length > 0) ? startInput('project') : null} disabled={!data.techSheet.templates.project || !data.techSheet.templates.project.pages || data.techSheet.templates.project.pages.length === 0} className={`text-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 ${(data.techSheet.templates.project && data.techSheet.templates.project.pages && data.techSheet.templates.project.pages.length > 0) ? ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: (data.techSheet.buttonColors && data.techSheet.buttonColors.project) || "#9333ea", flex: '0 0 calc(15% - 13px)', minWidth: '160px' }}><Layout size={28} /><span className="font-bold text-xs text-center">{(data.techSheet.templates.project && data.techSheet.templates.project.pages && data.techSheet.templates.project.pages.length > 0) ? 'CRIAR PROJETO' : 'SEM FICHA/TEMPLATE SALVA'}</span></button>
	                    <button onClick={() => (data.techSheet.templates.review && data.techSheet.templates.review.pages && data.techSheet.templates.review.pages.length > 0) ? startInput('review') : null} disabled={!data.techSheet.templates.review || !data.techSheet.templates.review.pages || data.techSheet.templates.review.pages.length === 0} className={`text-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 ${(data.techSheet.templates.review && data.techSheet.templates.review.pages && data.techSheet.templates.review.pages.length > 0) ? ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: (data.techSheet.buttonColors && data.techSheet.buttonColors.review) || "#f59e0b", flex: '0 0 calc(15% - 13px)', minWidth: '160px' }}><CheckSquare size={28} /><span className="font-bold text-xs text-center">{(data.techSheet.templates.review && data.techSheet.templates.review.pages && data.techSheet.templates.review.pages.length > 0) ? 'CRIAR FICHA DE REVISÃO' : 'SEM FICHA/TEMPLATE SALVA'}</span></button>
	                    <button onClick={() => (data.techSheet.templates.dyno && data.techSheet.templates.dyno.pages && data.techSheet.templates.dyno.pages.length > 0) ? startInput('dyno') : null} disabled={!data.techSheet.templates.dyno || !data.techSheet.templates.dyno.pages || data.techSheet.templates.dyno.pages.length === 0} className={`text-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 ${(data.techSheet.templates.dyno && data.techSheet.templates.dyno.pages && data.techSheet.templates.dyno.pages.length > 0) ? ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} style={{ backgroundColor: (data.techSheet.buttonColors && data.techSheet.buttonColors.dyno) || "#ef4444", flex: '0 0 calc(15% - 13px)', minWidth: '160px' }}><Gauge size={28} /><span className="font-bold text-xs text-center">{(data.techSheet.templates.dyno && data.techSheet.templates.dyno.pages && data.techSheet.templates.dyno.pages.length > 0) ? 'CRIAR FICHA DE DINAMÔMETRO' : 'SEM FICHA/TEMPLATE SALVA'}</span></button>
	                </div>
                <div className="flex gap-4 mt-4">
                    <button onClick={() => setScreen('saved-sheets')} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 border border-orange-500"><Folder size={24} /><span className="font-bold text-sm">FICHAS SALVAS</span></button>
                    <button onClick={startTemplateSelection} className="bg-red-900/80 hover:bg-red-800 text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 border border-red-700"><Settings size={24} /><span className="font-bold text-sm">CONFIGURAR MODELOS</span></button>
                </div>
            </div>
        );
    }
	    if (screen === 'template-selection') {
	        return (
	            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 relative">
	                <button onClick={() => setScreen('menu')} className="absolute top-0 left-0 bg-gray-800 p-3 rounded text-white hover:bg-gray-700 flex items-center gap-2 z-50"><ArrowLeft size={20}/> Voltar</button>
	                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-8">Selecione Modelo</h2>
	                <div className="flex flex-wrap justify-center gap-4">
	                    <div className="flex flex-col items-center gap-2">
	                        <button onClick={() => editTemplate('standard')} className="text-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-40" style={{ backgroundColor: data.techSheet.buttonColors?.standard || "#2563eb" }}><FileText size={32} /><span className="font-bold text-xs">Editar Ficha Técnica</span></button>
	                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
	                            <input type="color" value={data.techSheet.buttonColors?.standard || "#2563eb"} onChange={(e) => updateButtonColor('standard', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-0"/>
	                        </div>
	                    </div>
	                    <div className="flex flex-col items-center gap-2">
	                        <button onClick={() => editTemplate('weight')} className="text-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-40" style={{ backgroundColor: data.techSheet.buttonColors?.weight || "#16a34a" }}><Weight size={32} /><span className="font-bold text-xs">Editar Ficha de Peso</span></button>
	                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
	                            <input type="color" value={data.techSheet.buttonColors?.weight || "#16a34a"} onChange={(e) => updateButtonColor('weight', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-0"/>
	                        </div>
	                    </div>
	                    <div className="flex flex-col items-center gap-2">
	                        <button onClick={() => editTemplate('project')} className="text-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-40" style={{ backgroundColor: data.techSheet.buttonColors?.project || "#9333ea" }}><Layout size={32} /><span className="font-bold text-xs">Editar Projeto</span></button>
	                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
	                            <input type="color" value={data.techSheet.buttonColors?.project || "#9333ea"} onChange={(e) => updateButtonColor('project', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-0"/>
	                        </div>
	                    </div>
	                    <div className="flex flex-col items-center gap-2">
	                        <button onClick={() => editTemplate('review')} className="text-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-40" style={{ backgroundColor: data.techSheet.buttonColors?.review || "#f59e0b" }}><CheckSquare size={32} /><span className="font-bold text-xs">Editar Ficha de Revisão</span></button>
	                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
	                            <input type="color" value={data.techSheet.buttonColors?.review || "#f59e0b"} onChange={(e) => updateButtonColor('review', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-0"/>
	                        </div>
	                    </div>
	                    <div className="flex flex-col items-center gap-2">
	                        <button onClick={() => editTemplate('dyno')} className="text-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 w-40" style={{ backgroundColor: data.techSheet.buttonColors?.dyno || "#ef4444" }}><Gauge size={32} /><span className="font-bold text-xs">Editar Ficha de Dinamômetro</span></button>
	                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
	                            <input type="color" value={data.techSheet.buttonColors?.dyno || "#ef4444"} onChange={(e) => updateButtonColor('dyno', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-0"/>
	                        </div>
	                    </div>
	                </div>
	            </div>
	        );
	    }
    if (screen === 'saved-sheets') {
        const folders = data.folders || [];
        const savedSheets = data.savedSheets || [];
        const unfiledSheets = savedSheets.filter(s => !s.folderId);
        
        return (
            <div className="flex flex-col items-center min-h-[60vh] gap-6 relative w-full max-w-7xl mx-auto">
                <button onClick={() => setScreen('menu')} className="absolute top-0 left-0 bg-gray-800 p-3 rounded text-white hover:bg-gray-700 flex items-center gap-2 z-50"><ArrowLeft size={20}/> Voltar</button>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-8 mt-12">Fichas Salvas</h2>
                
                <button onClick={() => setNewFolderModal(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mb-4"><Plus size={20}/> NOVA PASTA</button>
                
                {/* Modal Nova Pasta */}
                {newFolderModal && (
                    <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border-4 border-black">
                            <h3 className="text-black font-black uppercase italic mb-6 text-xl tracking-tighter">Nova Pasta</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Cliente</label>
                                    <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-blue-600 font-bold placeholder:text-gray-300" placeholder="Ex: João Silva" style={{ color: 'black' }}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Carro</label>
                                    <input value={newFolderCar} onChange={(e) => setNewFolderCar(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl text-black outline-none focus:border-blue-600 font-bold placeholder:text-gray-300" placeholder="Ex: Golf GTI" style={{ color: 'black' }}/>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                                <button onClick={() => { setNewFolderModal(false); setNewFolderName(''); setNewFolderCar(''); }} className="text-gray-400 font-black uppercase text-xs px-4 py-2 hover:text-black">Cancelar</button>
                                <button onClick={createFolder} className="bg-black text-white font-black uppercase text-xs px-8 py-3 rounded-xl shadow-lg hover:bg-gray-800">CRIAR PASTA</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Fichas sem pasta */}
                {unfiledSheets.length > 0 && (
                    <div className="w-full bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
                        <h3 className="text-white font-bold text-lg mb-4 uppercase">Fichas sem Pasta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unfiledSheets.map(sheet => {
                                const date = new Date(sheet.savedAt);
                                const dateStr = date.toLocaleDateString('pt-BR');
                                const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                const typeLabel = sheet.type === 'standard' ? 'FICHA TÉCNICA' : sheet.type === 'weight' ? 'FICHA DE PESO' : sheet.type === 'project' ? 'PROJETO' : 'FICHA DE REVISÃO';
                                return (
                                    <div key={sheet.id} className="bg-black p-4 rounded-lg border border-gray-800 hover:border-gray-600">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="text-white font-bold text-sm mb-1">{sheet.fileName}</div>
                                                <div className="text-gray-400 text-xs mb-1">{typeLabel}</div>
                                                <div className="text-gray-500 text-[10px]">{dateStr} às {timeStr}</div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${sheet.status === 'FINALIZADA' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'}`}>{sheet.status}</div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => loadSavedSheet(sheet)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold">EDITAR</button>
                                            <button onClick={() => deleteSavedSheet(sheet.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded"><Trash2 size={14}/></button>
                                            <select onChange={(e) => { if(e.target.value) moveSheetToFolder(sheet.id, e.target.value); e.target.value = ''; }} className="bg-gray-700 text-white text-xs px-2 py-2 rounded border border-gray-600">
                                                <option value="">Mover para...</option>
                                                {folders.map(f => <option key={f.id} value={f.id}>{f.clientName} - {f.carName}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* Pastas */}
                {folders.map(folder => {
                    const folderSheets = savedSheets.filter(s => s.folderId === folder.id);
                    return (
                        <div key={folder.id} className="w-full bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-white font-bold text-lg uppercase">{folder.clientName}</h3>
                                    <p className="text-gray-400 text-sm">{folder.carName}</p>
                                </div>
                                <button onClick={() => deleteFolder(folder.id)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"><Trash2 size={16}/> Excluir Pasta</button>
                            </div>
                            {folderSheets.length === 0 ? (
                                <div className="text-gray-500 italic text-center py-8">Nenhuma ficha nesta pasta</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {folderSheets.map(sheet => {
                                        const date = new Date(sheet.savedAt);
                                        const dateStr = date.toLocaleDateString('pt-BR');
                                        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        const typeLabel = sheet.type === 'standard' ? 'FICHA TÉCNICA' : sheet.type === 'weight' ? 'FICHA DE PESO' : sheet.type === 'project' ? 'PROJETO' : 'FICHA DE REVISÃO';
                                        return (
                                            <div key={sheet.id} className="bg-black p-4 rounded-lg border border-gray-800 hover:border-gray-600">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="text-white font-bold text-sm mb-1">{sheet.fileName}</div>
                                                        <div className="text-gray-400 text-xs mb-1">{typeLabel}</div>
                                                        <div className="text-gray-500 text-[10px]">{dateStr} às {timeStr}</div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${sheet.status === 'FINALIZADA' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'}`}>{sheet.status}</div>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={() => loadSavedSheet(sheet)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold">EDITAR</button>
                                                    <button onClick={() => deleteSavedSheet(sheet.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded"><Trash2 size={14}/></button>
                                                    <button onClick={() => moveSheetToFolder(sheet.id, null)} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded" title="Remover da pasta"><MoveIcon size={14}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {folders.length === 0 && unfiledSheets.length === 0 && (
                    <div className="text-gray-500 italic text-center py-20">Nenhuma ficha salva ainda. Crie uma ficha e clique em "SALVAR" para começar!</div>
                )}
                <ConfirmModal isOpen={!!confirmModal} onClose={()=>setConfirmModal(null)} onConfirm={confirmModal?.onConfirm} message={confirmModal?.message}/>
            </div>
        );
    }
    return (
        <div className="w-full h-full relative flex flex-col items-center">
            <div className="fixed top-[180px] right-4 z-[100] flex flex-col gap-2 pointer-events-auto no-print">
                <div className="bg-gray-900 border border-gray-700 p-2 rounded-xl shadow-xl flex flex-col items-center gap-4">
                    <button onClick={() => { setIsPrintMode(false); setScreen('menu'); }} className="bg-gray-800 p-2 rounded text-white hover:bg-gray-700" title="Voltar"><ArrowLeft size={20}/></button>
                    {screen === 'input' && ( <> 
                        <button onClick={() => setIsPrintMode(!isPrintMode)} className={`p-2 rounded font-bold flex items-center justify-center w-full ${isPrintMode ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`} title="Modo Impressão de Dados (Overlay)">
                            <div className="flex flex-col items-center"><Printer size={20}/><span className="text-[8px]">DADOS</span></div>
                        </button>

                        <button onClick={generatePDF} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded font-bold flex items-center justify-center w-full" title="Baixar PDF">
                            <Download size={20}/>
                        </button>
                        <button onClick={() => saveSheetToSaved(false)} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded font-bold flex items-center justify-center w-full text-[10px]" title="Salvar e Continuar Depois">
                            <div className="flex flex-col items-center gap-1"><SaveIcon size={16}/><span>SALVAR</span></div>
                        </button>
                        {saveMessage && (
                            <div className="bg-green-600 text-white p-2 rounded font-bold text-xs text-center w-full uppercase tracking-widest">
                                {saveMessage}
                            </div>
                        )}
                    </> )}
	                    {screen === 'template' && ( 
                            <>
                                <div className="w-full h-px bg-gray-700 my-2"></div>
                                <div className="flex flex-col gap-3 w-full">
                                    <button onClick={() => {
                                        const activePageIdx = currentSheet.pages.findIndex(p => p.id === (document.querySelector('.tech-sheet-page:hover')?.id || currentSheet.pages[0].id));
                                        const page = currentSheet.pages[activePageIdx];
                                        const newFields = [...(page.fields || []), { id: generateId(), label: "", value: "", type: 'text', style: { font: currentSheet.textStyle.font, size: currentSheet.textStyle.size, color: currentSheet.textStyle.color, labelColor: currentSheet.headerConfig.lineColor }, x: 50, y: 50, width: 200, height: 40 }];
                                        updatePage(activePageIdx, { ...page, fields: newFields });
                                    }} className="flex flex-col items-center gap-1 bg-blue-600 text-white p-2 rounded-xl text-[8px] font-black uppercase hover:bg-blue-700 transition-all" title="Adicionar Texto"><TypeIcon size={18}/><span>TEXTO</span></button>
                                    
                                    <div className="flex flex-col gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
                                        <span className="text-[7px] text-gray-500 font-black text-center uppercase">Marcações</span>
                                        <div className="flex gap-1 justify-center">
                                            <button onClick={() => {
                                                const activePageIdx = currentSheet.pages.findIndex(p => p.id === (document.querySelector('.tech-sheet-page:hover')?.id || currentSheet.pages[0].id));
                                                const page = currentSheet.pages[activePageIdx];
                                                const newFields = [...(page.fields || []), { id: generateId(), label: "", value: false, type: 'checkbox', valueColor: '#000000', style: { font: currentSheet.textStyle.font, size: currentSheet.textStyle.size, color: '#000000', labelColor: currentSheet.headerConfig.lineColor }, x: 50, y: 50, width: 30, height: 30 }];
                                                updatePage(activePageIdx, { ...page, fields: newFields });
                                            }} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 flex-1 flex justify-center" title="X"><X size={14}/></button>
                                            
                                            <button onClick={() => {
                                                const activePageIdx = currentSheet.pages.findIndex(p => p.id === (document.querySelector('.tech-sheet-page:hover')?.id || currentSheet.pages[0].id));
                                                const page = currentSheet.pages[activePageIdx];
                                                const newFields = [...(page.fields || []), { id: generateId(), label: "", value: false, type: 'checkmark', valueColor: '#000000', style: { font: currentSheet.textStyle.font, size: currentSheet.textStyle.size, color: '#000000', labelColor: currentSheet.headerConfig.lineColor }, x: 50, y: 50, width: 30, height: 30 }];
                                                updatePage(activePageIdx, { ...page, fields: newFields });
                                            }} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 flex-1 flex justify-center" title="Check"><Check size={14}/></button>
                                            
                                            <button onClick={() => {
                                                const activePageIdx = currentSheet.pages.findIndex(p => p.id === (document.querySelector('.tech-sheet-page:hover')?.id || currentSheet.pages[0].id));
                                                const page = currentSheet.pages[activePageIdx];
                                                const newFields = [...(page.fields || []), { id: generateId(), label: "", value: false, type: 'square', valueColor: '#000000', style: { font: currentSheet.textStyle.font, size: currentSheet.textStyle.size, color: '#000000', labelColor: currentSheet.headerConfig.lineColor }, x: 50, y: 50, width: 30, height: 30 }];
                                                updatePage(activePageIdx, { ...page, fields: newFields });
                                            }} className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 flex-1 flex justify-center" title="Quadrado"><Grid size={14}/></button>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-px bg-gray-700 my-2"></div>
                                    
                                    <button onClick={saveTemplate} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-xl font-bold flex flex-col items-center gap-1 w-full" title="Salvar Template">
                                        <SaveIcon size={18}/><span className="text-[8px]">SALVAR</span>
                                    </button>
                                </div>
                            </>
                        )}
	                </div>
	            </div>
            <div id="tech-sheet-export" className={`flex flex-col items-center w-full ${isPrintMode ? 'print-mode-active' : ''}`}>
                {screen === 'input' && (
                    <div className="w-full bg-gray-800 border-b-4 border-gray-600 p-6 text-center no-print">
                        <input 
                            value={pdfFileName} 
                            onChange={(e) => setPdfFileName(e.target.value)} 
                            className="w-full bg-transparent text-white font-black text-2xl uppercase tracking-widest text-center outline-none border-b-2 border-transparent hover:border-gray-500 focus:border-green-500"
                            placeholder="Digite o nome do arquivo"
                        />
                    </div>
                )}
                <style>{` 
                    .print-mode-active img { display: none !important; }
                    .print-mode-active .bg-white { background: transparent !important; }
                    .print-mode-active h2, .print-mode-active .text-sm, .print-mode-active h1 { display: none !important; }
                    .print-mode-active .page-a4 { border: none !important; box-shadow: none !important; }
                    .printing-pdf .no-print { display: none !important; } 
                    .printing-pdf .border-red-500\\/50 { border-color: transparent !important; }
                    .printing-pdf .tech-sheet-page { margin-bottom: 0 !important; page-break-after: always !important; height: 296.5mm !important; width: 210mm !important; overflow: hidden !important; position: relative !important; }
                    .printing-pdf .tech-sheet-page:last-child { page-break-after: avoid !important; margin-bottom: 0 !important; }
                    .tech-sheet-page img { object-fit: fill !important; width: 100% !important; height: 100% !important; position: absolute !important; top: 0 !important; left: 0 !important; }
                    @media print {
                        body * { visibility: hidden; }
                        #tech-sheet-export, #tech-sheet-export * { visibility: visible; }
                        #tech-sheet-export { position: absolute; left: 0; top: 0; width: 100%; }
                        .no-print { display: none !important; }
                    }
                `}</style>
                {(currentSheet.pages || []).map((page, idx) => ( <TechSheetPage key={page.id} pageData={page} pageIndex={idx} headerConfig={currentSheet.headerConfig} textStyle={currentSheet.textStyle} updatePage={updatePage} removePage={removePage} mode={screen} /> ))}
                {screen === 'template' && ( 
                    <div className="flex gap-4 mb-20 no-print">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePageUpload} />
                        <button onClick={handleAddPageClick} className="bg-gray-800 text-white px-8 py-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-white hover:bg-gray-700 flex flex-col items-center gap-2"><Plus size={32}/><span className="font-bold">ADICIONAR NOVA PÁGINA (UPLOAD)</span></button>
                    </div> 
                 )}
            </div>
        </div>
    );
};

const ProjectsSection = ({ content, isAdmin, onUpdate, setEditingProject, viewPhoto, setViewPhoto }) => {
    const [selectedProject, setSelectedProject] = useState(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [tempProject, setTempProject] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
	    const [showLinkModal, setShowLinkModal] = useState(false);
	    const [specPresetModal, setSpecPresetModal] = useState(null);
	    const [cardModal, setCardModal] = useState(null);
  const [showCardDescModal, setShowCardDescModal] = useState(false);
	    const [specMenuOpen, setSpecMenuOpen] = useState(false);
	    const [videoModalOpen, setVideoModalOpen] = useState(false);
	    const [activeSubTab, setActiveSubTab] = useState('projects');
	    const savedRange = useRef(null);

		    useEffect(() => {
		        if (selectedProject) {
		            window.history.pushState({ projectOpen: true }, "");
		            const handlePopState = () => {
		                // Se houver uma foto aberta, o popstate global do App cuidará dela.
		                // Só fechamos o projeto se não houver foto aberta.
		                if (!viewPhoto) {
		                    setSelectedProject(null);
		                }
		            };
		            window.addEventListener('popstate', handlePopState);
		            return () => window.removeEventListener('popstate', handlePopState);
		        }
		    }, [selectedProject, viewPhoto]);

	    useEffect(() => {
	        if (!isEditingProject || !tempProject) return;
	        const autoSaveInterval = setInterval(() => {
	            autoSaveDraft();
	        }, 10000);
	        return () => clearInterval(autoSaveInterval);
	    }, [isEditingProject, tempProject, activeSubTab]);

	    useEffect(() => {
	        const handleBeforeUnload = (e) => {
	            if (isEditingProject && tempProject) {
	                e.preventDefault();
	                e.returnValue = '';
	            }
	        };
	        window.addEventListener('beforeunload', handleBeforeUnload);
	        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	    }, [isEditingProject, tempProject]);

	    const publishedProjects = useMemo(() => {
	        const key = activeSubTab === 'projects' ? 'projects' : `projects_${activeSubTab}`;
	        return Array.isArray(content[key]) ? content[key] : [];
	    }, [content, activeSubTab]);

	    const draftProjects = useMemo(() => {
	        const key = activeSubTab === 'projects' ? 'projectsDraft' : `projectsDraft_${activeSubTab}`;
	        return Array.isArray(content[key]) ? content[key] : [];
	    }, [content, activeSubTab]);

	    const allFeedItems = useMemo(() => {
	        const published = publishedProjects.map(p => ({ ...p, isDraft: false }));
	        const drafts = isAdmin ? draftProjects.map(d => ({ ...d, isDraft: true })) : [];
	        const map = new Map();
	        published.forEach(item => map.set(item.id, item));
	        if (isAdmin) drafts.forEach(item => map.set(item.id, item));
	        return Array.from(map.values()).filter(i => isAdmin || !i.isDraft).sort((a, b) => new Date(b.date) - new Date(a.date));
	    }, [publishedProjects, draftProjects, isAdmin]);

	    const autoSaveDraft = async () => {
	        if (!tempProject || !isEditingProject) return;
	        const blocks = captureEditorContent();
	        const updatedTemp = { ...tempProject, blocks };
	        const draftKey = activeSubTab === 'projects' ? 'projectsDraft' : `projectsDraft_${activeSubTab}`;
	        
	        const existingDraftIndex = draftProjects.findIndex(d => d.id === updatedTemp.id);
	        let newDraftProjects = [...draftProjects];
	        if (existingDraftIndex >= 0) {
	            newDraftProjects[existingDraftIndex] = updatedTemp;
	        } else {
	            newDraftProjects = [updatedTemp, ...newDraftProjects];
	        }
	        
	        onUpdate(draftKey, newDraftProjects);
	    };

	    const captureEditorContent = () => {
	        if (!tempProject) return [];
	        const blocks = (tempProject.blocks || []).map(b => ({...b}));
	        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
	            const bIdx = el.getAttribute('data-block-idx');
	            const type = el.getAttribute('data-block-type');
	            if (bIdx !== null) {
	                const idx = parseInt(bIdx);
	                if (blocks[idx]) {
	                    if (type === 'text') blocks[idx].content = el.innerHTML;
	                    if (type === 'sideText') blocks[idx].sideText = el.innerHTML;
	                    if (type === 'specValue') {
	                        const sIdx = parseInt(el.getAttribute('data-spec-idx'));
	                        if (blocks[idx].items && blocks[idx].items[sIdx]) blocks[idx].items[sIdx].value = el.innerHTML;
	                    }
	                }
	            }
	        });
	        return blocks;
	    };

			const saveAndPublish = async () => {
				if (!tempProject) return;
				const blocks = captureEditorContent();
				const finalProj = { ...tempProject, blocks, published: true };
				const key = activeSubTab === 'projects' ? 'projects' : `projects_${activeSubTab}`;
				const draftKey = activeSubTab === 'projects' ? 'projectsDraft' : `projectsDraft_${activeSubTab}`;
				
				const existingPublishedIndex = publishedProjects.findIndex(p => p.id === finalProj.id);
				let newPublishedProjects = [...publishedProjects];
				if (existingPublishedIndex >= 0) {
					newPublishedProjects[existingPublishedIndex] = finalProj;
				} else {
					newPublishedProjects = [finalProj, ...newPublishedProjects];
				}
				
				const newDrafts = draftProjects.filter(d => d.id !== finalProj.id);
				
				onUpdate(key, newPublishedProjects);
				onUpdate(draftKey, newDrafts);
				
				setTempProject(null);
				setIsEditingProject(false);
				setEditingProject(false);
				setSelectedProject(null);
		};
	
		    const goBackAndSaveDraft = async () => {
		        if (!tempProject) return;
		        const blocks = captureEditorContent();
		        const updatedTemp = { ...tempProject, blocks, published: false };
		        const draftKey = activeSubTab === 'projects' ? 'projectsDraft' : `projectsDraft_${activeSubTab}`;
		        const publishedKey = activeSubTab === 'projects' ? 'projects' : `projects_${activeSubTab}`;
		        
		        const existingDraftIndex = draftProjects.findIndex(d => d.id === updatedTemp.id);
		        let newDraftProjects = [...draftProjects];
		        if (existingDraftIndex >= 0) {
		            newDraftProjects[existingDraftIndex] = updatedTemp;
		        } else {
		            newDraftProjects = [updatedTemp, ...newDraftProjects];
		        }
		        
		        const newPublished = publishedProjects.filter(p => p.id !== updatedTemp.id);
		        
		        onUpdate(draftKey, newDraftProjects);
		        onUpdate(publishedKey, newPublished);
		        
		        setIsEditingProject(false);
		        setEditingProject(false);
		        setSelectedProject(null);
		        setTempProject(null);
		    };

	    const startNewProject = () => {
	        const newProj = { id: generateId(), title: "Novo Project Car", date: getToday(), excerpt: "", banner: null, coverPhoto: null, categoryTags: [], blocks: [{ id: generateId(), type: 'text', content: '' }], published: false };
	        setTempProject(newProj);
	        setIsEditingProject(true);
	        setEditingProject(true);
	        setSelectedProject(newProj);
	    };

	    const editProject = (proj) => {
	        const draft = draftProjects.find(d => d.id === proj.id);
	        setTempProject(draft ? JSON.parse(JSON.stringify(draft)) : JSON.parse(JSON.stringify(proj)));
	        setIsEditingProject(true);
	        setEditingProject(true);
	        setSelectedProject(proj);
	    };

	    const deleteProject = (id) => {
	        setConfirmModal({
	            message: "Deseja excluir este projeto permanentemente?",
	            onConfirm: async () => {
	                const key = activeSubTab === 'projects' ? 'projects' : `projects_${activeSubTab}`;
	                const draftKey = activeSubTab === 'projects' ? 'projectsDraft' : `projectsDraft_${activeSubTab}`;
	                const newPublishedProjects = publishedProjects.filter(p => p.id !== id);
	                const newDraftProjects = draftProjects.filter(d => d.id !== id);
	                onUpdate(key, newPublishedProjects);
	                onUpdate(draftKey, newDraftProjects);
	                setConfirmModal(null);
	            }
	        });
	    };

	    const handleAddVideo = (url) => {
	        if (!url) return;
	        let videoId = "";
	        if (url.includes("youtube.com/embed/")) videoId = url.split("embed/")[1].split("?")[0].split("\"")[0];
	        else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
	        else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
	        else if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
	        
	        if (videoId) {
	            const newBlock = { id: generateId(), type: 'youtube', videoId, size: '100', align: 'center', allowWrap: false, sideText: '', manualWidth: 100 };
	            setTempProject(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
	        } else alert("URL inválida. Certifique-se de que é um link do YouTube.");
	    };

	    const handleAction = (cmd, val) => {
	        const sel = window.getSelection();
	        if (!sel || !sel.rangeCount) return;
	        const range = sel.getRangeAt(0);
	        const applyStyle = (tag, styleProp, value) => {
	            const span = document.createElement('span');
	            if (styleProp) span.style[styleProp] = value;
	            if (range.collapsed) {
	                span.innerHTML = '&#8203;';
	                range.insertNode(span);
	                const newRange = document.createRange();
	                newRange.setStart(span.firstChild, 1);
	                newRange.setEnd(span.firstChild, 1);
	                sel.removeAllRanges();
	                sel.addRange(newRange);
	            } else {
	                span.appendChild(range.extractContents());
	                range.insertNode(span);
	                const newRange = document.createRange();
	                newRange.selectNodeContents(span);
	                sel.removeAllRanges();
	                sel.addRange(newRange);
	            }
	        };
	        if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') document.execCommand(cmd, false, null);
	        else if (cmd === 'fontSize') applyStyle('span', 'fontSize', val + 'px');
	        else if (cmd === 'fontName') applyStyle('span', 'fontFamily', val);
	        else if (cmd === 'foreColor') applyStyle('span', 'color', val);
	        else if (cmd === 'createLink') { savedRange.current = range.cloneRange(); setShowLinkModal(true); }
	        else document.execCommand(cmd, false, val);
	    };

	    const insertCamouflagedLink = (word, url) => {
	        if (word && url) {
	            if (savedRange.current) {
	                const sel = window.getSelection();
	                sel.removeAllRanges();
	                sel.addRange(savedRange.current);
	            }
	            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold;">${word}</a>`);
	        }
	    };

	    const addBlock = (type, preset = null) => {
	        let newBlock;
	        if (type === 'image') newBlock = { id: generateId(), type: 'image', url: null, size: '100', caption: '', align: 'center', allowWrap: false, sideText: '', manualWidth: 100 };
	        else if (type === 'specs') newBlock = { id: generateId(), type: 'specs', url: null, title: preset ? preset.label : 'ESPECIFICAÇÕES TÉCNICAS', items: preset ? preset.items.map(label => ({ label, value: '' })) : [{ label: 'PISTÕES', value: '' }, { label: 'BIELAS', value: '' }, { label: 'VIRABREQUIM', value: '' }, { label: 'CABEÇOTE', value: '' }, { label: 'TURBINA', value: '' }, { label: 'INJEÇÃO', value: '' }] };
	        else if (type === 'youtube') { setVideoModalOpen(true); return; }
	        else newBlock = { id: generateId(), type: 'text', content: '' };
	        setTempProject(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
	    };

    const toggleAlignment = (bIdx, align) => {
      const block = tempProject.blocks[bIdx];
      const hasContent = block.sideText && block.sideText.trim() !== '' && block.sideText !== '<br>';
      
      if (align === 'center' && block.allowWrap && hasContent) {
        setConfirmModal({
          message: "A foto voltará ao centro e o conteúdo lateral será excluído. Continuar?",
          onConfirm: () => {
            const n = [...tempProject.blocks];
            if (n[bIdx]) {
                n[bIdx].align = 'center';
                n[bIdx].allowWrap = false;
                n[bIdx].sideText = '';
                setTempProject({...tempProject, blocks: n});
            }
            setConfirmModal(null);
          }
        });
      } else {
        const n = [...tempProject.blocks];
        if (n[bIdx]) {
            n[bIdx].align = align;
            if (align === 'center') {
              n[bIdx].allowWrap = false;
              n[bIdx].sideText = '';
            }
            setTempProject({...tempProject, blocks: n});
        }
      }
    };

    const renderBlockControls = (bIdx) => (
        <div className="absolute -top-3 -right-3 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 group-hover/img-item:opacity-100 z-50 no-print">
            <button onClick={() => {
                const n = [...tempProject.blocks];
                if(bIdx > 0) {
                    [n[bIdx], n[bIdx-1]] = [n[bIdx-1], n[bIdx]];
                    setTempProject({...tempProject, blocks: n});
                }
            }} className="p-1.5 bg-gray-800 rounded-full text-white"><ChevronUp size={12}/></button>
            <button onClick={() => {
                const n = [...tempProject.blocks];
                if(bIdx < n.length - 1) {
                    [n[bIdx], n[bIdx+1]] = [n[bIdx+1], n[bIdx]];
                    setTempProject({...tempProject, blocks: n});
                }
            }} className="p-1.5 bg-gray-800 rounded-full text-white"><ChevronDown size={12}/></button>
            <button onClick={() => {
                const n = tempProject.blocks.filter((_, i) => i !== bIdx);
                setTempProject({...tempProject, blocks: n});
            }} className="p-1.5 bg-red-600 text-white rounded-full"><Trash2 size={12}/></button>
        </div>
    );

    const renderBlockContent = (block, bIdx, isEdit) => {
        if (block.type === 'youtube') {
            return (
                <div className={`relative group/block w-full my-8 ${isEdit ? 'border-2 border-dashed border-red-600/30 p-4 rounded-3xl bg-white' : ''}`}>
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-black bg-black" style={{ width: (block.size === '100' && block.manualWidth) ? `${block.manualWidth}%` : (block.size === '100' ? '100%' : `${block.size}%`), margin: block.align === 'center' ? '0 auto' : (block.align === 'right' ? '0 0 0 auto' : '0') }}>
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${block.videoId}?rel=0&modestbranding=1`} 
                            title="YouTube video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen
                        ></iframe>
                    </div>
                    {isEdit && (
                        <div className="flex flex-col gap-2 mt-3 items-center">
                            <div className="flex justify-center gap-1 bg-gray-100 p-1 rounded-lg">
                                {[
                                    {v:'100', l:'VIDEO 1'}, 
                                    {v:'50', l:'1/2'}, 
                                    {v:'33', l:'1/3'}, 
                                    {v:'25', l:'1/4'}
                                ].map(sz => (
                                    <button key={sz.v} onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const n = [...tempProject.blocks];
                                        if (n[bIdx]) {
                                            n[bIdx].size = sz.v;
                                            setTempProject({...tempProject, blocks: n});
                                        }
                                    }} className={`px-2 py-1 rounded text-[9px] font-black ${block.size === sz.v ? 'bg-red-600 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}>{sz.l}</button>
                                ))}
                            </div>
                            
                            {block.size === '100' && (
                                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full border border-gray-300">
                                    <span className="text-[7px] font-black text-red-600 ml-2 uppercase">LIVRE:</span>
                                    <input type="range" min="10" max="100" value={block.manualWidth || 100} onChange={(e) => {
                                        const n = [...tempProject.blocks];
                                        n[bIdx].manualWidth = Number(e.target.value);
                                        setTempProject({...tempProject, blocks: n});
                                    }} className="w-20 accent-red-600"/>
                                    <span className="text-[8px] font-black mr-2">{block.manualWidth || 100}%</span>
                                </div>
                            )}

                            <div className="flex gap-1">
                                <button onClick={() => {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].align = 'left';
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                }} className={`p-1 rounded ${block.align === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignLeft size={12}/></button>
                                <button onClick={() => {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].align = 'center';
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                }} className={`p-1 rounded ${block.align === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignCenter size={12}/></button>
                                <button onClick={() => {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].align = 'right';
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                }} className={`p-1 rounded ${block.align === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignRight size={12}/></button>
                                
                                {block.size === '50' && (block.align === 'left' || block.align === 'right') && (
                                    <button onClick={() => {
                                        const n = [...tempProject.blocks];
                                        if (n[bIdx]) {
                                            n[bIdx].allowWrap = !n[bIdx].allowWrap;
                                            setTempProject({...tempProject, blocks: n});
                                        }
                                    }} className={`px-2 py-0.5 rounded text-[8px] font-bold ${block.allowWrap ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                                        LATERAL
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {isEdit && renderBlockControls(bIdx)}
                </div>
            );
        }
        if (block.type === 'specs') {
            const specBlocks = tempProject.blocks.filter(b => b.type === 'specs');
            const specIndex = specBlocks.findIndex(b => b.id === block.id);
            const isMirrored = specIndex % 2 !== 0;

            return (
                <div className={`relative group/block w-full flex flex-col md:flex-row items-start gap-8 my-12 ${isMirrored ? 'md:flex-row-reverse' : ''} ${isEdit ? 'border-2 border-dashed border-red-600/30 p-6 rounded-3xl bg-white' : ''}`}>
                    <div className="w-full md:w-1/2">
                        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group/img flex items-center justify-center shadow-xl border border-gray-200">
                            {block.url ? (
                                <img src={block.url} className="w-full h-full object-cover" alt="Spec Block"/>
                            ) : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2"><ImageIcon size={48}/><span className="text-[10px] font-black uppercase">Foto do Componente</span></div>}
                            {isEdit && (
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer z-10">
                                    <Upload size={32} className="text-white"/>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => {
                                        const n = [...tempProject.blocks];
                                        if (n[bIdx]) {
                                            n[bIdx].url = res;
                                            setTempProject({...tempProject, blocks: n});
                                        }
                                    })}/>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 space-y-4">
                        <div 
                            contentEditable={isEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                if(isEdit) {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].title = e.target.innerText;
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                }
                            }}
                            className="text-2xl font-black text-red-600 tracking-tighter outline-none"
                        >
                            {block.title || 'ESPECIFICAÇÕES TÉCNICAS'}
                        </div>
                        
                        <div className="h-1 w-20 bg-red-600 rounded-full"></div>

                        <div className="space-y-2">
                            {(block.items || []).map((item, iIdx) => (
                                <div key={iIdx} className="flex items-center gap-2 group/item">
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-sm font-black text-black uppercase min-w-[100px]">
                                            {isEdit ? (
                                                <input 
                                                    value={item.label} 
                                                    onChange={(e) => {
                                                        const n = [...tempProject.blocks];
                                                        n[bIdx].items[iIdx].label = e.target.value.toUpperCase();
                                                        setTempProject({...tempProject, blocks: n});
                                                    }}
                                                    className="bg-transparent border-b border-gray-200 outline-none w-full focus:border-red-600"
                                                />
                                            ) : `${item.label}:`}
                                        </span>
                                        <div className="flex-1">
                                            {isEdit ? (
                                                <div className="relative group/spec-input">
                                                    <div className="absolute -top-10 left-0 hidden group-focus-within/spec-input:block z-[200]">
                                                        <div className="bg-black p-1 rounded shadow-2xl flex gap-1 scale-75 origin-left">
                                                            <button onMouseDown={(e) => { e.preventDefault(); handleAction('bold'); }} className="p-1 text-white hover:bg-gray-700 rounded"><Bold size={14}/></button>
                                                            <select onChange={(e) => handleAction('fontSize', e.target.value)} className="bg-gray-800 text-white text-[10px] rounded px-1 outline-none">
                                                                <option value="">Tamanho</option>
                                                                {[10,12,14,16,18,20,24].map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                            <input type="color" onChange={(e) => handleAction('foreColor', e.target.value)} className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div 
                                                        ref={(el) => {
                                                            if (el && isEdit) {
                                                                el.onInput = (e) => {
                                                                    const n = [...tempProject.blocks];
                                                                    n[bIdx].items[iIdx].value = e.target.innerHTML;
                                                                    setTempProject({...tempProject, blocks: n});
                                                                };
                                                            }
                                                        }}
                                                        contentEditable={isEdit}
                                                        data-block-idx={bIdx}
                                                        data-spec-idx={iIdx}
                                                        data-block-type="specValue"
                                                        suppressContentEditableWarning
                                                        className={`bg-gray-50/50 border-b-2 outline-none w-full focus:border-red-600 text-sm min-h-[24px] break-all whitespace-pre-wrap relative z-10 px-1 rounded-t ${!item.value || item.value === '<br>' || item.value === '' ? 'border-gray-300' : 'border-gray-100'}`}
                                                        dangerouslySetInnerHTML={{ __html: typeof item.value === 'string' ? item.value : '' }}
                                                    />

                                                </div>
                                            ) : <span className="text-sm text-gray-700 font-medium break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: item.value }}></span>}
                                        </div>
                                    </div>
                                    {isEdit && (
                                        <button 
                                            onClick={() => {
                                                const n = [...tempProject.blocks];
                                                n[bIdx].items = n[bIdx].items.filter((_, i) => i !== iIdx);
                                                setTempProject({...tempProject, blocks: n});
                                            }}
                                            className="opacity-0 group-hover/item:opacity-100 text-red-600 p-1 hover:bg-red-50 rounded"
                                        >
                                            <X size={12}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {isEdit && (
                                <button 
                                    onClick={() => {
                                        const n = [...tempProject.blocks];
                                        if (!n[bIdx].items) n[bIdx].items = [];
                                        n[bIdx].items.push({ label: 'NOVO ITEM', value: '' });
                                        setTempProject({...tempProject, blocks: n});
                                    }}
                                    className="mt-4 flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest"
                                >
                                    <Plus size={14}/> Adicionar Especificação
                                </button>
                            )}
                        </div>
                    </div>

                    {isEdit && renderBlockControls(bIdx)}
                </div>
            );
        } else if(block.type === 'text') {
            return (
                <div className="relative group/block w-full">
                    {isEdit && <FormattingToolbar onAction={handleAction}/>}
                    <div 
                        ref={(el) => {
                            if (el && isEdit) {
                                el.onInput = (e) => {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].content = e.target.innerHTML;
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                };
                            }
                        }}
                        contentEditable={isEdit} 
                        data-block-idx={bIdx}
                        data-block-type="text"
                        suppressContentEditableWarning 
                        className={`prose prose-sm md:prose-lg max-w-none min-h-[50px] outline-none p-6 rounded-b-xl ${isEdit ? 'border-x border-b-2 border-red-600 bg-white text-black' : 'text-gray-800'}`}
                        style={{ margin: 0, caretColor: isEdit ? '#ef4444' : 'transparent' }}
                        dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                    {isEdit && renderBlockControls(bIdx)}
                </div>
            );
        } else {
            return (
                <div className={`relative group/img-item ${isEdit ? 'border-2 border-red-600 p-2 rounded-2xl bg-white' : ''} ${!isEdit && block.url ? 'cursor-zoom-in' : ''}`} onClick={() => !isEdit && block.url && setViewPhoto(block.url)}>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative group/img flex items-center justify-center">
                        {block.url ? (
                            <img src={block.url} className="w-full h-full object-contain" style={{ width: (block.size === '100' && block.manualWidth) ? `${block.manualWidth}%` : '100%' }} alt="Project Block"/>
                        ) : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={48}/></div>}
                        {isEdit && (
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer z-10">
                                <Upload size={32} className="text-white"/>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => {
                                    const n = [...tempProject.blocks];
                                    if (n[bIdx]) {
                                        n[bIdx].url = res;
                                        setTempProject({...tempProject, blocks: n});
                                    }
                                })}/>
                            </label>
                        )}
                    </div>
                    {isEdit && (
                        <div className="flex flex-col gap-2 mt-3 items-center">
                            <div className="flex justify-center gap-1 bg-gray-100 p-1 rounded-lg">
                                {[
                                    {v:'100', l:'FOTO 1'}, 
                                    {v:'50', l:'1/2'}, 
                                    {v:'33', l:'1/3'}, 
                                    {v:'25', l:'1/4'}
                                ].map(sz => (
                                    <button key={sz.v} onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const n = [...tempProject.blocks];
                                        if (n[bIdx]) {
                                            n[bIdx].size = sz.v;
                                            setTempProject({...tempProject, blocks: n});
                                        }
                                    }} className={`px-2 py-1 rounded text-[9px] font-black ${block.size === sz.v ? 'bg-red-600 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}>{sz.l}</button>
                                ))}
                            </div>
                            
                            {block.size === '100' && (
                                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full border border-gray-300">
                                    <span className="text-[7px] font-black text-red-600 ml-2 uppercase">LIVRE:</span>
                                    <input type="range" min="10" max="100" value={block.manualWidth || 100} onChange={(e) => {
                                        const n = [...tempProject.blocks];
                                        n[bIdx].manualWidth = Number(e.target.value);
                                        setTempProject({...tempProject, blocks: n});
                                    }} className="w-20 accent-red-600"/>
                                    <span className="text-[8px] font-black mr-2">{block.manualWidth || 100}%</span>
                                </div>
                            )}

                            <div className="flex gap-1">
                                <button onClick={() => toggleAlignment(bIdx, 'left')} className={`p-1 rounded ${block.align === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignLeft size={12}/></button>
                                <button onClick={() => toggleAlignment(bIdx, 'center')} className={`p-1 rounded ${block.align === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignCenter size={12}/></button>
                                <button onClick={() => toggleAlignment(bIdx, 'right')} className={`p-1 rounded ${block.align === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}><AlignRight size={12}/></button>
                                
                                {block.size === '50' && (block.align === 'left' || block.align === 'right') && (
                                    <button onClick={() => {
                                        const n = [...tempProject.blocks];
                                        if (n[bIdx]) {
                                            n[bIdx].allowWrap = !n[bIdx].allowWrap;
                                            setTempProject({...tempProject, blocks: n});
                                        }
                                    }} className={`px-2 py-0.5 rounded text-[8px] font-bold ${block.allowWrap ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                                        LATERAL
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <input 
                        readOnly={!isEdit}
                        value={block.caption || ''} 
                        onChange={(e) => {
                            const n = [...tempProject.blocks];
                            if (n[bIdx]) {
                                n[bIdx].caption = e.target.value;
                                setTempProject({...tempProject, blocks: n});
                            }
                        }} 
                        placeholder="Legenda da foto"
                        className={`w-full bg-transparent text-center text-[10px] mt-2 font-bold uppercase tracking-widest outline-none italic ${isEdit ? 'text-black border-b border-red-600' : 'text-gray-500'}`} 
                    />
                    {isEdit && renderBlockControls(bIdx)}
                </div>
            );
        }
    };

	    const renderBlocks = (blocks, isEdit) => {
	        return (
	            <div className="w-full flex flex-wrap justify-center">
	                {blocks.map((block, index) => {
	                    const blockGap = isEdit ? 'mb-8' : 'mb-0';
	                    if(block.type === 'image') {
	                        const widthClass = block.size === '50' ? 'w-1/2' : (block.size === '33' ? 'w-1/3' : (block.size === '25' ? 'w-1/4' : 'w-full'));
	                        const alignmentClass = block.align === 'left' ? 'float-left mr-6 mb-2' : (block.align === 'right' ? 'float-right ml-6 mb-2' : 'mx-auto mb-0 clear-both');
	                        
	                        return (
	                            <div key={block.id} className={`${block.allowWrap ? 'w-full clearfix' : `${widthClass} flex flex-col items-center ${blockGap}  `}`} style={{ width: !block.allowWrap ? (block.size === '100' ? '100%' : (block.size === '50' ? '50%' : (block.size === '33' ? '33.333%' : (block.size === '25' ? '25%' : '100%')))) : '100%', flexDirection: !block.allowWrap ? 'column' : undefined, padding: '0' }}>
	                                <div className={`${block.allowWrap ? (block.align === 'right' ? 'float-right ml-6 mb-4 w-full md:w-1/2' : 'float-left mr-6 mb-4 w-full md:w-1/2') : `w-full ${alignmentClass}`} relative group/img-cont flex flex-col items-center`}>
		                                <div className="w-full flex justify-center">
		                                        <div style={{ width: (block.size === '100' && block.manualWidth) ? `${block.manualWidth}%` : '100%' }} className="flex justify-center">
		                                          <div className="w-full max-w-full">
		                                            {renderBlockContent(block, index, isEdit)}
		                                          </div>
	                                        </div>
	                                    </div>
	                                </div>
                                {block.allowWrap && (
                                  <div 
                                    ref={(el) => {
                                        if (el && isEdit) {
                                            el.onInput = (e) => {
                                                const n = [...tempProject.blocks];
                                                if (n[index]) {
                                                    n[index].sideText = e.target.innerHTML;
                                                    setTempProject({...tempProject, blocks: n});
                                                }
                                            };
                                        }
                                    }}
                                    contentEditable={isEdit}
                                    data-block-idx={index}
                                    data-block-type="sideText"
                                    suppressContentEditableWarning
                                    className={`min-h-[50px] w-full prose prose-sm md:prose-lg outline-none p-4 rounded-xl ${isEdit ? 'border border-blue-600/30 bg-blue-50/5 text-black' : 'text-gray-800'}`}
                                    style={{ margin: 0, flex: 1 }}
                                    dangerouslySetInnerHTML={{ __html: block.sideText || '' }}
                                  />
                                )}
                            </div>
                        );
                    } else if (block.type === 'youtube' && block.allowWrap) {
                        return (
                            <div key={block.id} className="w-full clearfix" style={{ width: '100%' }}>
                                <div className={`${block.allowWrap ? (block.align === 'right' ? 'float-right ml-6 mb-4 w-full md:w-1/2' : 'float-left mr-6 mb-4 w-full md:w-1/2') : `w-full`} relative group/vid-cont flex flex-col items-center`}>
                                    <div className="w-full flex justify-center">
                                        <div style={{ width: (block.size === '100' && block.manualWidth) ? `${block.manualWidth}%` : '100%' }} className="flex justify-center">
                                          <div className="w-full max-w-full">
                                            {renderBlockContent(block, index, isEdit)}
                                          </div>
                                        </div>
                                    </div>
                                </div>
                                <div 
                                    ref={(el) => {
                                        if (el && isEdit) {
                                            el.onInput = (e) => {
                                                const n = [...tempProject.blocks];
                                                if (n[index]) {
                                                    n[index].sideText = e.target.innerHTML;
                                                    setTempProject({...tempProject, blocks: n});
                                                }
                                            };
                                        }
                                    }}
                                    contentEditable={isEdit}
                                    data-block-idx={index}
                                    data-block-type="sideText"
                                    suppressContentEditableWarning
                                    className={`min-h-[50px] w-full prose prose-sm md:prose-lg outline-none p-4 rounded-xl ${isEdit ? 'border border-blue-600/30 bg-blue-50/5 text-black' : 'text-gray-800'}`}
                                    style={{ margin: 0, flex: 1 }}
                                    dangerouslySetInnerHTML={{ __html: block.sideText || '' }}
                                />
                            </div>
                        );
                    } else {
                        return (
                            <div key={block.id} className={`w-full ${blockGap}`}>
                                {renderBlockContent(block, index, isEdit)}
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    if (selectedProject && isEditingProject) {
        return (
            <div className="min-h-screen bg-white text-black pb-40 relative">
                <div className="fixed top-0 left-0 w-full z-[9999] bg-black p-4 flex justify-between items-center shadow-2xl no-print">
                    <button onClick={goBackAndSaveDraft} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-black uppercase text-xs flex items-center gap-2"><ArrowLeft size={16}/> VOLTAR E SALVAR RASCUNHO</button>
                    <button onClick={saveAndPublish} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-black uppercase text-sm flex items-center gap-2">PUBLICAR MATÉRIA</button>
                </div>

                <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-32">
                    <div className="max-w-5xl mx-auto space-y-12 mb-20">
                        <div>
                            <label className="text-[10px] font-black uppercase text-red-600 mb-2 block tracking-widest">1. Título da Matéria</label>
                            <input value={tempProject.title} onChange={(e) => setTempProject({...tempProject, title: e.target.value})} className="w-full bg-transparent text-5xl md:text-7xl font-black uppercase italic tracking-tighter outline-none border-b-8 border-red-600 pb-4 leading-[0.85]" placeholder="TÍTULO DO PROJETO..."/>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-start">
                            <div>
                                <label className="text-[10px] font-black uppercase text-red-600 mb-2 block tracking-widest">Resumo / Chamada</label>
                                <textarea value={tempProject.excerpt} onChange={(e) => setTempProject({...tempProject, excerpt: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 text-gray-800 font-bold outline-none h-32 focus:border-red-600" placeholder="Escreva um breve resumo..."/>
                            </div>
                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase text-red-600 mb-2 block tracking-widest">Informações Gerais</label>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
                                    <Calendar size={24} className="text-red-600"/>
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black uppercase text-gray-400 block">Data de Publicação</span>
                                        <input type="date" value={tempProject.date} onChange={(e) => setTempProject({...tempProject, date: e.target.value})} className="bg-transparent font-black text-lg outline-none text-black w-full"/>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-gray-400 block">CATEGORIA</span>
                                        
                                    </div>
                                    <div className="space-y-4">
                                        {['PROJECT CARS', 'SUB CATEGORIAS', 'OUTROS ASSUNTOS'].map(group => (
                                            <div key={group}>
                                                <span className="text-[8px] font-black text-gray-400 uppercase mb-2 block">{group}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {(content.categoryTags || []).filter(t => t.group === group).map(tag => (
                                                        <div key={tag.id} className="relative group/tag">
                                                            <div className="flex flex-col gap-1">
                                                                <button 
                                                                    onClick={() => {
                                                                        const currentTags = tempProject.categoryTags || [];
                                                                        if (currentTags.includes(tag.id)) {
                                                                            setTempProject({...tempProject, categoryTags: currentTags.filter(id => id !== tag.id)});
                                                                        } else {
                                                                            setTempProject({...tempProject, categoryTags: [...currentTags, tag.id]});
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${(tempProject.categoryTags || []).includes(tag.id) ? 'text-white shadow-lg' : 'text-white/80 hover:text-white'}`}
                                                                    style={{ backgroundColor: (tempProject.categoryTags || []).includes(tag.id) ? tag.color : `${tag.color}80` }}
                                                                >
                                                                    {tag.label}
                                                                </button>
                                                                <input type="color" value={tag.color} onChange={(e) => {
                                                                    const newTags = content.categoryTags.map(t => t.id === tag.id ? {...t, color: e.target.value} : t);
                                                                    onUpdate('categoryTags', newTags);
                                                                }} className="w-full h-2 p-0 border-0 bg-transparent cursor-pointer" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-4 mb-20">
                        <label className="text-[10px] font-black uppercase text-red-600 block tracking-widest max-w-5xl mx-auto">FOTO DE CAPA (BANNER)</label>
                        <div className="relative w-full bg-gray-100 rounded-[40px] overflow-hidden group border-8 border-white shadow-2xl ring-1 ring-gray-100">
                            {tempProject.banner ? <img src={tempProject.banner} className="w-full h-auto max-h-[80vh] object-cover" alt="SEM FOTO"/> : <div className="w-full h-[500px] flex flex-col items-center justify-center text-gray-300 gap-4"><ImageIcon size={64}/><span className="font-black uppercase tracking-widest">Clique para Upload<br/><small className="text-[8px] opacity-50">(Recomendado: 1920x1080px)</small></span></div>}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="text-white" size={48}/>
                                    <span className="text-white font-black uppercase tracking-tighter">Alterar Foto de Capa<br/><small className="text-[10px] opacity-70">(Recomendado: 1920x1080px)</small></span>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => setTempProject({...tempProject, banner: res, coverPhoto: res}))}/>
                            </label>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <div className="prose-container clearfix">
                            {renderBlocks(tempProject.blocks, true)}
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 py-20 mt-20 border-t-8 border-red-600">
                            <button onClick={() => addBlock('text')} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-2xl active:scale-95"><Type size={18}/> ADICIONAR TEXTO</button>
                            <button onClick={() => addBlock('image')} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-2xl active:scale-95"><ImageIcon size={18}/> ADICIONAR FOTO</button>
                            <button onClick={() => addBlock('youtube')} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-2xl active:scale-95"><Play size={18}/> ADICIONAR VÍDEO</button>
                            <div className="relative group/spec-btn">
                                <button onClick={() => setSpecMenuOpen(!specMenuOpen)} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 shadow-2xl active:scale-95"><List size={18}/> ADICIONAR ESPECIFICAÇÕES</button>
                                {specMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setSpecMenuOpen(false)}></div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-col bg-white border-4 border-black rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden min-w-[280px] z-[100] animate-in fade-in slide-in-from-bottom-4">
                                            <div className="bg-gray-100 p-4 text-[12px] font-black text-gray-400 uppercase border-b-2 border-gray-200 flex justify-between items-center">
                                                <span>Modelos Prontos</span>
                                                <button onClick={() => setSpecPresetModal({ mode: 'add' })} className="text-red-600"><Plus size={20}/></button>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {(content.specPresets || []).map(preset => (
                                                    <div key={preset.id} className="flex items-center hover:bg-red-50 border-b border-gray-100 last:border-0">
                                                        <button onClick={() => { setSpecMenuOpen(false); addBlock('specs', preset); }} className="flex-1 text-left px-6 py-4 text-sm font-black text-black uppercase tracking-tighter">{preset.label}</button>
                                                        <button onClick={() => setSpecPresetModal({ mode: 'edit', preset })} className="p-4 text-gray-300 hover:text-blue-600"><Settings size={16}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => { setSpecMenuOpen(false); addBlock('specs'); }} className="w-full text-left px-6 py-5 text-sm font-black text-red-600 uppercase tracking-tighter hover:bg-red-600 hover:text-white border-t-4 border-gray-100 italic">+ Criar do Zero</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <ConfirmModal isOpen={!!confirmModal} onClose={()=>setConfirmModal(null)} onConfirm={confirmModal?.onConfirm} message={confirmModal?.message}/>
                <SpecPresetModal 
                    isOpen={!!specPresetModal} 
                    onClose={() => setSpecPresetModal(null)} 
                    preset={specPresetModal?.preset}
                    onSave={(newPreset) => {
                        const currentPresets = content.specPresets || [];
                        let updated;
                        if (specPresetModal.mode === 'edit') {
                            updated = currentPresets.map(p => p.id === newPreset.id ? newPreset : p);
                        } else {
                            updated = [...currentPresets, newPreset];
                        }
                        onUpdate('specPresets', updated);
                    }}
                />
                <VideoModal 
                    isOpen={videoModalOpen} 
                    onClose={() => setVideoModalOpen(false)} 
                    onSave={handleAddVideo}
                />
                <LinkInsertModal 
                    isOpen={showLinkModal} 
                    onClose={() => setShowLinkModal(false)} 
                    onConfirm={insertCamouflagedLink}
                />
            </div>
        );
    }

    if (selectedProject) {
        return (
	            <div className="bg-white rounded-3xl p-8 md:p-16 text-black shadow-2xl border border-gray-100">
	                <button onClick={() => setSelectedProject(null)} className="mb-12 flex items-center gap-2 text-red-600 hover:text-red-700 font-black uppercase text-xs tracking-widest"><ArrowLeft size={16}/> Voltar</button>
	                
	                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4 leading-[0.9]">{selectedProject?.title || "Sem Título"}</h1>
	                <div className="flex items-center gap-2 text-red-600 font-black text-sm uppercase mb-10 border-b-2 border-gray-100 pb-4">
	                    <Calendar size={16}/> {selectedProject?.date ? (function(){ try { return new Date(selectedProject.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch(e) { return '-'; } })() : '-'}
	                </div>
	                
				<div className="w-full md:rounded-3xl md:overflow-hidden md:shadow-2xl mb-12 cursor-zoom-in md:border-4 md:border-red-600" onClick={() => setViewPhoto(selectedProject?.banner || selectedProject?.coverPhoto)}>
	                    {selectedProject?.banner || selectedProject?.coverPhoto ? <img src={selectedProject.banner || selectedProject.coverPhoto} className="w-full h-auto object-contain" alt="SEM FOTO"/> : <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400 font-black uppercase tracking-widest">SEM FOTO</div>}
	                </div>

	                <div className="prose-container clearfix" style={{ padding: '20px 0' }}>
	                    {renderBlocks(selectedProject?.blocks || [], false)}
	                </div>
                {viewPhoto && <FullScreenMediaViewer media={[{ url: viewPhoto, type: 'image' }]} onClose={() => {
                    setViewPhoto(null);
                    // Ao fechar pelo "X", removemos o estado do histórico para manter sincronia
                    if (window.history.state?.modalOpen) {
                        window.history.back();
                    }
                }} />}
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-8">
                <div className="flex gap-4 border-b border-white/5 pb-4 bg-white/5 p-4 rounded-2xl">
                    {['projects', 'materias'].map(id => [id, (content.subTabsConfig || { 'projects': { label: 'PROJECT CARS' }, 'materias': { label: 'MATÉRIAS' } })[id]]).filter(([id, config]) => config).map(([id, config]) => (
                        <div key={id} className="relative group/subtab">
                            <button 
                                onClick={() => { setActiveSubTab(id); setSelectedProject(null); }}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${activeSubTab === id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}
                            >
                                {config.label}
                            </button>

                        </div>
                    ))}

                </div>
            </div>

            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                            <EditableText text={content.subTabsConfig?.[activeSubTab]?.titleMain || (activeSubTab === 'projects' ? content.projectsFeedTitleMain : { content: activeSubTab.replace(/-/g, ' ').toUpperCase(), style: { font: "Racing Sans One", color: "#ffffff", size: "48px" } })} isEditing={isAdmin} onSave={(v)=>{
                                if (activeSubTab === 'projects') {
                                    onUpdate('projectsFeedTitleMain', v);
                                }
                                const newConfig = { ...content.subTabsConfig };
                                if (!newConfig[activeSubTab]) newConfig[activeSubTab] = {};
                                newConfig[activeSubTab].titleMain = v;
                                onUpdate('subTabsConfig', newConfig);
                            }} className="text-5xl font-black uppercase italic tracking-tighter text-white" />
                            <EditableText text={content.subTabsConfig?.[activeSubTab]?.titleHighlight || (activeSubTab === 'projects' ? content.projectsFeedTitleHighlight : { content: "", style: { font: "Racing Sans One", color: "#ef4444", size: "48px" } })} isEditing={isAdmin} onSave={(v)=>{
                                if (activeSubTab === 'projects') {
                                    onUpdate('projectsFeedTitleHighlight', v);
                                }
                                const newConfig = { ...content.subTabsConfig };
                                if (!newConfig[activeSubTab]) newConfig[activeSubTab] = {};
                                newConfig[activeSubTab].titleHighlight = v;
                                onUpdate('subTabsConfig', newConfig);
                            }} className="text-5xl font-black uppercase italic tracking-tighter text-red-600" />
                        </div>
                        <EditableText text={content.subTabsConfig?.[activeSubTab]?.subtitle || (activeSubTab === 'projects' ? content.projectsFeedSubtitle : { content: "Acompanhe as publicações exclusivas", style: { font: "Arial", color: "#6b7280", size: "12px" } })} isEditing={isAdmin} onSave={(v)=>{
                            if (activeSubTab === 'projects') {
                                onUpdate('projectsFeedSubtitle', v);
                            }
                            const newConfig = { ...content.subTabsConfig };
                            if (!newConfig[activeSubTab]) newConfig[activeSubTab] = {};
                            newConfig[activeSubTab].subtitle = v;
                            onUpdate('subTabsConfig', newConfig);
                        }} className="font-bold uppercase text-xs tracking-[0.2em] text-gray-500" />
                </div>
                {isAdmin && <button onClick={startNewProject} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-black uppercase text-xs shadow-xl flex items-center gap-2"><Plus size={18}/> Iniciar Novo Projeto</button>}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {allFeedItems.map((proj) => (
                    <div key={proj.id} className="bg-[#111] md:rounded-3xl md:overflow-hidden group relative flex flex-col md:flex-row md:border md:border-white/5">
                        <div className="w-full md:w-72 aspect-video md:aspect-square md:overflow-hidden cursor-pointer relative md:shrink-0" onClick={() => setSelectedProject(proj)}>
                            {proj.coverPhoto || proj.banner ? <img src={proj.coverPhoto || proj.banner} className="w-full h-full object-contain" alt="SEM FOTO"/> : <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700 font-black uppercase tracking-widest text-xs">SEM FOTO</div>}
                            {proj.isDraft && (
                                <div className="absolute top-4 left-4 bg-yellow-500 text-black px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-tighter shadow-xl z-20 flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full animate-pulse"></div> EM EDIÇÃO</div>
                            )}
                            {(proj.categoryTags && proj.categoryTags.length > 0 && false) && (
                                <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end z-20">
                                    {proj.categoryTags.map(tagId => {
                                        const tag = (content.categoryTags || []).find(t => t.id === tagId);
                                        return tag ? (
                                            <div key={tag.id} className="px-4 py-2 rounded-full font-black text-[12px] uppercase tracking-tighter shadow-xl text-white" style={{ backgroundColor: tag.color }}>
                                                {tag.label}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
                                {proj.categoryTags?.map((tagId, idx) => {
                                    const tag = (content.categoryTags || []).find(t => t.id === tagId);
                                    if (!tag) return null;
                                    const isProjectCar = tag.group === 'PROJECT CARS';
                                    return (
                                        <React.Fragment key={tag.id}>
                                            <span className={`${isProjectCar ? 'text-[12px] border-b-2 border-current pb-0.5 mb-1' : 'text-[10px]'} font-black uppercase tracking-widest`} style={{ color: tag.color }}>{tag.label}</span>
                                            {idx < proj.categoryTags.length - 1 && <span className="text-[10px] text-gray-600 mx-1">/</span>}
                                        </React.Fragment>
                                    );
                                }).sort((a, b) => {
                                    const tagA = (content.categoryTags || []).find(t => t.id === a.key);
                                    const tagB = (content.categoryTags || []).find(t => t.id === b.key);
                                    if (tagA?.group === 'PROJECT CARS' && tagB?.group !== 'PROJECT CARS') return -1;
                                    if (tagA?.group !== 'PROJECT CARS' && tagB?.group === 'PROJECT CARS') return 1;
                                    return 0;
                                })}
                            </div>
                                                        <span className="text-[12px] text-red-600 font-black uppercase tracking-widest mb-2 block">
                                {new Date(proj.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <h3 className="text-xl font-black uppercase italic leading-tight mb-3 text-white group-hover:text-red-500 cursor-pointer" onClick={() => setSelectedProject(proj)}>{proj.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">{proj.excerpt}</p>
                            <div className="flex justify-between items-center">
                                <button onClick={() => setSelectedProject(proj)} className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/btn">Ler mais <ChevronRight size={14}/></button>
                                {isAdmin && (
                                    <div className="flex gap-1">
                                        <button onClick={() => editProject(proj)} className="bg-blue-600 p-2 rounded-full text-white"><Edit3 size={14}/></button>
                                        <button onClick={() => deleteProject(proj.id)} className="bg-red-600 p-2 rounded-full text-white"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {allFeedItems.length === 0 && <div className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-white/10 text-gray-600 font-bold uppercase tracking-widest">Nenhum projeto ainda.</div>}
                <ConfirmModal isOpen={!!confirmModal} onClose={()=>setConfirmModal(null)} onConfirm={confirmModal?.onConfirm} message={confirmModal?.message}/>
                <SpecPresetModal 
                    isOpen={!!specPresetModal} 
                    onClose={() => setSpecPresetModal(null)} 
                    preset={specPresetModal?.preset}
                    onSave={(newPreset) => {
                        const currentPresets = content.specPresets || [];
                        let updated;
                        if (specPresetModal.mode === 'edit') {
                            updated = currentPresets.map(p => p.id === newPreset.id ? newPreset : p);
                        } else {
                            updated = [...currentPresets, newPreset];
                        }
                        onUpdate('specPresets', updated);
                    }}
                />
                <VideoModal 
                    isOpen={videoModalOpen} 
                    onClose={() => setVideoModalOpen(false)} 
                    onSave={handleAddVideo}
                />
            </div>
        );
    };

export default function App() {
  const [content, setContent] = useState(defaultContent); 
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [activeTabId, setActiveTabId] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [mediaModal, setMediaModal] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [productGalleryModal, setProductGalleryModal] = useState(null); 
  const [rankingModal, setRankingModal] = useState(null);
  const [carMediaModal, setCarMediaModal] = useState(null);
  const [interestModal, setInterestModal] = useState(null);
  const [inputTextModal, setInputTextModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [tabManagerOpen, setTabManagerOpen] = useState(false);
  const [faqModal, setFaqModal] = useState(null);
  const [logoEditModal, setLogoEditModal] = useState(null); 
  const [headerTitleEdit, setHeaderTitleEdit] = useState(false);
  const [headerSubtitleEdit, setHeaderSubtitleEdit] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0); 
  const [showStructurePage, setShowStructurePage] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [rankingConfigModal, setRankingConfigModal] = useState(false);
  const [bannerEditModal, setBannerEditModal] = useState(false); 
  const [carouselManagerOpen, setCarouselManagerOpen] = useState(false);
  const [carouselType, setCarouselType] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [specPresetModal, setSpecPresetModal] = useState(null);
  const [cardModal, setCardModal] = useState(null);
  const [showCardDescModal, setShowCardDescModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const faqSavedRange = useRef(null);

  // Refs para evitar loops de sincronização e excesso de escritas
  const lastRemoteContentRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const bannerContainerRef = useRef(null);
  const [editingHotspotBannerIdx, setEditingHotspotBannerIdx] = useState(null);
  const [hotspotDrag, setHotspotDrag] = useState(null);
  const [hotspotResize, setHotspotResize] = useState(null);
  const [localHotspots, setLocalHotspots] = useState([]);

  useEffect(() => {
    const handleBackButton = (e) => {
      if (showStructurePage) {
        e.preventDefault();
        setShowStructurePage(false);
        window.history.pushState(null, null, window.location.href);
      }
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [showStructurePage]);

  // --- LÓGICA PARA O BOTÃO VOLTAR NATIVO ---
  useEffect(() => {
	    const handlePopState = (event) => {
	      if (showLoginModal) {
	        setShowLoginModal(false);
	      } else if (mobileMenuOpen) {
	        setMobileMenuOpen(false);
	      } else if (showUserModal) {
	        setShowUserModal(false);
	      } else if (tabManagerOpen) {
	        setTabManagerOpen(false);
	      } else if (viewPhoto) {
	        setViewPhoto(null);
	      } else if (mediaModal) {
	        setMediaModal(null);
	      } else if (productModal) {
	        setProductModal(null);
	      } else if (rankingModal) {
	        setRankingModal(null);
	      } else if (faqModal) {
	        setFaqModal(null);
	      } else if (interestModal) {
	        setInterestModal(null);
	      } else if (carMediaModal) {
	        setCarMediaModal(null);
	      } else if (productGalleryModal) {
	        setProductGalleryModal(null);
	      } else if (activeTabId === 'faq' || activeTabId === 'ranking' || activeTabId === 'projects' || activeTabId === 'contact') {
        setActiveTabId('home');
      } else if (activeTabId === 'shop') {
        setActiveTabId('vitrine');
      }
    };

	    if (showLoginModal || mobileMenuOpen || showUserModal || tabManagerOpen || viewPhoto || mediaModal || productModal || rankingModal || faqModal || interestModal || carMediaModal || productGalleryModal) {
	      window.history.pushState({ modalOpen: true }, '');
	    }

	    window.addEventListener('popstate', handlePopState);
	    return () => window.removeEventListener('popstate', handlePopState);
	  }, [showLoginModal, mobileMenuOpen, showUserModal, tabManagerOpen, viewPhoto, mediaModal, productModal, rankingModal, faqModal, interestModal, carMediaModal, productGalleryModal, activeTabId]);

  useEffect(() => {
    const initAuth = async () => {
      if (auth) {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Erro na autenticação:", error);
        }
      }
    };
    initAuth();
    if (auth) {
      return onAuthStateChanged(auth, (u) => { 
        if (u) setUser(u); 
        else {
          setUser(null);
          setIsAdmin(false);
        }
      });
    }
  }, []);
  
  useEffect(() => {
      if (!content.home.bannerImages || content.home.bannerImages.length <= 1 || editingHotspotBannerIdx !== null) return;
      const interval = setInterval(() => {
          setCurrentBannerIndex(prev => (prev + 1) % content.home.bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
  }, [content.home.bannerImages, editingHotspotBannerIdx]);

  useEffect(() => {
    if (!user || !db) return;
    
    const docs = [
        { id: 'main', keys: ['header', 'social', 'styles', 'tabs', 'specPresets', 'categoryTags', 'home', 'services', 'specialistBrands', 'partners', 'brands', 'faq', 'ranking', 'shop', 'contact', 'footer', 'users'] },
        { id: 'projects', keys: ['projects', 'projectsDraft', 'projectsFeedTitleMain', 'projectsFeedTitleHighlight', 'projectsFeedSubtitle', 'subTabsConfig'] },
        { id: 'sheets', keys: ['savedSheets', 'folders', 'techSheet'] }
    ];

    const unsubscribes = docs.map(docConfig => {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'vps_site_content', docConfig.id);
        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const remoteData = snapshot.data();
                
                // Verificação de igualdade para evitar loops
                if (lastRemoteContentRef.current && lastRemoteContentRef.current[docConfig.id] && JSON.stringify(remoteData) === JSON.stringify(lastRemoteContentRef.current[docConfig.id])) {
                    return;
                }

                if (!lastRemoteContentRef.current) lastRemoteContentRef.current = {};
                lastRemoteContentRef.current[docConfig.id] = remoteData;

                setContent(prev => {
                    // Se houver um timer de debounce ativo, não sobrescrevemos o estado local com dados remotos
                    // para evitar que uploads de imagens ou edições rápidas "sumam" antes de serem salvos.
                    if (debounceTimerRef.current) return prev;
                    
                    let newContent = { ...prev, ...remoteData };
                    // Garantir que objetos aninhados não sejam sobrescritos se o remoteData não os tiver
                    docConfig.keys.forEach(key => {
                        if (remoteData[key] && typeof remoteData[key] === 'object' && !Array.isArray(remoteData[key])) {
                            newContent[key] = { ...prev[key], ...remoteData[key] };
                        }
                    });
                    return newContent;
                });

                if (docConfig.id === 'main' && editingHotspotBannerIdx !== null && remoteData.home?.bannerImages?.[editingHotspotBannerIdx]) {
                    setLocalHotspots(remoteData.home.bannerImages[editingHotspotBannerIdx].hotspots || []);
                }
            } else {
                // Se o documento não existe, inicializa com o default correspondente
                const initialData = {};
                docConfig.keys.forEach(k => initialData[k] = defaultContent[k]);
                setDoc(docRef, initialData);
            }
        }, (error) => console.error(`Error fetching ${docConfig.id}:`, error));
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, editingHotspotBannerIdx]);

	  const updateContent = async (path, value) => {
	    if (!content) return;
	    
	    const newData = JSON.parse(JSON.stringify(content));
	    const keys = path.split('.');
	    let current = newData;
	    for (let i = 0; i < keys.length - 1; i++) { 
	        if (!current[keys[i]]) current[keys[i]] = {}; 
	        current = current[keys[i]]; 
	    }
	    current[keys[keys.length - 1]] = value;
	    
	    // Garantir que listas não sejam perdidas por sobrescrita acidental
	    if (Array.isArray(value) && value.length === 0 && (path.includes('items') || path.includes('list') || path.includes('projects'))) {
	        console.warn("Tentativa de salvar lista vazia em:", path);
	    }

	    setContent(newData);
    
    // Se for uma atualização de projetos (publicação), salvamos IMEDIATAMENTE sem debounce
    const isProjectUpdate = ['projects', 'projectsDraft'].some(k => path.includes(k));
    
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const performUpdate = async () => {
        if (user && db) {
	            const rootKey = keys[0];
	            
	            // Determina qual documento deve ser atualizado
	            let docId = 'main';
	            if (['projects', 'projectsDraft', 'projectsFeedTitleMain', 'projectsFeedTitleHighlight', 'projectsFeedSubtitle', 'subTabsConfig'].includes(rootKey) || rootKey.startsWith('projects_') || rootKey.startsWith('projectsDraft_')) {
	                docId = 'projects';
	            } else if (['savedSheets', 'folders', 'techSheet'].includes(rootKey)) {
	                docId = 'sheets';
	            } else if (['shop', 'brands', 'services', 'specialistBrands', 'ranking'].includes(rootKey)) {
	                docId = 'main';
	            }

            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'vps_site_content', docId);
            const updateObj = {};
            updateObj[rootKey] = newData[rootKey];
            
            // Verificação de igualdade para evitar loops
            if (lastRemoteContentRef.current?.[docId] && JSON.stringify(newData[rootKey]) === JSON.stringify(lastRemoteContentRef.current[docId][rootKey])) {
                return;
            }

            try {
                await updateDoc(docRef, updateObj);
                if (!lastRemoteContentRef.current) lastRemoteContentRef.current = {};
                if (!lastRemoteContentRef.current[docId]) lastRemoteContentRef.current[docId] = {};
                lastRemoteContentRef.current[docId][rootKey] = JSON.parse(JSON.stringify(newData[rootKey]));
            } catch (e) {
                console.error(`Erro ao salvar em ${docId}:`, e);
            }
        }
    };

    if (isProjectUpdate) {
        await performUpdate();
    } else {
        debounceTimerRef.current = setTimeout(performUpdate, 1000);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const usersList = content?.users || defaultContent.users;
    const validUser = usersList.find(u => u.username.toLowerCase() === loginUser.toLowerCase() && u.password === loginPass);
    if (validUser) { 
        setIsAdmin(true); 
        setShowLoginModal(false); 
        setLoginUser(''); 
        setLoginPass(''); 
    } 
    else {
        setLoginError('Usuário ou senha incorretos.');
    }
  };

  // LOGICA DE EDITOR ATUALIZADA PARA FAQ (FLUIDA E COM SUPORTE A PX REAIS E PREPARAÇÃO DE CURSOR SEM JUMP)
  const handleEditorAction = (cmd, val) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    const applyStyle = (tag, styleProp, value) => {
        if (range.collapsed) {
            const span = document.createElement('span');
            if (styleProp) span.style[styleProp] = value;
            span.innerHTML = '&#8203;'; 
            range.insertNode(span);
            const newRange = document.createRange();
            newRange.setStart(span.firstChild, 1);
            newRange.setEnd(span.firstChild, 1);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } else {
            const span = document.createElement('span');
            if (styleProp) span.style[styleProp] = value;
            try {
                range.surroundContents(span);
            } catch(e) {
                const content = range.extractContents();
                span.appendChild(content);
                range.insertNode(span);
            }
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.removeAllRanges();
            sel.addRange(newRange);
        }
    };

    if (cmd === 'fontSize') applyStyle('span', 'fontSize', val + 'px');
    else if (cmd === 'fontName') applyStyle('span', 'fontFamily', val);
    else if (cmd === 'foreColor') applyStyle('span', 'color', val);
    else if (cmd === 'createLink') {
        faqSavedRange.current = range.cloneRange();
        setShowLinkModal(true);
    } else {
        document.execCommand(cmd, false, val);
    }
  };

  const insertCamouflagedLink = (word, url) => {
    if (word && url) {
        if (faqSavedRange.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(faqSavedRange.current);
        }
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold;">${word}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
    }
  };

  const deleteWithConfirm = (message, action) => { setConfirmModal({ message, onConfirm: action }); };
  const renderStyledText = (textData) => {
      const style = { fontFamily: textData.style?.font || 'inherit', color: textData.style?.color || 'inherit', fontSize: textData.style?.size || 'inherit' };
      return <div style={style}>{String(textData.content || '')}</div>;
  };
  const activeTabIdx = (content.tabs || []).findIndex(t => t.id === activeTabId);
  const activeTab = (content.tabs || [])[activeTabIdx] || (content.tabs || [])[0] || { type: 'home' };
  const { header, styles, home, services, faq, ranking, shop, contact, techSheet, specialistBrands, partners, brands, secondCarousel } = content;
  const sortedRanking = [...(ranking.list || [])].sort((a, b) => Number(b.power) - Number(a.power));

  const handleHotspotMove = (e) => {
    if (!isAdmin || editingHotspotBannerIdx === null || !bannerContainerRef.current || (!hotspotDrag && !hotspotResize)) return;
    const rect = bannerContainerRef.current.getBoundingClientRect();

    if (hotspotDrag) {
      const deltaX = ((e.clientX - hotspotDrag.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - hotspotDrag.startY) / rect.height) * 100;
      const updated = [...localHotspots];
      updated[hotspotDrag.hIdx].x = Math.max(0, Math.min(100 - updated[hotspotDrag.hIdx].w, hotspotDrag.initialX + deltaX));
      updated[hotspotDrag.hIdx].y = Math.max(0, Math.min(100 - updated[hotspotDrag.hIdx].h, hotspotDrag.initialY + deltaY));
      setLocalHotspots(updated);
    } else if (hotspotResize) {
      const deltaX = ((e.clientX - hotspotResize.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - hotspotResize.startY) / rect.height) * 100;
      const updated = [...localHotspots];
      updated[hotspotResize.hIdx].w = Math.max(5, Math.min(100 - updated[hotspotResize.hIdx].x, hotspotResize.initialW + deltaX));
      updated[hotspotResize.hIdx].h = Math.max(5, Math.min(100 - updated[hotspotResize.hIdx].y, hotspotResize.initialH + deltaY));
      setLocalHotspots(updated);
    }
  };

  const hotspotActionsEnd = () => { 
    if ((hotspotDrag || hotspotResize) && editingHotspotBannerIdx !== null) {
      const banners = [...home.bannerImages];
      banners[editingHotspotBannerIdx].hotspots = localHotspots;
      updateContent('home.bannerImages', banners);
    }
    setHotspotDrag(null); 
    setHotspotResize(null); 
  };

  return (
    <div style={{ fontFamily: styles.fontFamily, backgroundColor: activeTab.style?.bgColor || styles.bgColor }} className="min-h-screen flex flex-col text-gray-100 selection:bg-red-500 selection:text-white relative w-full" onMouseMove={handleHotspotMove} onMouseUp={hotspotActionsEnd}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Racing+Sans+One&family=Roboto:wght@400;700;900&family=Open+Sans:wght@400;700;800&family=Lato:wght@400;700;900&family=Montserrat:wght@400;700;900&display=swap');
        .clearfix::after {
          content: "";
          clear: both;
          display: table;
          width: 100%;
        }
        .page-a4 { box-sizing: border-box; }
        @media print { .no-print { display: none !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        . { animation: fadeIn 0.5s ; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .prose-container { background-color: white !important; color: black !important; padding: 20px; border-radius: 12px; }
        .prose p { margin-top: 0.25em !important; margin-bottom: 0.25em !important; }
        .prose-container ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 1em 0 !important; }
        .prose-container ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 1em 0 !important; }
        .prose-container li { display: list-item !important; margin-bottom: 0.5em !important; }
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .tech-sheet-page { margin: 0 !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>
      
      <div className="relative w-full z-[150] pt-12" style={{ backgroundColor: header.bgColor }}>
        <div className="w-full px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Mobile: Hambúrguer no topo esquerdo */}
            <div className="md:hidden absolute top-3 left-6 z-50">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2 bg-white/5 rounded-lg">
                    {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                </button>
            </div>
            
            {/* Mobile: Logo, Título e Subtítulo Centralizados */}
            <div className="md:hidden flex flex-col items-center justify-center w-full pt-8">
                <div className="flex items-center justify-center cursor-pointer mb-4" onClick={() => { setActiveTabId('home'); window.scrollTo(0,0); }}>
                    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: `${header.logoSize || 100}px`, height: `${header.logoSize || 100}px`, minWidth: `${header.logoSize || 100}px`, minHeight: `${header.logoSize || 100}px` }}>
                        {header.logoUrl ? <img src={header.logoUrl} alt="Logo" className="object-cover w-full h-full rounded-full" style={{ }} /> : (isAdmin && <div className="border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center w-full h-full"><span className="text-xs text-gray-500">Logo</span></div>)}
                        {isAdmin && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setLogoEditModal('header'); }}><Camera className="text-white" size={24} /></div>}
                    </div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="relative group">{renderStyledText(header.title)}{isAdmin && <button onClick={(e) => { e.stopPropagation(); setHeaderTitleEdit(true); }} className="absolute -top-2 -right-4 text-white bg-blue-600 rounded-full p-1 shadow-lg z-50"><Edit3 size={10}/></button>}</div>
                    <div className="relative group">{renderStyledText(header.subtitle)}{isAdmin && <button onClick={(e) => { e.stopPropagation(); setHeaderSubtitleEdit(true); }} className="absolute -top-2 -right-4 text-white bg-blue-600 rounded-full p-1 shadow-lg z-50"><Edit3 size={10}/></button>}</div>
                </div>
            </div>
            
            {/* Desktop: Logo, Título e Subtítulo à Esquerda */}
            <div className="hidden md:flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setActiveTabId('home'); window.scrollTo(0,0); }}>
                    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: `${header.logoSize || 100}px`, height: `${header.logoSize || 100}px`, minWidth: `${header.logoSize || 100}px`, minHeight: `${header.logoSize || 100}px` }}>
                        {header.logoUrl ? <img src={header.logoUrl} alt="Logo" className="object-cover w-full h-full rounded-full" style={{ }} /> : (isAdmin && <div className="border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center w-full h-full"><span className="text-xs text-gray-500">Logo</span></div>)}
                        {isAdmin && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setLogoEditModal('header'); }}><Camera className="text-white" size={24} /></div>}
                    </div>
                    <div className="flex flex-col items-start">
                        <div className="relative group">{renderStyledText(header.title)}{isAdmin && <button onClick={(e) => { e.stopPropagation(); setHeaderTitleEdit(true); }} className="absolute -top-2 -right-4 text-white bg-blue-600 rounded-full p-1 shadow-lg z-50"><Edit3 size={10}/></button>}</div>
                        <div className="relative group">{renderStyledText(header.subtitle)}{isAdmin && <button onClick={(e) => { e.stopPropagation(); setHeaderSubtitleEdit(true); }} className="absolute -top-2 -right-4 text-white bg-blue-600 rounded-full p-1 shadow-lg z-50"><Edit3 size={10}/></button>}</div>
                    </div>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
                <SocialMediaBar items={content.social || []} isEditing={isAdmin} onUpdate={(items) => updateContent('social', items)} onDelete={(id) => deleteWithConfirm("Excluir mídia?", () => updateContent('social', (content.social || []).filter(s=>s.id!==id)))} primaryColor={styles.primaryColor} />
                <div className="flex items-center gap-4 mt-2 relative z-[300]">
                    {isAdmin ? (
                        <>
                            <button onClick={() => setShowUserModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white p-2 px-4 rounded-full shadow-lg flex items-center gap-2" title="Gerenciar Usuários"><User size={16}/> Usuários</button>
                            <button onClick={() => setTabManagerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-full shadow-lg flex items-center gap-2" title="Gerenciar Menu Principal"><List size={16}/> Menu Principal</button>
                            <button onClick={() => setIsEditingGlobal(true)} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full" title="Configurações"><Layout size={20} /></button>
                            <button onClick={() => setIsAdmin(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2" style={{ backgroundColor: styles.primaryColor }}><LogOut size={14}/> SALVAR E SAIR</button>
                        </>
                    ) : (<button type="button" onClick={() => { setLoginError(''); setShowLoginModal(true); }} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest cursor-pointer z-[400] relative"><Lock size={14} /> Área Admin</button>)}
                </div>
            </div>
        </div>
      </div>
      
      <nav className="sticky top-0 z-[100] border-t border-white/5 bg-black/90 backdrop-blur-md w-full shadow-2xl py-3">
            {/* Menu Desktop */}
            <div className="hidden md:flex w-full flex-wrap justify-center items-center gap-2 px-4">
            {content.tabs.map((tab) => {
                  if (tab.type === 'techSheet' && !isAdmin) return null; 
                  const isActive = activeTabId === tab.id;
                 return (
                  <button key={tab.id} onClick={() => { setActiveTabId(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`px-8 py-3 rounded-full text-sm font-bold uppercase flex items-center gap-2 ${isActive ? 'text-white shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`} style={{ color: isActive ? '#ffffff' : tab.style?.color, backgroundColor: isActive ? (tab.id === 'techSheet' ? '#22c55e' : styles.primaryColor) : 'transparent' }}>{tab.id === 'home' && <HomeIcon size={14} />}{tab.label}</button>
                  )})}
            </div>

            {/* Menu Mobile Empilhado */}
            {mobileMenuOpen && (
                <div className="md:hidden flex flex-col w-full px-4 pt-2 pb-4 gap-2 animate-in slide-in-from-top duration-300">
                    {content.tabs.map((tab) => {
                        if (tab.type === 'techSheet' && !isAdmin) return null; 
                        const isActive = activeTabId === tab.id;
                        return (
                            <button key={tab.id} onClick={() => { setActiveTabId(tab.id); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-full px-6 py-4 rounded-xl text-sm font-bold uppercase flex items-center justify-between ${isActive ? 'text-white shadow-lg' : 'text-gray-400 bg-white/5'}`} style={{ color: isActive ? '#ffffff' : tab.style?.color, backgroundColor: isActive ? (tab.id === 'techSheet' ? '#22c55e' : styles.primaryColor) : '' }}>
                                <span className="flex items-center gap-3">{tab.id === 'home' && <HomeIcon size={16} />}{tab.label}</span>
                                {isActive && <Check size={16}/>}
                            </button>
                        )
                    })}
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-center py-2">
                        <SocialMediaBar items={content.social || []} isEditing={isAdmin} onUpdate={(items) => updateContent('social', items)} onDelete={(id) => deleteWithConfirm("Excluir mídia?", () => updateContent('social', (content.social || []).filter(s=>s.id!==id)))} primaryColor={styles.primaryColor} />
                    </div>
                    {!isAdmin && (
                        <button type="button" onClick={() => { setLoginError(''); setShowLoginModal(true); setMobileMenuOpen(false); }} className="w-full py-4 flex items-center justify-center gap-2 text-gray-500 text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl mt-2"><Lock size={14} /> Área Admin</button>
                    )}
                    {isAdmin && (
                        <div className="flex flex-col gap-2 mt-2">
                            <button onClick={() => { setShowUserModal(true); setMobileMenuOpen(false); }} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><User size={16}/> Usuários</button>
                            <button onClick={() => { setTabManagerOpen(true); setMobileMenuOpen(false); }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><List size={16}/> Menu Principal</button>
                            <button onClick={() => { setIsAdmin(false); setMobileMenuOpen(false); }} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2" style={{ backgroundColor: styles.primaryColor }}><LogOut size={14}/> SALVAR E SAIR</button>
                        </div>
                    )}
                </div>
            )}
      </nav>
      
      <main className="w-full px-6 py-8 flex-grow relative">
        {activeTab.type === 'techSheet' && (<TechSheetGenerator data={content} isEditing={isAdmin} onUpdate={updateContent} />)}
         {activeTab.type === 'projects' && (
           <div className="relative">
             <ProjectsSection content={content} isAdmin={isAdmin} onUpdate={updateContent} setEditingProject={setIsEditingProject} viewPhoto={viewPhoto} setViewPhoto={setViewPhoto} />
           </div>
         )}
        {activeTab.type === 'home' && (
            <div className="space-y-16 w-full">
                <div ref={bannerContainerRef} className="relative w-full md:rounded-3xl md:overflow-hidden md:border md:border-white/10">
                    <div className="w-full relative">
                        {home.bannerImages && home.bannerImages.length > 0 ? (
                            <div className="w-full relative">
                                <div onClick={()=>!isAdmin && home.bannerImages[currentBannerIndex]?.link && window.open(home.bannerImages[currentBannerIndex].link, '_blank')} className={`w-full block ${(!isAdmin && home.bannerImages[currentBannerIndex]?.link) ? 'cursor-pointer' : ''}`}>
                                    <img src={home.bannerImages[currentBannerIndex]?.url} className="w-full h-auto object-contain" alt="Banner" />
                                </div>

                                {(editingHotspotBannerIdx === currentBannerIndex ? localHotspots : (home.bannerImages[currentBannerIndex]?.hotspots || [])).map((hs, hIdx) => {
                                  const isBeingEdited = isAdmin && editingHotspotBannerIdx === currentBannerIndex;
                                  return (
                                    <div 
                                        key={hs.id} 
                                        className={`absolute z-[100] ${isBeingEdited ? 'bg-blue-500/40 border-2 border-blue-400 cursor-move' : (!isAdmin ? 'bg-transparent cursor-pointer' : 'bg-transparent opacity-0 pointer-events-none')}`}
                                        style={{ top: `${hs.y}%`, left: `${hs.x}%`, width: `${hs.w}%`, height: `${hs.h}%` }}
                                        onMouseDown={(e) => {
                                          if (isBeingEdited) {
                                            e.stopPropagation();
                                            setHotspotDrag({ hIdx, startX: e.clientX, startY: e.clientY, initialX: hs.x, initialY: hs.y });
                                          }
                                        }}
                                        onClick={() => { if(!isAdmin && hs.link) window.open(hs.link, '_blank'); }}
                                    >
                                        {isBeingEdited && (
                                          <div className="relative w-full h-full">
                                            <div className="absolute -top-7 left-0 bg-blue-600 text-white text-[10px] font-black px-1 py-0.5 rounded flex items-center gap-1 shadow-lg pointer-events-auto">
                                                #{hIdx+1} 
                                               <button 
                                                  onMouseDown={(e)=>e.stopPropagation()} 
                                                  onClick={(e)=>{
                                                    e.stopPropagation();
                                                    const newLink = prompt("Link do Botão:", hs.link);
                                                    if (newLink !== null) {
                                                        const updated = [...localHotspots];
                                                        updated[hIdx].link = newLink;
                                                        setLocalHotspots(updated);
                                                    }
                                                  }} 
                                                  className="bg-white/20 p-0.5 rounded hover:bg-white/40"
                                               >
                                                  <LucideLink size={12}/>
                                               </button>
                                               <button 
                                                  onMouseDown={(e)=>e.stopPropagation()} 
                                                  onClick={(e)=>{
                                                    e.stopPropagation();
                                                    const updated = localHotspots.filter((_, idx)=>idx !== hIdx);
                                                    setLocalHotspots(updated);
                                                    const banners = [...home.bannerImages];
                                                    banners[editingHotspotBannerIdx].hotspots = updated;
                                                    updateContent('home.bannerImages', banners);
                                                  }} 
                                                  className="bg-red-600/50 p-0.5 rounded hover:bg-red-600"
                                               >
                                                  <Trash2 size={12}/>
                                               </button>
                                            </div>
                                            <div 
                                              className="absolute bottom-0 right-0 w-5 h-5 bg-white cursor-nwse-resize z-[110] border border-blue-500 rounded-full shadow flex items-center justify-center pointer-events-auto"
                                              onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setHotspotResize({ hIdx, startX: e.clientX, startY: e.clientY, initialW: hs.w, initialH: hs.h });
                                              }}
                                            >
                                              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  );
                                })}

                                {isAdmin && editingHotspotBannerIdx === currentBannerIndex && (
                                  <div className="absolute top-2 left-2 z-[200] flex flex-col gap-2">
                                      <button onClick={() => {
                                        const newHotspots = [...localHotspots, { id: generateId(), x: 40, y: 40, w: 20, h: 20, link: "" }];
                                        setLocalHotspots(newHotspots);
                                        const banners = [...home.bannerImages];
                                        banners[currentBannerIndex].hotspots = newHotspots;
                                        updateContent('home.bannerImages', banners);
                                      }} className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-green-500"><Plus size={14}/> NOVO BOTÃO</button>
                                      <button onClick={() => setEditingHotspotBannerIdx(null)} className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-red-500"><Check size={14}/> CONCLUIR EDIÇÃO</button>
                                  </div>
                                )}
                            </div>
                        ) : (isAdmin && (<div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white/50"><Upload size={48} className="text-white" /><span className="font-bold text-xl text-white">Adicionar Banner</span><span className="text-xs text-yellow-500 mt-2">Rec: 1920x600px</span></div>))}
                        {(home.bannerImages?.length > 1 && editingHotspotBannerIdx === null) && (<><button onClick={() => setCurrentBannerIndex(prev => (prev - 1 + home.bannerImages.length) % home.bannerImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 z-20"><ArrowLeft size={24}/></button><button onClick={() => setCurrentBannerIndex(prev => (prev + 1) % home.bannerImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 z-20"><ArrowRight size={24}/></button></>)}
                    </div>
                    {isAdmin && editingHotspotBannerIdx === null && (<button onClick={() => setBannerEditModal(true)} className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-blue-500 z-50 flex items-center justify-center font-bold text-sm gap-2"><Edit3 size={16}/> EDITAR BANNER</button>)}
                </div>
                


	                <div className="grid md:grid-cols-2 gap-12 items-stretch bg-[#111] p-8 md:p-12 rounded-3xl border border-white/5 shadow-xl w-full relative group">
                    <div className="flex flex-col justify-center space-y-6">
                        <EditableText text={home.aboutTitle} isEditing={isAdmin} onSave={(val) => updateContent('home.aboutTitle', val)} className="font-bold border-l-4 pl-4" style={{ borderColor: content.styles.primaryColor }}/>
                        <EditableText text={home.aboutText} isEditing={isAdmin} onSave={(val) => updateContent('home.aboutText', val)} className="leading-relaxed"/>
                        
                        <div>
                          <button onClick={()=>setShowStructurePage(true)} className="text-white font-bold py-3 px-6 rounded-lg uppercase tracking-wider shadow-lg transform inline-block" style={{ backgroundColor: content.styles.primaryColor }}>
                              CONHEÇA NOSSA ESTRUTURA
                          </button>
                        </div>
                    </div>
                    <div className="relative min-h-[300px] h-full group md:rounded-2xl md:overflow-hidden md:border md:border-gray-800">
                        {home.aboutImage ? <img src={home.aboutImage} className="w-full h-full object-contain absolute inset-0" alt="about"/> : <div className="bg-gradient-to-br from-gray-900 to-black w-full h-full flex items-center justify-center"><span className="text-gray-700 font-black text-6xl opacity-20">VPS</span></div>}
                        {isAdmin && (<label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer z-20"><Upload className="text-white mb-2"/><span className="text-white font-bold">Trocar Foto</span><span className="text-xs text-yellow-500 mt-1">Recomendado: 600x600px</span><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>updateContent('home.aboutImage', res))}/></label>)}
                        {isAdmin && home.aboutImage && (
                            <button onClick={()=>updateContent('home.aboutImage', null)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 z-30 hover:bg-red-700">
                                <Trash2 size={16}/>
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100">

                        </div>
                    )}
                </div>

		                <div id="services-section" className="w-full scroll-mt-32 relative group">
		                     <div className="flex flex-col mb-8 border-b border-white/10 pb-4">
		                        <div className="flex gap-2"><EditableText text={services.titleMain} isEditing={isAdmin} onSave={(v)=>updateContent('services.titleMain', v)} /><EditableText text={services.titleHighlight} isEditing={isAdmin} onSave={(v)=>updateContent('services.titleHighlight', v)} /></div>
		                        <EditableText text={services.subtitle || {content: "CONHEÇA NOSSAS SOLUÇÕES", style: {font: "Arial", color: "#6b7280", size: "12px"}}} isEditing={isAdmin} onSave={(v)=>updateContent('services.subtitle', v)} className="font-bold uppercase text-xs tracking-[0.2em] text-gray-500 mt-1" />
		                     </div>
		                     
		                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
		                            {(services.items || []).map((item) => (
		                                <div key={item.id} className="flex flex-col items-center group/card relative" style={{cursor: (!isAdmin && (item.description || item.showWhatsapp !== false)) ? 'pointer' : 'default'}} onClick={() => !isAdmin && (item.description || item.showWhatsapp !== false) && setInterestModal({...item, section: 'services'})}>
		                                    <div className="w-full aspect-square relative group/icon overflow-hidden bg-black" style={{maxWidth: '250px'}}>
		                                        {item.image ? <img src={item.image} className="w-full h-full object-contain" alt={item.title}/> : <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={40}/></div>}
                                        {(item.description || item.showWhatsapp !== false) && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white font-black text-[8px] uppercase tracking-widest">Ver Detalhes</span>
                                            </div>
                                        )}
		                                    </div>
		                                    <div className="mt-2 text-center">
		                                        <h4 className="font-black uppercase text-[10px] tracking-tighter text-white">{item.title}</h4>
		                                    </div>
		                                    {isAdmin && (
		                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 z-20">
		                                            <button onClick={(e)=>{e.stopPropagation(); setCardModal({...item, section: 'services'})}} className="bg-blue-600 text-white p-1 rounded-full shadow-lg"><Edit3 size={10}/></button>
		                                            <button onClick={(e)=>{e.stopPropagation(); updateContent('services.items', services.items.filter(i=>i.id!==item.id))}} className="bg-red-600 text-white p-1 rounded-full shadow-lg"><Trash2 size={10}/></button>
		                                        </div>
		                                    )}
		                                </div>
		                            ))}
		                            {isAdmin && (
		                                <button onClick={()=>setCardModal({ id: generateId(), title: '', description: '', image: null, section: 'services' })} className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-all gap-2" style={{maxWidth: '250px'}}>
		                                    <Plus size={32}/>
		                                    <span className="font-black uppercase italic tracking-tighter text-[7px]">Novo Serviço</span>
		                                </button>
		                            )}
		                        </div>
			                </div>
	
		<div id="specialist-brands-section" className="w-full scroll-mt-32 relative group">
			                     <div className="flex flex-col mb-8 border-b border-white/10 pb-4">
		                            <div className="flex gap-2"><EditableText text={specialistBrands.titleMain} isEditing={isAdmin} onSave={(v)=>updateContent('specialistBrands.titleMain', v)} /><EditableText text={specialistBrands.titleHighlight} isEditing={isAdmin} onSave={(v)=>updateContent('specialistBrands.titleHighlight', v)} /></div>
		                            <EditableText text={specialistBrands.subtitle || {content: "MARCAS QUE CONFIAMOS", style: {font: "Arial", color: "#6b7280", size: "12px"}}} isEditing={isAdmin} onSave={(v)=>updateContent('specialistBrands.subtitle', v)} className="font-bold uppercase text-xs tracking-[0.2em] text-gray-500 mt-1" />
		                         </div>
		                     
		                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
		                            {(specialistBrands.items || []).map((item) => (
		                                <div key={item.id} className="flex flex-col items-center group/card relative" style={{cursor: (!isAdmin && (item.description || item.showWhatsapp !== false)) ? 'pointer' : 'default'}} onClick={() => !isAdmin && (item.description || item.showWhatsapp !== false) && setInterestModal({...item, section: 'specialistBrands'})}>
		                                    <div className="w-full aspect-square relative group/icon overflow-hidden bg-black" style={{maxWidth: '250px'}}>
		                                        {item.image ? <img src={item.image} className="w-full h-full object-contain" alt={item.title}/> : <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={40}/></div>}
	                                        {(item.description || item.showWhatsapp !== false) && (
			                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
			                                                <span className="text-white font-black text-[8px] uppercase tracking-widest">Ver Detalhes</span>
			                                            </div>
	                                        )}
		                                    </div>
		                                    <div className="mt-2 text-center">
		                                        <h4 className="font-black uppercase text-[10px] tracking-tighter text-white">{item.title}</h4>
		                                    </div>
		                                    {isAdmin && (
		                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 z-20">
		                                            <button onClick={(e)=>{e.stopPropagation(); setCardModal({...item, section: 'specialistBrands'})}} className="bg-blue-600 text-white p-1 rounded-full shadow-lg"><Edit3 size={10}/></button>
		                                            <button onClick={(e)=>{e.stopPropagation(); updateContent('specialistBrands.items', specialistBrands.items.filter(i=>i.id!==item.id))}} className="bg-red-600 text-white p-1 rounded-full shadow-lg"><Trash2 size={10}/></button>
		                                        </div>
		                                    )}
		                                </div>
		                            ))}
		                            {isAdmin && (
		                                <button onClick={()=>setCardModal({ id: generateId(), title: '', description: '', image: null, section: 'specialistBrands' })} className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-all gap-2" style={{maxWidth: '250px'}}>
		                                    <Plus size={32}/>
		                                    <span className="font-black uppercase italic tracking-tighter text-[7px]">Nova Marca</span>
		                                </button>
		                            )}
		                        </div>
		                </div>

		<div id="partners-section" className="w-full scroll-mt-32 relative group">
			                     <div className="flex flex-col mb-8 border-b border-white/10 pb-4">
		                            <EditableText text={partners.title} isEditing={isAdmin} onSave={(v)=>updateContent('partners.title', v)} />
		                            <EditableText text={partners.subtitle || {content: "CONFIANÇA E QUALIDADE", style: {font: "Arial", color: "#6b7280", size: "12px"}}} isEditing={isAdmin} onSave={(v)=>updateContent('partners.subtitle', v)} className="font-bold uppercase text-xs tracking-[0.2em] text-gray-500 mt-1" />
		                         </div>

		                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
		                            {(partners.items || []).map((item) => (
		                                <div key={item.id} className="flex flex-col items-center group/card relative">
		                                    <div className="w-full aspect-square relative group/icon overflow-hidden bg-black" style={{maxWidth: '150px'}}>
		                                        {item.image ? <img src={item.image} className="w-full h-full object-contain" alt={item.title}/> : <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={32}/></div>}
		                                    </div>
		                                    <div className="mt-2 text-center">
		                                        <h4 className="font-black uppercase text-[9px] tracking-tighter text-white">{typeof item.title === 'string' ? item.title : (item.title?.content || '')}</h4>
		                                    </div>
		                                    {isAdmin && (
		                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 z-20">
		                                            <button onClick={(e)=>{e.stopPropagation(); setCardModal({...item, section: 'partners'})}} className="bg-blue-600 text-white p-1 rounded-full shadow-lg"><Edit3 size={10}/></button>
		                                            <button onClick={(e)=>{e.stopPropagation(); updateContent('partners.items', partners.items.filter(i=>i.id!==item.id))}} className="bg-red-600 text-white p-1 rounded-full shadow-lg"><Trash2 size={10}/></button>
		                                        </div>
		                                    )}
		                                </div>
		                            ))}
		                            {isAdmin && (
		                                <button onClick={()=>setCardModal({ id: generateId(), title: '', description: '', image: null, section: 'partners' })} className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-all gap-2" style={{maxWidth: '150px'}}>
		                                    <Plus size={24}/>
		                                    <span className="font-black uppercase italic tracking-tighter text-[7px]">Novo Parceiro</span>
		                                </button>
		                            )}
		                        </div>
			                </div>

		<div id="brands-section" className="w-full scroll-mt-32 relative group">
			                     <div className="flex flex-col mb-8 border-b border-white/10 pb-4">
		                            <EditableText text={brands.title} isEditing={isAdmin} onSave={(v)=>updateContent('brands.title', v)} />
		                            <EditableText text={brands.subtitle || {content: "TRABALHAMOS COM AS MELHORES", style: {font: "Arial", color: "#6b7280", size: "12px"}}} isEditing={isAdmin} onSave={(v)=>updateContent('brands.subtitle', v)} className="font-bold uppercase text-xs tracking-[0.2em] text-gray-500 mt-1" />
		                         </div>

		                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
		                            {(brands.items || []).map((item) => (
		                                <div key={item.id} className="flex flex-col items-center group/card relative">
		                                    <div className="w-full aspect-square relative group/icon overflow-hidden bg-black" style={{maxWidth: '150px'}}>
		                                        {item.image ? <img src={item.image} className="w-full h-full object-contain" alt={item.title}/> : <div className="w-full h-full flex items-center justify-center text-gray-800"><ImageIcon size={32}/></div>}
		                                    </div>
		                                    <div className="mt-2 text-center">
		                                        <h4 className="font-black uppercase text-[9px] tracking-tighter text-white">{typeof item.title === 'string' ? item.title : (item.title?.content || '')}</h4>
		                                    </div>
		                                    {isAdmin && (
		                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 z-20">
		                                            <button onClick={(e)=>{e.stopPropagation(); setCardModal({...item, section: 'brands'})}} className="bg-blue-600 text-white p-1 rounded-full shadow-lg"><Edit3 size={10}/></button>
		                                            <button onClick={(e)=>{e.stopPropagation(); updateContent('brands.items', brands.items.filter(i=>i.id!==item.id))}} className="bg-red-600 text-white p-1 rounded-full shadow-lg"><Trash2 size={10}/></button>
		                                        </div>
		                                    )}
		                                </div>
		                            ))}
		                            {isAdmin && (
		                                <button onClick={()=>setCardModal({ id: generateId(), title: '', description: '', image: null, section: 'brands' })} className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-all gap-2" style={{maxWidth: '150px'}}>
		                                    <Plus size={24}/>
		                                    <span className="font-black uppercase italic tracking-tighter text-[7px]">Nova Marca</span>
		                                </button>
		                            )}
		                        </div>
			                </div>


                <div className={`my-12 border-y border-white/10 relative overflow-hidden group ${home.disclaimer.type === 'text' ? 'py-8 min-h-[250px] flex items-center justify-center' : ''}`} style={{ height: home.disclaimer.type === 'image' ? `${home.disclaimer.height || 200}px` : 'auto' }}>
                    {home.disclaimer.type === 'text' && <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: home.disclaimer.bgColor || "#2a0a0a", opacity: home.disclaimer.opacity !== undefined ? home.disclaimer.opacity : 0.2 }}></div>}
                     {home.disclaimer.type === 'image' && home.disclaimer.imageUrl && (<img src={home.disclaimer.imageUrl} className="w-full h-full object-contain z-0 opacity-100" alt="Disclaimer"/>)}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex flex-col gap-2 z-50 bg-black/80 p-3 rounded border border-gray-700 shadow-xl opacity-0 group-hover:opacity-100">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] text-white">Modo Imagem</span>
                          <button onClick={()=>updateContent('home.disclaimer.type', home.disclaimer.type === 'image' ? 'text' : 'image')} className={`w-8 h-4 rounded-full flex items-center ${home.disclaimer.type === 'image' ? 'bg-green-600 justify-end' : 'bg-gray-700 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full mx-0.5"></div></button>
                        </div>
                        {home.disclaimer.type === 'text' && (<><div className="flex items-center gap-2"><input type="color" value={home.disclaimer.bgColor || "#2a0a0a"} onChange={(e) => updateContent('home.disclaimer.bgColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0"/><span className="text-[10px] text-white">Fundo</span></div><div className="flex items-center gap-2"><input type="range" min="0" max="1" step="0.1" value={home.disclaimer.opacity !== undefined ? home.disclaimer.opacity : 0.2} onChange={(e) => updateContent('home.disclaimer.opacity', Number(e.target.value))} className="w-20"/><span className="text-[10px] text-white">{Math.round((home.disclaimer.opacity||0.2)*100)}%</span></div></>)}
                         {home.disclaimer.type === 'image' && (<><div className="mt-1"><label className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded cursor-pointer block text-center w-full">Upload Imagem<input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>updateContent('home.disclaimer.imageUrl', res))}/></label></div><div className="flex flex-col gap-1 mt-2"><div className="flex items-center gap-2 text-white text-[10px]"><span>Altura: {home.disclaimer.height || 200}px</span><input type="range" min="50" max="600" value={home.disclaimer.height || 200} onChange={(e)=>updateContent('home.disclaimer.height', Number(e.target.value))} className="w-16"/></div><div className="text-[8px] text-yellow-500 font-bold uppercase">Largura Recomendada: 1200px</div></div></>)}
                      </div>
                    )}
                    {home.disclaimer.type === 'text' && (
                      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 relative z-10 w-full">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="relative group">{home.disclaimer.icon ? <img src={home.disclaimer.icon} className="h-16 w-16 object-contain mb-2" alt="Icon"/> : <AlertTriangle size={32} className="text-yellow-500 mb-2"/>}{isAdmin && <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-xs rounded border border-gray-700"><Upload size={12}/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>updateContent('home.disclaimer.icon', res))}/></label>}</div>
                          <EditableText text={home.disclaimer.title} isEditing={isAdmin} onSave={(v) => updateContent('home.disclaimer', {...home.disclaimer, title: v})} className="font-bold uppercase tracking-widest"/>
                          <EditableText text={home.disclaimer.text} isEditing={isAdmin} onSave={(v) => updateContent('home.disclaimer', {...home.disclaimer, text: v})} className="text-center max-w-4xl"/>
                        </div>
                      </div>
                    )}
                </div>
            </div>
        )}
        {activeTab.type === 'faq' && (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex gap-2 justify-center mb-8 border-b border-white/10 pb-4 text-xl sm:text-2xl md:text-4xl">
                    <EditableText text={faq.titleMain} isEditing={isAdmin} onSave={(v)=>updateContent('faq.titleMain', v)} />
                    <EditableText text={faq.titleHighlight} isEditing={isAdmin} onSave={(v)=>updateContent('faq.titleHighlight', v)} />
                </div>
                <div className="space-y-4">
                    {(faq.list || []).map((item, idx) => (
                        <div key={item.id} className="bg-[#111] md:rounded-xl md:border md:border-white/5 relative group md:overflow-hidden">
                            <div className="w-full text-left p-4 flex flex-col md:bg-gray-900/50 md:hover:bg-gray-900">
                                <div className="flex justify-between items-start">
                                    <div 
                                        contentEditable={isAdmin}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            if(!isAdmin) return;
                                            const n = [...faq.list];
                                            n[idx].question.content = e.target.innerText;
                                            updateContent('faq.list', n);
                                        }}
                                        onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                                        className="font-bold text-lg text-white outline-none flex-1 pr-10 cursor-pointer"
                                    >{String(item.question?.content || '')}</div>
                                </div>
                                {expandedFaq === item.id && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        {/* BARRA DE FERRAMENTAS PARA FAQ (PX REAIS E SELEÇÃO FLUIDA) */}
                                        {isAdmin && <FormattingToolbar onAction={handleEditorAction}/>}
                                        <div 
                                            ref={(el) => {
                                                if (el && isAdmin) {
                                                    el.onInput = (e) => {
                                                        const n = [...faq.list];
                                                        n[idx].answer.content = e.target.innerHTML;
                                                    };
                                                }
                                            }}
                                            contentEditable={isAdmin}
                                            suppressContentEditableWarning
                                            className={`text-gray-400 text-sm whitespace-pre-wrap outline-none prose prose-sm md:prose-lg max-w-none p-6 rounded-b-xl ${isAdmin ? 'bg-white text-black border-x border-b-2 border-gray-300' : ''}`}
                                            style={{ margin: 0 }}
                                            id={`faq-answer-${item.id}`}
                                            dangerouslySetInnerHTML={{ __html: String(item.answer?.content || '') }}
                                        />
                                    </div>
                                )}
                            </div>
                            {isAdmin && (
                                <div className="absolute top-2 right-4 flex gap-1 z-10 opacity-0 group-hover:opacity-100">
                                    <button onClick={(e)=>{ e.stopPropagation(); deleteWithConfirm("Excluir pergunta?", ()=>updateContent('faq.list', faq.list.filter(i=>i.id!==item.id))); }} className="bg-red-600 p-1 rounded hover:bg-red-500"><Trash2 size={14} className="text-white"/></button>
                                    <button onClick={(e)=>{ e.stopPropagation(); const n = [...faq.list]; n[idx].answer.content = document.getElementById(`faq-answer-${item.id}`).innerHTML; updateContent('faq.list', n); }} className="bg-green-600 p-1 rounded hover:bg-green-500"><Save size={14} className="text-white"/></button>
                                </div>
                            )}
                        </div>
                    ))}
                    {isAdmin && (
                        <button onClick={()=>updateContent('faq.list', [...(faq.list || []), { id: generateId(), question: { content: 'Nova Pergunta' }, answer: { content: 'Nova Resposta' } }])} className="w-full py-3 bg-gray-800 border-2 border-dashed border-gray-700 text-gray-400 font-bold rounded-xl hover:text-white flex items-center justify-center gap-2"><Plus/> Adicionar Pergunta</button>
                    )}
                </div>
            </div>
        )}
        {activeTab.type === 'ranking' && (
            <div className="max-w-6xl mx-auto">
                 <div className="text-center mb-12 relative group/header pt-12">
                    <div className="flex justify-center mb-4 cursor-pointer relative items-end gap-2">
                         <div className="relative flex items-center justify-center">{ranking.headerImage && (<img src={ranking.headerImage} alt="Logo Ranking" className="object-contain mx-auto" style={{ maxHeight: `${ranking.headerImageSize || 300}px`, maxWidth: '100%' }}/>)}{isAdmin && (<div className="absolute top-0 right-[-140px] flex flex-col gap-2 bg-black/80 p-2 rounded z-50 opacity-0 group-hover:opacity-100"><label className="cursor-pointer bg-blue-600 text-white p-2 rounded text-center text-xs font-bold hover:bg-blue-500">Trocar Logo<input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>updateContent('ranking.headerImage', res))}/></label></div>)}</div>
                    </div>
                    <EditableText text={ranking.title} isEditing={isAdmin} onSave={(v)=>updateContent('ranking.title', v)} />
                    <div className="mt-2"><EditableText text={ranking.subtitle} isEditing={isAdmin} onSave={(v)=>updateContent('ranking.subtitle', v)} /></div>
                </div>
                
                <div className="flex flex-col gap-4 relative">
                    {isAdmin && (
                        <div className="absolute -top-10 right-0 z-50">
                            <button onClick={()=>setRankingConfigModal(true)} className="bg-gray-800 p-2 rounded hover:bg-white/20 text-white shadow border border-gray-600 flex items-center gap-2 text-xs font-bold">
                                <Settings size={16}/> Config Tabela
                            </button>
                        </div>
                    )}
                    <div className="p-4 rounded-xl border border-white/5 items-center gap-4 text-center font-bold uppercase text-xs tracking-widest hidden md:flex" style={{ backgroundColor: ranking.styles?.header?.bgColor || '#111111', color: ranking.styles?.header?.color || '#6b7280', fontFamily: ranking.styles?.header?.font || 'Arial' }}>
                        <div className="w-12 flex-shrink-0 text-center">Pos.</div>
                        <div className="flex-1 text-left">Carro / Dono</div>
                        <div className="w-24 text-center">POTÊNCIA</div>
                        <div className="w-24 text-center">Torque</div>
                        <div className="w-20 text-center">FOTOS</div>
                        <div className="w-24 text-center">Data/Dyno</div>
                        {isAdmin && <div className="w-20"></div>}
                    </div>

                    <div className="w-full space-y-[15px] md:space-y-2.5">
                    {sortedRanking.map((car, idx) => {
                        const rowBgColor = idx < 5 ? (ranking.colors?.top5 || '#16a34a') : (idx < 10 ? (ranking.colors?.top10 || '#ca8a04') : (ranking.colors?.rest || '#dc2626'));
                        
                        let posColor = 'bg-black';
                        if (idx === 0) posColor = 'bg-[#ffd700] text-black'; 
                        else if (idx === 1) posColor = 'bg-[#c0c0c0] text-black';
                        else if (idx === 2) posColor = 'bg-[#cd7f32] text-black';

                        return (
                        <div key={car.id} className="md:rounded-xl md:border md:border-white/10 flex flex-col md:flex-row items-center md:overflow-hidden group w-full md:min-w-0 rounded-2xl md:rounded-none" style={{ backgroundColor: hexToRgba(rowBgColor, ranking.transparency || 0.2) }}>
                            {/* Mobile Card Layout - Primeira Linha */}
                            <div className="md:hidden w-full flex flex-row gap-2 p-2 items-center">
                                {/* Posição */}
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 flex justify-center items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg text-xs ${posColor} ${idx > 2 ? 'text-white' : ''}`}>{idx + 1}</div>
                                    </div>
                                </div>
                                
                                {/* Carro + Dono */}
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <div className="font-bold text-xs uppercase italic" style={{ color: ranking.styles?.row?.color || '#ffffff' }}>Carro: {typeof car.car === 'object' ? car.car.content : car.car}</div>
                                    <div className="text-xs opacity-80">Dono: {typeof car.owner === 'object' ? car.owner.content : car.owner}</div>
                                </div>
                            </div>
                            {/* Mobile Card Layout - Segunda Linha (Potência + Torque) */}
                            <div className="md:hidden w-full flex flex-row px-2 py-2 items-center border-t border-white/10">
                                <div className="flex-shrink-0 w-10"></div>
                                <div className="text-xs font-bold flex-1">Potência: {car.power} Cv</div>
                                <div className="text-xs font-bold flex-1">Torque: {car.torque} Kgf.m</div>
                            </div>
                            {/* Mobile Card Layout - Terceira Linha (Mídia + Data + Dyno) */}
                            <div className="md:hidden w-full flex flex-row px-2 pb-2 items-center border-t border-white/10">
                                <div className="flex-shrink-0 w-10"></div>
                                <button onClick={()=>setCarMediaModal(car)} className="bg-white text-black px-2 py-0.5 rounded font-bold text-[10px] uppercase leading-none flex-shrink-0 w-fit">Mídia</button>
                                <div className="text-xs font-bold flex-1 ml-2">Data: {car.date ? (typeof car.date === 'string' ? car.date.split('-').reverse().join('/') : (car.date.content ? car.date.content.split('-').reverse().join('/') : '-')) : '-'}</div>
                                <div className="text-xs font-bold flex-1 ml-2">Dyno: {car.dyno || '-'}</div>
                            </div>
                            
                            {/* Desktop Layout */}
                            <div className="hidden md:flex flex-1 w-full flex-row items-center gap-2 md:gap-4 p-2 md:p-4">
                                <div className="w-12 flex-shrink-0 flex justify-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg text-sm ${posColor} ${idx > 2 ? 'text-white' : ''}`}>{idx + 1}</div>
                                </div>
                                <div className="flex-1 w-full text-center md:text-left min-w-0">
                                    <div className="font-bold text-sm md:text-lg uppercase italic truncate" style={{ color: ranking.styles?.row?.color || '#ffffff' }}>{typeof car.car === 'object' ? car.car.content : car.car}</div>
                                    <div className="text-xs md:text-sm truncate opacity-80">{typeof car.owner === 'object' ? car.owner.content : car.owner}</div>
                                </div>
                                <div className="w-full md:w-24 text-center font-bold text-xs md:text-base">{car.power} Cv</div>
                                <div className="w-full md:w-24 text-center font-bold text-xs md:text-base">{car.torque} Kgf.m</div>
                                <div className="w-full md:w-20 flex justify-center">
                                    <div className="w-10 h-10 bg-black rounded-lg overflow-hidden relative cursor-pointer border border-gray-700" onClick={()=>setCarMediaModal(car)}>
                                        {car.media && car.media[0] ? (<img src={car.media[0].url} className="w-full h-full object-contain" alt="rk"/>) : <div className="w-full h-full flex items-center justify-center text-gray-600"><Camera size={16}/></div>}
                                    </div>
                                </div>
	                                <div className="w-full md:w-24 text-center text-xs flex flex-col justify-center">
	                                    <div className="font-bold opacity-80">{car.date ? (typeof car.date === 'string' ? car.date.split('-').reverse().join('/') : (car.date.content ? car.date.content.split('-').reverse().join('/') : '-')) : '-'}</div>
	                                    <span className="opacity-60">{car.dyno || '-'}</span>
	                                </div>
                                {isAdmin && (
                                    <div className="w-full md:w-20 flex gap-1 justify-center opacity-0 group-hover:opacity-100">
                                        <button onClick={()=>setRankingModal(car)} className="bg-blue-600 text-white p-1 rounded shadow hover:bg-blue-500"><Edit3 size={12}/></button>
                                        <button onClick={()=>deleteWithConfirm("Excluir item?", ()=>updateContent('ranking.list', ranking.list.filter(c=>c.id!==car.id)))} className="bg-red-600 text-white p-1 rounded shadow hover:bg-red-700"><Trash2 size={12}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                    </div>
                    {isAdmin && <button onClick={()=>setRankingModal({ id: generateId(), car: { content: "" }, owner: { content: "" }, power: '', torque: '', media: [], date: { content: "" }, dyno: '' })} className="w-full py-4 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center gap-2"><Plus size={20}/> ADICIONAR AO RANKING</button>}
                </div>
            </div>
        )}
        {activeTab.type === 'shop' && (
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12"><div className="flex justify-center items-center gap-2"><EditableText text={shop.title} isEditing={isAdmin} onSave={(v)=>updateContent('shop.title', v)} /><EditableText text={shop.subtitle} isEditing={isAdmin} onSave={(v)=>updateContent('shop.subtitle', v)} /></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{(shop.items || []).map((prod) => {
                    const conditionColor = prod.condition === 'Novo' ? 'bg-green-600' : (prod.condition === 'Seminovo' ? 'bg-yellow-500' : 'bg-red-600');
                    return (
                    <div key={prod.id} className="bg-[#111] md:rounded-2xl md:border md:border-white/5 md:overflow-hidden group md:shadow-xl flex flex-col h-full relative">
                        <div className="aspect-square bg-black relative cursor-pointer md:overflow-hidden" onClick={()=>setProductGalleryModal(prod)}>
                            {prod.images && prod.images.length > 0 ? <img src={prod.images[0]} className="w-full h-full object-contain" alt="shop"/> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={32}/></div>}
                            <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${conditionColor}`}>{prod.condition}</span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
	                            <h4 className="font-bold text-white text-lg mb-2 whitespace-normal break-words">{prod.title}</h4>
	                            <p className="text-gray-400 text-sm mb-4 flex-1 whitespace-normal break-words">{prod.desc}</p>
                            <div className="flex justify-between items-end border-t border-gray-800 pt-4 mt-auto">
                                <div><span className="text-xs text-gray-500 block">Preço</span><span className="text-green-500 font-bold text-xl">{prod.price}</span></div>
                                <button onClick={()=>setInterestModal(prod)} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg">TENHO INTERESSE</button>
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="p-3 border-t border-gray-800 flex justify-between bg-black">
                                <button onClick={()=>setProductModal(prod)} className="text-blue-500 text-xs flex items-center gap-1"><Edit3 size={14}/> Editar</button>
                                <button onClick={()=>deleteWithConfirm("Excluir produto?", ()=>updateContent('shop.items', shop.items.filter(p=>p.id!==prod.id)))} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={14}/> Excluir</button>
                            </div>
                        )}
                    </div>
                )})}
                {isAdmin && (
                    <button onClick={() => setProductModal({ id: generateId(), title: '', desc: '', price: '', condition: 'Novo', images: [] })} className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center min-h-[400px] text-gray-400 hover:text-white cursor-pointer"><Plus size={48}/></button>
                )}</div>
            </div>
        )}
        {activeTab.type === 'contact' && (
          <div className="max-w-5xl mx-auto bg-[#111] md:border md:border-white/10 p-10 md:rounded-3xl md:shadow-2xl relative">
            <div className="flex gap-2 mb-8 text-xl sm:text-2xl md:text-4xl"><EditableText text={contact.titleMain} isEditing={isAdmin} onSave={(v)=>updateContent('contact.titleMain', v)} /><EditableText text={contact.titleHighlight} isEditing={isAdmin} onSave={(v)=>updateContent('contact.titleHighlight', v)} /></div>
            <div className={`grid grid-cols-1 ${contact.showMap && contact.mapEmbed ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-12`}>
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-4">
                  {(isAdmin ? (
                      <div className="relative p-6 rounded-2xl flex flex-col gap-4 shadow-lg border border-green-600/30 bg-green-600/20 items-center text-center">
                          <div className="flex flex-col items-center gap-3">
                              <MessageCircle size={32} className="text-green-500"/>
                              <div className="flex flex-col">
                                  <EditableText text={contact.labels.whatsapp} isEditing={true} onSave={(v)=>updateContent('contact.labels.whatsapp', v)} className="text-green-500 font-bold text-lg"/>
                                  <EditableText text={contact.whatsapp} isEditing={true} onSave={(v)=>updateContent('contact.whatsapp', v)} className="text-white/70 text-sm"/>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <a href={`https://wa.me/${contact.whatsapp?.content?.replace(/\D/g,'')}`} target="_blank" className="p-6 rounded-2xl flex flex-col gap-4 shadow-lg bg-green-600/20 hover:bg-green-600 border border-green-600/30 text-green-500 hover:text-white transition-all items-center text-center group">
                          <div className="flex flex-col items-center gap-3">
                              <MessageCircle size={32} className="group-hover:scale-110 transition-transform"/>
                              <div className="flex flex-col">
                                  <span className="font-bold text-lg">{contact.labels.whatsapp.content}</span>
                                  <span className="opacity-70 text-sm">{contact.whatsapp.content}</span>
                              </div>
                          </div>
                      </a>
                  ))}
                  
	                  {contact.showForm && contact.formUrl && (
	                      <div className="relative group/form-btn">
	                          <div 
	                            role="button"
	                            tabIndex={0}
	                            onClick={() => !isAdmin && window.open(contact.formUrl, '_blank')} 
	                            onKeyDown={(e) => { if(!isAdmin && e.key === 'Enter') window.open(contact.formUrl, '_blank'); }}
	                            className={`p-6 rounded-2xl flex flex-col gap-4 shadow-lg items-center w-full cursor-pointer transition-all border border-white/10 hover:bg-white/10 text-center`} 
	                            style={{ backgroundColor: isAdmin ? (contact.formColor || styles.primaryColor) : hexToRgba(contact.formColor || styles.primaryColor, 0.2) }}
	                          >
	                            <div className="flex flex-col items-center gap-3 w-full">
	                                <FileText size={32} style={{ color: contact.formColor || styles.primaryColor }}/>
	                                <div className="flex flex-col text-white items-center">
	                                    <EditableText text={contact.formLabel || {content:"ACESSAR FORMULÁRIO"}} isEditing={isAdmin} onSave={(v)=>updateContent('contact.formLabel', v)} className="font-bold text-lg uppercase" style={{ color: contact.formColor || styles.primaryColor }}/>
	                                    <div className="text-xs opacity-70">{isAdmin ? "MODO ADMIN: Clique para editar" : "Clique para abrir o formulário"}</div>
	                                </div>
	                            </div>
	                          </div>
                          {isAdmin && (
                            <div className="absolute -top-2 -right-2 z-[60] flex items-center gap-1 bg-black p-1 rounded border border-gray-700 shadow-xl">
                                <input type="color" value={contact.formColor || styles.primaryColor} onChange={(e)=>updateContent('contact.formColor', normalizeHex(e.target.value))} className="w-6 h-6 rounded cursor-pointer border-0" title="Cor do Botão"/>
                            </div>
                          )}
                      </div>
                  )}
                </div>
                <div className="mt-8 space-y-6">
                  <div className=""><div className="flex items-center gap-2 mb-2" style={{ color: styles.primaryColor }}><Mail size={20}/><EditableText text={contact.labels.email} isEditing={isAdmin} onSave={(v)=>updateContent('contact.labels.email',v)}/></div><div className="bg-gray-900 p-4 rounded-lg border border-gray-800"><EditableText text={contact.email} isEditing={isAdmin} onSave={(v)=>updateContent('contact.email',v)} className="text-gray-300 text-sm"/></div></div>
                  {contact.showAddress && (
                    <div className=""><div className="flex items-center gap-2 mb-2" style={{ color: styles.primaryColor }}><MapPin size={20}/><EditableText text={contact.labels.address} isEditing={isAdmin} onSave={(v)=>updateContent('contact.labels.address',v)}/></div><div className="bg-gray-900 p-4 rounded-lg border border-gray-800"><EditableText text={contact.address} isEditing={isAdmin} onSave={(v)=>updateContent('contact.address',v)} className="text-gray-300 text-sm"/></div></div>
                  )}
                  <div><div className="flex items-center gap-2 mb-2" style={{ color: styles.primaryColor }}><Clock size={20}/><EditableText text={contact.labels.hours} isEditing={isAdmin} onSave={(v)=>updateContent('contact.labels.hours',v)}/></div><div className="bg-gray-900 p-4 rounded-lg border border-gray-800"><EditableText text={contact.hours} isEditing={isAdmin} onSave={(v)=>updateContent('contact.hours',v)} className="text-gray-300 text-sm"/></div></div>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-4 border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={()=>updateContent('contact.showAddress', !contact.showAddress)} className={`p-2 rounded flex items-center justify-center gap-2 text-[10px] font-bold ${contact.showAddress ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>ENDEREÇO {contact.showAddress ? <Eye size={12}/> : <EyeOff size={12}/>}</button>
                      <button onClick={()=>updateContent('contact.showMap', !contact.showMap)} className={`p-2 rounded flex items-center justify-center gap-2 text-[10px] font-bold ${contact.showMap ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>MAPA {contact.showMap ? <Eye size={12}/> : <EyeOff size={12}/>}</button>
                      <button onClick={()=>updateContent('contact.showForm', !contact.showForm)} className={`p-2 rounded flex items-center justify-center gap-2 text-[10px] font-bold ${contact.showForm ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>BOTÃO FORM {contact.showForm ? <Eye size={12}/> : <EyeOff size={12}/>}</button>
                    </div>
                    {contact.showForm && (
                        <div className="">
                            <label className="text-gray-500 text-[10px] font-bold block mb-1 uppercase tracking-widest">URL Formulário (Google Forms)</label>
                            <input className="w-full bg-black text-white p-2 rounded border border-gray-700 text-xs" value={contact.formUrl || ''} onChange={(e)=>updateContent('contact.formUrl', e.target.value)} placeholder="https://docs.google.com/forms/..."/>
                        </div>
                    )}
                    {contact.showMap && (
                      <div className="">
                        <label className="text-gray-500 text-[10px] font-bold block mb-1 uppercase tracking-widest">Link do Mapa (URL Google Maps)</label>
                        <input className="w-full bg-black text-white p-2 rounded border border-gray-700 text-xs" value={contact.mapEmbed || ''} onChange={(e)=>updateContent('contact.mapEmbed', extractIframeSrc(e.target.value))} placeholder="Cole aqui o código ou link..."/>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {contact.showMap && contact.mapEmbed && (
                <div className="w-full h-full min-h-[400px] md:rounded-3xl md:overflow-hidden md:border md:border-white/10 md:shadow-inner bg-gray-900 flex items-center justify-center">
                  <iframe src={contact.mapEmbed} width="100%" height="100%" frameBorder="0" style={{ border: 0 }} title="map" allowFullScreen="" loading="lazy"></iframe>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-black text-white py-12 border-t border-gray-900 w-full"><div className="container mx-auto px-4"><div className="flex flex-col md:flex-row justify-between items-center gap-6"><div><EditableText text={content.footer?.text} isEditing={isAdmin} onSave={(v) => updateContent('footer.text', v)} label="Footer"/><div className="text-gray-600 text-sm mt-1">© {new Date().getFullYear()} <EditableText text={content.footer?.copyright} isEditing={isAdmin} onSave={(v) => updateContent('footer.copyright', v)} tag="span"/></div></div><SocialMediaBar items={content.social || []} isEditing={isAdmin} onUpdate={(items) => updateContent('social', items)} onDelete={(id) => updateContent('social', (content.social || []).filter(s=>s.id!==id))} primaryColor={styles.primaryColor} /></div></div></footer>
      
      <TabManagerModal isOpen={tabManagerOpen} onClose={() => setTabManagerOpen(false)} tabs={content.tabs} onSave={(t) => updateContent('tabs', t)} />
      <ConfirmModal isOpen={!!confirmModal} onClose={()=>setConfirmModal(null)} onConfirm={confirmModal?.onConfirm} message={confirmModal?.message}/>
      <RichEditModal isOpen={headerTitleEdit} onClose={() => setHeaderTitleEdit(false)} initialData={header.title} onSave={(val) => { updateContent('header.title', val); setHeaderTitleEdit(false); }} title="Título" noLink={true}/>
      <RichEditModal isOpen={headerSubtitleEdit} onClose={() => setHeaderSubtitleEdit(false)} initialData={header.subtitle} onSave={(val) => { updateContent('header.subtitle', val); setHeaderSubtitleEdit(false); }} title="Subtítulo" noLink={true}/>
      <InterestModal isOpen={!!interestModal} onClose={()=>setInterestModal(null)} product={interestModal} contact={content} isAdmin={isAdmin} onUpdate={updateContent}/>
      <InputTextModal isOpen={!!inputTextModal} onClose={()=>setInputTextModal(null)} title={inputTextModal?.title} value={inputTextModal?.value} onConfirm={inputTextModal?.onConfirm}/>
      <UserModal isOpen={showUserModal} onClose={()=>setShowUserModal(false)} users={content.users || []} onSave={(u)=>{ updateContent('users', u); }}/>
      <GlobalSettingsModal isOpen={isEditingGlobal} onClose={()=>setIsEditingGlobal(false)} content={content} updateContent={updateContent}/>
      <CarMediaModal car={carMediaModal} onClose={()=>setCarMediaModal(null)}/>
      <ProductGalleryModal product={productGalleryModal} onClose={()=>setProductGalleryModal(null)}/>
      <StructurePageModal isOpen={showStructurePage} onClose={()=>setShowStructurePage(false)} content={content} updateContent={updateContent} isEditing={isAdmin} setMediaModal={setMediaModal} deleteWithConfirm={deleteWithConfirm} setInputTextModal={setInputTextModal}/>
      
      <BannerManagerModal isOpen={bannerEditModal} onClose={() => setBannerEditModal(false)} banners={content.home.bannerImages || []} onUpdate={(newBanners) => updateContent('home.bannerImages', newBanners)} onStartHotspotEdit={(idx) => { setEditingHotspotBannerIdx(idx); setLocalHotspots(home.bannerImages[idx].hotspots || []); }}/>
      <CarouselManagerModal isOpen={carouselManagerOpen} onClose={() => setCarouselManagerOpen(false)} title={carouselType === 'partners' ? 'Parceiros' : 'Marcas'} items={carouselType === 'partners' ? (partners?.items || []) : (brands?.items || [])} speed={carouselType === 'partners' ? partners.speed : brands.speed} onSpeedChange={(newSpeed) => updateContent(`${carouselType}.speed`, newSpeed)} onSave={(newItems) => updateContent(`${carouselType}.items`, newItems)}/>
      {logoEditModal && (<LogoEditModal isOpen={true} onClose={() => setLogoEditModal(null)} initialImage={logoEditModal === 'header' ? header.logoUrl : ranking.headerImage} initialSize={logoEditModal === 'header' ? header.logoSize : ranking.headerImageSize} onSave={(img, sz) => { if(logoEditModal === 'header') { updateContent('header', { ...header, logoUrl: img, logoSize: sz }); } else { updateContent('ranking', { ...ranking, headerImage: img, headerImageSize: sz }); } }}/>)}
      
      {faqModal && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"><div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-md border border-gray-700 shadow-2xl h-auto"><h3 className="text-white font-bold mb-4">Editar FAQ</h3><div className="space-y-3"><div><label className="text-xs text-gray-500 font-bold uppercase">Pergunta</label><input value={faqModal.question.content} onChange={(e)=>setFaqModal({...faqModal, question: {...faqModal.question, content: e.target.value}})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div><div><label className="text-xs text-gray-500 font-bold uppercase">Resposta</label><textarea value={faqModal.answer.content} onChange={(e)=>setFaqModal({...faqModal, answer: {...faqModal.answer, content: e.target.value}})} className="w-full bg-black text-white p-2 rounded border border-gray-700 h-24"/></div></div><div className="flex justify-end gap-2 mt-4"><button onClick={()=>setFaqModal(null)} className="text-gray-500 font-bold">Cancelar</button><button onClick={()=>{ const list = faq.list || []; const idx = list.findIndex(f=>f.id === faqModal.id); let newList; if(idx >= 0) { newList = [...list]; newList[idx] = faqModal; } else { newList = [...list, faqModal]; } updateContent('faq.list', newList); setFaqModal(null); }} className="bg-green-600 px-4 py-1 rounded text-white font-black">Salvar</button></div></div></div>)}
      
      {rankingConfigModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg border border-gray-700 shadow-2xl overflow-y-auto max-h-[80vh] custom-scrollbar">
                  <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2 uppercase italic tracking-tighter">Configurar Ranking</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Cores das Faixas (Demais Posições)</label>
                          <div className="grid grid-cols-1 gap-2">
                              <div className="flex items-center gap-2">
                                  <input type="color" value={ranking.colors?.top5 || '#16a34a'} onChange={(e)=>updateContent('ranking.colors.top5', normalizeHex(e.target.value))} className="w-8 h-8 rounded cursor-pointer border-0"/>
                                  <span className="text-xs text-white">Top 5</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <input type="color" value={ranking.colors?.top10 || '#ca8a04'} onChange={(e)=>updateContent('ranking.colors.top10', normalizeHex(e.target.value))} className="w-8 h-8 rounded cursor-pointer border-0"/>
                                  <span className="text-xs text-white">Top 10</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <input type="color" value={ranking.colors?.rest || '#dc2626'} onChange={(e)=>updateContent('ranking.colors.rest', normalizeHex(e.target.value))} className="w-8 h-8 rounded cursor-pointer border-0"/>
                                  <span className="text-xs text-white">Demais</span>
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Transparência das Linhas</label>
                          <input type="range" min="0" max="1" step="0.1" value={ranking.transparency || 0.2} onChange={(e)=>updateContent('ranking.transparency', Number(e.target.value))} className="w-full"/>
                      </div>
                  </div>
                  <div className="flex justify-end mt-6">
                      <button onClick={()=>setRankingConfigModal(false)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Concluir</button>
                  </div>
              </div>
          </div>
      )}
      
      {rankingModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg border border-gray-700 shadow-2xl h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-white font-bold mb-4 uppercase italic">Editar Carro Ranking</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Carro</label><input value={typeof rankingModal.car === 'string' ? rankingModal.car : rankingModal.car?.content || ''} onChange={(e)=>setRankingModal({...rankingModal, car: { content: e.target.value, style: rankingModal.car?.style || {} }})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Dono</label><input value={typeof rankingModal.owner === 'string' ? rankingModal.owner : rankingModal.owner?.content || ''} onChange={(e)=>setRankingModal({...rankingModal, owner: { content: e.target.value, style: rankingModal.owner?.style || {} }})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">CV</label><input type="number" value={rankingModal.power} onChange={(e)=>setRankingModal({...rankingModal, power: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Torque</label><input type="number" value={rankingModal.torque} onChange={(e)=>setRankingModal({...rankingModal, torque: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Data</label><input type="date" value={typeof rankingModal.date === 'string' ? rankingModal.date : rankingModal.date?.content || ''} onChange={(e)=>setRankingModal({...rankingModal, date: { content: e.target.value, style: rankingModal.date?.style || {} }})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Dyno (Opcional)</label><input value={rankingModal.dyno || ''} onChange={(e)=>setRankingModal({...rankingModal, dyno: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700"/></div>
                  </div>
                  <div className="mt-4">
                      <label className="text-xs text-gray-500 block mb-2 uppercase font-bold">Mídia (FOTOS E VÍDEOS YOUTUBE)</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                          {(rankingModal.media || []).map((m, i) => (
                              <div key={i} className="relative w-16 h-16 bg-gray-900 border border-gray-700 rounded overflow-hidden group">
                                  {m.type === 'image' && <img src={m.url} className="w-full h-full object-contain" alt="rk"/>}
                                  {m.type === 'youtube' && <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">YT</div>}
                                  <button onClick={()=>{const nm=[...rankingModal.media]; nm.splice(i,1); setRankingModal({...rankingModal, media: nm})}} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"><X size={10}/></button>
                              </div>
                          ))}
                          <label className="w-16 h-16 bg-gray-900 border border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 text-gray-500 hover:text-white" title="Upload Foto">
                              <Upload size={20}/>
                              <input type="file" className="hidden" multiple accept="image/*" onChange={(e)=>{
                                  Array.from(e.target.files).forEach(f => {
                                      const r = new FileReader();
                                      r.onloadend = async () => {
                                          const compressed = await compressImage(r.result, 1500, 0.98);
                                          setRankingModal(prev => ({...prev, media: [...(prev.media||[]), { type: 'image', url: compressed }]}));
                                      };
                                      r.readAsDataURL(f);
                                  });
                              }}/>
                          </label>
                      </div>
                      <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Adicionar Vídeo YouTube</label>
                          <div className="flex gap-2">
                              <input type="text" placeholder="Cole a URL do YouTube (ex: https://youtube.com/watch?v=...)" value={rankingModal.youtubeUrl || ''} onChange={(e)=>setRankingModal({...rankingModal, youtubeUrl: e.target.value})} className="flex-1 bg-black text-white p-2 rounded border border-gray-700 text-xs"/>
                              <button onClick={()=>{
                                  if(rankingModal.youtubeUrl) {
                                      const videoId = rankingModal.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
                                      if(videoId) {
                                          setRankingModal(prev => ({
                                              ...prev, 
                                              media: [...(prev.media||[]), { type: 'youtube', url: `https://www.youtube.com/embed/${videoId}`, videoId }],
                                              youtubeUrl: ''
                                          }));
                                      } else {
                                          alert('URL do YouTube inválida');
                                      }
                                  }
                              }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-bold text-xs uppercase">Adicionar</button>
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={()=>setRankingModal(null)} className="text-gray-500 font-bold">Cancelar</button>
                      <button onClick={()=>{
                          const list = ranking.list || [];
                          const idx = list.findIndex(r=>r.id === rankingModal.id);
                          let newList;
                          if(idx >= 0) { newList = [...list]; newList[idx] = rankingModal; }
                          else { newList = [...list, rankingModal]; }
                          updateContent('ranking.list', newList);
                          setRankingModal(null);
                      }} className="bg-green-600 px-4 py-1 rounded text-white font-black">Salvar</button>
                  </div>
              </div>
          </div>
      )}
      
      {productModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-lg border border-gray-700 shadow-2xl h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-white font-bold mb-4 uppercase italic">Editar Produto</h3>
                  <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Título</label><input value={productModal.title} onChange={(e)=>setProductModal({...productModal, title: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700" placeholder="Produto..."/></div>
                      <div><label className="text-xs text-gray-500 font-bold uppercase">Descrição</label><textarea value={productModal.desc} onChange={(e)=>setProductModal({...productModal, desc: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700 h-20" placeholder="Descrição..."/></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Preço</label>
                            <div className="flex items-center bg-black rounded border border-gray-700 overflow-hidden">
                                <span className="px-3 text-gray-500 font-bold bg-gray-900 h-full flex items-center border-r border-gray-700">R$</span>
                                <input value={String(productModal.price).replace('R$ ', '')} onChange={(e)=>setProductModal({...productModal, price: `R$ ${e.target.value}`})} className="w-full bg-transparent text-white p-2 outline-none" placeholder="0.000,00"/>
                            </div>
                          </div>
                          <div><label className="text-xs text-gray-500 font-bold uppercase">Condição</label><select value={productModal.condition} onChange={(e)=>setProductModal({...productModal, condition: e.target.value})} className="w-full bg-black text-white p-2 rounded border border-gray-700 h-10"><option>Novo</option><option>Seminovo</option><option>Usado</option></select></div>
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-2 uppercase font-bold">Fotos</label>
                          <div className="flex flex-wrap gap-2">
                              {(productModal.images || []).map((img, i) => (
                                   <div key={i} className="relative w-20 h-20 bg-gray-900 rounded overflow-hidden group">
                                       <img src={img} className="w-full h-full object-contain" alt="prod"/>
                                       <button onClick={()=>{const ni=[...productModal.images]; ni.splice(i,1); setProductModal({...productModal, images: ni})}} className="absolute top-0 right-0 bg-red-600 text-white p-1"><X size={12}/></button>
                                   </div>
                              ))}
                              <label className="w-20 h-14 bg-gray-900 border border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 text-gray-500 hover:text-white">
                                   <Plus size={24}/>
                                   <input type="file" className="hidden" accept="image/*" onChange={(e)=>{
                                       const f=e.target.files[0];
                                       if(f){
                                          const r=new FileReader();
                                          r.onloadend= async ()=>{
                                              const compressed = await compressImage(r.result, 1500, 0.98);
                                              setProductModal(prev => ({...prev, images: [...(prev.images||[]), compressed]}));
                                          };
                                          r.readAsDataURL(f);
                                       }
                                   }}/>
                              </label>
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={()=>setProductModal(null)} className="text-gray-500 font-bold">Cancelar</button>
	                      <button onClick={async ()=>{
	                          const currentShop = content.shop || { items: [] };
	                          const list = currentShop.items || [];
	                          const idx = list.findIndex(p=>p.id === productModal.id);
	                          let newList;
	                          if(idx >= 0) { newList = [...list]; newList[idx] = productModal; }
	                          else { newList = [...list, productModal]; }
	                          await updateContent('shop.items', newList);
	                          setProductModal(null);
	                      }} className="bg-green-600 px-4 py-1 rounded text-white font-black">Salvar</button>
                  </div>
              </div>
          </div>
      )}
      <LinkInsertModal isOpen={showLinkModal} onClose={()=>setShowLinkModal(false)} onConfirm={insertCamouflagedLink}/>
      {cardModal && (
          <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-3xl w-full max-w-4xl shadow-2xl border-4 border-black max-h-[85vh] overflow-y-auto">
                  <h3 className="text-black font-black uppercase italic mb-4 text-xl tracking-tighter sticky top-0 bg-white pb-2">Editar Card</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-red-600">
                          {cardModal.image ? <img src={cardModal.image} className="h-32 mx-auto object-contain" alt="card"/> : (
                              <div className="flex flex-col items-center gap-2">
                                  <span className="text-gray-400 font-bold">Upload da Foto</span>
                                  <span className="text-xs text-gray-500">
                                      {cardModal.section === 'services' ? 'Recomendado: 250x250px' :
                                       cardModal.section === 'specialistBrands' ? 'Recomendado: 250x250px' :
                                       cardModal.section === 'partners' ? 'Recomendado: 150x150px' :
                                       cardModal.section === 'brands' ? 'Recomendado: 150x150px' : 'Qualquer Tamanho'}
                                  </span>
                              </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUpload(e, (res)=>setCardModal({...cardModal, image: res}), cardModal.section)}/>
                      </label>
                      <div className="col-span-2 space-y-2">
                          <label className="block text-black font-bold text-sm">Título</label>
                          <input value={cardModal.title} onChange={(e)=>setCardModal({...cardModal, title: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl text-black font-bold outline-none focus:border-red-600 text-sm" placeholder="Título do Card"/>
                      </div>
                      <div className="col-span-2 space-y-2">
                          <label className="block text-black font-bold text-sm">Descrição / Informações</label>
                          <button 
                              onClick={() => setShowCardDescModal(true)}
                              className="w-full border-2 border-gray-200 p-4 rounded-xl text-black font-bold outline-none hover:border-black transition-all flex items-center justify-center gap-2 bg-gray-50"
                          >
                              <Edit3 size={16}/>
                              {cardModal.description?.content ? 'EDITAR DESCRIÇÃO' : 'ADICIONAR DESCRIÇÃO'}
                          </button>
                          <CardDescriptionModal 
                              isOpen={showCardDescModal} 
                              onClose={() => setShowCardDescModal(false)} 
                              initialData={cardModal.description} 
                              onSave={(v) => setCardModal({...cardModal, description: v})} 
                          />
                      </div>
                      {(cardModal.section === 'services' || cardModal.section === 'specialistBrands') && (
                          <>
                              <div className="col-span-2 space-y-2">
                                  <label className="block text-black font-bold text-sm">Mensagem Padrão do WhatsApp (Opcional)</label>
                                  <input value={cardModal.whatsappMessage || ''} onChange={(e)=>setCardModal({...cardModal, whatsappMessage: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl text-black font-bold outline-none focus:border-green-600 text-sm" placeholder="Ex: Olá, tenho interesse neste serviço..."/>
                              </div>
                              <div className="col-span-2 flex gap-4 items-center bg-gray-50 p-3 rounded-xl">
                                  <div className="flex items-center gap-2">
                                      <input type="checkbox" id="showWhatsapp" checked={cardModal.showWhatsapp !== false} onChange={(e)=>setCardModal({...cardModal, showWhatsapp: e.target.checked})} className="w-4 h-4 cursor-pointer"/>
                                      <label htmlFor="showWhatsapp" className="text-black font-bold text-sm cursor-pointer">Mostrar Botão WhatsApp</label>
                                  </div>
                              </div>
                          </>
                      )}
                      <div className="space-y-2">
                          <label className="block text-black font-bold text-sm">Cor do Título</label>
                          <div className="flex gap-2 items-center">
                              <input type="color" value={cardModal.titleColor || '#ffffff'} onChange={(e)=>setCardModal({...cardModal, titleColor: e.target.value})} className="w-12 h-8 border-2 border-gray-200 rounded cursor-pointer"/>
                              <span className="text-black text-xs">{cardModal.titleColor || '#ffffff'}</span>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-black font-bold text-sm">Fmt. Título</label>
                          <div className="flex gap-1">
                              <button onClick={()=>setCardModal({...cardModal, titleBold: !cardModal.titleBold})} className={`px-2 py-1 rounded text-sm font-bold ${cardModal.titleBold ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>N</button>
                              <button onClick={()=>setCardModal({...cardModal, titleItalic: !cardModal.titleItalic})} className={`px-2 py-1 rounded text-sm italic ${cardModal.titleItalic ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>I</button>
                              <button onClick={()=>setCardModal({...cardModal, titleUnderline: !cardModal.titleUnderline})} className={`px-2 py-1 rounded text-sm underline ${cardModal.titleUnderline ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>U</button>
                          </div>
                      </div>
                  </div>
	                  <div className="flex justify-end gap-3 mt-6">
	                      <button onClick={()=>setCardModal(null)} className="text-gray-400 font-black uppercase text-xs px-4 py-2 hover:text-black">Cancelar</button>
		                      <button onClick={async ()=>{
		                          const section = cardModal.section;
		                          const sectionData = content[section] || { items: [] };
		                          const currentItems = sectionData.items || [];
		                          const idx = currentItems.findIndex(i=>i.id === cardModal.id);
		                          let newItems;
		                          const { section: _, ...cleanCard } = cardModal;
		                          if(idx >= 0) { newItems = [...currentItems]; newItems[idx] = cleanCard; }
		                          else { newItems = [...currentItems, cleanCard]; }
		                          await updateContent(`${section}.items`, newItems);
		                          setCardModal(null);
		                      }} className="bg-black text-white font-black uppercase text-xs px-8 py-3 rounded-xl shadow-lg hover:bg-gray-800">SALVAR CARD</button>
	                  </div>
              </div>
          </div>
      )}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-[#0a0a0a] p-10 rounded-2xl border border-red-900/50 shadow-2xl w-full max-w-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${styles.primaryColor}, transparent)` }}></div>
            <h3 className="text-3xl font-black text-white mb-8 text-center tracking-tighter italic uppercase">
              ÁREA <span style={{ color: styles.primaryColor }}>ADMIN</span>
            </h3>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-xs text-red-500 font-bold uppercase block mb-1" style={{ color: styles.primaryColor }}>Usuário</label>
                <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-lg text-white focus:border-red-600 outline-none" />
              </div>
              <div>
                <label className="text-xs text-red-500 font-bold uppercase block mb-1" style={{ color: styles.primaryColor }}>Senha</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-lg text-white focus:border-red-600 outline-none" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg" style={{ backgroundColor: styles.primaryColor }}>ACESSAR SISTEMA</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-gray-600 text-xs mt-4 hover:text-white uppercase font-bold">CANCELAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
