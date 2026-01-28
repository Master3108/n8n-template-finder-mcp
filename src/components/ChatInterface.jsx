import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Image, FileText, Music, X, Sparkles, Zap, Brain, Rocket, Star, TrendingUp } from 'lucide-react';
import workflowsIndex from '../data/workflows-index.json';
import agencyProducts from '../data/agency-products.json';

const N8N_WEBHOOK_URL = 'https://n8n-n8n.cwf1hb.easypanel.host/webhook-test/flowmatch-processor';


// Componente de partículas flotantes (efecto premium)
const FloatingParticles = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"
                    animate={{
                        x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                        y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
                    }}
                    transition={{
                        duration: Math.random() * 20 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                    }}
                />
            ))}
        </div>
    );
};

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: '¡Hola! 👋 Soy **FlowMatch**, tu asistente inteligente.\n\n✨ Tengo acceso a **6,698 workflows** de N8N y puedo analizar:\n📸 Imágenes con IA\n📄 PDFs y documentos\n🎵 Archivos de audio\n\n**¿Qué automatización quieres crear hoy?**',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const searchWorkflows = (query) => {
        const lowerQuery = query.toLowerCase();

        // 1. Buscar en productos de la agencia primero (Prioridad Alta)
        const agencyResults = agencyProducts
            .filter(product =>
                product.keywords.some(k => lowerQuery.includes(k.toLowerCase())) ||
                product.name.toLowerCase().includes(lowerQuery) ||
                product.niche.toLowerCase().includes(lowerQuery)
            )
            .map(p => ({ ...p, isAgencyProduct: true }));

        // 2. Buscar en el índice general
        const generalResults = workflowsIndex
            .filter(workflow =>
                !agencyResults.some(ar => ar.name === workflow.name) && (
                    workflow.searchText.includes(lowerQuery) ||
                    workflow.name.toLowerCase().includes(lowerQuery) ||
                    workflow.description.toLowerCase().includes(lowerQuery)
                )
            )
            .slice(0, 5)
            .map(w => ({ ...w, isAgencyProduct: false }));

        return [...agencyResults, ...generalResults];
    };


    const sendToN8N = async (text, files) => {
        try {
            const formData = new FormData();
            formData.append('message', text);
            if (files && files.length > 0) {
                files.forEach((fileData, index) => {
                    formData.append(`file${index}`, fileData.file);
                });
            }
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling N8N:', error);
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: input,
            files: attachedFiles,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);
        setIsProcessing(true);

        // 1. Realizar búsqueda local para dar contexto a la IA
        const localResults = searchWorkflows(currentInput);

        // 2. Preparar el contexto para N8N (los 5 mejores matches locales)
        const context = localResults.map(w => `- ${w.name}: ${w.isAgencyProduct ? w.solution : w.description}`).join('\n');
        const messageWithContext = `Mensaje del usuario: ${currentInput}\n\nContexto de workflows encontrados en la base de datos local:\n${context}`;

        // 3. Enviar SIEMPRE a N8N para obtener respuesta inteligente
        try {
            const n8nResponse = await sendToN8N(messageWithContext, attachedFiles);

            if (n8nResponse) {
                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: n8nResponse.analysis || n8nResponse.text || "He analizado tu solicitud.",
                    workflows: n8nResponse.workflows || localResults,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error('La respuesta de n8n está vacía o no es válida.');
            }
        } catch (error) {
            console.error('Error detallado en el flujo IA:', error);

            let errorMessage = "⚠️ Tuve un problema conectando con mi cerebro IA.";
            if (error.message.includes('Failed to fetch')) {
                errorMessage = "⚠️ No pude conectar con n8n. ¿Activaste el 'Listen for Test Event' en n8n o es un problema de CORS?";
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: errorMessage + "\n\nPero no te preocupes, aquí tienes una búsqueda local en los 6,698 workflows:",
                workflows: localResults,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        }

        setIsTyping(false);
        setIsProcessing(false);
        setAttachedFiles([]);
    };


    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const fileData = files.map(file => ({
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));
        setAttachedFiles(prev => [...prev, ...fileData]);
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
        if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
        if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    return (
        <div className="relative flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Fondo animado con partículas */}
            <FloatingParticles />

            {/* Gradiente holográfico de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>

            {/* Header Premium con Glassmorphism */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl"
            >
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        {/* Logo y Título */}
                        <motion.div
                            className="flex items-center gap-4"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-75"
                                ></motion.div>
                                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                    FlowMatch
                                </h1>
                                <p className="text-white/70 font-semibold text-sm flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Asistente IA • 6,698 Workflows Premium
                                </p>
                            </div>
                        </motion.div>

                        {/* Estados y Badges */}
                        <div className="flex items-center gap-3">
                            <AnimatePresence>
                                {isProcessing && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-400/30 rounded-full"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles className="w-4 h-4 text-blue-400" />
                                        </motion.div>
                                        <span className="text-sm font-bold text-blue-300">Analizando con IA...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-lg border border-emerald-400/30 rounded-full"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
                                ></motion.div>
                                <span className="text-sm font-bold text-emerald-300">Online</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg border border-amber-400/30 rounded-full"
                            >
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold text-amber-300">Premium</span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
                <div className="max-w-5xl mx-auto space-y-6">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.02, rotateY: 2 }}
                                    className={`max-w-3xl ${message.type === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                                        : 'backdrop-blur-xl bg-white/10 border border-white/20'
                                        } rounded-3xl px-8 py-6 shadow-2xl relative overflow-hidden`}
                                >
                                    {/* Efecto de brillo */}
                                    {message.type === 'user' && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                    )}

                                    <div className={`text-base leading-relaxed whitespace-pre-line font-medium ${message.type === 'user' ? 'text-white' : 'text-white/90'
                                        }`}>
                                        {message.text}
                                    </div>

                                    {/* Files */}
                                    {message.files && message.files.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {message.files.map((file, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.05 }}
                                                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"
                                                >
                                                    {getFileIcon(file.type)}
                                                    <span className="text-sm text-white font-semibold">{file.name}</span>
                                                    <span className="text-xs text-white/60">({(file.size / 1024).toFixed(1)} KB)</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Workflows Cards */}
                                    {message.workflows && message.workflows.length > 0 && (
                                        <div className="mt-6 space-y-4">
                                            {message.workflows.map((workflow, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    whileHover={{ scale: 1.03, rotateX: 5 }}
                                                    className="group bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6 cursor-pointer relative overflow-hidden"
                                                >
                                                    {/* Efecto hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="relative flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {workflow.isAgencyProduct && (
                                                                    <span className="px-3 py-1 bg-amber-500/30 text-amber-300 border border-amber-400/50 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                                        Solución Agencia ⭐
                                                                    </span>
                                                                )}
                                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-bold">
                                                                    {workflow.category || (workflow.isAgencyProduct ? 'PMV' : 'Workflow')}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-black text-xl text-white mb-2 flex items-center gap-2">
                                                                {workflow.isAgencyProduct ? <Sparkles className="w-5 h-5 text-amber-400" /> : <TrendingUp className="w-5 h-5 text-emerald-400" />}
                                                                {workflow.name}
                                                            </h3>
                                                            <p className="text-white/70 text-sm mb-4 leading-relaxed">
                                                                {workflow.isAgencyProduct ? workflow.solution : workflow.description.substring(0, 150) + '...'}
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {workflow.nodeCount && (
                                                                    <span className="px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-full text-xs font-bold border border-slate-700">
                                                                        {workflow.nodeCount} nodos
                                                                    </span>
                                                                )}
                                                                {workflow.niche && (
                                                                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30">
                                                                        Nicho: {workflow.niche}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/50 flex items-center gap-2"
                                                        >
                                                            <Rocket className="w-4 h-4" />
                                                            Ver
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    <div className={`text-xs mt-3 ${message.type === 'user' ? 'text-white/50' : 'text-white/40'}`}>
                                        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl px-8 py-6 shadow-2xl">
                                <div className="flex gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area Premium */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 backdrop-blur-2xl bg-white/10 border-t border-white/20 shadow-2xl"
            >
                <div className="max-w-5xl mx-auto px-6 py-8 mb-4">
                    {/* Files Preview */}
                    <AnimatePresence>
                        {attachedFiles.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-4 flex flex-wrap gap-3"
                            >
                                {attachedFiles.map((file, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 group"
                                    >
                                        {getFileIcon(file.type)}
                                        <span className="text-sm font-semibold text-white">{file.name}</span>
                                        <motion.button
                                            whileHover={{ scale: 1.2, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => removeFile(idx)}
                                            className="text-white/60 hover:text-red-400 transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Row */}
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.wav"
                        />

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg border border-purple-400/30 hover:border-purple-400/60 rounded-2xl transition group"
                        >
                            <Paperclip className="w-6 h-6 text-purple-300 group-hover:text-purple-200" />
                        </motion.button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Describe qué quieres automatizar..."
                                className="w-full px-8 py-5 bg-white/10 backdrop-blur-lg border-2 border-white/20 focus:border-purple-400/50 rounded-2xl text-white placeholder-white/50 font-semibold text-lg outline-none transition"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={(!input.trim() && attachedFiles.length === 0) || isProcessing}
                            className="p-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-2xl shadow-purple-500/50 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <Send className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
        </div>
    );
};

export default ChatInterface;
