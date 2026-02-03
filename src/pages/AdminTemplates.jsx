import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Zap, ArrowRight, Save, X,
  ChevronDown, ChevronUp, Variable
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const VARIABLE_TYPES = ['text', 'number', 'boolean'];

export default function AdminTemplates() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint_url: '',
    method: 'GET',
    headers: {},
    body_template: '',
    variables: [],
    is_public: true
  });
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['apiTemplates'],
    queryFn: () => base44.entities.ApiTemplate.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const createTemplate = useMutation({
    mutationFn: (data) => base44.entities.ApiTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTemplates'] });
      toast.success('התבנית נוצרה בהצלחה');
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApiTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTemplates'] });
      toast.success('התבנית עודכנה');
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id) => base44.entities.ApiTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTemplates'] });
      toast.success('התבנית נמחקה');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      endpoint_url: '',
      method: 'GET',
      headers: {},
      body_template: '',
      variables: [],
      is_public: true
    });
    setEditingTemplate(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      endpoint_url: template.endpoint_url,
      method: template.method,
      headers: template.headers || {},
      body_template: template.body_template || '',
      variables: template.variables || [],
      is_public: template.is_public ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.endpoint_url) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplate.mutate(formData);
    }
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData(prev => ({
        ...prev,
        headers: { ...prev.headers, [headerKey]: headerValue }
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData(prev => ({ ...prev, headers: newHeaders }));
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { name: '', label: '', type: 'text', default_value: '' }]
    }));
  };

  const updateVariable = (index, field, value) => {
    const newVariables = [...formData.variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setFormData(prev => ({ ...prev, variables: newVariables }));
  };

  const removeVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  // Check if user is admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">גישה נדחתה</h2>
            <p className="text-slate-400 mb-6">רק מנהלים יכולים לגשת לדף זה</p>
            <Link to={createPageUrl('Dashboard')}>
              <Button className="bg-violet-600 hover:bg-violet-500">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה לדשבורד
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">תבניות API</h1>
              <p className="text-slate-400">ניהול תבניות לכרטיסיות חכמות</p>
            </div>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
          >
            <Plus className="w-4 h-4 ml-2" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                          <Badge className={cn(
                            "mt-1 text-xs",
                            template.method === 'GET' && "bg-green-500/20 text-green-400",
                            template.method === 'POST' && "bg-blue-500/20 text-blue-400",
                            template.method === 'PUT' && "bg-amber-500/20 text-amber-400",
                            template.method === 'DELETE' && "bg-red-500/20 text-red-400"
                          )}>
                            {template.method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.description && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                    )}
                    <p className="text-xs text-slate-500 font-mono truncate mb-3" dir="ltr">
                      {template.endpoint_url}
                    </p>
                    {template.variables?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.variables.map(v => (
                          <Badge key={v.name} variant="outline" className="text-xs border-slate-600 text-slate-400">
                            <Variable className="w-3 h-3 ml-1" />
                            {v.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(template)}
                        className="flex-1 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <Edit2 className="w-4 h-4 ml-1" />
                        עריכה
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate.mutate(template.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {templates.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Zap className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">אין תבניות עדיין</h3>
            <p className="text-slate-400 mb-6">צור את תבנית ה-API הראשונה שלך</p>
            <Button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
            >
              <Plus className="w-4 h-4 ml-2" />
              צור תבנית
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingTemplate ? 'עריכת תבנית' : 'תבנית API חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">שם התבנית *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="לדוגמה: שליפת נתוני משתמש"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">שיטת HTTP</Label>
                <Select value={formData.method} onValueChange={(v) => setFormData(prev => ({ ...prev, method: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {HTTP_METHODS.map(method => (
                      <SelectItem key={method} value={method} className="text-white">
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של התבנית..."
                className="bg-slate-800 border-slate-700 text-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">כתובת ה-API *</Label>
              <Input
                value={formData.endpoint_url}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                placeholder="https://api.example.com/users/{{id}}"
                className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                dir="ltr"
              />
              <p className="text-xs text-slate-500">השתמש ב-{'{{variable}}'} להגדרת משתנים דינמיים</p>
            </div>

            {/* Headers */}
            <div className="space-y-3">
              <Label className="text-slate-300">כותרות (Headers)</Label>
              <div className="flex gap-2">
                <Input
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="Key"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                  dir="ltr"
                />
                <Input
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="Value"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                  dir="ltr"
                />
                <Button onClick={addHeader} size="sm" variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {Object.entries(formData.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
                  <code className="flex-1 text-sm text-slate-300" dir="ltr">{key}: {value}</code>
                  <Button variant="ghost" size="icon" onClick={() => removeHeader(key)} className="h-6 w-6 text-slate-400 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Body Template (for POST/PUT) */}
            {['POST', 'PUT'].includes(formData.method) && (
              <div className="space-y-2">
                <Label className="text-slate-300">גוף הבקשה (Body)</Label>
                <Textarea
                  value={formData.body_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
                  placeholder='{"user_id": "{{id}}", "name": "{{name}}"}'
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm resize-none min-h-[100px]"
                  dir="ltr"
                />
              </div>
            )}

            {/* Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">משתנים</Label>
                <Button variant="ghost" size="sm" onClick={addVariable} className="text-violet-400 hover:text-violet-300">
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף משתנה
                </Button>
              </div>
              {formData.variables.map((variable, index) => (
                <div key={index} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      placeholder="שם המשתנה (name)"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                      dir="ltr"
                    />
                    <Input
                      value={variable.label}
                      onChange={(e) => updateVariable(index, 'label', e.target.value)}
                      placeholder="תווית בעברית"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={variable.type} onValueChange={(v) => updateVariable(index, 'type', v)}>
                      <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {VARIABLE_TYPES.map(type => (
                          <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={variable.default_value}
                      onChange={(e) => updateVariable(index, 'default_value', e.target.value)}
                      placeholder="ערך ברירת מחדל"
                      className="flex-1 bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeVariable(index)} className="h-8 w-8 text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400">
              ביטול
            </Button>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
              <Save className="w-4 h-4 ml-2" />
              {editingTemplate ? 'שמור שינויים' : 'צור תבנית'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}