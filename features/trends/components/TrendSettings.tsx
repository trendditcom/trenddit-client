'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/ui/dialog';
import { Button } from '@/lib/ui/button';
import { Textarea } from '@/lib/ui/textarea';
import { Label } from '@/lib/ui/label';
import { Switch } from '@/lib/ui/switch';
import { Slider } from '@/lib/ui/slider';
import { Badge } from '@/lib/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs';
import { Alert, AlertDescription } from '@/lib/ui/alert';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lock,
  Edit3
} from 'lucide-react';
import { TrendPromptSettings, DEFAULT_TREND_SETTINGS, SettingsState } from '../types/settings';

interface TrendSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdate: (settings: TrendPromptSettings) => void;
}

const SETTINGS_STORAGE_KEY = 'trenddit_prompt_settings';

export function TrendSettings({ open, onOpenChange, onSettingsUpdate }: TrendSettingsProps) {
  const [settings, setSettings] = useState<TrendPromptSettings>(DEFAULT_TREND_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings: SettingsState = JSON.parse(stored);
        setSettings(parsedSettings.prompts);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      const settingsState: SettingsState = {
        prompts: settings,
        lastUpdated: new Date().toISOString(),
        version: 1
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
      
      // Notify parent component
      onSettingsUpdate(settings);
      
      setHasChanges(false);
      
      // Close dialog after save
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_TREND_SETTINGS);
    setHasChanges(true);
  };

  const updateUserPrompt = (field: keyof typeof settings.userPrompt, value: string) => {
    setSettings(prev => ({
      ...prev,
      userPrompt: {
        ...prev.userPrompt,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const updateUrlVerification = (field: keyof typeof settings.urlVerification, value: any) => {
    setSettings(prev => ({
      ...prev,
      urlVerification: {
        ...prev.urlVerification,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const updateModelSettings = (field: keyof typeof settings.modelSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      modelSettings: {
        ...prev.modelSettings,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Trend Generation Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="prompts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prompts">Prompt Settings</TabsTrigger>
            <TabsTrigger value="urls">URL Verification</TabsTrigger>
            <TabsTrigger value="model">Model Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure how trends are generated. Only user-editable sections can be modified - system-controlled parts ensure app stability.
              </AlertDescription>
            </Alert>

            {/* User-Editable Prompts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Edit3 className="h-4 w-4 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">User-Editable Prompts</h3>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Customizable
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="trendFocus" className="text-sm font-medium">
                    Trend Focus & Priorities
                  </Label>
                  <Textarea
                    id="trendFocus"
                    value={settings.userPrompt.trendFocus}
                    onChange={(e) => updateUserPrompt('trendFocus', e.target.value)}
                    className="mt-2 min-h-[100px]"
                    placeholder="Define what types of trends to prioritize..."
                  />
                </div>

                <div>
                  <Label htmlFor="industryContext" className="text-sm font-medium">
                    Industry Context & Target Audience
                  </Label>
                  <Textarea
                    id="industryContext"
                    value={settings.userPrompt.industryContext}
                    onChange={(e) => updateUserPrompt('industryContext', e.target.value)}
                    className="mt-2 min-h-[80px]"
                    placeholder="Describe target industries and business contexts..."
                  />
                </div>

                <div>
                  <Label htmlFor="timeframeContext" className="text-sm font-medium">
                    Timeframe & Currency Requirements
                  </Label>
                  <Textarea
                    id="timeframeContext"
                    value={settings.userPrompt.timeframeContext}
                    onChange={(e) => updateUserPrompt('timeframeContext', e.target.value)}
                    className="mt-2 min-h-[80px]"
                    placeholder="Specify how current and specific trends should be..."
                  />
                </div>

                <div>
                  <Label htmlFor="sourcePreferences" className="text-sm font-medium">
                    Source Preferences & Quality Requirements
                  </Label>
                  <Textarea
                    id="sourcePreferences"
                    value={settings.userPrompt.sourcePreferences}
                    onChange={(e) => updateUserPrompt('sourcePreferences', e.target.value)}
                    className="mt-2 min-h-[80px]"
                    placeholder="Define preferred sources and URL requirements..."
                  />
                </div>
              </div>
            </div>

            {/* System-Controlled Prompts (Read-Only) */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">System-Controlled Prompts</h3>
                <Badge variant="outline" className="text-gray-600 border-gray-200">
                  Protected
                </Badge>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These sections are controlled by the application to ensure proper functionality and cannot be modified.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                <div>
                  <Label className="font-medium text-gray-700">Response Format</Label>
                  <p className="text-gray-600 mt-1">{settings.systemPrompt.responseFormat}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-700">Validation Rules</Label>
                  <p className="text-gray-600 mt-1">{settings.systemPrompt.validationRules}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-700">Category Requirements</Label>
                  <p className="text-gray-600 mt-1">{settings.systemPrompt.categoryRequirements}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-700">URL Validation Rules</Label>
                  <p className="text-gray-600 mt-1">{settings.systemPrompt.urlValidationRules}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="urls" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                URL verification helps ensure source links point to real articles, not fake/generated URLs.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable URL Verification</Label>
                  <p className="text-xs text-gray-600">
                    Verify that source URLs are real and accessible before displaying
                  </p>
                </div>
                <Switch
                  checked={settings.urlVerification.enabled}
                  onCheckedChange={(checked) => updateUrlVerification('enabled', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Verification Timeout: {settings.urlVerification.timeout}ms
                </Label>
                <Slider
                  value={[settings.urlVerification.timeout]}
                  onValueChange={([value]) => updateUrlVerification('timeout', value)}
                  max={15000}
                  min={1000}
                  step={500}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Time to wait when checking if URLs are accessible
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Fallback to Generated URLs</Label>
                  <p className="text-xs text-gray-600">
                    If real URLs fail verification, use generated placeholder URLs
                  </p>
                </div>
                <Switch
                  checked={settings.urlVerification.fallbackToGenerated}
                  onCheckedChange={(checked) => updateUrlVerification('fallbackToGenerated', checked)}
                />
              </div>

              {!settings.urlVerification.fallbackToGenerated && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommended:</strong> Disabled fallback means only verified real URLs will be shown, 
                    preventing users from clicking on fake/generated links.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Temperature: {settings.modelSettings.temperature}
                </Label>
                <Slider
                  value={[settings.modelSettings.temperature]}
                  onValueChange={([value]) => updateModelSettings('temperature', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Higher values make output more creative, lower values more focused
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Max Tokens: {settings.modelSettings.maxTokens}
                </Label>
                <Slider
                  value={[settings.modelSettings.maxTokens]}
                  onValueChange={([value]) => updateModelSettings('maxTokens', value)}
                  max={4000}
                  min={1000}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Maximum number of tokens in the response
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                Unsaved Changes
              </Badge>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="min-w-[100px]"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}