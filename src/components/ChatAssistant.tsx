import { useState } from 'react';
import { useLocation } from 'react-router-dom';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const location = useLocation();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
        const res = await fetch("http://localhost:8001/rag/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: input,
                history: newMessages,
                context: { path: location.pathname }, // можешь ещё добавить buildingId
            }),
        });


      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer ?? 'No answer' },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error while contacting assistant 🫠' },
      ]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg hover:bg-indigo-700 transition"
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[420px] w-[340px] flex-col rounded-2xl bg-white shadow-2xl border border-slate-100">
          <div className="flex items-center justify-between rounded-t-2xl bg-indigo-600 px-4 py-2 text-white">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SDU Assistant</span>
              <span className="text-[11px] opacity-80">
                Ask about SDU, rooms, events, map
              </span>
            </div>
            <button
              className="text-lg hover:text-slate-200"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
            {messages.length === 0 && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                👋 Hi! I can help you with SDU campus, free rooms, events and
                navigation.
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  msg.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'mr-auto bg-slate-100 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-2">
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Ask something about SDU..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
