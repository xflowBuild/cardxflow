import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Play, Loader2, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function SmartCardPanel({ card, templates, onUpdate }) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const selectedTemplate = templates?.find(t => t.id === card.api_template_id);
  const variables = card.api_variables || {};

  const handleTemplateChange = (templateId) => {
    const template = templates?.find(t => t.id === templateId);
    onUpdate({ 
      api_template_id: templateId,
      api_variables: template?.variables?.reduce((acc, v) => {
        acc[v.name] = v.default_value || '';
        return acc;
      }, {}) || {}
    });
  };

  const handleVariableChange = (name, value) => {
    onUpdate({
      api_variables: { ...variables, [name]: value }
    });
  };

  const executeApi = async () => {
    if (!selectedTemplate) return;
    
    setIsRunning(true);
    setError(null);

    try {
      // Build URL with variables
      let url = selectedTemplate.endpoint_url;
      let body = selectedTemplate.body_template;

      // Replace placeholders
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        url = url.replace(new RegExp(placeholder, 'g'), value);
        if (body) {
          body = body.replace(new RegExp(placeholder, 'g'), value);
        }
      });

      // Parse headers
      const headers = selectedTemplate.headers || {};

      const response = await fetch(url, {
        method: selectedTemplate.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        ...(body && selectedTemplate.method !== 'GET' ? { body } : {})
      });

      const data = await response.json();
      onUpdate({ api_response: JSON.stringify(data, null, 2) });
    } catch (err) {
      setError(err.message);
      onUpdate({ api_response: `שגיאה: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/15 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">הגדרות API חכם</h3>
                <p className="text-sm text-slate-400">
                  {selectedTemplate ? selectedTemplate.name : 'בחר תבנית API'}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 mt-2 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">תבנית API</Label>
              <Select value={card.api_template_id || ''} onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="בחר תבנית..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {templates?.map(template => (
                    <SelectItem key={template.id} value={template.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-mono",
                          template.method === 'GET' && "bg-green-500/20 text-green-400",
                          template.method === 'POST' && "bg-blue-500/20 text-blue-400",
                          template.method === 'PUT' && "bg-amber-500/20 text-amber-400",
                          template.method === 'DELETE' && "bg-red-500/20 text-red-400"
                        )}>
                          {template.method}
                        </span>
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variables */}
            {selectedTemplate?.variables?.length > 0 && (
              <div className="space-y-3">
                <Label className="text-slate-300">משתנים</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable.name} className="space-y-1">
                      <Label className="text-sm text-slate-400">{variable.label || variable.name}</Label>
                      <Input
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.default_value || ''}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={executeApi}
              disabled={!selectedTemplate || isRunning}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מריץ...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-2" />
                  הרץ בקשה
                </>
              )}
            </Button>

            {/* Response */}
            {card.api_response && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {error ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                  <Label className={error ? "text-red-400" : "text-green-400"}>
                    {error ? 'שגיאה' : 'תוצאה'}
                  </Label>
                </div>
                <pre 
                  className={cn(
                    "p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-64",
                    error ? "bg-red-500/10 text-red-300" : "bg-slate-900 text-slate-300"
                  )}
                  dir="ltr"
                >
                  {card.api_response}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}