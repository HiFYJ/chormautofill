import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Info, Save, Settings, Zap } from 'lucide-react';
import { Rule, getRules, saveRules } from './lib/storage';

export default function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    name: '',
    urlPattern: '.*',
    selector: '',
    value: ''
  });
  const [activeTab, setActiveTab] = useState<'rules' | 'help'>('rules');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const loadedRules = await getRules();
    setRules(loadedRules);
  };

  const handleSaveRule = async () => {
    if (!newRule.selector || !newRule.value) {
      alert('Selector and Value are required');
      return;
    }
    
    const rule: Rule = {
      id: Date.now().toString(),
      name: newRule.name || 'Unnamed Rule',
      urlPattern: newRule.urlPattern || '.*',
      selector: newRule.selector,
      value: newRule.value
    };

    const updatedRules = [...rules, rule];
    setRules(updatedRules);
    await saveRules(updatedRules);
    
    setNewRule({
      name: '',
      urlPattern: '.*',
      selector: '',
      value: ''
    });
    setIsEditing(false);
  };

  const handleDeleteRule = async (id: string) => {
    const updatedRules = rules.filter(r => r.id !== id);
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const handleExecute = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "apply_rules" }, (response) => {
            if (chrome.runtime.lastError) {
              alert("Cannot execute on this page. Make sure you are on a valid webpage and refresh it.");
            } else {
              console.log("Rules applied", response);
            }
          });
        }
      });
    } else {
      alert("This feature only works when running as a Chrome extension.");
    }
  };

  const handleGenerateRules = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "generate_rules" }, async (response) => {
            if (chrome.runtime.lastError) {
              alert("Cannot read this page. Make sure it's a valid webpage and refresh it.");
            } else if (response && response.rules && response.rules.length > 0) {
              const newRules = [...rules, ...response.rules];
              setRules(newRules);
              await saveRules(newRules);
              alert(`Success! Extracted ${response.rules.length} fields from the current page.`);
            } else {
              alert("No filled form fields found on this page. Please fill out the form first, then click Generate.");
            }
          });
        }
      });
    } else {
      alert("This feature only works when running as a Chrome extension.");
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 text-gray-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-md">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Autofill Clone</h1>
        </div>
        <button 
          onClick={handleExecute}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
          title="Execute rules on current page"
        >
          <Play className="w-4 h-4" />
          <span>Fill</span>
        </button>
      </header>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button 
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'help' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('help')}
        >
          Help & Install
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {activeTab === 'rules' && (
          <div className="space-y-4">
            
            {/* Actions */}
            {!isEditing && (
              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateRules}
                  className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer font-medium shadow-sm"
                  title="Extract filled fields from current page"
                >
                  <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span className="text-sm">Generate from Page</span>
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer bg-white shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Add Manual Rule</span>
                </button>
              </div>
            )}

            {isEditing && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                <h2 className="font-semibold text-gray-800 border-b pb-2">Add New Rule</h2>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Rule Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Login Form" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">URL Pattern (Regex)</label>
                  <input 
                    type="text" 
                    placeholder=".*" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    value={newRule.urlPattern}
                    onChange={(e) => setNewRule({...newRule, urlPattern: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">CSS Selector <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g., input[name='username']" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    value={newRule.selector}
                    onChange={(e) => setNewRule({...newRule, selector: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Value to Fill <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g., my_username" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={newRule.value}
                    onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveRule}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Rule
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {rules.length === 0 && !isEditing ? (
                <div className="text-center py-10 text-gray-400">
                  <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rules defined yet.</p>
                  <p className="text-xs mt-2 text-gray-400 max-w-[250px] mx-auto">
                    Fill out a form on any website, then click <strong>Generate from Page</strong> to create rules automatically.
                  </p>
                </div>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 group relative">
                    <div className="pr-8">
                      <h3 className="font-semibold text-sm text-gray-800">{rule.name}</h3>
                      <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                        <span className="text-gray-400">URL:</span>
                        <code className="text-gray-600 truncate bg-gray-50 px-1 rounded">{rule.urlPattern}</code>
                        <span className="text-gray-400">Sel:</span>
                        <code className="text-gray-600 truncate bg-gray-50 px-1 rounded">{rule.selector}</code>
                        <span className="text-gray-400">Val:</span>
                        <span className="text-gray-800 font-medium truncate">{rule.value}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4 text-sm text-gray-600">
            <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> 
              Lightning Generation
            </h2>
            <p>The easiest way to use this extension is to let it generate rules for you:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Go to the webpage with the form you want to autofill.</li>
              <li><strong>Manually fill out the form</strong> with your desired data.</li>
              <li>Open this extension and click <strong>Generate from Page</strong>.</li>
              <li>The extension will scan the page, extract your inputs, and save them as rules automatically!</li>
            </ol>

            <div className="h-px bg-gray-200 my-4"></div>

            <h2 className="font-semibold text-gray-800 text-base">How to install this extension</h2>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Click the <strong>Export</strong> button in AI Studio (top right) to download the project as a ZIP file.</li>
              <li>Extract the ZIP file to a folder on your computer.</li>
              <li>Open your terminal, navigate to the folder, and run <code>npm install</code> then <code>npm run build</code>.</li>
              <li>Open Chrome and navigate to <code>chrome://extensions/</code>.</li>
              <li>Enable <strong>Developer mode</strong> in the top right corner.</li>
              <li>Click <strong>Load unpacked</strong> and select the <code>dist</code> folder generated in step 3.</li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
