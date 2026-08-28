'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  HeartPulse,
  Droplet,
  Activity,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientFullRecord } from '@/types/patient';

interface PatientRecoveryChatbotProps {
  patient: PatientFullRecord;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const KNOWLEDGE_RESPONSES: Record<string, string> = {
  catheter: 'Catheter removal (Trial Without Catheter / TWOC) is typically scheduled at days 7–10 post-RALP at the Oxford Urology Outpatients clinic. Remember to drink 1.5–2 litres of water and complete your voiding bladder trial before discharge.',
  twoc: 'Catheter removal (Trial Without Catheter / TWOC) is typically scheduled at days 7–10 post-RALP at the Oxford Urology Outpatients clinic. Remember to drink 1.5–2 litres of water and complete your voiding bladder trial before discharge.',
  exercise: 'Pelvic floor (Kegel) exercises should be initiated 2 days after catheter removal. Perform 3 sets daily of 10 slow contractions (hold for 10 seconds) and 10 quick contractions.',
  kegel: 'Pelvic floor (Kegel) exercises should be initiated 2 days after catheter removal. Perform 3 sets daily of 10 slow contractions (hold for 10 seconds) and 10 quick contractions.',
  leakage: 'Urinary leakage is normal in the early weeks following catheter removal. Most patients make steady recovery over 3 to 6 months. Log your 24h pad counts in the recovery portal so your Clinical Nurse Specialist can adjust your rehabilitation plan.',
  pad: 'Please record your daytime and nighttime pad counts on your dashboard. Moving from 3–4 pads to 1 security pad per day is a major recovery milestone.',
  psa: 'Your first post-operative ultrasensitive PSA test is scheduled at 2 months post-surgery. An undetectable level (< 0.05 ng/mL) indicates complete surgical removal of prostate tissue.',
  sex: 'Erectile function recovery is a gradual 12–24 month process after robotic nerve-sparing surgery. If prescribed, continue your daily low-dose Tadalafil (5mg) nightly to support nerve regeneration and tissue oxygenation.',
  erection: 'Erectile function recovery is a gradual 12–24 month process after robotic nerve-sparing surgery. If prescribed, continue your daily low-dose Tadalafil (5mg) nightly to support nerve regeneration and tissue oxygenation.',
  blood: 'Mild blood in the urine (pinkish tinge) can occasionally occur after strenuous activity or bowel movements. If you see bright red heavy bleeding or large blood clots, please contact the 24/7 Urology Triage on 01865 221234 immediately.',
};

export function PatientRecoveryChatbot({ patient }: PatientRecoveryChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello ${patient.firstName}! I am your Oxford Urology AI Recovery Companion. How can I assist you with your recovery or questionnaires today?`,
      timestamp: 'Just now',
    },
  ]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    // Formulate response
    setTimeout(() => {
      let reply = `Thank you for your question, ${patient.firstName}. Your clinical team at Oxford Urology Centre monitors your recovery. If you experience severe pain or temperature above 38°C, please call the triage nurse.`;

      const lower = userText.toLowerCase();
      for (const [key, val] of Object.entries(KNOWLEDGE_RESPONSES)) {
        if (lower.includes(key)) {
          reply = val;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: reply,
          timestamp: 'Just now',
        },
      ]);
    }, 400);
  };

  const handlePromptChip = (chipText: string) => {
    setInput(chipText);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl shadow-teal-600/30 hover:scale-105 transition-all text-xs font-bold"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Ask Recovery AI Companion</span>
        </button>
      </div>

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-full max-w-sm sm:max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                <HeartPulse className="h-5 w-5 text-teal-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Patient Recovery AI Companion</h3>
                <p className="text-[10px] text-teal-200">Oxford Urology NHS Foundation Trust</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[11px]">
            {['Catheter removal timing?', 'Pelvic floor exercises', 'When is first PSA?', 'Managing pad leakage'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handlePromptChip(chip)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 whitespace-nowrap transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about catheter, exercises, PSA, recovery..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500"
            />
            <Button type="submit" size="sm" className="h-8 w-8 p-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Footer Note */}
          <div className="px-3 py-1 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span>NHS Caldicott Governance • For medical emergencies call 999</span>
          </div>
        </div>
      )}
    </>
  );
}
